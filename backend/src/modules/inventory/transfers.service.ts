import { LedgerType, TransferStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { BusinessRuleError, NotFoundError } from '../../domain/errors';
import { generateDocumentCode } from './codeGenerator';
import { lockStockItem } from './stock.service';

export async function listTransfers(tenantId: string) {
  return prisma.inventoryTransfer.findMany({
    where: { tenantId },
    include: { fromBranch: true, toBranch: true, items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createTransfer(
  tenantId: string,
  input: { fromBranchId: string; toBranchId: string; note?: string; items: { productId: string; quantity: number }[] },
) {
  return prisma.inventoryTransfer.create({
    data: {
      tenantId,
      fromBranchId: input.fromBranchId,
      toBranchId: input.toBranchId,
      note: input.note,
      code: generateDocumentCode('TR'),
      items: { create: input.items.map((i) => ({ tenantId, productId: i.productId, quantity: i.quantity })) },
    },
    include: { items: { include: { product: true } } },
  });
}

/** FR-INV-03 step 1: out-bound — deducts stock from the source branch and marks the transfer in transit. */
export async function dispatchTransfer(tenantId: string, transferId: string) {
  return prisma.$transaction(async (tx) => {
    const transfer = await tx.inventoryTransfer.findFirst({ where: { id: transferId, tenantId }, include: { items: true } });
    if (!transfer) throw new NotFoundError('Không tìm thấy phiếu chuyển kho.');
    if (transfer.status !== TransferStatus.DRAFT) {
      throw new BusinessRuleError('Phiếu chuyển kho không ở trạng thái nháp.');
    }

    for (const item of transfer.items) {
      const stock = await lockStockItem(tx, tenantId, item.productId, transfer.fromBranchId);
      const available = stock.onHand - stock.reserved;
      if (available < item.quantity) {
        throw new BusinessRuleError(
          `Không đủ hàng khả dụng để chuyển kho (khả dụng: ${available}, yêu cầu: ${item.quantity}).`,
        );
      }

      const newOnHand = stock.onHand - item.quantity;
      await tx.stockItem.update({ where: { id: stock.id }, data: { onHand: newOnHand } });
      await tx.inventoryTransaction.create({
        data: {
          tenantId,
          branchId: transfer.fromBranchId,
          productId: item.productId,
          type: LedgerType.TRANSFER_OUT,
          quantity: -item.quantity,
          balanceAfter: newOnHand,
          referenceId: transfer.id,
          note: `Xuất chuyển kho ${transfer.code}`,
        },
      });
    }

    return tx.inventoryTransfer.update({
      where: { id: transferId },
      data: { status: TransferStatus.IN_TRANSIT, dispatchedAt: new Date() },
      include: { items: { include: { product: true } } },
    });
  });
}

/** FR-INV-03 step 2: in-bound — confirms arrival, increases stock at the destination branch. */
export async function receiveTransfer(tenantId: string, transferId: string) {
  return prisma.$transaction(async (tx) => {
    const transfer = await tx.inventoryTransfer.findFirst({ where: { id: transferId, tenantId }, include: { items: true } });
    if (!transfer) throw new NotFoundError('Không tìm thấy phiếu chuyển kho.');
    if (transfer.status !== TransferStatus.IN_TRANSIT) {
      throw new BusinessRuleError('Phiếu chuyển kho chưa được xuất kho.');
    }

    for (const item of transfer.items) {
      const stock = await lockStockItem(tx, tenantId, item.productId, transfer.toBranchId);
      const newOnHand = stock.onHand + item.quantity;
      await tx.stockItem.update({ where: { id: stock.id }, data: { onHand: newOnHand } });
      await tx.inventoryTransaction.create({
        data: {
          tenantId,
          branchId: transfer.toBranchId,
          productId: item.productId,
          type: LedgerType.TRANSFER_IN,
          quantity: item.quantity,
          balanceAfter: newOnHand,
          referenceId: transfer.id,
          note: `Nhập chuyển kho ${transfer.code}`,
        },
      });
    }

    return tx.inventoryTransfer.update({
      where: { id: transferId },
      data: { status: TransferStatus.COMPLETED, receivedAt: new Date() },
      include: { items: { include: { product: true } } },
    });
  });
}

export async function cancelTransfer(tenantId: string, transferId: string) {
  const transfer = await prisma.inventoryTransfer.findFirst({ where: { id: transferId, tenantId } });
  if (!transfer) throw new NotFoundError('Không tìm thấy phiếu chuyển kho.');
  if (transfer.status !== TransferStatus.DRAFT) {
    throw new BusinessRuleError('Chỉ có thể huỷ phiếu chuyển kho ở trạng thái nháp.');
  }
  return prisma.inventoryTransfer.update({ where: { id: transferId }, data: { status: TransferStatus.CANCELLED } });
}
