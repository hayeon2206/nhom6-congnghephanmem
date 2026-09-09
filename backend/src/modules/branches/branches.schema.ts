import { z } from 'zod';

export const createBranchSchema = z.object({
  name: z.string().min(2),
  address: z.string().optional(),
  phone: z.string().optional(),
  isWarehouse: z.boolean().optional(),
});

export const updateBranchSchema = z.object({
  name: z.string().min(2).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  isWarehouse: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
