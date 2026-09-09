import { prisma } from '../../src/lib/prisma';
import { ingestWebhookOrder } from '../../src/modules/webhooks/webhooks.service';
import { createFixture } from '../helpers';

describe('webhooks.service — omnichannel ingestion (FR-SIM-01 / BR-13 idempotency)', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates a canonical order and auto-reserves it when stock is available', async () => {
    const { tenant, branch, product } = await createFixture({ onHand: 10 });

    const result = await ingestWebhookOrder(tenant.id, {
      channel: 'SHOPEE',
      externalOrderId: 'SHOPEE-001',
      branchId: branch.id,
      items: [{ skuCode: product.skuCode, quantity: 2 }],
    });

    expect(result.isDuplicate).toBe(false);
    expect(result.reserved).toBe(true);
    expect(result.order.state).toBe('RESERVED');
  });

  it('a retried webhook with the same externalOrderId returns the existing order, not a new one', async () => {
    const { tenant, branch, product } = await createFixture({ onHand: 10 });
    const payload = {
      channel: 'TIKTOK' as const,
      externalOrderId: 'TIKTOK-DUPLICATE-001',
      branchId: branch.id,
      items: [{ skuCode: product.skuCode, quantity: 1 }],
    };

    const first = await ingestWebhookOrder(tenant.id, payload);
    const second = await ingestWebhookOrder(tenant.id, payload);

    expect(second.isDuplicate).toBe(true);
    expect(second.order.id).toBe(first.order.id);

    const allOrders = await prisma.order.findMany({ where: { tenantId: tenant.id, externalOrderId: payload.externalOrderId } });
    expect(allOrders).toHaveLength(1);
  });

  it('leaves the order in Draft (not Reserved) when there is not enough stock', async () => {
    const { tenant, branch, product } = await createFixture({ onHand: 1 });

    const result = await ingestWebhookOrder(tenant.id, {
      channel: 'LAZADA',
      externalOrderId: 'LAZADA-OVERSELL-001',
      branchId: branch.id,
      items: [{ skuCode: product.skuCode, quantity: 5 }],
    });

    expect(result.reserved).toBe(false);
    expect(result.order.state).toBe('DRAFT');
  });
});
