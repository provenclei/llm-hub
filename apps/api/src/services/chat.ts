import { PrismaClient } from '@prisma/client';
import { OpenAI } from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();

export interface Channel {
  id: string;
  name: string;
  provider: string;
  credentials: any;
  rateLimit: any;
  priority: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
}

export class ChatService {
  // 选择最佳渠道
  async selectChannel(modelId: string): Promise<Channel | null> {
    const channels = await prisma.channel.findMany({
      where: {
        status: 'active',
        OR: [
          { provider: modelId.split('/')[0] },
          { supportedModels: { has: modelId } },
        ],
      },
      orderBy: { priority: 'asc' },
    });

    // TODO: 实现更智能的路由策略（检查健康状态、负载等）
    if (channels.length === 0) return null;

    const channel = channels[0];
    return {
      id: channel.id,
      name: channel.name,
      provider: channel.provider,
      credentials: channel.credentials as any,
      rateLimit: channel.rateLimit as any,
      priority: channel.priority,
    };
  }

  // 创建对话完成
  async createChatCompletion(
    channel: Channel,
    model: string,
    messages: ChatMessage[],
    options: any
  ) {
    const adapter = this.getAdapter(channel);
    return adapter.createChatCompletion(model, messages, options);
  }

  // 创建流式对话完成
  async createChatCompletionStream(
    channel: Channel,
    model: string,
    messages: ChatMessage[],
    options: any
  ) {
    const adapter = this.getAdapter(channel);
    return adapter.createChatCompletionStream(model, messages, options);
  }

  // 获取适配器
  private getAdapter(channel: Channel) {
    switch (channel.provider) {
      case 'openai':
        return new OpenAIAdapter(channel.credentials);
      case 'anthropic':
        return new AnthropicAdapter(channel.credentials);
      case 'google':
        return new GoogleAdapter(channel.credentials);
      case 'azure':
        return new AzureOpenAIAdapter(channel.credentials);
      case 'baidu':
        return new BaiduAdapter(channel.credentials);
      case 'alibaba':
        return new AlibabaAdapter(channel.credentials);
      default:
        throw new Error(`Unsupported provider: ${channel.provider}`);
    }
  }
}

// OpenAI 适配器
class OpenAIAdapter {
  private client: OpenAI;

  constructor(credentials: any) {
    this.client = new OpenAI({
      apiKey: credentials.apiKey,
      baseURL: credentials.baseUrl,
    });
  }

  async createChatCompletion(model: string, messages: ChatMessage[], options: any) {
    const response = await this.client.chat.completions.create({
      model,
      messages: messages as any,
      temperature: options.temperature,
      max_tokens: options.max_tokens,
      top_p: options.top_p,
      frequency_penalty: options.frequency_penalty,
      presence_penalty: options.presence_penalty,
      stream: false,
    });

    return response;
  }

  async *createChatCompletionStream(
    model: string,
    messages: ChatMessage[],
    options: any
  ): AsyncGenerator<any> {
    const stream = await this.client.chat.completions.create({
      model,
      messages: messages as any,
      temperature: options.temperature,
      max_tokens: options.max_tokens,
      stream: true,
    });

    for await (const chunk of stream) {
      yield chunk;
    }
  }
}

// Anthropic Claude 适配器
class AnthropicAdapter {
  private client: Anthropic;

  constructor(credentials: any) {
    this.client = new Anthropic({
      apiKey: credentials.apiKey,
    });
  }

  async createChatCompletion(model: string, messages: ChatMessage[], options: any) {
    // 转换消息格式
    const systemMessage = messages.find(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');

    const response = await this.client.messages.create({
      model,
      system: systemMessage?.content,
      messages: chatMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      max_tokens: options.max_tokens || 4096,
      temperature: options.temperature,
      top_p: options.top_p,
    });

    // 转换为OpenAI兼容格式
    return {
      id: response.id,
      object: 'chat.completion',
      created: Date.now(),
      model: response.model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: response.content[0]?.text || '',
        },
        finish_reason: response.stop_reason,
      }],
      usage: {
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }

  async *createChatCompletionStream(
    model: string,
    messages: ChatMessage[],
    options: any
  ): AsyncGenerator<any> {
    // TODO: 实现流式响应
    throw new Error('Anthropic streaming not implemented yet');
  }
}

// Google Gemini 适配器
class GoogleAdapter {
  private client: GoogleGenerativeAI;

  constructor(credentials: any) {
    this.client = new GoogleGenerativeAI(credentials.apiKey);
  }

  async createChatCompletion(model: string, messages: ChatMessage[], options: any) {
    const genModel = this.client.getGenerativeModel({ model });
    
    // 转换消息格式
    const chat = genModel.startChat({
      history: messages.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
    });

    const result = await chat.sendMessage(messages[messages.length - 1].content);
    const response = await result.response;

    // 转换为OpenAI兼容格式
    return {
      id: `gen-${Date.now()}`,
      object: 'chat.completion',
      created: Date.now(),
      model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: response.text(),
        },
        finish_reason: 'stop',
      }],
      usage: {
        prompt_tokens: 0, // Gemini API不返回token数
        completion_tokens: 0,
        total_tokens: 0,
      },
    };
  }

  async *createChatCompletionStream(
    model: string,
    messages: ChatMessage[],
    options: any
  ): AsyncGenerator<any> {
    throw new Error('Google streaming not implemented yet');
  }
}

// Azure OpenAI 适配器
class AzureOpenAIAdapter extends OpenAIAdapter {
  constructor(credentials: any) {
    super({
      apiKey: credentials.apiKey,
      baseUrl: `${credentials.endpoint}/openai/deployments/${credentials.deployment}`,
    });
  }
}

// 百度文心适配器 (简化实现)
class BaiduAdapter {
  constructor(credentials: any) {
    // TODO: 实现百度API调用
  }

  async createChatCompletion(model: string, messages: ChatMessage[], options: any) {
    throw new Error('Baidu adapter not implemented yet');
  }

  async *createChatCompletionStream(
    model: string,
    messages: ChatMessage[],
    options: any
  ): AsyncGenerator<any> {
    throw new Error('Baidu streaming not implemented yet');
  }
}

// 阿里通义适配器 (简化实现)
class AlibabaAdapter {
  constructor(credentials: any) {
    // TODO: 实现阿里API调用
  }

  async createChatCompletion(model: string, messages: ChatMessage[], options: any) {
    throw new Error('Alibaba adapter not implemented yet');
  }

  async *createChatCompletionStream(
    model: string,
    messages: ChatMessage[],
    options: any
  ): AsyncGenerator<any> {
    throw new Error('Alibaba streaming not implemented yet');
  }
}
