import { prisma } from '../../lib/prisma';
import { hashPassword } from '../../lib/password';
import { ConflictError, NotFoundError } from '../../domain/errors';

const SAFE_SELECT = { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true };

export async function listUsers(tenantId: string) {
  return prisma.user.findMany({ where: { tenantId }, select: SAFE_SELECT, orderBy: { createdAt: 'asc' } });
}

export async function createUser(
  tenantId: string,
  input: { name: string; email: string; phone?: string; password: string; role: 'OWNER' | 'STAFF' | 'CASHIER' },
) {
  const existing = await prisma.user.findUnique({ where: { tenantId_email: { tenantId, email: input.email } } });
  if (existing) throw new ConflictError('Email đã được sử dụng trong cửa hàng này.');

  const passwordHash = await hashPassword(input.password);
  return prisma.user.create({
    data: { tenantId, name: input.name, email: input.email, phone: input.phone, role: input.role, passwordHash },
    select: SAFE_SELECT,
  });
}

export async function updateUser(
  tenantId: string,
  userId: string,
  input: { name?: string; phone?: string; role?: 'OWNER' | 'STAFF' | 'CASHIER'; isActive?: boolean; password?: string },
) {
  const user = await prisma.user.findFirst({ where: { id: userId, tenantId } });
  if (!user) throw new NotFoundError('Không tìm thấy nhân viên.');

  const passwordHash = input.password ? await hashPassword(input.password) : undefined;

  return prisma.user.update({
    where: { id: userId },
    data: {
      name: input.name,
      phone: input.phone,
      role: input.role,
      isActive: input.isActive,
      ...(passwordHash ? { passwordHash } : {}),
    },
    select: SAFE_SELECT,
  });
}
