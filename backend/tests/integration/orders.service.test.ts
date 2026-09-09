import { prisma } from '../../src/lib/prisma';
import * as ordersService from '../../src/modules/orders/orders.service';
import { createFixture, getStockItem } from '../helpers';

describe('orders.service — Order Hub lifecycle (FR-ORD / FR-COST-02)', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('walks Draft -> Reserved -> Confirmed -> Completed, deducting stock only on Confirm', async () => {
    const { tenant, branch, product } = await createFixture({ onHand: 10, costPrice: 50000 });

    const order = await ordersService.createOrder(tenant.id, {
      branchId: branch.id,
      items: [{ productId: product.id, quantity: 3 }],
    });
    expect(order.state).toBe('DRAFT');

    const reserved = await ordersService.reserveOrder(tenant.id, order.id);
    expect(reserved.state).toBe('RESERVED');
    let stock = await getStockItem(tenant.id, product.id, branch.id);
    expect(stock.onHand).toBe(10); // unchanged until Confirmed
    expect(stock.reserved).toBe(3);

    const confirmed = await ordersService.confirmOrder(tenant.id, order.id);
    expect(confirmed.state).toBe('CONFIRMED');
    stock = await getStockItem(tenant.id, product.id, branch.id);
    expect(stock.onHand).toBe(7);
    expect(stock.reserved).toBe(0);

    const completed = await ordersService.completeOrder(tenant.id, order.id);
    expect(completed.state).toBe('COMPLETED');
  });

  it('cancelling a Reserved order releases the hold back to Available', async () => {
    const { tenant, branch, product } = await createFixture({ onHand: 10 });

    const order = await ordersService.createOrder(tenant.id, { branchId: branch.id, items: [{ productId: product.id, quantity: 5 }] });
    await ordersService.reserveOrder(tenant.id, order.id);

    const cancelled = await ordersService.cancelOrder(tenant.id, order.id);
    expect(cancelled.state).toBe('CANCELLED');

    const stock = await getStockItem(tenant.id, product.id, branch.id);
    expect(stock.onHand).toBe(10);
    expect(stock.reserved).toBe(0);
  });

  it('rejects reserving an order twice (illegal Reserved -> Reserved transition)', async () => {
    const { tenant, branch, product } = await createFixture({ onHand: 10 });
    const order = await ordersService.createOrder(tenant.id, { branchId: branch.id, items: [{ productId: product.id, quantity: 1 }] });
    await ordersService.reserveOrder(tenant.id, order.id);

    await expect(ordersService.reserveOrder(tenant.id, order.id)).rejects.toThrow();
  });

  it('re-snapshots the unit cost at Confirm time (FR-COST-02)', async () => {
    const { tenant, branch, product } = await createFixture({ onHand: 10, costPrice: 50000 });
    const order = await ordersService.createOrder(tenant.id, { branchId: branch.id, items: [{ productId: product.id, quantity: 1 }] });

    // Cost changes after the order was created (e.g. a purchase receipt landed) but before confirmation.
    await prisma.product.update({ where: { id: product.id }, data: { costPrice: 70000 } });

    await ordersService.reserveOrder(tenant.id, order.id);
    const confirmed = await ordersService.confirmOrder(tenant.id, order.id);

    expect(Number(confirmed.items[0].snapshotCostPrice)).toBe(70000);
  });

  it('cancelExpiredReservations releases reservations past the expiry window', async () => {
    const { tenant, branch, product } = await createFixture({ onHand: 10 });
    const order = await ordersService.createOrder(tenant.id, { branchId: branch.id, items: [{ productId: product.id, quantity: 4 }] });
    await ordersService.reserveOrder(tenant.id, order.id);

    // Simulate a reservation made 60 minutes ago.
    await prisma.order.update({ where: { id: order.id }, data: { reservedAt: new Date(Date.now() - 60 * 60 * 1000) } });

    const cancelledCount = await ordersService.cancelExpiredReservations(30);
    expect(cancelledCount).toBeGreaterThanOrEqual(1);

    const refreshed = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(refreshed.state).toBe('CANCELLED');
  });
});
