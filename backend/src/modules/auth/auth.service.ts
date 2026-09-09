import { randomUUID, createHash } from 'crypto';
import { prisma } from '../../lib/prisma';
import { hashPassword, verifyPassword } from '../../lib/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt';
import { BusinessRuleError, ConflictError, UnauthorizedError } from '../../domain/errors';
import { LoginInput, RegisterTenantInput } from './auth.schema';
import { env } from '../../config/env';

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || randomUUID().slice(0, 8)
  );
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function issueTokenPair(userId: string, tenantId: string, role: 'OWNER' | 'STAFF' | 'CASHIER') {
  const accessToken = signAccessToken({ sub: userId, tenantId, role });

  const tokenRecordId = randomUUID();
  const refreshToken = signRefreshToken({ sub: userId, jti: tokenRecordId });
  const expiresAt = new Date(Date.now() + parseDurationMs(env.jwtRefreshExpiresIn));

  await prisma.refreshToken.create({
    data: { id: tokenRecordId, userId, tokenHash: hashToken(refreshToken), expiresAt },
  });

  return { accessToken, refreshToken };
}

function parseDurationMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration.trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unit = match[2];
  const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit] ?? 86_400_000;
  return value * unitMs;
}

/** FR-AUTH-01: creates an isolated tenant (store), a default branch, and the first Owner user. */
export async function registerTenant(input: RegisterTenantInput) {
  const slug = slugify(input.tenantName);

  const existingSlug = await prisma.tenant.findUnique({ where: { slug } });
  if (existingSlug) throw new ConflictError('Tên cửa hàng đã được sử dụng, vui lòng chọn tên khác.');

  const passwordHash = await hashPassword(input.password);

  const tenant = await prisma.$transaction(async (tx) => {
    const createdTenant = await tx.tenant.create({ data: { name: input.tenantName, slug } });

    await tx.user.create({
      data: {
        tenantId: createdTenant.id,
        name: input.ownerName,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: 'OWNER',
      },
    });

    await tx.branch.create({
      data: { tenantId: createdTenant.id, name: 'Chi nhánh chính', isWarehouse: true },
    });

    return createdTenant;
  });

  return login({ email: input.email, password: input.password }, tenant.id);
}

/** FR-AUTH-02. When tenantId is passed (right after registration) the email lookup is scoped to it. */
export async function login(input: LoginInput, tenantId?: string) {
  const user = await prisma.user.findFirst({
    where: { email: input.email, ...(tenantId ? { tenantId } : {}) },
  });

  if (!user || !user.isActive) throw new UnauthorizedError('Sai tài khoản hoặc mật khẩu.');

  const validPassword = await verifyPassword(input.password, user.passwordHash);
  if (!validPassword) throw new UnauthorizedError('Sai tài khoản hoặc mật khẩu.');

  const tokens = await issueTokenPair(user.id, user.tenantId, user.role);

  return {
    ...tokens,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId },
  };
}

/** Refresh-token rotation: the old token is revoked and a new pair is issued. */
export async function refreshTokens(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new UnauthorizedError('Refresh token không hợp lệ hoặc đã hết hạn.');
  }

  const record = await prisma.refreshToken.findUnique({ where: { id: payload.jti }, include: { user: true } });
  if (!record || record.revokedAt || record.expiresAt < new Date() || record.tokenHash !== hashToken(refreshToken)) {
    throw new UnauthorizedError('Refresh token không hợp lệ hoặc đã bị thu hồi.');
  }

  await prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });

  if (!record.user.isActive) throw new UnauthorizedError('Tài khoản đã bị vô hiệu hoá.');

  return issueTokenPair(record.user.id, record.user.tenantId, record.user.role);
}

export async function logout(refreshToken: string): Promise<void> {
  try {
    const payload = verifyRefreshToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { id: payload.jti, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  } catch {
    // Already invalid/expired — logout is idempotent, nothing else to do.
  }
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, role: true, tenantId: true, isActive: true, tenant: { select: { name: true } } },
  });
  if (!user) throw new BusinessRuleError('Người dùng không tồn tại.');
  return user;
}
