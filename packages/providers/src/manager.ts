import {
  LLMProvider,
  ProviderConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  ProviderError,
} from './types';
import { OpenAIProvider } from './adapters/openai';
import { AnthropicProvider } from './adapters/anthropic';
import { AlibabaProvider, MoonshotProvider, ZhipuProvider } from './adapters/chinese';

export type ProviderType = 
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'baidu'
  | 'alibaba'
  | 'doubao'
  | 'zhipu'
  | 'moonshot'
  | 'yi'
  | 'minimax'
  | 'xunfei';

interface ProviderInstance {
  type: ProviderType;
  provider: LLMProvider;
  config: ProviderConfig;
  weight: number;
  priority: number;
  isHealthy: boolean;
  lastError?: Date;
  consecutiveErrors: number;
}

interface RoutingStrategy {
  type: 'priority' | 'weighted' | 'round-robin' | 'least-latency';
}

export class ProviderManager {
  private providers: Map<string, ProviderInstance> = new Map();
  private modelToProviders: Map<string, string[]> = new Map();
  private roundRobinIndex: Map<string, number> = new Map();

  constructor() {}

  /**
   * 注册提供商
   */
  registerProvider(
    id: string,
    type: ProviderType,
    config: ProviderConfig,
    options: {
      weight?: number;
      priority?: number;
      supportedModels?: string[];
    } = {}
  ): void {
    let provider: LLMProvider;

    switch (type) {
      case 'openai':
        provider = new OpenAIProvider(config);
        break;
      case 'anthropic':
        provider = new AnthropicProvider(config);
        break;
      case 'alibaba':
        provider = new AlibabaProvider(config);
        break;
      case 'moonshot':
        provider = new MoonshotProvider(config);
        break;
      case 'zhipu':
        provider = new ZhipuProvider(config);
        break;
      default:
        throw new Error(`Unsupported provider type: ${type}`);
    }

    this.providers.set(id, {
      type,
      provider,
      config,
      weight: options.weight ?? 100,
      priority: options.priority ?? 0,
      isHealthy: true,
      consecutiveErrors: 0,
    });

    // 注册支持的模型
    if (options.supportedModels) {
      for (const model of options.supportedModels) {
        const existing = this.modelToProviders.get(model) || [];
        if (!existing.includes(id)) {
          this.modelToProviders.set(model, [...existing, id]);
        }
      }
    }
  }

  /**
   * 注销提供商
   */
  unregisterProvider(id: string): void {
    this.providers.delete(id);
    // 从模型映射中移除
    for (const [model, ids] of this.modelToProviders.entries()) {
      const filtered = ids.filter((i) => i !== id);
      if (filtered.length === 0) {
        this.modelToProviders.delete(model);
      } else {
        this.modelToProviders.set(model, filtered);
      }
    }
  }

  /**
   * 获取支持指定模型的提供商列表
   */
  getProvidersForModel(modelId: string): ProviderInstance[] {
    const providerIds = this.modelToProviders.get(modelId) || [];
    return providerIds
      .map((id) => this.providers.get(id))
      .filter((p): p is ProviderInstance => !!p && p.isHealthy);
  }

  /**
   * 选择最佳提供商
   */
  selectProvider(modelId: string, strategy: RoutingStrategy = { type: 'priority' }): ProviderInstance | null {
    const candidates = this.getProvidersForModel(modelId);
    if (candidates.length === 0) return null;

    switch (strategy.type) {
      case 'priority':
        // 按优先级选择
        return candidates.sort((a, b) => b.priority - a.priority)[0];

      case 'weighted':
        // 按权重随机选择
        const totalWeight = candidates.reduce((sum, p) => sum + p.weight, 0);
        let random = Math.random() * totalWeight;
        for (const provider of candidates) {
          random -= provider.weight;
          if (random <= 0) return provider;
        }
        return candidates[0];

      case 'round-robin':
        // 轮询
        const index = (this.roundRobinIndex.get(modelId) || 0) % candidates.length;
        this.roundRobinIndex.set(modelId, index + 1);
        return candidates[index];

      case 'least-latency':
        // 选择延迟最低的（需要实现延迟追踪）
        return candidates[0];

      default:
        return candidates[0];
    }
  }

  /**
   * 调用聊天补全
   */
  async chatCompletion(
    modelId: string,
    request: ChatCompletionRequest,
    strategy?: RoutingStrategy
  ): Promise<{ response: ChatCompletionResponse; providerId: string }> {
    const providerInstance = this.selectProvider(modelId, strategy);
    if (!providerInstance) {
      throw new ProviderError(
        `No available provider for model: ${modelId}`,
        'NO_PROVIDER_AVAILABLE',
        503
      );
    }

    try {
      const response = await providerInstance.provider.chatCompletion({
        ...request,
        model: modelId,
      });

      // 重置错误计数
      providerInstance.consecutiveErrors = 0;
      providerInstance.isHealthy = true;

      return { response, providerId: providerInstance.provider.name };
    } catch (error) {
      // 记录错误
      providerInstance.lastError = new Date();
      providerInstance.consecutiveErrors++;

      // 连续错误超过阈值，标记为不健康
      if (providerInstance.consecutiveErrors >= 5) {
        providerInstance.isHealthy = false;
      }

      throw error;
    }
  }

  /**
   * 流式调用聊天补全
   */
  async *chatCompletionStream(
    modelId: string,
    request: ChatCompletionRequest,
    strategy?: RoutingStrategy
  ): AsyncGenerator<ChatCompletionChunk & { providerId: string }, void, unknown> {
    const providerInstance = this.selectProvider(modelId, strategy);
    if (!providerInstance) {
      throw new ProviderError(
        `No available provider for model: ${modelId}`,
        'NO_PROVIDER_AVAILABLE',
        503
      );
    }

    try {
      const stream = providerInstance.provider.chatCompletionStream({
        ...request,
        model: modelId,
      });

      for await (const chunk of stream) {
        yield { ...chunk, providerId: providerInstance.provider.name };
      }

      // 重置错误计数
      providerInstance.consecutiveErrors = 0;
      providerInstance.isHealthy = true;
    } catch (error) {
      providerInstance.lastError = new Date();
      providerInstance.consecutiveErrors++;

      if (providerInstance.consecutiveErrors >= 5) {
        providerInstance.isHealthy = false;
      }

      throw error;
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<
    Array<{
      id: string;
      type: ProviderType;
      isHealthy: boolean;
      lastError?: Date;
      consecutiveErrors: number;
    }>
  > {
    const results = [];

    for (const [id, instance] of this.providers.entries()) {
      const isHealthy = await instance.provider.validateConfig();
      instance.isHealthy = isHealthy;

      if (isHealthy) {
        instance.consecutiveErrors = 0;
      }

      results.push({
        id,
        type: instance.type,
        isHealthy,
        lastError: instance.lastError,
        consecutiveErrors: instance.consecutiveErrors,
      });
    }

    return results;
  }

  /**
   * 获取所有提供商状态
   */
  getProviderStatus(): Array<{
    id: string;
    type: ProviderType;
    weight: number;
    priority: number;
    isHealthy: boolean;
    supportedModels: string[];
  }> {
    const result = [];

    for (const [id, instance] of this.providers.entries()) {
      const supportedModels: string[] = [];
      for (const [model, ids] of this.modelToProviders.entries()) {
        if (ids.includes(id)) {
          supportedModels.push(model);
        }
      }

      result.push({
        id,
        type: instance.type,
        weight: instance.weight,
        priority: instance.priority,
        isHealthy: instance.isHealthy,
        supportedModels,
      });
    }

    return result;
  }
}

// 单例实例
export const providerManager = new ProviderManager();
