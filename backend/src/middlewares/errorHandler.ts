import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../domain/errors';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      message: 'Dữ liệu gửi lên không hợp lệ.',
      errors: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({ message: 'Dữ liệu bị trùng (vi phạm ràng buộc duy nhất).', fields: err.meta?.target });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ message: 'Không tìm thấy dữ liệu.' });
      return;
    }
  }

  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống, vui lòng thử lại sau.' });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ message: `Không tìm thấy route ${req.method} ${req.path}` });
}
