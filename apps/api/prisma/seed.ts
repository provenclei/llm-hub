import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 创建默认模型
  const models = [
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      provider: 'openai',
      pricingInput: 0.01,
      pricingOutput: 0.03,
      contextWindow: 128000,
      features: ['chat', 'vision', 'function-calling'],
    },
    {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'openai',
      pricingInput: 0.03,
      pricingOutput: 0.06,
      contextWindow: 8192,
      features: ['chat', 'function-calling'],
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      provider: 'openai',
      pricingInput: 0.0005,
      pricingOutput: 0.0015,
      contextWindow: 16385,
      features: ['chat', 'function-calling'],
    },
    {
      id: 'claude-3-opus',
      name: 'Claude 3 Opus',
      provider: 'anthropic',
      pricingInput: 0.015,
      pricingOutput: 0.075,
      contextWindow: 200000,
      features: ['chat', 'vision'],
    },
    {
      id: 'claude-3-sonnet',
      name: 'Claude 3 Sonnet',
      provider: 'anthropic',
      pricingInput: 0.003,
      pricingOutput: 0.015,
      contextWindow: 200000,
      features: ['chat', 'vision'],
    },
    {
      id: 'gemini-pro',
      name: 'Gemini Pro',
      provider: 'google',
      pricingInput: 0.00025,
      pricingOutput: 0.0005,
      contextWindow: 1000000,
      features: ['chat', 'vision'],
    },
    {
      id: 'ernie-bot',
      name: '文心一言',
      provider: 'baidu',
      pricingInput: 0.0017, // 约¥0.012/1K
      pricingOutput: 0.0017,
      contextWindow: 8000,
      features: ['chat'],
    },
    {
      id: 'qwen-turbo',
      name: '通义千问 Turbo',
      provider: 'alibaba',
      pricingInput: 0.0003, // 约¥0.002/1K
      pricingOutput: 0.0003,
      contextWindow: 8000,
      features: ['chat'],
    },
  ];

  for (const model of models) {
    await prisma.model.upsert({
      where: { id: model.id },
      update: model,
      create: model,
    });
    console.log(`✅ Model created: ${model.name}`);
  }

  // 创建示例渠道（需要手动配置API密钥）
  const channels = [
    {
      name: 'OpenAI Enterprise',
      provider: 'openai',
      type: 'enterprise',
      credentials: { apiKey: 'sk-your-openai-key' },
      supportedModels: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
      priority: 1,
    },
    {
      name: 'Anthropic Claude',
      provider: 'anthropic',
      type: 'enterprise',
      credentials: { apiKey: 'sk-ant-your-anthropic-key' },
      supportedModels: ['claude-3-opus', 'claude-3-sonnet'],
      priority: 2,
    },
  ];

  for (const channel of channels) {
    await prisma.channel.upsert({
      where: { id: `seed-${channel.provider}` },
      update: channel,
      create: {
        id: `seed-${channel.provider}`,
        ...channel,
      },
    });
    console.log(`✅ Channel created: ${channel.name}`);
  }

  console.log('✅ Database seed completed!');
  console.log('⚠️  Please update the channel credentials in the database before using.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
