import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { generateEan13Barcode, generateSkuCode } from '../../domain/barcode';
import { NotFoundError } from '../../domain/errors';

// ---------- Categories (FR-PROD-01) ----------

export async function listCategories(tenantId: string) {
  return prisma.category.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
}

export async function createCategory(tenantId: string, input: { name: string; description?: string; parentCategoryId?: string }) {
  return prisma.category.create({ data: { tenantId, ...input } });
}

export async function updateCategory(tenantId: string, id: string, input: Partial<{ name: string; description: string; parentCategoryId: string }>) {
  const category = await prisma.category.findFirst({ where: { id, tenantId } });
  if (!category) throw new NotFoundError('Không tìm thấy danh mục.');
  return prisma.category.update({ where: { id }, data: input });
}

export async function deleteCategory(tenantId: string, id: string) {
  const category = await prisma.category.findFirst({ where: { id, tenantId } });
  if (!category) throw new NotFoundError('Không tìm thấy danh mục.');
  await prisma.category.delete({ where: { id } });
}

// ---------- Brands (FR-PROD-01) ----------

export async function listBrands(tenantId: string) {
  return prisma.brand.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
}

export async function createBrand(tenantId: string, input: { name: string; description?: string }) {
  return prisma.brand.create({ data: { tenantId, ...input } });
}

export async function updateBrand(tenantId: string, id: string, input: Partial<{ name: string; description: string }>) {
  const brand = await prisma.brand.findFirst({ where: { id, tenantId } });
  if (!brand) throw new NotFoundError('Không tìm thấy thương hiệu.');
  return prisma.brand.update({ where: { id }, data: input });
}

export async function deleteBrand(tenantId: string, id: string) {
  const brand = await prisma.brand.findFirst({ where: { id, tenantId } });
  if (!brand) throw new NotFoundError('Không tìm thấy thương hiệu.');
  await prisma.brand.delete({ where: { id } });
}

// ---------- Products / SKUs (FR-PROD-02/03/04) ----------

export interface ProductInput {
  name: string;
  skuCode?: string;
  barcode?: string;
  categoryId?: string;
  brandId?: string;
  attributes?: Record<string, string>;
  costPrice?: number;
  sellingPrice: number;
  wholesalePrice?: number;
  reorderThreshold?: number;
}

export async function createProduct(tenantId: string, input: ProductInput) {
  const skuCode = input.skuCode?.trim() || generateSkuCode(input.name);
  const barcode = input.barcode?.trim() || generateEan13Barcode();

  const branches = await prisma.branch.findMany({ where: { tenantId }, select: { id: true } });

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        tenantId,
        name: input.name,
        skuCode,
        barcode,
        categoryId: input.categoryId,
        brandId: input.brandId,
        attributes: input.attributes as Prisma.InputJsonValue | undefined,
        costPrice: input.costPrice ?? 0,
        sellingPrice: input.sellingPrice,
        wholesalePrice: input.wholesalePrice,
        reorderThreshold: input.reorderThreshold ?? 5,
      },
    });

    if (branches.length > 0) {
      await tx.stockItem.createMany({
        data: branches.map((b) => ({ tenantId, productId: product.id, branchId: b.id, onHand: 0, reserved: 0 })),
      });
    }

    return product;
  });
}

export async function updateProduct(tenantId: string, id: string, input: Partial<ProductInput> & { isActive?: boolean }) {
  const product = await prisma.product.findFirst({ where: { id, tenantId } });
  if (!product) throw new NotFoundError('Không tìm thấy sản phẩm.');

  return prisma.product.update({
    where: { id },
    data: {
      ...input,
      attributes: input.attributes as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function getProduct(tenantId: string, id: string) {
  const product = await prisma.product.findFirst({
    where: { id, tenantId },
    include: { category: true, brand: true, stockItems: { include: { branch: true } } },
  });
  if (!product) throw new NotFoundError('Không tìm thấy sản phẩm.');
  return product;
}

export interface SearchProductParams {
  q?: string;
  branchId?: string;
  categoryId?: string;
  page: number;
  pageSize: number;
}

/** FR-POS-01 / general catalog search: matches on name, SKU code, or barcode. */
export async function searchProducts(tenantId: string, params: SearchProductParams) {
  const where: Prisma.ProductWhereInput = {
    tenantId,
    isActive: true,
    ...(params.categoryId ? { categoryId: params.categoryId } : {}),
    ...(params.q
      ? {
          OR: [
            { name: { contains: params.q, mode: 'insensitive' } },
            { skuCode: { contains: params.q, mode: 'insensitive' } },
            { barcode: { contains: params.q } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        brand: true,
        stockItems: params.branchId ? { where: { branchId: params.branchId } } : true,
      },
      orderBy: { name: 'asc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: items.map((p) => ({
      ...p,
      available: p.stockItems.reduce((sum, s) => sum + (s.onHand - s.reserved), 0),
      onHand: p.stockItems.reduce((sum, s) => sum + s.onHand, 0),
    })),
    total,
    page: params.page,
    pageSize: params.pageSize,
  };
}
