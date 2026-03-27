import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import dotenv from 'dotenv';

import { authPlugin } from './plugins/auth';
import { rateLimitPlugin } from './plugins/rateLimit';
import { errorHandler } from './plugins/errorHandler';

import { authRoutes } from './routes/auth';
import { modelRoutes } from './routes/models';
import { chatRoutes } from './routes/chat';
import { billingRoutes } from './routes/billing';
import { userRoutes } from './routes/users';

dotenv.config();

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// 注册插件
async function registerPlugins() {
  // CORS
  await app.register(cors, {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://admin.llm-hub.com', 'https://portal.llm-hub.com']
      : true,
    credentials: true,
  });

  // 安全头
  await app.register(helmet);

  // Swagger文档
  await app.register(swagger, {
    swagger: {
      info: {
        title: 'LLM-Hub API',
        description: '大模型调用服务平台API文档',
        version: '1.0.0',
      },
      host: 'api.llm-hub.com',
      schemes: ['https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      securityDefinitions: {
        apiKey: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
        },
      },
    },
  });

  // 认证插件
  await app.register(authPlugin);

  // 限流插件
  await app.register(rateLimitPlugin);

  // 错误处理
  app.setErrorHandler(errorHandler);
}

// 注册路由
async function registerRoutes() {
  await app.register(authRoutes, { prefix: '/v1/auth' });
  await app.register(modelRoutes, { prefix: '/v1/models' });
  await app.register(chatRoutes, { prefix: '/v1/chat' });
  await app.register(billingRoutes, { prefix: '/v1/billing' });
  await app.register(userRoutes, { prefix: '/v1/users' });
  
  // OpenAI兼容路由
  await app.register(chatRoutes, { prefix: '/v1' });
}

// 健康检查
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// 启动服务
async function start() {
  try {
    await registerPlugins();
    await registerRoutes();

    const port = parseInt(process.env.APP_PORT || '3000');
    const host = process.env.APP_HOST || '0.0.0.0';

    await app.listen({ port, host });
    app.log.info(`🚀 Server running at http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
