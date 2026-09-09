import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/password';
import { generateEan13Barcode } from '../src/domain/barcode';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo tenant...');

  const passwordHash = await hashPassword('123456');

  const tenant = await prisma.tenant.create({
    data: { name: 'Cua Hang Demo OISM', slug: 'demo-oism' },
  });

  const owner = await prisma.user.create({
    data: { tenantId: tenant.id, name: 'Chu cua hang', email: 'owner@demo.com', passwordHash, role: 'OWNER' },
  });
  await prisma.user.create({
    data: { tenantId: tenant.id, name: 'Nhan vien kho', email: 'staff@demo.com', passwordHash, role: 'STAFF' },
  });
  await prisma.user.create({
    data: { tenantId: tenant.id, name: 'Thu ngan', email: 'cashier@demo.com', passwordHash, role: 'CASHIER' },
  });

  const mainBranch = await prisma.branch.create({
    data: { tenantId: tenant.id, name: 'Chi nhanh trung tam', address: '123 Nguyen Trai, Q1', isWarehouse: true },
  });
  const branch2 = await prisma.branch.create({
    data: { tenantId: tenant.id, name: 'Chi nhanh Thu Duc', address: '45 Vo Van Ngan, TP Thu Duc' },
  });

  const category = await prisma.category.create({ data: { tenantId: tenant.id, name: 'Thoi trang' } });
  const brand = await prisma.brand.create({ data: { tenantId: tenant.id, name: 'OISM Basic' } });

  const productDefs = [
    { name: 'Ao thun basic', sellingPrice: 150000, costSeed: 80000 },
    { name: 'Quan jean slimfit', sellingPrice: 450000, costSeed: 250000 },
    { name: 'Ao khoac gio', sellingPrice: 350000, costSeed: 180000 },
    { name: 'Non luoi trai', sellingPrice: 90000, costSeed: 40000 },
  ];

  for (const def of productDefs) {
    const product = await prisma.product.create({
      data: {
        tenantId: tenant.id,
        name: def.name,
        skuCode: def.name.toUpperCase().replace(/\s+/g, '-'),
        barcode: generateEan13Barcode(),
        categoryId: category.id,
        brandId: brand.id,
        sellingPrice: def.sellingPrice,
        costPrice: 0,
        reorderThreshold: 5,
      },
    });

    for (const branch of [mainBranch, branch2]) {
      await prisma.stockItem.create({ data: { tenantId: tenant.id, productId: product.id, branchId: branch.id, onHand: 0, reserved: 0 } });
    }

    // Seed initial stock via a confirmed purchase receipt so cost price + ledger stay consistent.
    const receipt = await prisma.purchaseReceipt.create({
      data: {
        tenantId: tenant.id,
        branchId: mainBranch.id,
        supplierName: 'NCC Demo',
        code: `SEED-${product.skuCode}`,
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        items: { create: [{ tenantId: tenant.id, productId: product.id, quantity: 100, unitCost: def.costSeed }] },
      },
    });

    await prisma.stockItem.updateMany({
      where: { tenantId: tenant.id, productId: product.id, branchId: mainBranch.id },
      data: { onHand: 100 },
    });
    await prisma.product.update({ where: { id: product.id }, data: { costPrice: def.costSeed } });
    await prisma.inventoryTransaction.create({
      data: {
        tenantId: tenant.id,
        branchId: mainBranch.id,
        productId: product.id,
        type: 'IMPORT',
        quantity: 100,
        balanceAfter: 100,
        referenceId: receipt.id,
        note: 'Nhap kho khoi tao du lieu demo',
      },
    });
  }

  console.log('Seed complete.');
  console.log('Login: owner@demo.com / staff@demo.com / cashier@demo.com — password: 123456');
  console.log('Tenant:', tenant.slug, tenant.id);
  console.log('Owner user id:', owner.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
