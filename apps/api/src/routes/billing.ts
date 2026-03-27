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

  // 获取账单列表
  app.get('/invoices', { preHandler: [authenticateJwt] }, async (request, reply) => {
    const invoices = await prisma.invoice.findMany({
      where: { userId: request.user!.id },
      orderBy: { periodEnd: 'desc' },
    });

    return {
      data: invoices.map(inv => ({
        id: inv.id,
        period: {
          start: inv.periodStart.toISOString(),
          end: inv.periodEnd.toISOString(),
        },
        totalTokens: inv.totalTokens,
        totalCost: Number(inv.totalCost),
        status: inv.status,
        createdAt: inv.createdAt.toISOString(),
      })),
    };
  });

  // 获取定价信息
  app.get('/pricing', async (request, reply) => {
    const models = await prisma.model.findMany({
      where: { status: 'active' },
      select: {
        id: true,
        name: true,
        provider: true,
        pricingInput: true,
        pricingOutput: true,
        contextWindow: true,
        features: true,
      },
    });

    return {
      data: models.map(m => ({
        model: m.id,
        name: m.name,
        provider: m.provider,
        pricing: {
          input: Number(m.pricingInput),
          output: Number(m.pricingOutput),
          currency: 'USD',
        },
        contextWindow: m.contextWindow,
        features: m.features,
      })),
    };
  });
}
