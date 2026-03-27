import { PrismaClient } from '@prisma/client';
import { encoding_for_model } from 'tiktoken';

const prisma = new PrismaClient();

export interface UsageRecord {
  userId: string;
  apiKeyId: string;
  modelId: string;
  channelId: string;
  inputTokens: number;
  outputTokens: number;
}

export class BillingService {
  private markupRate: number;

  constructor() {
    this.markupRate = parseFloat(process.env.MARKUP_RATE || '1.5');
  }

  // 检查用户余额
  async checkBalance(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });

    // 如果用户没有余额记录，默认允许（免费额度内）
    if (!user || user.balance === null) {
      return true;
    }

    return Number(user.balance) > 0;
  }

  // 计算费用
  async calculateCost(modelId: string, inputTokens: number, outputTokens: number): Promise<number> {
    const model = await prisma.model.findUnique({
      where: { id: modelId },
      select: { pricingInput: true, pricingOutput: true },
    });

    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    const inputCost = (inputTokens / 1000) * Number(model.pricingInput);
    const outputCost = (outputTokens / 1000) * Number(model.pricingOutput);
    const totalCost = (inputCost + outputCost) * this.markupRate;

    return Number(totalCost.toFixed(8));
  }

  // 记录使用量
  async recordUsage(usage: UsageRecord): Promise<void> {
    const cost = await this.calculateCost(
      usage.modelId,
      usage.inputTokens,
      usage.outputTokens
    );

    // 记录使用记录
    await prisma.usageRecord.create({
      data: {
        userId: usage.userId,
        apiKeyId: usage.apiKeyId,
        modelId: usage.modelId,
        channelId: usage.channelId,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        cost,
      },
    });

    // 扣除用户余额
    await prisma.user.update({
      where: { id: usage.userId },
      data: {
        balance: {
          decrement: cost,
        },
      },
    });
  }

  // 获取用户使用统计
  async getUsageStats(userId: string, startDate: Date, endDate: Date) {
    const records = await prisma.usageRecord.groupBy({
      by: ['modelId'],
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        cost: true,
      },
      _count: {
        id: true,
      },
    });

    return records.map(record => ({
      modelId: record.modelId,
      requests: record._count.id,
      inputTokens: record._sum.inputTokens || 0,
      outputTokens: record._sum.outputTokens || 0,
      cost: Number(record._sum.cost || 0),
    }));
  }

  // 估算Token数量
  estimateTokens(text: string, model: string = 'gpt-3.5-turbo'): number {
    try {
      const encoding = encoding_for_model(model as any);
      const tokens = encoding.encode(text);
      encoding.free();
      return tokens.length;
    } catch {
      // 如果模型不支持，使用简单估算（约4字符1token）
      return Math.ceil(text.length / 4);
    }
  }
}
