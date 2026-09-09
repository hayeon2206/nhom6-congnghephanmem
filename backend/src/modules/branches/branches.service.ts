import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../domain/errors';

export async function listBranches(tenantId: string) {
  return prisma.branch.findMany({ where: { tenantId }, orderBy: { createdAt: 'asc' } });
}

export async function createBranch(
  tenantId: string,
  input: { name: string; address?: string; phone?: string; isWarehouse?: boolean },
) {
  return prisma.branch.create({ data: { tenantId, ...input } });
}

export async function updateBranch(tenantId: string, branchId: string, input: Partial<{
  name: string; address: string; phone: string; isWarehouse: boolean; isActive: boolean;
}>) {
  const branch = await prisma.branch.findFirst({ where: { id: branchId, tenantId } });
  if (!branch) throw new NotFoundError('Không tìm thấy chi nhánh.');

  return prisma.branch.update({ where: { id: branchId }, data: input });
}

export async function toggleBranchVisibility(tenantId: string, branchId: string) {
  const branch = await prisma.branch.findFirst({ where: { id: branchId, tenantId } });
  if (!branch) throw new NotFoundError('Không tìm thấy chi nhánh.');

  return prisma.branch.update({ where: { id: branchId }, data: { isActive: !branch.isActive } });
}
