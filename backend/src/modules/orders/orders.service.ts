import { randomUUID } from 'crypto';
import { OrderChannel, OrderState, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { BusinessRuleError, NotFoundError } from '../../domain/errors';
import { assertTransition } from '../../domain/orderStateMachine';
import { confirmStock, releaseStock, reserveStock } from '../inventory/stock.service';
import { emitOrderEvent } from '../../realtime/socket';

export interface CreateOrderInput {
  branchId: string;
  customerName?: string;
  customerPhone?: string;
  paymentMethod?: string;
  items: { productId: string; quantity: number; sellingPrice?: number }[];
  channel?: OrderChannel;
  externalOrderId?: string;
}

/** FR-ORD-01: normalizes any order source (POS, Admin, webhook) into one canonical Order + OrderItem shape. */
export async function createOrder(tenantId: string, input: CreateOrderInput) {
  const products = await prisma.product.findMany({
    where: { tenantId, id: { in: input.items.map((i) => i.productId) } },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const item of input.items) {
    if (!productMap.has(item.productId)) {
      throw new BusinessRuleError(`Không tìm thấy sản phẩm với ID: ${item.productId}`);
    }
  }

  const order = await prisma.order.create({
    data: {
      tenantId,
      branchId: input.branchId,
      channel: input.channel ?? OrderChannel.ADMIN,
      externalOrderId: input.externalOrderId ?? `ADMIN-${randomUUID()}`,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      paymentMethod: input.paymentMethod,
      items: {
        create: input.items.map((item) => {
          const product = productMap.get(item.productId)!;
          return {
            tenantId,
            productId: item.productId,
            quantity: item.quantity,
            sellingPrice: item.sellingPrice ?? product.sellingPrice,
            snapshotCostPrice: product.costPrice,
          };
        }),
      },
    },
    include: { items: { include: { product: true } } },
  });

  emitOrderEvent(tenantId, 'order:new', order);
  return order;
}

async function loadOrderOrThrow(tx: Prisma.TransactionClient, tenantId: string, orderId: string) {
  const order = await tx.order.findFirst({ where: { id: orderId, tenantId }, include: { items: true } });
  if (!order) throw new NotFoundError('Không tìm thấy đơn hàng.');
  return order;
}

function toStockLines(items: { productId: string; quantity: number }[]) {
  return items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
}

/** FR-ORD-02 + FR-RSE-02: Draft -> Reserved. Rejects (BusinessRuleError) if any SKU lacks available stock. */
export async function reserveOrder(tenantId: string, orderId: string) {
  const order = await prisma.$transaction(async (tx) => {
    const current = await loadOrderOrThrow(tx, tenantId, orderId);
    assertTransition(current.state, OrderState.RESERVED);

    await reserveStock(tenantId, current.branchId, toStockLines(current.items), current.id, tx);

    return tx.order.update({
      where: { id: current.id },
      data: { state: OrderState.RESERVED, reservedAt: new Date() },
      include: { items: { include: { product: true } } },
    });
  });

  emitOrderEvent(tenantId, 'order:reserved', order);
  return order;
}

/** FR-ORD-02 + FR-RSE-03 (Confirmed): deducts on-hand, releases the reservation, snapshots COGS (FR-COST-02). */
export async function confirmOrder(tenantId: string, orderId: string) {
  const order = await prisma.$transaction(async (tx) => {
    const current = await loadOrderOrThrow(tx, tenantId, orderId);
    assertTransition(current.state, OrderState.CONFIRMED);

    // FR-COST-02: re-snapshot the unit cost at the moment of confirmation.
    for (const item of current.items) {
      const product = await tx.product.findUniqueOrThrow({ where: { id: item.productId } });
      await tx.orderItem.update({ where: { id: item.id }, data: { snapshotCostPrice: product.costPrice } });
    }

    await confirmStock(tenantId, current.branchId, toStockLines(current.items), current.id, tx);

    return tx.order.update({
      where: { id: current.id },
      data: { state: OrderState.CONFIRMED, confirmedAt: new Date() },
      include: { items: { include: { product: true } } },
    });
  });

  emitOrderEvent(tenantId, 'order:confirmed', order);
  return order;
}

export async function completeOrder(tenantId: string, orderId: string) {
  const order = await prisma.$transaction(async (tx) => {
    const current = await loadOrderOrThrow(tx, tenantId, orderId);
    assertTransition(current.state, OrderState.COMPLETED);

    return tx.order.update({
      where: { id: current.id },
      data: { state: OrderState.COMPLETED, completedAt: new Date() },
      include: { items: { include: { product: true } } },
    });
  });

  emitOrderEvent(tenantId, 'order:completed', order);
  return order;
}

/** FR-RSE-03 (Cancelled): releases any held reservation back to the available pool. */
export async function cancelOrder(tenantId: string, orderId: string) {
  const order = await prisma.$transaction(async (tx) => {
    const current = await loadOrderOrThrow(tx, tenantId, orderId);
    assertTransition(current.state, OrderState.CANCELLED);

    if (current.state === OrderState.RESERVED) {
      await releaseStock(tenantId, current.branchId, toStockLines(current.items), current.id, tx);
    }

    return tx.order.update({
      where: { id: current.id },
      data: { state: OrderState.CANCELLED, cancelledAt: new Date() },
      include: { items: { include: { product: true } } },
    });
  });

  emitOrderEvent(tenantId, 'order:cancelled', order);
  return order;
}

export interface ListOrdersQuery {
  state?: string;
  channel?: string;
  branchId?: string;
  page: number;
  pageSize: number;
}

export async function listOrders(tenantId: string, query: ListOrdersQuery) {
  const where: Prisma.OrderWhereInput = {
    tenantId,
    ...(query.state ? { state: query.state as OrderState } : {}),
    ...(query.channel ? { channel: query.channel as OrderChannel } : {}),
    ...(query.branchId ? { branchId: query.branchId } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: { include: { product: true } }, branch: true },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  return { items, total, page: query.page, pageSize: query.pageSize };
}

export async function getOrder(tenantId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId },
    include: { items: { include: { product: true } }, branch: true },
  });
  if (!order) throw new NotFoundError('Không tìm thấy đơn hàng.');
  return order;
}

/** FR-SIM-03: auto-cancels Reserved orders whose reservation has expired, releasing stock back to the pool. */
export async function cancelExpiredReservations(reservationExpiryMinutes: number) {
  const cutoff = new Date(Date.now() - reservationExpiryMinutes * 60 * 1000);
  const expired = await prisma.order.findMany({
    where: { state: OrderState.RESERVED, reservedAt: { lt: cutoff } },
    select: { id: true, tenantId: true },
  });

  let cancelledCount = 0;
  for (const order of expired) {
    try {
      await cancelOrder(order.tenantId, order.id);
      cancelledCount++;
    } catch {
      // Best-effort background sweep — a single failed order should not stop the batch.
    }
  }
  return cancelledCount;
}
