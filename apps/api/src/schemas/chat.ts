import { z } from 'zod';

// Chat Completion请求验证
export const chatCompletionSchema = z.object({
  model: z.string().min(1, 'Model is required'),
  messages: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant', 'function']),
      content: z.string(),
      name: z.string().optional(),
    })
  ).min(1, 'At least one message is required'),
  temperature: z.number().min(0).max(2).optional().default(1),
  max_tokens: z.number().int().positive().optional(),
  top_p: z.number().min(0).max(1).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional().default(0),
  presence_penalty: z.number().min(-2).max(2).optional().default(0),
  stream: z.boolean().optional().default(false),
  stop: z.union([z.string(), z.array(z.string())]).optional(),
  user: z.string().optional(),
});

// 登录请求验证
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// 注册请求验证
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

// API Key创建验证
export const createApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  permissions: z.array(z.string()).optional(),
  rateLimit: z.object({
    rpm: z.number().int().positive().optional(),
    tpm: z.number().int().positive().optional(),
  }).optional(),
  expiresAt: z.string().datetime().optional(),
});
