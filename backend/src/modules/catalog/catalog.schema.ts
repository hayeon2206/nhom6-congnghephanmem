import { z } from 'zod';

// Uploaded images are served back from our own /uploads static route as a
// relative path (see uploads.routes.ts) — accept that, or a full http(s) URL
// for anything set by other means.
const imageUrlSchema = z.string().refine((v) => v.startsWith('/uploads/') || /^https?:\/\//.test(v), {
  message: 'Đường dẫn ảnh không hợp lệ.',
});

export const createCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: imageUrlSchema.optional(),
  parentCategoryId: z.string().uuid().optional(),
});
export const updateCategorySchema = createCategorySchema.partial();

export const createBrandSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: imageUrlSchema.optional(),
});
export const updateBrandSchema = createBrandSchema.partial();

export const createProductSchema = z.object({
  name: z.string().min(1),
  skuCode: z.string().min(1).optional(), // auto-generated when omitted
  barcode: z.string().optional(), // auto-generated when omitted
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  imageUrl: imageUrlSchema.optional(),
  attributes: z.record(z.string()).optional(), // e.g. { color: "Do", size: "M" }
  costPrice: z.number().nonnegative().default(0),
  sellingPrice: z.number().nonnegative(),
  wholesalePrice: z.number().nonnegative().optional(),
  reorderThreshold: z.number().int().nonnegative().default(5),
});

export const updateProductSchema = createProductSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const searchProductSchema = z.object({
  q: z.string().optional(),
  branchId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(200).default(20),
});
