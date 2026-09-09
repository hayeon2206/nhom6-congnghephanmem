import { z } from 'zod';

export const revenueReportQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  branchId: z.string().uuid().optional(),
  channel: z.string().optional(),
  productId: z.string().uuid().optional(),
});

export const velocityReportQuerySchema = z.object({
  branchId: z.string().uuid().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const stockAlertQuerySchema = z.object({
  branchId: z.string().uuid().optional(),
});
