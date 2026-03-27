import { FastifyInstance } from 'fastify';
import { ModelService } from '../services/model';
import { authenticateApiKey } from '../plugins/auth';

const modelService = new ModelService();

export async function modelRoutes(app: FastifyInstance) {
  // 获取所有可用模型
  app.get('/', async (request, reply) => {
    const models = await modelService.getAvailableModels();
    
    // OpenAI兼容格式返回
    return {
      object: 'list',
      data: models.map(model => ({
        id: model.id,
        object: 'model',
        created: Math.floor(new Date(model.createdAt).getTime() / 1000),
        owned_by: model.provider,
        permission: [],
        root: model.id,
        parent: null,
      })),
    };
  });

  // 获取模型详情
  app.get('/:model', async (request, reply) => {
    const { model } = request.params as { model: string };
    const modelData = await modelService.getModelById(model);

    if (!modelData) {
      return reply.code(404).send({
        error: {
          message: `The model '${model}' does not exist`,
          type: 'invalid_request_error',
          param: 'model',
          code: 'model_not_found',
        },
      });
    }

    return {
      id: modelData.id,
      object: 'model',
      created: Math.floor(new Date(modelData.createdAt).getTime() / 1000),
      owned_by: modelData.provider,
      permission: [],
      root: modelData.id,
      parent: null,
    };
  });

  // 获取模型定价（需要认证）
  app.get('/:model/pricing', { preHandler: [authenticateApiKey] }, async (request, reply) => {
    const { model } = request.params as { model: string };
    const pricing = await modelService.getModelPricing(model);

    if (!pricing) {
      return reply.code(404).send({
        error: {
          message: `Pricing for model '${model}' not found`,
          type: 'invalid_request_error',
          code: 'not_found',
        },
      });
    }

    return {
      model,
      pricing: {
        input: pricing.input,
        output: pricing.output,
        currency: pricing.currency,
      },
    };
  });
}
