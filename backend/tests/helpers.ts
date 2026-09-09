import { randomUUID } from 'crypto';
import { prisma } from '../src/lib/prisma';

/** Creates an isolated Tenant + Branch + Product fixture so tests never collide with each other. */
export async function createFixture(overrides?: { onHand?: number; sellingPrice?: number; costPrice?: number }) {
  const suffix = randomUUID().slice(0, 8);

  const tenant = await prisma.tenant.create({ data: { name: `Test Tenant ${suffix}`, slug: `test-${suffix}` } });
  const branch = await prisma.branch.create({ data: { tenantId: tenant.id, name: 'Chi nhanh test' } });
  const branch2 = await prisma.branch.create({ data: { tenantId: tenant.id, name: 'Chi nhanh test 2' } });

  const product = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      name: `San pham test ${suffix}`,
      skuCode: `SKU-${suffix}`,
      barcode: `BAR-${suffix}`,
      sellingPrice: overrides?.sellingPrice ?? 100000,
      costPrice: overrides?.costPrice ?? 50000,
      reorderThreshold: 5,
    },
  });

  await prisma.stockItem.create({
    data: { tenantId: tenant.id, productId: product.id, branchId: branch.id, onHand: overrides?.onHand ?? 10, reserved: 0 },
  });
  await prisma.stockItem.create({ data: { tenantId: tenant.id, productId: product.id, branchId: branch2.id, onHand: 0, reserved: 0 } });

  return { tenant, branch, branch2, product };
}

export async function getStockItem(tenantId: string, productId: string, branchId: string) {
  return prisma.stockItem.findFirstOrThrow({ where: { tenantId, productId, branchId } });
}
