import { LedgerType, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';

export interface LedgerQuery {
  branchId?: string;
  productId?: string;
  type?: string;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
}

/** FR-INV-01: read-only view over the append-only ledger. No mutation endpoint exists for this table. */
export async function queryLedger(tenantId: string, query: LedgerQuery) {
  const where: Prisma.InventoryTransactionWhereInput = {
    tenantId,
    ...(query.branchId ? { branchId: query.branchId } : {}),
    ...(query.productId ? { productId: query.productId } : {}),
    ...(query.type ? { type: query.type as LedgerType } : {}),
    ...(query.from || query.to
      ? {
          createdAt: {
            ...(query.from ? { gte: new Date(query.from) } : {}),
            ...(query.to ? { lte: new Date(query.to) } : {}),
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.inventoryTransaction.findMany({
      where,
      include: { product: true, branch: true },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.inventoryTransaction.count({ where }),
  ]);

  return { items, total, page: query.page, pageSize: query.pageSize };
}
