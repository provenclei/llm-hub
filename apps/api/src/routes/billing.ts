import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authenticateJwt } from '../plugins/auth';

const prisma = new PrismaClient();

export async function billingRoutes(app: FastifyInstance) {
  // 获取用户余额
  app.get('/balance', { preHandler: [authenticateJwt] }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user!.id },
      select: { balance: true },
    });

    return { balance: Number(user?.balance || 0) };
  });

  // 获取交易记录
  app.get('/transactions', { preHandler: [authenticateJwt] }, async (request, reply) => {
    const page = parseInt((request.query as any).page) || 1;
    const limit = Math.min(parseInt((request.query as any).limit) || 20, 100);

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId: request.user!.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({
        where: { userId: request.user!.id },
      }),
    ]);

    return {
      data: transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        currency: t.currency,
        balanceAfter: Number(t.balanceAfter),
        description: t.description,
        createdAt: t.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  });

  // 获取定价信息
  app.get('/pricing', async (request, reply) => {
    const models = await prisma.model.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        provider: true,
        pricePer1kInput: true,
        pricePer1kOutput: true,
        contextWindow: true,
        supportsChat: true,
        supportsStreaming: true,
        supportsVision: true,
        supportsTools: true,
      },
    });

    return {
      data: models.map(m => ({
        model: m.id,
        name: m.name,
        provider: m.provider,
        pricing: {
          input: Number(m.pricePer1kInput),
          output: Number(m.pricePer1kOutput),
          currency: 'CNY',
        },
        contextWindow: m.contextWindow,
        features: {
          chat: m.supportsChat,
          streaming: m.supportsStreaming,
          vision: m.supportsVision,
          tools: m.supportsTools,
        },
      })),
    };
  });
}
