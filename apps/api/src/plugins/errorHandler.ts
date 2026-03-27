import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Zod验证错误
  if (error.code === 'FST_ERR_VALIDATION') {
    return reply.status(400).send({
      error: {
        message: 'Invalid request parameters',
        type: 'invalid_request_error',
        code: 'validation_error',
        details: error.message,
      },
    });
  }

  // 401 认证错误
  if (error.statusCode === 401) {
    return reply.status(401).send({
      error: {
        message: 'Authentication failed',
        type: 'authentication_error',
        code: 'unauthorized',
      },
    });
  }

  // 403 权限错误
  if (error.statusCode === 403) {
    return reply.status(403).send({
      error: {
        message: 'Permission denied',
        type: 'permission_error',
        code: 'forbidden',
      },
    });
  }

  // 404 未找到
  if (error.statusCode === 404) {
    return reply.status(404).send({
      error: {
        message: 'Resource not found',
        type: 'not_found_error',
        code: 'not_found',
      },
    });
  }

  // 429 限流
  if (error.statusCode === 429) {
    return reply.status(429).send({
      error: {
        message: 'Rate limit exceeded. Please try again later.',
        type: 'rate_limit_error',
        code: 'rate_limit_exceeded',
      },
    });
  }

  // 默认服务器错误
  request.log.error(error);
  
  return reply.status(500).send({
    error: {
      message: 'Internal server error',
      type: 'api_error',
      code: 'internal_error',
    },
  });
}
