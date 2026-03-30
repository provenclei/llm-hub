import { providerManager } from '@llm-hub/providers';
import { prisma } from '@llm-hub/database';
import { ChatCompletionRequest, ChatCompletionResponse, ChatCompletionChunk } from '@llm-hub/providers';

export interface Channel {
  id: string;
  name: string;
  provider: string;
  apiKey: string;
  baseUrl?: string;
  weight: number;
  priority: number;
  costPer1kInput: number;
  costPer1kOutput: number;
}

export class ChatService {
  /**
   * 选择最佳渠道
   */
  async selectChannel(modelId: string): Promise<Channel | null> {
    // 从数据库获取支持该模型的活跃渠道
    const providerModels = await prisma.providerModel.findMany({
      where: {
        modelId,
        isActive: true,
        providerAccount: {
          isActive: true,
        },
      },
      include: {
        providerAccount: true,
      },
      orderBy: {
        providerAccount: {
          priority: 'desc',
        },
      },
    });

    if (providerModels.length === 0) {
      return null;
    }

    // 优先选择成功率高的渠道
    const candidates = providerModels
      .filter(pm => Number(pm.providerAccount.successRate) > 80)
      .sort((a, b) => {
        // 先按优先级，再按成功率
        if (a.providerAccount.priority !== b.providerAccount.priority) {
          return b.providerAccount.priority - a.providerAccount.priority;
        }
        return Number(b.providerAccount.successRate) - Number(a.providerAccount.successRate);
      });

    const selected = candidates[0] || providerModels[0];

    return {
      id: selected.providerAccount.id,
      name: selected.providerAccount.name,
      provider: selected.providerAccount.provider,
      apiKey: selected.providerAccount.apiKey,
      baseUrl: selected.providerAccount.baseUrl || undefined,
      weight: selected.providerAccount.weight,
      priority: selected.providerAccount.priority,
      costPer1kInput: Number(selected.providerAccount.costPer1kInput),
      costPer1kOutput: Number(selected.providerAccount.costPer1kOutput),
    };
  }

  /**
   * 创建聊天补全
   */
  async createChatCompletion(
    channel: Channel,
    modelId: string,
    messages: Array<{ role: string; content: string }>,
    options: Partial<ChatCompletionRequest> = {}
  ): Promise<ChatCompletionResponse> {
    // 获取模型的原始 ID
    const providerModel = await prisma.providerModel.findFirst({
      where: {
        providerId: channel.id,
        model: {
          modelId: modelId,
        },
      },
      include: {
        model: true,
      },
    });

    const actualModelId = providerModel?.providerModelId || modelId;

    const { response, providerId } = await providerManager.chatCompletion(
      actualModelId,
      {
        model: actualModelId,
        messages,
        temperature: options.temperature,
        top_p: options.top_p,
        max_tokens: options.max_tokens,
        stream: false,
        tools: options.tools,
        tool_choice: options.tool_choice,
      },
      { type: 'priority' }
    );

    return response;
  }

  /**
   * 创建流式聊天补全
   */
  async createChatCompletionStream(
    channel: Channel,
    modelId: string,
    messages: Array<{ role: string; content: string }>,
    options: Partial<ChatCompletionRequest> = {}
  ): Promise<AsyncGenerator<ChatCompletionChunk, void, unknown>> {
    // 获取模型的原始 ID
    const providerModel = await prisma.providerModel.findFirst({
      where: {
        providerId: channel.id,
        model: {
          modelId: modelId,
        },
      },
      include: {
        model: true,
      },
    });

    const actualModelId = providerModel?.providerModelId || modelId;

    const streamGenerator = providerManager.chatCompletionStream(
      actualModelId,
      {
        model: actualModelId,
        messages,
        temperature: options.temperature,
        top_p: options.top_p,
        max_tokens: options.max_tokens,
        stream: true,
        tools: options.tools,
        tool_choice: options.tool_choice,
      },
      { type: 'priority' }
    );

    return streamGenerator;
  }

  /**
   * 统计流式输出的 tokens
   */
  countStreamTokens(chunks: ChatCompletionChunk[]): number {
    let totalTokens = 0;
    for (const chunk of chunks) {
      if (chunk.choices[0]?.delta?.content) {
        // 简单估算，实际应该使用 tiktoken
        totalTokens += Math.ceil(chunk.choices[0].delta.content.length / 4);
      }
    }
    return totalTokens;
  }

  /**
   * 获取模型信息
   */
  async getModelInfo(modelId: string) {
    const model = await prisma.model.findUnique({
      where: { id: modelId },
    });

    if (!model) {
      return null;
    }

    return {
      id: model.id,
      name: model.name,
      provider: model.provider,
      pricePer1kInput: Number(model.pricePer1kInput),
      pricePer1kOutput: Number(model.pricePer1kOutput),
      contextWindow: model.contextWindow,
      maxTokens: model.maxTokens,
      supportsStreaming: model.supportsStreaming,
      supportsVision: model.supportsVision,
      supportsTools: model.supportsTools,
    };
  }

  /**
   * 获取所有可用模型
   */
  async getAvailableModels() {
    const models = await prisma.model.findMany({
      where: {
        isActive: true,
        isPublic: true,
      },
      orderBy: {
        provider: 'asc',
      },
    });

    return models.map(model => ({
      id: model.id,
      name: model.name,
      description: model.description,
      provider: model.provider,
      contextWindow: model.contextWindow,
      supportsStreaming: model.supportsStreaming,
      supportsVision: model.supportsVision,
      supportsTools: model.supportsTools,
    }));
  }
}
