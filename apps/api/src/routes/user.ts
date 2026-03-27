import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@llm-hub/database';
import { billingService } from '../services/billing';
import { createError } from '../middleware/error';
import crypto from 'crypto';

const router = Router();

/**
 * 获取当前用户信息
 * GET /v1/user/me
 */
router.get('/me', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      balance: true,
      quotaRequestsPerMin: true,
      quotaTokensPerMin: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw createError('User not found', 'not_found', 404);
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    balance: user.balance.toNumber(),
    quota: {
      requests_per_min: user.quotaRequestsPerMin,
      tokens_per_min: user.quotaTokensPerMin,
    },
    created_at: user.createdAt,
  });
});

/**
 * 获取用户余额
 * GET /v1/user/balance
 */
router.get('/balance', async (req, res) => {
  const balance = await billingService.getBalance(req.user!.id);
  res.json({ balance, currency: 'CNY' });
});

/**
 * 获取使用统计
 * GET /v1/user/usage
 */
router.get('/usage', async (req, res) => {
  const days = parseInt(req.query.days as string) || 30;
  const stats = await billingService.getUsageStats(req.user!.id, days);
  res.json(stats);
});

/**
 * 获取交易记录
 * GET /v1/user/transactions
 */
router.get('/transactions', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({
      where: { userId: req.user!.id },
    }),
  ]);

  res.json({
    data: transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount.toNumber(),
      currency: t.currency,
      balance_after: t.balanceAfter.toNumber(),
      description: t.description,
      created_at: t.createdAt,
    })),
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
});

// API Key 管理
const createApiKeySchema = z.object({
  name: z.string().min(1).max(50),
  permissions: z.array(z.enum(['CHAT', 'COMPLETIONS', 'EMBEDDINGS', 'IMAGES'])).optional(),
  allowed_models: z.array(z.string()).optional(),
});

/**
 * 获取 API Keys
 * GET /v1/user/api-keys
 */
router.get('/api-keys', async (req, res) => {
  const keys = await prisma.apiKey.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      permissions: true,
      isRevoked: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  res.json({
    data: keys.map((k) => ({
      id: k.id,
      name: k.name,
      prefix: k.keyPrefix,
      permissions: k.permissions,
      is_revoked: k.isRevoked,
      last_used_at: k.lastUsedAt,
      expires_at: k.expiresAt,
      created_at: k.createdAt,
    })),
  });
});

/**
 * 创建 API Key
 * POST /v1/user/api-keys
 */
router.post('/api-keys', async (req, res) => {
  const data = createApiKeySchema.parse(req.body);

  // 生成 API Key
  const apiKey = `sk-${crypto.randomBytes(24).toString('hex')}`;
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
  const keyPrefix = apiKey.slice(0, 10);

  const record = await prisma.apiKey.create({
    data: {
      userId: req.user!.id,
      name: data.name,
      keyHash,
      keyPrefix,
      permissions: data.permissions || ['CHAT'],
      allowedModels: data.allowed_models || [],
    },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      permissions: true,
      createdAt: true,
    },
  });

  // 只返回一次完整 key
  res.status(201).json({
    ...record,
    api_key: apiKey, // 注意：只显示一次
    warning: 'Please save this API key. It will not be shown again.',
  });
});

/**
 * 撤销 API Key
 * DELETE /v1/user/api-keys/:id
 */
router.delete('/api-keys/:id', async (req, res) => {
  const { id } = req.params;

  const key = await prisma.apiKey.findFirst({
    where: { id, userId: req.user!.id },
  });

  if (!key) {
    throw createError('API key not found', 'not_found', 404);
  }

  await prisma.apiKey.update({
    where: { id },
    data: { isRevoked: true },
  });

  res.json({ message: 'API key revoked successfully' });
});

export { router as userRouter };
