import { prisma } from '../../src/lib/prisma';
import { confirmStock, releaseStock, reserveStock } from '../../src/modules/inventory/stock.service';
import { BusinessRuleError } from '../../src/domain/errors';
import { createFixture, getStockItem } from '../helpers';

describe('stock.service — anti-oversell primitives (FR-RSE)', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('reserves stock and increases the Reserved column without touching OnHand', async () => {
    const { tenant, branch, product } = await createFixture({ onHand: 10 });

    await reserveStock(tenant.id, branch.id, [{ productId: product.id, quantity: 4 }], 'order-1');

    const stock = await getStockItem(tenant.id, product.id, branch.id);
    expect(stock.onHand).toBe(10);
    expect(stock.reserved).toBe(4);
  });

  it('rejects a reservation that exceeds available stock (FR-RSE-02)', async () => {
    const { tenant, branch, product } = await createFixture({ onHand: 5 });

    await expect(
      reserveStock(tenant.id, branch.id, [{ productId: product.id, quantity: 6 }], 'order-2'),
    ).rejects.toThrow(BusinessRuleError);

    const stock = await getStockItem(tenant.id, product.id, branch.id);
    expect(stock.reserved).toBe(0); // rejected reservation must not partially apply
  });

  it('release returns reserved stock to the available pool (Cancelled path)', async () => {
    const { tenant, branch, product } = await createFixture({ onHand: 10 });
    await reserveStock(tenant.id, branch.id, [{ productId: product.id, quantity: 4 }], 'order-3');

    await releaseStock(tenant.id, branch.id, [{ productId: product.id, quantity: 4 }], 'order-3');

    const stock = await getStockItem(tenant.id, product.id, branch.id);
    expect(stock.reserved).toBe(0);
    expect(stock.onHand).toBe(10);
  });

  it('confirm deducts OnHand, clears Reserved, and appends a SALE ledger entry (FR-RSE-03 / NFR-SEC-03)', async () => {
    const { tenant, branch, product } = await createFixture({ onHand: 10 });
    await reserveStock(tenant.id, branch.id, [{ productId: product.id, quantity: 4 }], 'order-4');

    await confirmStock(tenant.id, branch.id, [{ productId: product.id, quantity: 4 }], 'order-4');

    const stock = await getStockItem(tenant.id, product.id, branch.id);
    expect(stock.onHand).toBe(6);
    expect(stock.reserved).toBe(0);

    const ledgerEntries = await prisma.inventoryTransaction.findMany({ where: { tenantId: tenant.id, productId: product.id } });
    expect(ledgerEntries).toHaveLength(1);
    expect(ledgerEntries[0].type).toBe('SALE');
    expect(ledgerEntries[0].quantity).toBe(-4);
    expect(ledgerEntries[0].balanceAfter).toBe(6);
  });

  it('never lets concurrent reservations drive Available below zero (NFR-PERF-02)', async () => {
    const { tenant, branch, product } = await createFixture({ onHand: 20 });

    const attempts = Array.from({ length: 50 }, (_, i) =>
      reserveStock(tenant.id, branch.id, [{ productId: product.id, quantity: 1 }], `concurrent-${i}`).then(
        () => true,
        () => false,
      ),
    );

    const results = await Promise.all(attempts);
    const successCount = results.filter(Boolean).length;

    expect(successCount).toBe(20); // exactly the available stock, no more

    const stock = await getStockItem(tenant.id, product.id, branch.id);
    expect(stock.reserved).toBe(20);
    expect(stock.onHand - stock.reserved).toBe(0); // Available never goes negative
  });
});
