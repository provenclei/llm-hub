import { FastifyInstance } from 'fastify';
import { ChatService } from '../services/chat';
import { BillingService } from '../services/billing';
import { authenticateApiKey } from '../plugins/auth';
import { chatCompletionSchema } from '../schemas/chat';

const chatService = new ChatService();
const billingService = new BillingService();

export async function chatRoutes(app: FastifyInstance) {
  // Chat Completions - OpenAI兼容接口
  app.post('/completions', { preHandler: [authenticateApiKey] }, async (request, reply) => {
    return reply.code(404).send({
      error: {
        message: 'This endpoint is not implemented. Use /chat/completions instead.',
        type: 'invalid_request_error',
        code: 'not_implemented',
      },
    });
  });

  // Chat Completions - 主要接口
  app.post('/chat/completions', { preHandler: [authenticateApiKey] }, async (request, reply) => {
    const startTime = Date.now();
    const body = chatCompletionSchema.parse(request.body);
    const { model, messages, stream = false, ...options } = body;

    // 预估费用
    const estimatedInputTokens = billingService.estimateInputTokens(messages);
    const estimatedOutputTokens = options.max_tokens || 1000;
    const estimatedCost = await billingService.estimateCost(model, estimatedInputTokens, estimatedOutputTokens);

    // 检查用户余额（含预留）
    const hasBalance = await billingService.checkBalance(request.apiKey!.userId, estimatedCost);
    if (!hasBalance) {
      return reply.code(402).send({
        error: {
          message: 'Insufficient balance. Please recharge your account.',
          type: 'billing_error',
          code: 'insufficient_balance',
        },
      });
    }

    // 选择最佳渠道
    const channel = await chatService.selectChannel(model);
    
    if (!channel) {
      return reply.code(503).send({
        error: {
          message: 'No available channel for the requested model',
          type: 'service_error',
          code: 'no_available_channel',
        },
      });
    }

    try {
      // 流式响应
      if (stream) {
        reply.raw.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        });

        const streamGenerator = await chatService.createChatCompletionStream(
          channel,
          model,
          messages,
          options
        );

        let allChunks: any[] = [];
        let finishReason: string | null = null;

        for await (const chunk of streamGenerator) {
          allChunks.push(chunk);
          
          if (chunk.choices[0]?.finish_reason) {
            finishReason = chunk.choices[0].finish_reason;
          }
          
          reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }

        reply.raw.write('data: [DONE]\n\n');
        reply.raw.end();

        // 计算实际输出 tokens
        const outputTokens = chatService.countStreamTokens(allChunks);
        
        // 异步记录使用量和计费
        billingService.recordUsage({
          userId: request.apiKey!.userId,
          apiKeyId: request.apiKey!.id,
          modelId: model,
          channelId: channel.id,
          inputTokens: estimatedInputTokens,
          outputTokens: outputTokens,
        }).catch(err => {
          request.log.error('Failed to record usage:', err);
        });

        return reply;
      }

      // 非流式响应
      const completion = await chatService.createChatCompletion(
        channel,
        model,
        messages,
        options
      );

      // 记录使用量和计费
      const usage = completion.usage;
      if (usage) {
        await billingService.recordUsage({
          userId: request.apiKey!.userId,
          apiKeyId: request.apiKey!.id,
          modelId: model,
          channelId: channel.id,
          inputTokens: usage.prompt_tokens,
          outputTokens: usage.completion_tokens,
        });
      }

      return completion;

    } catch (error: any) {
      request.log.error(error);
      
      // 区分不同类型的错误
      if (error.code === 'context_length_exceeded') {
        return reply.code(400).send({
          error: {
            message: 'This model\'s maximum context length exceeded',
            type: 'invalid_request_error',
            code: 'context_length_exceeded',
          },
        });
      }

      if (error.code === 'rate_limit_exceeded' || error.code === 'RATE_LIMIT_ERROR') {
        return reply.code(429).send({
          error: {
            message: 'Rate limit exceeded. Please try again later.',
            type: 'rate_limit_error',
            code: 'rate_limit_exceeded',
          },
        });
      }

      if (error.message === 'Insufficient balance') {
        return reply.code(402).send({
          error: {
            message: 'Insufficient balance',
            type: 'billing_error',
            code: 'insufficient_balance',
          },
        });
      }

      return reply.code(500).send({
        error: {
          message: 'An error occurred during the request',
          type: 'api_error',
          code: 'internal_error',
        },
      });
    }
  });

  // Embeddings
  app.post('/embeddings', { preHandler: [authenticateApiKey] }, async (request, reply) => {
    return reply.code(501).send({
      error: {
        message: 'Embeddings endpoint coming soon',
        type: 'not_implemented',
        code: 'not_implemented',
      },
    });
  });
}
