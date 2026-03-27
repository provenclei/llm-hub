export interface LLMHubConfig {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface Model {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export class LLMHub {
  private apiKey: string;
  private baseURL: string;
  private timeout: number;

  constructor(config: LLMHubConfig) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || 'https://api.llm-hub.com/v1';
    this.timeout = config.timeout || 60000;
  }

  // 获取模型列表
  async listModels(): Promise<Model[]> {
    const response = await fetch(`${this.baseURL}/models`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  // 创建对话完成
  async chatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // 流式对话完成
  async *streamChatCompletion(
    request: ChatCompletionRequest
  ): AsyncGenerator<Partial<ChatCompletionResponse>> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...request, stream: true }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Request failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          try {
            yield JSON.parse(data);
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  }
}

// 兼容OpenAI SDK格式
export class OpenAICompatible {
  private client: LLMHub;
  public chat: {
    completions: {
      create: (params: ChatCompletionRequest) => Promise<ChatCompletionResponse>;
    };
  };

  constructor(config: LLMHubConfig) {
    this.client = new LLMHub(config);
    this.chat = {
      completions: {
        create: (params: ChatCompletionRequest) => this.client.chatCompletion(params),
      },
    };
  }
}

export default LLMHub;
