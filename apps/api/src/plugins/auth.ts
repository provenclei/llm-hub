import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { verifyApiKey } from '../services/auth';
import { verifyToken } from '../utils/jwt';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: string;
    };
    apiKey?: {
      id: string;
      userId: string;
      permissions: string[];
    };
  }
}

export const authPlugin = fp(async (app: FastifyInstance) => {
  // API Key认证装饰器
  app.decorate('authenticateApiKey', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.code(401).send({
        error: {
          message: 'Missing or invalid API key',
          type: 'authentication_error',
          code: 'invalid_api_key',
        },
      });
    }

    const apiKey = authHeader.slice(7);
    const keyData = await verifyApiKey(apiKey);

    if (!keyData) {
      return reply.code(401).send({
        error: {
          message: 'Invalid API key',
          type: 'authentication_error',
          code: 'invalid_api_key',
        },
      });
    }

    request.apiKey = keyData;
    request.user = {
      id: keyData.userId,
      email: '',
      role: 'user',
    };
  });

  // JWT认证装饰器（用于管理后台）
  app.decorate('authenticateJwt', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Missing token' });
    }

    const token = authHeader.slice(7);
    const payload = verifyToken(token);

    if (!payload) {
      return reply.code(401).send({ error: 'Invalid token' });
    }

    request.user = payload;
  });
});
