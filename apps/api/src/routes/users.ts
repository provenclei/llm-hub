import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authenticateJwt, authenticateApiKey } from '../plugins/auth';
import { createApiKeySchema } from '../schemas/chat';
import { createApiKey as createNewApiKey } from '../services/auth';

const prisma = new PrismaClient();

export async function userRoutes(app: FastifyInstance) {
  // 获取用户API Keys
  app.get('/api-keys', { preHandler: [authenticateJwt] }, async (request, reply) => {
    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: request.user!.id },
      select: {
        id: true,
        name: true,
        permissions: true,
        lastUsedAt: true,
        expiresAt: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { data: apiKeys };
  });

  // 创建API Key
  app.post('/api-keys', { preHandler: [authenticateJwt] }, async (request, reply) => {
    const body = createApiKeySchema.parse(request.body);
    
    const { key, id } = await createNewApiKey(
      request.user!.id,
      body.name,
      body.permissions,
      body.rateLimit,
      body.expiresAt ? new Date(body.expiresAt) : undefined
    );

    return {
      id,
      key, // 只显示一次
      name: body.name,
      permissions: body.permissions,
      createdAt: new Date().toISOString(),
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
      data: { status: 'revoked' },
    });

    return { success: true };
  });

  // 获取用户使用统计
  app.get('/usage', { preHandler: [authenticateJwt] }, async (request, reply) => {
    const { startDate, endDate } = request.query as { startDate?: string; endDate?: string };

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const records = await prisma.usageRecord.groupBy({
      by: ['modelId'],
      where: {
        userId: request.user!.id,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        cost: true,
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
        cost: Number(r._sum.cost || 0),
      })),
    };
  });
}
