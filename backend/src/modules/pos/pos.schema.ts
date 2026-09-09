import { z } from 'zod';

export const posLookupSchema = z.object({
  q: z.string().min(1),
  branchId: z.string().uuid(),
});

const checkoutLineSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const posCheckoutSchema = z.object({
  branchId: z.string().uuid(),
  paymentMethod: z.enum(['CASH', 'QR_TRANSFER']),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  items: z.array(checkoutLineSchema).min(1),
});
