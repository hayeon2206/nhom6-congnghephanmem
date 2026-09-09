import { StocktakeStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { BusinessRuleError, NotFoundError } from '../../domain/errors';
import { generateDocumentCode } from './codeGenerator';
import { adjustStockToCount } from './stock.service';

export async function listStocktakeSessions(tenantId: string) {
  return prisma.stocktakeSession.findMany({
    where: { tenantId },
    include: { branch: true, items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

/** FR-INV-04 step 1: opens a count session; the current system balance is snapshotted per SKU. */
export async function openStocktakeSession(tenantId: string, input: { branchId: string; note?: string }) {
  const stockItems = await prisma.stockItem.findMany({ where: { tenantId, branchId: input.branchId } });

  return prisma.stocktakeSession.create({
    data: {
      tenantId,
      branchId: input.branchId,
      note: input.note,
      code: generateDocumentCode('ST'),
      items: {
        create: stockItems.map((s) => ({ tenantId, productId: s.productId, systemQty: s.onHand, countedQty: s.onHand, difference: 0 })),
      },
    },
    include: { items: { include: { product: true } } },
  });
}

/**
 * FR-INV-04 step 2: records physical counts and, on completion, writes compensating
 * Adjustment ledger entries for every SKU whose counted quantity differs from the system balance.
 */
export async function completeStocktakeSession(
  tenantId: string,
  sessionId: string,
  counts: { productId: string; countedQty: number }[],
) {
  return prisma.$transaction(async (tx) => {
    const session = await tx.stocktakeSession.findFirst({ where: { id: sessionId, tenantId }, include: { items: true } });
    if (!session) throw new NotFoundError('Không tìm thấy phiên kiểm kê.');
    if (session.status === StocktakeStatus.COMPLETED) {
      throw new BusinessRuleError('Phiên kiểm kê đã hoàn tất trước đó.');
    }

    const countMap = new Map(counts.map((c) => [c.productId, c.countedQty]));

    for (const item of session.items) {
      const countedQty = countMap.get(item.productId) ?? item.countedQty;
      const diff = await adjustStockToCount(tx, {
        tenantId,
        branchId: session.branchId,
        productId: item.productId,
        countedQty,
        referenceId: session.id,
        note: `Điều chỉnh theo kiểm kê ${session.code}`,
      });

      await tx.stocktakeItem.update({ where: { id: item.id }, data: { countedQty, difference: diff } });
    }

    return tx.stocktakeSession.update({
      where: { id: sessionId },
      data: { status: StocktakeStatus.COMPLETED, completedAt: new Date() },
      include: { items: { include: { product: true } } },
    });
  });
}
