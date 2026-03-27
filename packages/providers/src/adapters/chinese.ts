import axios from 'axios';
import {
  LLMProvider,
  ProviderConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  ProviderError,
} from '../types';

/**
 * 阿里通义千问适配器
 */
export class AlibabaProvider implements LLMProvider {
  name = 'alibaba';
  private client: ReturnType<typeof axios.create>;
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://dashscope.aliyuncs.com/api/v1',
      timeout: config.timeout || 60000,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async chatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    try {
      const response = await this.client.post('/services/aigc/text-generation/generation', {
        model: request.model,
        input: {
          messages: request.messages.map((m) => ({
            role: m.role,
            content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
          })),
        },
        parameters: {
          result_format: 'message',
          max_tokens: request.max_tokens,
          temperature: request.temperature,
          top_p: request.top_p,
          enable_search: false,
        },
      });

      const output = response.data.output;
      const usage = response.data.usage;

      return {
        id: response.data.request_id,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: request.model,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: output.choices[0]?.message?.content || '',
            },
            finish_reason: output.choices[0]?.finish_reason === 'stop' ? 'stop' : 'length',
          },
        ],
        usage: {
          prompt_tokens: usage.input_tokens,
          completion_tokens: usage.output_tokens,
          total_tokens: usage.input_tokens + usage.output_tokens,
        },
      };
    } catch (error: any) {
      throw new ProviderError(
        `Alibaba error: ${error.message}`,
        'COMPLETION_FAILED',
        error.response?.status,
        'alibaba'
      );
    }
  }

  async *chatCompletionStream(
    request: ChatCompletionRequest
  ): AsyncGenerator<ChatCompletionChunk, void, unknown> {
    try {
      const response = await this.client.post(
        '/services/aigc/text-generation/generation',
        {
          model: request.model,
          input: {
            messages: request.messages.map((m) => ({
              role: m.role,
              content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
            })),
          },
          parameters: {
            result_format: 'message',
            max_tokens: request.max_tokens,
            temperature: request.temperature,
            top_p: request.top_p,
            incremental_output: true,
          },
        },
        { responseType: 'stream' }
      );

      const stream = response.data as NodeJS.ReadableStream;
      const requestId = `alibaba-${Date.now()}`;

      for await (const chunk of stream) {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const data = JSON.parse(line.slice(5));
              if (data.output?.choices?.[0]?.message?.content) {
                yield {
                  id: requestId,
                  object: 'chat.completion.chunk',
                  created: Math.floor(Date.now() / 1000),
                  model: request.model,
                  choices: [
                    {
                      index: 0,
                      delta: { content: data.output.choices[0].message.content },
                      finish_reason: null,
                    },
                  ],
                };
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error: any) {
      throw new ProviderError(
        `Alibaba stream failed: ${error.message}`,
        'STREAM_FAILED',
        undefined,
        'alibaba'
      );
    }
  }

  async listModels(): Promise<string[]> {
    return [
      'qwen-max',
      'qwen-max-longcontext',
      'qwen-plus',
      'qwen-turbo',
      'qwen-vl-max',
      'qwen-vl-plus',
    ];
  }

  async validateConfig(): Promise<boolean> {
    try {
      await this.listModels();
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Moonshot Kimi 适配器
 */
export class MoonshotProvider implements LLMProvider {
  name = 'moonshot';
  private client: ReturnType<typeof axios.create>;
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.moonshot.cn/v1',
      timeout: config.timeout || 60000,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async chatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    try {
      const response = await this.client.post('/chat/completions', {
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        top_p: request.top_p,
        max_tokens: request.max_tokens,
        stream: false,
      });

      return response.data;
    } catch (error: any) {
      throw new ProviderError(
        `Moonshot error: ${error.message}`,
        'COMPLETION_FAILED',
        error.response?.status,
        'moonshot'
      );
    }
  }

  async *chatCompletionStream(
    request: ChatCompletionRequest
  ): AsyncGenerator<ChatCompletionChunk, void, unknown> {
    try {
      const response = await this.client.post(
        '/chat/completions',
        {
          model: request.model,
          messages: request.messages,
          temperature: request.temperature,
          top_p: request.top_p,
          max_tokens: request.max_tokens,
          stream: true,
        },
        { responseType: 'stream' }
      );

      const stream = response.data as NodeJS.ReadableStream;
      let buffer = '';

      for await (const chunk of stream) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              yield parsed as ChatCompletionChunk;
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error: any) {
      throw new ProviderError(
        `Moonshot stream failed: ${error.message}`,
        'STREAM_FAILED',
        undefined,
        'moonshot'
      );
    }
  }

  async listModels(): Promise<string[]> {
    return ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'];
  }

  async validateConfig(): Promise<boolean> {
    try {
      await this.listModels();
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * 智谱 GLM 适配器
 */
export class ZhipuProvider implements LLMProvider {
  name = 'zhipu';
  private client: ReturnType<typeof axios.create>;
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://open.bigmodel.cn/api/paas/v4',
      timeout: config.timeout || 60000,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async chatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    try {
      const response = await this.client.post('/chat/completions', {
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        top_p: request.top_p,
        max_tokens: request.max_tokens,
        stream: false,
      });

      return response.data;
    } catch (error: any) {
      throw new ProviderError(
        `Zhipu error: ${error.message}`,
        'COMPLETION_FAILED',
        error.response?.status,
        'zhipu'
      );
    }
  }

  async *chatCompletionStream(
    request: ChatCompletionRequest
  ): AsyncGenerator<ChatCompletionChunk, void, unknown> {
    try {
      const response = await this.client.post(
        '/chat/completions',
        {
          model: request.model,
          messages: request.messages,
          temperature: request.temperature,
          top_p: request.top_p,
          max_tokens: request.max_tokens,
          stream: true,
        },
        { responseType: 'stream' }
      );

      const stream = response.data as NodeJS.ReadableStream;
      let buffer = '';

      for await (const chunk of stream) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              yield parsed as ChatCompletionChunk;
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error: any) {
      throw new ProviderError(
        `Zhipu stream failed: ${error.message}`,
        'STREAM_FAILED',
        undefined,
        'zhipu'
      );
    }
  }

  async listModels(): Promise<string[]> {
    return ['glm-4', 'glm-4v', 'glm-3-turbo', 'chatglm_turbo'];
  }

  async validateConfig(): Promise<boolean> {
    try {
      await this.listModels();
      return true;
    } catch {
      return false;
    }
  }
}
