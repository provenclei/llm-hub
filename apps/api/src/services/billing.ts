import { PrismaClient } from '@prisma/client';

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

  /**
   * 检查用户余额（含预留金额）
   */
  async checkBalance(userId: string, estimatedCost: number = 0): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });

    if (!user || user.balance === null) {
      return false;
    }

    const balance = Number(user.balance);
    
    // 预留 20% 的缓冲，防止超额消费
    const requiredBalance = estimatedCost * 1.2;
    
    return balance >= requiredBalance;
  }

  /**
   * 预估请求费用
   */
  async estimateCost(modelId: string, estimatedInputTokens: number, estimatedOutputTokens: number): Promise<number> {
    const model = await prisma.model.findUnique({
      where: { id: modelId },
      select: { pricePer1kInput: true, pricePer1kOutput: true },
    });

    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    const inputCost = (estimatedInputTokens / 1000) * Number(model.pricePer1kInput);
    const outputCost = (estimatedOutputTokens / 1000) * Number(model.pricePer1kOutput);
    const totalCost = (inputCost + outputCost) * this.markupRate;

    return Number(totalCost.toFixed(8));
  }

  /**
   * 计算实际费用
   */
  async calculateCost(modelId: string, inputTokens: number, outputTokens: number): Promise<number> {
    const model = await prisma.model.findUnique({
      where: { id: modelId },
      select: { pricePer1kInput: true, pricePer1kOutput: true },
    });

    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    const inputCost = (inputTokens / 1000) * Number(model.pricePer1kInput);
    const outputCost = (outputTokens / 1000) * Number(model.pricePer1kOutput);
    const totalCost = (inputCost + outputCost) * this.markupRate;

    return Number(totalCost.toFixed(8));
  }

  /**
   * 记录使用量并扣费（带事务）
   */
  async recordUsage(usage: UsageRecord): Promise<void> {
    const cost = await this.calculateCost(
      usage.modelId,
      usage.inputTokens,
      usage.outputTokens
    );

    // 使用事务确保数据一致性
    await prisma.$transaction(async (tx) => {
      // 1. 检查并扣减余额（原子操作）
      const user = await tx.user.findUnique({
        where: { id: usage.userId },
        select: { balance: true },
      });

      if (!user || Number(user.balance) < cost) {
        throw new Error('Insufficient balance');
      }

      // 2. 扣减余额
      await tx.user.update({
        where: { id: usage.userId },
        data: {
          balance: {
            decrement: cost,
          },
        },
      });

      // 3. 记录使用记录
      await tx.usage.create({
        data: {
          userId: usage.userId,
          apiKeyId: usage.apiKeyId,
          modelId: usage.modelId,
          providerId: usage.channelId,
          requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          requestType: 'CHAT_COMPLETION',
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          totalTokens: usage.inputTokens + usage.outputTokens,
          inputCost: cost * (usage.inputTokens / (usage.inputTokens + usage.outputTokens)),
          outputCost: cost * (usage.outputTokens / (usage.inputTokens + usage.outputTokens)),
          totalCost: cost,
          status: 'SUCCESS',
          createdAt: new Date(),
        },
      });

      // 4. 记录交易
      await tx.transaction.create({
        data: {
          userId: usage.userId,
          type: 'CONSUMPTION',
          amount: -cost,
          currency: 'CNY',
          balanceAfter: Number(user.balance) - cost,
          description: `API调用: ${usage.modelId} (${usage.inputTokens} + ${usage.outputTokens} tokens)`,
          createdAt: new Date(),
        },
      });
    });
  }

  /**
   * 充值
   */
  async recharge(userId: string, amount: number, description?: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: 'RECHARGE',
          amount,
          currency: 'CNY',
          balanceAfter: Number(user.balance),
          description: description || `充值: ${amount} CNY`,
          createdAt: new Date(),
        },
      });
    });
  }

  /**
   * 获取用户使用统计
   */
  async getUsageStats(userId: string, startDate: Date, endDate: Date) {
    const records = await prisma.usage.groupBy({
      by: ['modelId'],
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'SUCCESS',
      },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        totalCost: true,
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
      cost: Number(record._sum.totalCost || 0),
    }));
  }

  /**
   * 获取用户余额
   */
  async getBalance(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });
    return user ? Number(user.balance) : 0;
  }

  /**
   * 估算 Token 数量（简单估算）
   */
  estimateTokens(text: string): number {
    // 简单估算：约4字符1token（中文约2字符1token）
    // 更准确的做法是使用 tiktoken 库
    const hasChinese = /[\u4e00-\u9fa5]/.test(text);
    if (hasChinese) {
      return Math.ceil(text.length / 2);
    }
    return Math.ceil(text.length / 4);
  }

  /**
   * 估算消息输入 tokens
   */
  estimateInputTokens(messages: Array<{ role: string; content: string }>): number {
    let total = 0;
    for (const msg of messages) {
      // 每个消息有约4个token的开销（role + 格式）
      total += 4 + this.estimateTokens(msg.content);
    }
    return total;
  }
}
