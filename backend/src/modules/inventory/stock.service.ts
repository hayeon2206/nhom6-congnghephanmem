import { randomUUID } from 'crypto';
import { LedgerType, Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { BusinessRuleError } from '../../domain/errors';

export type Tx = Prisma.TransactionClient;

export interface StockLine {
  productId: string;
  quantity: number;
}

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 150;

/** Postgres error codes for lock/serialization conflicts under high concurrency. */
const TRANSIENT_PG_CODES = new Set(['40001', '40P01', '55P03']);

function isTransientError(err: unknown): boolean {
  const code = (err as { code?: string } | undefined)?.code;
  if (code && TRANSIENT_PG_CODES.has(code)) return true;

  // Prisma's own "couldn't get a connection / acquire the row lock in time" errors
  // (not a Postgres error code — Prisma raises this client-side against its
  // interactive-transaction maxWait budget) show up under high concurrency, e.g. the
  // anti-oversell burst test. They are exactly as transient as a lock conflict.
  const message = err instanceof Error ? err.message : '';
  return /unable to start a transaction in the given time/i.test(message);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeLines(lines: StockLine[]): StockLine[] {
  if (!lines?.length) throw new BusinessRuleError('Danh sách sản phẩm không được rỗng.');

  const merged = new Map<string, number>();
  for (const line of lines) {
    merged.set(line.productId, (merged.get(line.productId) ?? 0) + line.quantity);
  }

  const result = [...merged.entries()]
    .map(([productId, quantity]) => ({ productId, quantity }))
    // Deterministic lock ordering across all callers prevents deadlocks (mirrors the
    // .NET InventoryReservationService, which sorts by ProductId before locking rows).
    .sort((a, b) => a.productId.localeCompare(b.productId));

  if (result.some((l) => l.quantity <= 0)) {
    throw new BusinessRuleError('Số lượng sản phẩm phải lớn hơn 0.');
  }

  return result;
}

/** Ensures a StockItem row exists for (productId, branchId) so it can be locked with FOR UPDATE. */
async function ensureStockItem(tx: Tx, tenantId: string, productId: string, branchId: string) {
  await tx.$executeRaw`
    INSERT INTO "StockItem" ("id", "tenantId", "productId", "branchId", "onHand", "reserved")
    VALUES (${randomUUID()}, ${tenantId}, ${productId}, ${branchId}, 0, 0)
    ON CONFLICT ("tenantId", "productId", "branchId") DO NOTHING
  `;
}

interface LockedStockRow {
  id: string;
  onHand: number;
  reserved: number;
}

/** NFR-PERF-02: row-level pessimistic lock (SELECT ... FOR UPDATE) — the core anti-oversell primitive. */
export async function lockStockItem(tx: Tx, tenantId: string, productId: string, branchId: string): Promise<LockedStockRow> {
  await ensureStockItem(tx, tenantId, productId, branchId);

  const rows = await tx.$queryRaw<LockedStockRow[]>`
    SELECT "id", "onHand", "reserved" FROM "StockItem"
    WHERE "tenantId" = ${tenantId} AND "productId" = ${productId} AND "branchId" = ${branchId}
    FOR UPDATE
  `;

  const row = rows[0];
  if (!row) throw new BusinessRuleError('Không tìm thấy tồn kho cho sản phẩm tại chi nhánh này.');
  return row;
}

async function runWithRetry<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => fn(tx),
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
          // Prisma's defaults (maxWait 2s / timeout 5s) are sized for ordinary request
          // traffic, not dozens of transactions all queueing for the SAME row lock at
          // once (a flash-sale burst). Widen both so a request queues instead of
          // erroring out while a legitimate lock ahead of it is still being processed.
          maxWait: 20000,
          timeout: 20000,
        },
      );
    } catch (err) {
      if (err instanceof BusinessRuleError) throw err;
      if (isTransientError(err) && attempt < MAX_RETRIES) {
        await sleep(RETRY_BASE_DELAY_MS * attempt);
        continue;
      }
      throw err;
    }
  }
  // Unreachable, satisfies TypeScript's control-flow analysis.
  throw new Error('Không thể hoàn tất giao dịch tồn kho sau nhiều lần thử lại.');
}

/** FR-RSE-02: reserve stock for a Draft -> Reserved order transition. Rejects if available < requested. */
export async function reserveStock(tenantId: string, branchId: string, lines: StockLine[], referenceId: string, externalTx?: Tx) {
  const items = normalizeLines(lines);

  const run = async (tx: Tx) => {
    for (const { productId, quantity } of items) {
      const stock = await lockStockItem(tx, tenantId, productId, branchId);
      const available = stock.onHand - stock.reserved;
      if (available < quantity) {
        throw new BusinessRuleError(
          `Không đủ hàng khả dụng để giữ chỗ (SKU khả dụng: ${available}, yêu cầu: ${quantity}).`,
        );
      }

      await tx.stockItem.update({ where: { id: stock.id }, data: { reserved: { increment: quantity } } });
    }
  };

  if (externalTx) return run(externalTx);
  await runWithRetry(run);
}

/** FR-RSE-03 (Cancelled branch): releases a previously reserved quantity back to the available pool. */
export async function releaseStock(tenantId: string, branchId: string, lines: StockLine[], referenceId: string, externalTx?: Tx) {
  const items = normalizeLines(lines);

  const run = async (tx: Tx) => {
    for (const { productId, quantity } of items) {
      const stock = await lockStockItem(tx, tenantId, productId, branchId);
      if (stock.reserved < quantity) {
        throw new BusinessRuleError(`Không thể nhả ${quantity} vì chỉ đang giữ ${stock.reserved}.`);
      }

      await tx.stockItem.update({ where: { id: stock.id }, data: { reserved: { decrement: quantity } } });
    }
  };

  if (externalTx) return run(externalTx);
  await runWithRetry(run);
}

/** FR-RSE-03 (Confirmed branch): deducts on-hand stock, releases the reservation, writes a SALE ledger entry. */
export async function confirmStock(tenantId: string, branchId: string, lines: StockLine[], referenceId: string, externalTx?: Tx) {
  const items = normalizeLines(lines);

  const run = async (tx: Tx) => {
    for (const { productId, quantity } of items) {
      const stock = await lockStockItem(tx, tenantId, productId, branchId);
      if (stock.reserved < quantity) {
        throw new BusinessRuleError(`Không thể chốt ${quantity} vì chỉ đang giữ ${stock.reserved}.`);
      }
      if (stock.onHand < quantity) {
        throw new BusinessRuleError(`Tồn kho không hợp lệ khi chốt đơn (onHand: ${stock.onHand}, cần xuất: ${quantity}).`);
      }

      const newOnHand = stock.onHand - quantity;
      await tx.stockItem.update({
        where: { id: stock.id },
        data: { onHand: newOnHand, reserved: { decrement: quantity } },
      });

      await writeLedgerEntry(tx, {
        tenantId,
        branchId,
        productId,
        type: LedgerType.SALE,
        quantity: -quantity,
        balanceAfter: newOnHand,
        referenceId,
      });
    }
  };

  if (externalTx) return run(externalTx);
  await runWithRetry(run);
}

/** FR-INV-02 style direct stock increase (used by purchase receipts, transfer receive, returns, adjustments). */
export async function increaseStock(
  tx: Tx,
  params: { tenantId: string; branchId: string; productId: string; quantity: number; type: LedgerType; referenceId: string; note?: string },
) {
  if (params.quantity <= 0) throw new BusinessRuleError('Số lượng phải lớn hơn 0.');

  const stock = await lockStockItem(tx, params.tenantId, params.productId, params.branchId);
  const newOnHand = stock.onHand + params.quantity;

  await tx.stockItem.update({ where: { id: stock.id }, data: { onHand: newOnHand } });
  await writeLedgerEntry(tx, {
    tenantId: params.tenantId,
    branchId: params.branchId,
    productId: params.productId,
    type: params.type,
    quantity: params.quantity,
    balanceAfter: newOnHand,
    referenceId: params.referenceId,
    note: params.note,
  });

  return newOnHand;
}

/** Directly sets on-hand to an absolute value (used by stocktake adjustments). Writes a compensating ledger row. */
export async function adjustStockToCount(
  tx: Tx,
  params: { tenantId: string; branchId: string; productId: string; countedQty: number; referenceId: string; note?: string },
) {
  if (params.countedQty < 0) throw new BusinessRuleError('Số lượng kiểm kê không được âm.');

  const stock = await lockStockItem(tx, params.tenantId, params.productId, params.branchId);
  if (params.countedQty < stock.reserved) {
    throw new BusinessRuleError(
      `Tồn kiểm kê (${params.countedQty}) không thể nhỏ hơn số lượng đang giữ chỗ (${stock.reserved}).`,
    );
  }

  const diff = params.countedQty - stock.onHand;
  await tx.stockItem.update({ where: { id: stock.id }, data: { onHand: params.countedQty } });

  if (diff !== 0) {
    await writeLedgerEntry(tx, {
      tenantId: params.tenantId,
      branchId: params.branchId,
      productId: params.productId,
      type: LedgerType.STOCKTAKE,
      quantity: diff,
      balanceAfter: params.countedQty,
      referenceId: params.referenceId,
      note: params.note,
    });
  }

  return diff;
}

async function writeLedgerEntry(
  tx: Tx,
  entry: {
    tenantId: string;
    branchId: string;
    productId: string;
    type: LedgerType;
    quantity: number;
    balanceAfter: number;
    referenceId: string;
    note?: string;
  },
) {
  // NFR-SEC-03: InventoryTransaction is append-only — this is the only place that writes to it.
  await tx.inventoryTransaction.create({ data: entry });
}

export async function getStockForBranch(tenantId: string, branchId: string) {
  return prisma.stockItem.findMany({
    where: { tenantId, branchId },
    include: { product: true },
  });
}

export type { PrismaClient };
