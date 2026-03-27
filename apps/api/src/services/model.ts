import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  pricing: {
    input: number;
    output: number;
    currency: string;
  };
  contextWindow: number;
  features: string[];
  status: string;
  createdAt: Date;
}

export class ModelService {
  // 获取所有可用模型
  async getAvailableModels(): Promise<ModelInfo[]> {
    const models = await prisma.model.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
    });

    return models.map(model => ({
      id: model.id,
      name: model.name,
      provider: model.provider,
      pricing: {
        input: Number(model.pricingInput),
        output: Number(model.pricingOutput),
        currency: 'USD',
      },
      contextWindow: model.contextWindow,
      features: model.features as string[],
      status: model.status,
      createdAt: model.createdAt,
    }));
  }

  // 根据ID获取模型
  async getModelById(id: string): Promise<ModelInfo | null> {
    const model = await prisma.model.findUnique({
      where: { id },
    });

    if (!model) return null;

    return {
      id: model.id,
      name: model.name,
      provider: model.provider,
      pricing: {
        input: Number(model.pricingInput),
        output: Number(model.pricingOutput),
        currency: 'USD',
      },
      contextWindow: model.contextWindow,
      features: model.features as string[],
      status: model.status,
      createdAt: model.createdAt,
    };
  }

  // 获取模型定价
  async getModelPricing(modelId: string) {
    const model = await prisma.model.findUnique({
      where: { id: modelId },
    });

    if (!model) return null;

    return {
      input: Number(model.pricingInput),
      output: Number(model.pricingOutput),
      currency: 'USD',
    };
  }

  // 检查模型是否存在且可用
  async isModelAvailable(modelId: string): Promise<boolean> {
    const model = await prisma.model.findFirst({
      where: {
        id: modelId,
        status: 'active',
      },
    });

    return !!model;
  }
}
