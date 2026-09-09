import { OrderChannel } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { BusinessRuleError } from '../../domain/errors';
import { createOrder, reserveOrder } from '../orders/orders.service';
import { emitOrderEvent } from '../../realtime/socket';

export interface WebhookOrderPayload {
  channel: 'SHOPEE' | 'TIKTOK' | 'LAZADA';
  externalOrderId: string;
  branchId: string;
  customerName?: string;
  customerPhone?: string;
  items: { skuCode: string; quantity: number }[];
}

/**
 * FR-SIM-01 / FR-ORD-01: simulates an inbound e-commerce webhook. Idempotent on
 * (tenantId, channel, externalOrderId) — a retried webhook returns the existing order
 * instead of creating a duplicate (BR-13).
 */
export async function ingestWebhookOrder(tenantId: string, payload: WebhookOrderPayload) {
  const existing = await prisma.order.findUnique({
    where: { tenantId_channel_externalOrderId: { tenantId, channel: payload.channel as OrderChannel, externalOrderId: payload.externalOrderId } },
    include: { items: { include: { product: true } } },
  });

  if (existing) {
    await logWebhook(tenantId, payload, existing.id, true);
    return { order: existing, isDuplicate: true, reserved: existing.state !== 'DRAFT' };
  }

  const products = await prisma.product.findMany({
    where: { tenantId, skuCode: { in: payload.items.map((i) => i.skuCode) } },
  });
  const productBySku = new Map(products.map((p) => [p.skuCode, p]));

  for (const item of payload.items) {
    if (!productBySku.has(item.skuCode)) {
      throw new BusinessRuleError(`Không tìm thấy sản phẩm với mã SKU '${item.skuCode}'.`);
    }
  }

  let order;
  try {
    order = await createOrder(tenantId, {
      branchId: payload.branchId,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      channel: payload.channel as OrderChannel,
      externalOrderId: payload.externalOrderId,
      items: payload.items.map((i) => ({ productId: productBySku.get(i.skuCode)!.id, quantity: i.quantity })),
    });
  } catch (err) {
    // BR-13 race-safety net: a near-simultaneous duplicate webhook can lose the pre-check
    // above to the DB's unique constraint. Fall back to returning the row that won.
    const race = await prisma.order.findUnique({
      where: { tenantId_channel_externalOrderId: { tenantId, channel: payload.channel as OrderChannel, externalOrderId: payload.externalOrderId } },
      include: { items: { include: { product: true } } },
    });
    if (race) {
      await logWebhook(tenantId, payload, race.id, true);
      return { order: race, isDuplicate: true, reserved: race.state !== 'DRAFT' };
    }
    throw err;
  }

  await logWebhook(tenantId, payload, order.id, false);

  // FR-RSE-02: online orders attempt to move straight into Reserved when they enter the hub.
  let reserved = false;
  try {
    order = await reserveOrder(tenantId, order.id);
    reserved = true;
  } catch (err) {
    if (!(err instanceof BusinessRuleError)) throw err;
    // Not enough available stock — the order stays Draft for staff to review manually (FR-ORD-03).
  }

  emitOrderEvent(tenantId, 'webhook:received', { orderId: order.id, channel: payload.channel, reserved });
  return { order, isDuplicate: false, reserved };
}

async function logWebhook(tenantId: string, payload: WebhookOrderPayload, orderId: string, isDuplicate: boolean) {
  await prisma.webhookLog.create({
    data: { tenantId, channel: payload.channel, payload: payload as any, orderId, isDuplicate },
  });
}

export async function listWebhookLogs(tenantId: string) {
  return prisma.webhookLog.findMany({ where: { tenantId }, orderBy: { receivedAt: 'desc' }, take: 100 });
}

/** FR-SIM-01: throughput/lock test — fires many concurrent orders at the same SKU/branch. */
export async function simulateBurst(
  tenantId: string,
  input: { channel: 'SHOPEE' | 'TIKTOK' | 'LAZADA'; branchId: string; productId: string; quantityPerOrder: number; concurrentOrders: number },
) {
  const product = await prisma.product.findFirst({ where: { id: input.productId, tenantId } });
  if (!product) throw new BusinessRuleError('Không tìm thấy sản phẩm.');

  const jobs = Array.from({ length: input.concurrentOrders }, (_, i) =>
    ingestWebhookOrder(tenantId, {
      channel: input.channel,
      externalOrderId: `BURST-${Date.now()}-${i}`,
      branchId: input.branchId,
      items: [{ skuCode: product.skuCode, quantity: input.quantityPerOrder }],
    }).then(
      (r) => ({ ok: true as const, reserved: r.reserved }),
      (err) => ({ ok: false as const, message: err instanceof Error ? err.message : String(err) }),
    ),
  );

  const results = await Promise.all(jobs);
  return {
    total: results.length,
    reserved: results.filter((r) => r.ok && r.reserved).length,
    rejected: results.filter((r) => r.ok && !r.reserved).length,
    failed: results.filter((r) => !r.ok).length,
  };
}
