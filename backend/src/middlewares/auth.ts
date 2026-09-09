import { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { verifyAccessToken } from '../lib/jwt';
import { ForbiddenError, UnauthorizedError } from '../domain/errors';

export interface AuthContext {
  userId: string;
  tenantId: string;
  role: Role;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

/** FR-AUTH-02: verifies the Bearer access token and attaches {userId, tenantId, role}. */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Thiếu token xác thực.');
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = verifyAccessToken(token);
    req.auth = { userId: payload.sub, tenantId: payload.tenantId, role: payload.role };
    next();
  } catch {
    throw new UnauthorizedError('Token không hợp lệ hoặc đã hết hạn.');
  }
}

/** FR-AUTH-03: Role-Based Access Control. Owner > Staff > Cashier, scoped per route. */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) throw new UnauthorizedError();
    if (!roles.includes(req.auth.role)) {
      throw new ForbiddenError(`Chức năng này yêu cầu vai trò: ${roles.join(', ')}.`);
    }
    next();
  };
}
