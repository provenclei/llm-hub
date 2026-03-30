import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@llm-hub/database';
import fp from 'fastify-plugin';
import crypto from 'crypto';

// 扩展 Fastify 请求类型
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: string;
    };
    apiKey?: {
      id: string;
      userId: string;
      permissions: string[];
      rateLimit?: {
        rpm?: number;
        tpm?: number;
      };
    };
    userBalance?: number;
    userQuota?: {
      requestsPerMin: number;
      tokensPerMin: number;
    };
  }
}

/**
 * API Key 认证插件
 */
export const authPlugin = fp(async (app) => {
  app.decorateRequest('user', null);
  app.decorateRequest('apiKey', null);
});

/**
 * API Key 认证中间件
 */
export async function authenticateApiKey(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: {
          message: 'Missing or invalid authorization header',
          type: 'authentication_error',
        },
      });
    }

    const apiKey = authHeader.slice(7);

    // 计算 API Key 的哈希值
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    // 从数据库查询
    const keyRecord = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: { user: true },
    });

    if (!keyRecord || keyRecord.isRevoked) {
      return reply.status(401).send({
        error: {
          message: 'Invalid API key',
          type: 'authentication_error',
        },
      });
    }

    // 检查是否过期
    if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) {
      return reply.status(401).send({
        error: {
          message: 'API key has expired',
          type: 'authentication_error',
        },
      });
    }

    // 检查用户状态
    if (keyRecord.user.status !== 'ACTIVE') {
      return reply.status(403).send({
        error: {
          message: 'User account is not active',
          type: 'authentication_error',
        },
      });
    }

    // 更新最后使用时间
    await prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() },
    });

    // 设置请求上下文
    request.apiKey = {
      id: keyRecord.id,
      userId: keyRecord.userId,
      permissions: keyRecord.permissions,
      rateLimit: {
        rpm: keyRecord.rateLimitReqPerMin || undefined,
        tpm: keyRecord.rateLimitTokensPerMin || undefined,
      },
    };

    request.user = {
      id: keyRecord.user.id,
      email: keyRecord.user.email,
      role: keyRecord.user.role,
    };

    request.userBalance = Number(keyRecord.user.balance);
    request.userQuota = {
      requestsPerMin: keyRecord.user.quotaRequestsPerMin,
      tokensPerMin: keyRecord.user.quotaTokensPerMin,
    };

  } catch (error) {
    request.log.error('Auth middleware error:', error);
    return reply.status(500).send({
      error: {
        message: 'Internal server error',
        type: 'internal_error',
      },
    });
  }
}

/**
 * JWT 认证中间件
 */
export async function authenticateJwt(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: {
          message: 'Missing or invalid authorization header',
          type: 'authentication_error',
        },
      });
    }

    const token = authHeader.slice(7);

    // 验证 JWT
    const jwt = await import('jsonwebtoken');
    
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;

    request.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

  } catch (error) {
    return reply.status(401).send({
      error: {
        message: 'Invalid or expired token',
        type: 'authentication_error',
      },
    });
  }
}

/**
 * 管理员权限检查
 */
export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (!request.user || (request.user.role !== 'ADMIN' && request.user.role !== 'SUPER_ADMIN')) {
    return reply.status(403).send({
      error: {
        message: 'Admin access required',
        type: 'authorization_error',
      },
    });
  }
}
