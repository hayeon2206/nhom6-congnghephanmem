import { z } from 'zod';

const webhookItemSchema = z.object({
  skuCode: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const webhookOrderSchema = z.object({
  channel: z.enum(['SHOPEE', 'TIKTOK', 'LAZADA']),
  externalOrderId: z.string().min(1),
  branchId: z.string().uuid(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  items: z.array(webhookItemSchema).min(1),
});

/** FR-SIM-01: fires N concurrent mock orders at the same SKU to exercise the anti-oversell lock. */
export const webhookBurstSchema = z.object({
  channel: z.enum(['SHOPEE', 'TIKTOK', 'LAZADA']),
  branchId: z.string().uuid(),
  productId: z.string().uuid(),
  quantityPerOrder: z.number().int().positive().default(1),
  concurrentOrders: z.number().int().positive().max(200).default(20),
});
