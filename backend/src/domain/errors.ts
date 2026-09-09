export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

/** Business-rule violation — always maps to HTTP 422/400, safe to show to the user. */
export class BusinessRuleError extends AppError {
  constructor(message: string) {
    super(message, 422);
    this.name = 'BusinessRuleError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Không tìm thấy dữ liệu.') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Bạn cần đăng nhập để thực hiện thao tác này.') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Bạn không có quyền thực hiện thao tác này.') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Dữ liệu đã tồn tại hoặc xung đột.') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}
