import { Request, Response, NextFunction } from 'express';
import { prisma } from '@llm-hub/database';
import { redis } from '../index';

// 扩展 Express 请求类型
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
      apiKey?: {
        id: string;
        userId: string;
        permissions: string[];
      };
    }
  }
}

/**
 * API Key 认证中间件
 */
export async function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          message: 'Missing or invalid authorization header',
          type: 'authentication_error',
        },
      });
    }

    const apiKey = authHeader.slice(7);

    // 先从缓存查询
    const cacheKey = `apikey:${apiKey}`;
    const cached = await redis.get(cacheKey);
    
    let keyData;
    if (cached) {
      keyData = JSON.parse(cached);
    } else {
      // 从数据库查询
      const keyRecord = await prisma.apiKey.findUnique({
        where: { keyHash: apiKey },
        include: { user: true },
      });

      if (!keyRecord || keyRecord.isRevoked) {
        return res.status(401).json({
          error: {
            message: 'Invalid API key',
            type: 'authentication_error',
          },
        });
      }

      // 检查是否过期
      if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) {
        return res.status(401).json({
          error: {
            message: 'API key has expired',
            type: 'authentication_error',
          },
        });
      }

      // 检查用户状态
      if (keyRecord.user.status !== 'ACTIVE') {
        return res.status(403).json({
          error: {
            message: 'User account is not active',
            type: 'authentication_error',
          },
        });
      }

      keyData = {
        id: keyRecord.id,
        userId: keyRecord.userId,
        permissions: keyRecord.permissions,
        user: {
          id: keyRecord.user.id,
          email: keyRecord.user.email,
          role: keyRecord.user.role,
          balance: keyRecord.user.balance.toString(),
          quotaRequestsPerMin: keyRecord.user.quotaRequestsPerMin,
          quotaTokensPerMin: keyRecord.user.quotaTokensPerMin,
        },
      };

      // 缓存 5 分钟
      await redis.setex(cacheKey, 300, JSON.stringify(keyData));

      // 更新最后使用时间
      await prisma.apiKey.update({
        where: { id: keyRecord.id },
        data: { lastUsedAt: new Date() },
      });
    }

    req.apiKey = {
      id: keyData.id,
      userId: keyData.userId,
      permissions: keyData.permissions,
    };

    req.user = {
      id: keyData.user.id,
      email: keyData.user.email,
      role: keyData.user.role,
    };

    // 将用户信息附加到请求以便后续使用
    (req as any).userBalance = parseFloat(keyData.user.balance);
    (req as any).userQuota = {
      requestsPerMin: keyData.user.quotaRequestsPerMin,
      tokensPerMin: keyData.user.quotaTokensPerMin,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: {
        message: 'Internal server error',
        type: 'internal_error',
      },
    });
  }
}

/**
 * 管理员权限检查
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN')) {
    return res.status(403).json({
      error: {
        message: 'Admin access required',
        type: 'authorization_error',
      },
    });
  }
  next();
}
