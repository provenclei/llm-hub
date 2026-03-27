// 通用消息类型
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | MessageContent[];
  name?: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
    detail?: 'low' | 'high' | 'auto';
  };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface Tool {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters: Record<string, any>;
  };
}

// 请求参数
export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  tools?: Tool[];
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
  user?: string;
}

// 响应类型
export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatCompletionChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: {
    index: number;
    delta: Partial<ChatMessage>;
    finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
  }[];
}

// 提供商配置
export interface ProviderConfig {
  apiKey: string;
  apiSecret?: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

// 提供商接口
export interface LLMProvider {
  name: string;
  
  chatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse>;
  
  chatCompletionStream(
    request: ChatCompletionRequest
  ): AsyncGenerator<ChatCompletionChunk, void, unknown>;
  
  listModels(): Promise<string[]>;
  
  validateConfig(): Promise<boolean>;
}

// 提供商工厂
export interface ProviderFactory {
  create(config: ProviderConfig): LLMProvider;
}

// 错误类型
export class ProviderError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public provider?: string
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export class RateLimitError extends ProviderError {
  constructor(message: string, public retryAfter?: number) {
    super(message, 'RATE_LIMIT_ERROR', 429);
    this.name = 'RateLimitError';
  }
}

export class AuthenticationError extends ProviderError {
  constructor(message: string) {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class InsufficientBalanceError extends ProviderError {
  constructor(message: string) {
    super(message, 'INSUFFICIENT_BALANCE', 402);
    this.name = 'InsufficientBalanceError';
  }
}
