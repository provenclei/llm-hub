import { prisma } from '@llm-hub/database';

export class ModelService {
  /**
   * 获取所有可用模型
   */
  async getAvailableModels() {
    const models = await prisma.model.findMany({
      where: {
        isActive: true,
        isPublic: true,
      },
      orderBy: { provider: 'asc' },
    });

    return models;
  }

  /**
   * 根据 ID 获取模型
   */
  async getModelById(modelId: string) {
    const model = await prisma.model.findUnique({
      where: { id: modelId },
    });

    return model;
  }

  /**
   * 获取模型定价
   */
  async getModelPricing(modelId: string) {
    const model = await prisma.model.findUnique({
      where: { id: modelId },
      select: {
        pricePer1kInput: true,
        pricePer1kOutput: true,
      },
    });

    if (!model) {
      return null;
    }

    return {
      input: Number(model.pricePer1kInput),
      output: Number(model.pricePer1kOutput),
      currency: 'CNY',
    };
  }
}
