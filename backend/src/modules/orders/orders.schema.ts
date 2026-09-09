import { z } from 'zod';

const orderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  sellingPrice: z.number().nonnegative().optional(), // defaults to the product's current selling price
});

export const createOrderSchema = z.object({
  branchId: z.string().uuid(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  paymentMethod: z.string().optional(),
  items: z.array(orderItemSchema).min(1),
});

export const listOrdersQuerySchema = z.object({
  state: z.string().optional(),
  channel: z.string().optional(),
  branchId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
