import { OrderChannel, OrderState } from '@prisma/client';
import { randomUUID } from 'crypto';
import { prisma } from '../../lib/prisma';
import { BusinessRuleError } from '../../domain/errors';
import { confirmStock, reserveStock } from '../inventory/stock.service';
import { emitOrderEvent } from '../../realtime/socket';

/** FR-POS-01: fast lookup by name / SKU / barcode with live available-stock at the given branch. */
export async function lookupProducts(tenantId: string, branchId: string, q: string) {
  const products = await prisma.product.findMany({
    where: {
      tenantId,
      isActive: true,
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { skuCode: { contains: q, mode: 'insensitive' } },
        { barcode: q },
      ],
    },
    include: { stockItems: { where: { branchId } } },
    take: 20,
  });

  return products.map((p) => {
    const stock = p.stockItems[0];
    const available = stock ? stock.onHand - stock.reserved : 0;
    return {
      id: p.id,
      name: p.name,
      skuCode: p.skuCode,
      barcode: p.barcode,
      sellingPrice: p.sellingPrice,
      available,
    };
  });
}

export interface CheckoutInput {
  branchId: string;
  paymentMethod: 'CASH' | 'QR_TRANSFER';
  customerName?: string;
  customerPhone?: string;
  items: { productId: string; quantity: number }[];
}

/**
 * FR-POS-04: Reserve -> Confirm -> Complete executed as a single atomic DB transaction
 * (NFR-SEC-02). Anti-oversell (FR-POS-02) is enforced by the same row-locked reserveStock
 * primitive the online order hub uses, so POS sales can never eat into online-reserved stock.
 */
export async function fastCheckout(tenantId: string, input: CheckoutInput) {
  const products = await prisma.product.findMany({
    where: { tenantId, id: { in: input.items.map((i) => i.productId) }, isActive: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const item of input.items) {
    if (!productMap.has(item.productId)) {
      throw new BusinessRuleError(`Không tìm thấy sản phẩm với ID: ${item.productId}`);
    }
  }

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        tenantId,
        branchId: input.branchId,
        channel: OrderChannel.POS,
        externalOrderId: `POS-${randomUUID()}`,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        paymentMethod: input.paymentMethod,
        state: OrderState.DRAFT,
        items: {
          create: input.items.map((item) => {
            const product = productMap.get(item.productId)!;
            return {
              tenantId,
              productId: item.productId,
              quantity: item.quantity,
              sellingPrice: product.sellingPrice,
              snapshotCostPrice: product.costPrice,
            };
          }),
        },
      },
      include: { items: true },
    });

    const lines = created.items.map((i) => ({ productId: i.productId, quantity: i.quantity }));

    await reserveStock(tenantId, input.branchId, lines, created.id, tx);
    await confirmStock(tenantId, input.branchId, lines, created.id, tx);

    return tx.order.update({
      where: { id: created.id },
      data: {
        state: OrderState.COMPLETED,
        reservedAt: new Date(),
        confirmedAt: new Date(),
        completedAt: new Date(),
      },
      include: { items: { include: { product: true } } },
    });
  });

  emitOrderEvent(tenantId, 'order:new', order);
  emitOrderEvent(tenantId, 'order:completed', order);
  return order;
}
