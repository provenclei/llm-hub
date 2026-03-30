import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authenticateJwt, authenticateApiKey } from '../plugins/auth';
import crypto from 'crypto';
import { z } from 'zod';

const prisma = new PrismaClient();

const createApiKeySchema = z.object({
  name: z.string().min(1).max(50),
  permissions: z.array(z.enum(['CHAT', 'COMPLETIONS', 'EMBEDDINGS', 'IMAGES'])).optional(),
  rateLimit: z.object({
    rpm: z.number().optional(),
    tpm: z.number().optional(),
  }).optional(),
  expiresAt: z.string().datetime().optional(),
});

export async function userRoutes(app: FastifyInstance) {
  // 获取用户API Keys
  app.get('/api-keys', { preHandler: [authenticateJwt] }, async (request, reply) => {
    const apiKeys = await prisma.apiKey.findMany({
      where: { 
        userId: request.user!.id,
        isRevoked: false,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        lastUsedAt: true,
        expiresAt: true,
        isRevoked: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { data: apiKeys };
  });

  // 创建API Key
  app.post('/api-keys', { preHandler: [authenticateJwt] }, async (request, reply) => {
    const body = createApiKeySchema.parse(request.body);
    
    // 生成 API Key
    const apiKey = `sk-${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const keyPrefix = apiKey.slice(0, 10);

    const record = await prisma.apiKey.create({
      data: {
        userId: request.user!.id,
        name: body.name,
        keyHash,
        keyPrefix,
        permissions: body.permissions || ['CHAT'],
        rateLimitReqPerMin: body.rateLimit?.rpm,
        rateLimitTokensPerMin: body.rateLimit?.tpm,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      },
    });

    return {
      id: record.id,
      key: apiKey, // 只显示一次
      prefix: keyPrefix,
      name: body.name,
      permissions: body.permissions || ['CHAT'],
      createdAt: record.createdAt,
      warning: 'Please save this API key. It will not be shown again.',
    };
  });

  // 撤销API Key
  app.delete('/api-keys/:id', { preHandler: [authenticateJwt] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id,
        userId: request.user!.id,
      },
    });

    if (!apiKey) {
      return reply.code(404).send({ error: 'API Key not found' });
    }

    await prisma.apiKey.update({
      where: { id },
      data: { isRevoked: true },
    });

    return { success: true, message: 'API key revoked successfully' };
  });

  // 获取用户使用统计
  app.get('/usage', { preHandler: [authenticateJwt] }, async (request, reply) => {
    const { startDate, endDate } = request.query as { startDate?: string; endDate?: string };

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const records = await prisma.usage.groupBy({
      by: ['modelId'],
      where: {
        userId: request.user!.id,
        createdAt: {
          gte: start,
          lte: end,
        },
        status: 'SUCCESS',
      },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        totalCost: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      period: { start: start.toISOString(), end: end.toISOString() },
      data: records.map(r => ({
        modelId: r.modelId,
        requests: r._count.id,
        inputTokens: r._sum.inputTokens || 0,
        outputTokens: r._sum.outputTokens || 0,
        cost: Number(r._sum.totalCost || 0),
      })),
    };
  });

  // 获取用户信息
  app.get('/me', { preHandler: [authenticateJwt] }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        balance: true,
        createdAt: true,
      },
    });

    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    return {
      ...user,
      balance: Number(user.balance),
    };
  });
}
