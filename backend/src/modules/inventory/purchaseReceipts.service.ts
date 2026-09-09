import { LedgerType, PurchaseReceiptStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { BusinessRuleError, NotFoundError } from '../../domain/errors';
import { calculateWeightedAverageCost } from '../../domain/cogs';
import { generateDocumentCode } from './codeGenerator';
import { lockStockItem } from './stock.service';

export async function listPurchaseReceipts(tenantId: string) {
  return prisma.purchaseReceipt.findMany({
    where: { tenantId },
    include: { branch: true, items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createPurchaseReceipt(
  tenantId: string,
  input: { branchId: string; supplierName?: string; items: { productId: string; quantity: number; unitCost: number }[] },
) {
  return prisma.purchaseReceipt.create({
    data: {
      tenantId,
      branchId: input.branchId,
      supplierName: input.supplierName,
      code: generateDocumentCode('PR'),
      items: { create: input.items.map((i) => ({ tenantId, productId: i.productId, quantity: i.quantity, unitCost: i.unitCost })) },
    },
    include: { items: { include: { product: true } } },
  });
}

/**
 * FR-INV-02 + FR-COST-01: confirming a receipt increases on-hand stock at the branch and
 * recalculates the SKU's tenant-wide weighted average cost, all inside one transaction.
 */
export async function confirmPurchaseReceipt(tenantId: string, receiptId: string) {
  return prisma.$transaction(async (tx) => {
    const receipt = await tx.purchaseReceipt.findFirst({
      where: { id: receiptId, tenantId },
      include: { items: true },
    });
    if (!receipt) throw new NotFoundError('Không tìm thấy phiếu nhập.');
    if (receipt.status === PurchaseReceiptStatus.CONFIRMED) {
      throw new BusinessRuleError('Phiếu nhập đã được xác nhận trước đó.');
    }

    for (const item of receipt.items) {
      const product = await tx.product.findFirstOrThrow({ where: { id: item.productId, tenantId } });
      const stock = await lockStockItem(tx, tenantId, item.productId, receipt.branchId);

      const newCost = calculateWeightedAverageCost(
        stock.onHand,
        Number(product.costPrice),
        item.quantity,
        Number(item.unitCost),
      );

      const newOnHand = stock.onHand + item.quantity;
      await tx.stockItem.update({ where: { id: stock.id }, data: { onHand: newOnHand } });
      await tx.product.update({ where: { id: product.id }, data: { costPrice: newCost } });
      await tx.inventoryTransaction.create({
        data: {
          tenantId,
          branchId: receipt.branchId,
          productId: item.productId,
          type: LedgerType.IMPORT,
          quantity: item.quantity,
          balanceAfter: newOnHand,
          referenceId: receipt.id,
          note: `Nhập hàng từ phiếu ${receipt.code}`,
        },
      });
    }

    return tx.purchaseReceipt.update({
      where: { id: receiptId },
      data: { status: PurchaseReceiptStatus.CONFIRMED, confirmedAt: new Date() },
      include: { items: { include: { product: true } } },
    });
  });
}
