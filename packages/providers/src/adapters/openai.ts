import axios, { AxiosInstance } from 'axios';
import {
  LLMProvider,
  ProviderConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  ProviderError,
  RateLimitError,
  AuthenticationError,
} from '../types';

export class OpenAIProvider implements LLMProvider {
  name = 'openai';
  private client: AxiosInstance;
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.openai.com/v1',
      timeout: config.timeout || 60000,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const status = error.response.status;
          const data = error.response.data;
          const errorMessage = data?.error?.message || 'Unknown error';

          if (status === 401) {
            throw new AuthenticationError('Invalid OpenAI API key');
          }
          if (status === 429) {
            const retryAfter = error.response.headers['retry-after'];
            throw new RateLimitError(
              'OpenAI rate limit exceeded',
              retryAfter ? parseInt(retryAfter) : undefined
            );
          }
          throw new ProviderError(
            `OpenAI error: ${errorMessage}`,
            data?.error?.code || 'UNKNOWN_ERROR',
            status,
            'openai'
          );
        }
        throw new ProviderError(
          `OpenAI request failed: ${error.message}`,
          'REQUEST_FAILED',
          undefined,
          'openai'
        );
      }
    );
  }

  async chatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    try {
      const response = await this.client.post<ChatCompletionResponse>(
        '/chat/completions',
        {
          model: request.model,
          messages: request.messages,
          temperature: request.temperature,
          top_p: request.top_p,
          max_tokens: request.max_tokens,
          stream: false,
          tools: request.tools,
          tool_choice: request.tool_choice,
          user: request.user,
        }
      );

      return response.data;
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error;
      }
      throw new ProviderError(
        `OpenAI chat completion failed: ${(error as Error).message}`,
        'COMPLETION_FAILED',
        undefined,
        'openai'
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
          tools: request.tools,
          tool_choice: request.tool_choice,
          user: request.user,
        },
        {
          responseType: 'stream',
        }
      );

      const stream = response.data as NodeJS.ReadableStream;
      let buffer = '';

      for await (const chunk of stream) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
          
          if (trimmedLine.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmedLine.slice(6));
              yield data as ChatCompletionChunk;
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error;
      }
      throw new ProviderError(
        `OpenAI stream failed: ${(error as Error).message}`,
        'STREAM_FAILED',
        undefined,
        'openai'
      );
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await this.client.get('/models');
      return response.data.data
        .filter((m: any) => m.id.includes('gpt'))
        .map((m: any) => m.id);
    } catch (error) {
      throw new ProviderError(
        `Failed to list OpenAI models: ${(error as Error).message}`,
        'LIST_MODELS_FAILED',
        undefined,
        'openai'
      );
    }
  }

  async validateConfig(): Promise<boolean> {
    try {
      await this.listModels();
      return true;
    } catch (error) {
      return false;
    }
  }
}
