import axios from 'axios';
import {
  LLMProvider,
  ProviderConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  ChatMessage,
  ProviderError,
  RateLimitError,
  AuthenticationError,
} from '../types';

export class AnthropicProvider implements LLMProvider {
  name = 'anthropic';
  private client: ReturnType<typeof axios.create>;
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.anthropic.com/v1',
      timeout: config.timeout || 60000,
      headers: {
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
    });
  }

  private convertMessages(messages: ChatMessage[]): {
    system?: string;
    messages: Array<{ role: 'user' | 'assistant'; content: any }>;
  } {
    const systemMessage = messages.find((m) => m.role === 'system');
    const otherMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    return {
      system: systemMessage?.content as string,
      messages: otherMessages,
    };
  }

  private convertResponse(response: any): ChatCompletionResponse {
    return {
      id: response.id,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: response.model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: response.content[0]?.text || '',
          },
          finish_reason: response.stop_reason === 'max_tokens' ? 'length' : 'stop',
        },
      ],
      usage: {
        prompt_tokens: response.usage?.input_tokens || 0,
        completion_tokens: response.usage?.output_tokens || 0,
        total_tokens:
          (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
      },
    };
  }

  async chatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    try {
      const { system, messages } = this.convertMessages(request.messages);

      const response = await this.client.post('/messages', {
        model: request.model,
        system,
        messages,
        max_tokens: request.max_tokens || 4096,
        temperature: request.temperature,
        top_p: request.top_p,
        stream: false,
      });

      return this.convertResponse(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new AuthenticationError('Invalid Anthropic API key');
      }
      if (error.response?.status === 429) {
        throw new RateLimitError('Anthropic rate limit exceeded');
      }
      throw new ProviderError(
        `Anthropic error: ${error.message}`,
        'COMPLETION_FAILED',
        error.response?.status,
        'anthropic'
      );
    }
  }

  async *chatCompletionStream(
    request: ChatCompletionRequest
  ): AsyncGenerator<ChatCompletionChunk, void, unknown> {
    try {
      const { system, messages } = this.convertMessages(request.messages);

      const response = await this.client.post(
        '/messages',
        {
          model: request.model,
          system,
          messages,
          max_tokens: request.max_tokens || 4096,
          temperature: request.temperature,
          top_p: request.top_p,
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
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'content_block_delta') {
                yield {
                  id: data.message?.id || 'unknown',
                  object: 'chat.completion.chunk',
                  created: Math.floor(Date.now() / 1000),
                  model: request.model,
                  choices: [
                    {
                      index: 0,
                      delta: { content: data.delta?.text || '' },
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
        `Anthropic stream failed: ${error.message}`,
        'STREAM_FAILED',
        undefined,
        'anthropic'
      );
    }
  }

  async listModels(): Promise<string[]> {
    return [
      'claude-3-5-sonnet-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ];
  }

  async validateConfig(): Promise<boolean> {
    try {
      await this.chatCompletion({
        model: 'claude-3-haiku-20240307',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10,
      });
      return true;
    } catch {
      return false;
    }
  }
}
