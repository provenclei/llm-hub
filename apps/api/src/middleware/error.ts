import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const code = err.code || 'internal_error';

  // OpenAI 兼容的错误格式
  res.status(statusCode).json({
    error: {
      message: err.message || 'Internal server error',
      type: code,
      code: statusCode,
    },
  });
}

export function createError(message: string, code: string, statusCode: number): ApiError {
  const error = new Error(message) as ApiError;
  error.code = code;
  error.statusCode = statusCode;
  return error;
}
