import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),
  role: z.enum(['OWNER', 'STAFF', 'CASHIER']),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  role: z.enum(['OWNER', 'STAFF', 'CASHIER']).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
});
