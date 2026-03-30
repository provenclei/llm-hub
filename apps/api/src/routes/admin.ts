import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@llm-hub/database';
import { providerManager } from '@llm-hub/providers';
import { authenticateApiKey, requireAdmin } from '../plugins/auth';
import { BillingService } from '../services/billing';

const billingService = new BillingService();

export async function adminRoutes(app: FastifyInstance) {
  // 应用管理员权限中间件
  app.addHook('preHandler', authenticateApiKey);
  app.addHook('preHandler', requireAdmin);

  /**
   * 获取系统统计
   * GET /v1/admin/stats
   */
  app.get('/stats', async (request, reply) => {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [
      totalUsers,
      totalApiKeys,
      totalRequests,
      totalRevenue,
      recentUsage,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.apiKey.count(),
      prisma.usage.count({
        where: { createdAt: { gte: since } },
      }),
      prisma.transaction.aggregate({
        where: {
          type: 'CONSUMPTION',
          createdAt: { gte: since },
        },
        _sum: { amount: true },
      }),
      prisma.usage.aggregate({
        where: { createdAt: { gte: since } },
        _sum: {
          totalTokens: true,
          totalCost: true,
        },
      }),
    ]);

    return {
      overview: {
        total_users: totalUsers,
        total_api_keys: totalApiKeys,
        total_requests_30d: totalRequests,
        total_revenue_30d: Math.abs(Number(totalRevenue._sum.amount) || 0),
        total_tokens_30d: recentUsage._sum.totalTokens || 0,
      },
    };
  });

  /**
   * 用户管理
   * GET /v1/admin/users
   */
  app.get('/users', async (request, reply) => {
    const page = parseInt((request.query as any).page) || 1;
    const limit = Math.min(parseInt((request.query as any).limit) || 20, 100);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          balance: true,
          createdAt: true,
          _count: { select: { apiKeys: true } },
        },
      }),
      prisma.user.count(),
    ]);

    return {
      data: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        status: u.status,
        balance: Number(u.balance),
        api_keys_count: u._count.apiKeys,
        created_at: u.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  });

  /**
   * 更新用户余额
   * POST /v1/admin/users/:id/balance
   */
  app.post('/users/:id/balance', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { amount, reason } = request.body as { amount: number; reason?: string };

    if (typeof amount !== 'number') {
      return reply.code(400).send({
        error: {
          message: 'Amount must be a number',
          type: 'invalid_request',
        },
      });
    }

    await billingService.recharge(id, amount, reason);

    return { message: 'Balance updated successfully' };
  });

  /**
   * 获取提供商列表
   * GET /v1/admin/providers
   */
  app.get('/providers', async (request, reply) => {
    const providers = await prisma.providerAccount.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return { providers };
  });

  /**
   * 添加提供商账号
   * POST /v1/admin/providers
   */
  const createProviderSchema = z.object({
    provider: z.enum(['OPENAI', 'ANTHROPIC', 'GOOGLE', 'BAIDU', 'ALIBABA', 'DOUBAO', 'ZHIPU', 'MOONSHOT', 'YI', 'MINIMAX', 'XUNFEI']),
    name: z.string().min(1),
    api_key: z.string().min(1),
    api_secret: z.string().optional(),
    base_url: z.string().optional(),
    cost_per_1k_input: z.number().positive(),
    cost_per_1k_output: z.number().positive(),
    monthly_quota: z.number().optional(),
    priority: z.number().default(0),
    weight: z.number().default(100),
  });

  app.post('/providers', async (request, reply) => {
    const data = createProviderSchema.parse(request.body);

    const provider = await prisma.providerAccount.create({
      data: {
        provider: data.provider,
        name: data.name,
        apiKey: data.api_key,
        apiSecret: data.api_secret,
        baseUrl: data.base_url,
        costPer1kInput: data.cost_per_1k_input,
        costPer1kOutput: data.cost_per_1k_output,
        monthlyQuota: data.monthly_quota,
        priority: data.priority,
        weight: data.weight,
      },
    });

    return reply.code(201).send(provider);
  });

  /**
   * 获取模型列表
   * GET /v1/admin/models
   */
  app.get('/models', async (request, reply) => {
    const models = await prisma.model.findMany({
      orderBy: { provider: 'asc' },
    });

    return { models };
  });

  /**
   * 添加模型
   * POST /v1/admin/models
   */
  const createModelSchema = z.object({
    provider: z.enum(['OPENAI', 'ANTHROPIC', 'GOOGLE', 'BAIDU', 'ALIBABA', 'DOUBAO', 'ZHIPU', 'MOONSHOT', 'YI', 'MINIMAX', 'XUNFEI']),
    model_id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    price_per_1k_input: z.number().positive(),
    price_per_1k_output: z.number().positive(),
    context_window: z.number().int().positive(),
    max_tokens: z.number().int().positive(),
    supports_vision: z.boolean().default(false),
    supports_tools: z.boolean().default(false),
  });

  app.post('/models', async (request, reply) => {
    const data = createModelSchema.parse(request.body);

    const model = await prisma.model.create({
      data: {
        provider: data.provider,
        modelId: data.model_id,
        name: data.name,
        description: data.description,
        pricePer1kInput: data.price_per_1k_input,
        pricePer1kOutput: data.price_per_1k_output,
        contextWindow: data.context_window,
        maxTokens: data.max_tokens,
        supportsVision: data.supports_vision,
        supportsTools: data.supports_tools,
      },
    });

    return reply.code(201).send(model);
  });

  /**
   * 获取系统日志
   * GET /v1/admin/logs
   */
  app.get('/logs', async (request, reply) => {
    const limit = Math.min(parseInt((request.query as any).limit) || 100, 1000);

    const logs = await prisma.usage.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { email: true } },
        model: { select: { name: true } },
      },
    });

    return {
      data: logs.map((l) => ({
        id: l.id,
        request_id: l.requestId,
        user: l.user?.email,
        model: l.model?.name,
        input_tokens: l.inputTokens,
        output_tokens: l.outputTokens,
        total_cost: Number(l.totalCost),
        latency: l.latency,
        status: l.status,
        created_at: l.createdAt,
      })),
    };
  });
}
