import { z } from 'zod';

const receiptItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitCost: z.number().nonnegative(),
});

export const createPurchaseReceiptSchema = z.object({
  branchId: z.string().uuid(),
  supplierName: z.string().optional(),
  items: z.array(receiptItemSchema).min(1),
});

const transferItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const createTransferSchema = z
  .object({
    fromBranchId: z.string().uuid(),
    toBranchId: z.string().uuid(),
    note: z.string().optional(),
    items: z.array(transferItemSchema).min(1),
  })
  .refine((v) => v.fromBranchId !== v.toBranchId, { message: 'Chi nhánh nguồn và đích phải khác nhau.' });

const stocktakeItemSchema = z.object({
  productId: z.string().uuid(),
  countedQty: z.number().int().nonnegative(),
});

export const createStocktakeSchema = z.object({
  branchId: z.string().uuid(),
  note: z.string().optional(),
});

export const completeStocktakeSchema = z.object({
  items: z.array(stocktakeItemSchema).min(1),
});

export const ledgerQuerySchema = z.object({
  branchId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  type: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(200).default(50),
});

export const stockQuerySchema = z.object({
  branchId: z.string().uuid().optional(),
});
