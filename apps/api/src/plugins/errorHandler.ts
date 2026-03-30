import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  request.log.error(error);

  // Zod 验证错误
  if (error instanceof ZodError) {
    return reply.code(400).send({
      error: {
        message: 'Validation error',
        type: 'invalid_request_error',
        details: error.errors,
      },
    });
  }

  // 自定义错误处理
  if (error.code === 'INSUFFICIENT_BALANCE') {
    return reply.code(402).send({
      error: {
        message: 'Insufficient balance',
        type: 'billing_error',
        code: 'insufficient_balance',
      },
    });
  }

  // 默认错误响应
  const statusCode = error.statusCode || 500;
  return reply.code(statusCode).send({
    error: {
      message: error.message || 'Internal server error',
      type: error.code || 'api_error',
      code: statusCode,
    },
  });
}
