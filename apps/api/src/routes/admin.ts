import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@llm-hub/database';
import { providerManager } from '@llm-hub/providers';
import { requireAdmin } from '../middleware/auth';
import { createError } from '../middleware/error';
import { billingService } from '../services/billing';

const router = Router();

// 应用管理员权限中间件
router.use(requireAdmin);

/**
 * 获取系统统计
 * GET /v1/admin/stats
 */
router.get('/stats', async (req, res) => {
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

  res.json({
    overview: {
      total_users: totalUsers,
      total_api_keys: totalApiKeys,
      total_requests_30d: totalRequests,
      total_revenue_30d: Math.abs(totalRevenue._sum.amount?.toNumber() || 0),
      total_tokens_30d: recentUsage._sum.totalTokens || 0,
    },
  });
});

/**
 * 用户管理
 * GET /v1/admin/users
 */
router.get('/users', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

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

  res.json({
    data: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      status: u.status,
      balance: u.balance.toNumber(),
      api_keys_count: u._count.apiKeys,
      created_at: u.createdAt,
    })),
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
});

/**
 * 更新用户余额
 * POST /v1/admin/users/:id/balance
 */
router.post('/users/:id/balance', async (req, res) => {
  const { id } = req.params;
  const { amount, reason } = req.body;

  if (typeof amount !== 'number') {
    throw createError('Amount must be a number', 'invalid_request', 400);
  }

  await billingService.recharge(id, amount);

  res.json({ message: 'Balance updated successfully' });
});

/**
 * 获取提供商列表
 * GET /v1/admin/providers
 */
router.get('/providers', async (req, res) => {
  const providers = await prisma.providerAccount.findMany({
    orderBy: { createdAt: 'desc' },
  });

  res.json({ providers });
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

router.post('/providers', async (req, res) => {
  const data = createProviderSchema.parse(req.body);

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

  res.status(201).json(provider);
});

/**
 * 获取模型列表
 * GET /v1/admin/models
 */
router.get('/models', async (req, res) => {
  const models = await prisma.model.findMany({
    orderBy: { provider: 'asc' },
  });

  res.json({ models });
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

router.post('/models', async (req, res) => {
  const data = createModelSchema.parse(req.body);

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

  res.status(201).json(model);
});

/**
 * 获取系统日志
 * GET /v1/admin/logs
 */
router.get('/logs', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);

  const logs = await prisma.usage.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: { select: { email: true } },
      model: { select: { name: true } },
    },
  });

  res.json({
    data: logs.map((l) => ({
      id: l.id,
      request_id: l.requestId,
      user: l.user?.email,
      model: l.model?.name,
      input_tokens: l.inputTokens,
      output_tokens: l.outputTokens,
      total_cost: l.totalCost.toNumber(),
      latency: l.latency,
      status: l.status,
      created_at: l.createdAt,
    })),
  });
});

export { router as adminRouter };
