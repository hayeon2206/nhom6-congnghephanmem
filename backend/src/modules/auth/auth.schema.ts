import { z } from 'zod';

export const registerTenantSchema = z.object({
  tenantName: z.string().min(2, 'Tên cửa hàng phải có ít nhất 2 ký tự.'),
  ownerName: z.string().min(2, 'Tên chủ cửa hàng phải có ít nhất 2 ký tự.'),
  email: z.string().email('Email không hợp lệ.'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự.'),
});

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ.'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Thiếu refresh token.'),
});

export type RegisterTenantInput = z.infer<typeof registerTenantSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
