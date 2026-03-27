import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const rateLimitPlugin = fp(async (app: FastifyInstance) => {
  app.addHook('onRequest', async (request, reply) => {
    const apiKey = request.apiKey;
    
    // 如果没有API Key（如公开接口），跳过限流
    if (!apiKey) {
      return;
    }

    const key = `rate_limit:${apiKey.id}`;
    const window = 60; // 1分钟窗口
    const limit = apiKey.rateLimit?.rpm || parseInt(process.env.RATE_LIMIT_DEFAULT_RPM || '60');

    // 使用Redis实现滑动窗口限流
    const now = Date.now();
    const windowStart = now - window * 1000;

    // 移除窗口外的请求记录
    await redis.zremrangebyscore(key, 0, windowStart);
    
    // 获取当前窗口内的请求数
    const current = await redis.zcard(key);

    if (current >= limit) {
      return reply.code(429).send({
        error: {
          message: `Rate limit exceeded. Limit: ${limit} requests per minute.`,
          type: 'rate_limit_error',
          code: 'rate_limit_exceeded',
        },
      });
    }

    // 记录当前请求
    await redis.zadd(key, now, `${now}-${Math.random()}`);
    await redis.expire(key, window);

    // 设置响应头
    reply.header('X-RateLimit-Limit', limit);
    reply.header('X-RateLimit-Remaining', Math.max(0, limit - current - 1));
  });
});
