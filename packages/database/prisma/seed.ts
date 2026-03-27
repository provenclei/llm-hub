import { prisma, ProviderType } from '../src';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. 创建管理员账户
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@llm-hub.com' },
    update: {},
    create: {
      email: 'admin@llm-hub.com',
      password: adminPassword,
      name: 'Administrator',
      role: 'SUPER_ADMIN',
      balance: 10000,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // 2. 创建测试用户
  const userPassword = await bcrypt.hash('user123', 10);
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: userPassword,
      name: 'Test User',
      role: 'USER',
      balance: 100,
    },
  });
  console.log('✅ Test user created:', testUser.email);

  // 3. 初始化模型列表
  const models = [
    // OpenAI
    {
      provider: ProviderType.OPENAI,
      modelId: 'gpt-4o',
      name: 'GPT-4o',
      description: 'OpenAI 最新多模态模型',
      pricePer1kInput: 0.035,
      pricePer1kOutput: 0.105,
      contextWindow: 128000,
      maxTokens: 4096,
      supportsVision: true,
      supportsTools: true,
    },
    {
      provider: ProviderType.OPENAI,
      modelId: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      description: '轻量级高性价比模型',
      pricePer1kInput: 0.0035,
      pricePer1kOutput: 0.0105,
      contextWindow: 128000,
      maxTokens: 4096,
      supportsVision: true,
      supportsTools: true,
    },
    {
      provider: ProviderType.OPENAI,
      modelId: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      description: '高性能模型',
      pricePer1kInput: 0.07,
      pricePer1kOutput: 0.21,
      contextWindow: 128000,
      maxTokens: 4096,
      supportsVision: true,
      supportsTools: true,
    },
    {
      provider: ProviderType.OPENAI,
      modelId: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      description: '快速经济模型',
      pricePer1kInput: 0.0035,
      pricePer1kOutput: 0.0105,
      contextWindow: 16385,
      maxTokens: 4096,
      supportsVision: false,
      supportsTools: true,
    },
    // Anthropic
    {
      provider: ProviderType.ANTHROPIC,
      modelId: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      description: 'Anthropic 最新模型',
      pricePer1kInput: 0.021,
      pricePer1kOutput: 0.063,
      contextWindow: 200000,
      maxTokens: 8192,
      supportsVision: true,
      supportsTools: true,
    },
    {
      provider: ProviderType.ANTHROPIC,
      modelId: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      description: '最强大的 Claude 模型',
      pricePer1kInput: 0.105,
      pricePer1kOutput: 0.525,
      contextWindow: 200000,
      maxTokens: 4096,
      supportsVision: true,
      supportsTools: true,
    },
    // Google
    {
      provider: ProviderType.GOOGLE,
      modelId: 'gemini-pro',
      name: 'Gemini Pro',
      description: 'Google 多模态模型',
      pricePer1kInput: 0.007,
      pricePer1kOutput: 0.021,
      contextWindow: 1000000,
      maxTokens: 8192,
      supportsVision: true,
      supportsTools: true,
    },
    // 阿里通义千问
    {
      provider: ProviderType.ALIBABA,
      modelId: 'qwen-max',
      name: '通义千问 Max',
      description: '阿里最强模型',
      pricePer1kInput: 0.028,
      pricePer1kOutput: 0.084,
      contextWindow: 32000,
      maxTokens: 8192,
      supportsVision: false,
      supportsTools: true,
    },
    {
      provider: ProviderType.ALIBABA,
      modelId: 'qwen-plus',
      name: '通义千问 Plus',
      description: '平衡型模型',
      pricePer1kInput: 0.014,
      pricePer1kOutput: 0.042,
      contextWindow: 32000,
      maxTokens: 8192,
      supportsVision: false,
      supportsTools: true,
    },
    // Moonshot Kimi
    {
      provider: ProviderType.MOONSHOT,
      modelId: 'moonshot-v1-8k',
      name: 'Kimi 8K',
      description: '长文本模型',
      pricePer1kInput: 0.006,
      pricePer1kOutput: 0.006,
      contextWindow: 8192,
      maxTokens: 4096,
      supportsVision: false,
      supportsTools: true,
    },
    {
      provider: ProviderType.MOONSHOT,
      modelId: 'moonshot-v1-128k',
      name: 'Kimi 128K',
      description: '超长文本模型',
      pricePer1kInput: 0.03,
      pricePer1kOutput: 0.03,
      contextWindow: 128000,
      maxTokens: 4096,
      supportsVision: false,
      supportsTools: true,
    },
    // 智谱
    {
      provider: ProviderType.ZHIPU,
      modelId: 'glm-4',
      name: 'GLM-4',
      description: '智谱最新模型',
      pricePer1kInput: 0.014,
      pricePer1kOutput: 0.014,
      contextWindow: 128000,
      maxTokens: 4096,
      supportsVision: true,
      supportsTools: true,
    },
  ];

  for (const model of models) {
    await prisma.model.upsert({
      where: {
        provider_modelId: {
          provider: model.provider,
          modelId: model.modelId,
        },
      },
      update: {},
      create: model as any,
    });
  }
  console.log(`✅ ${models.length} models seeded`);

  // 4. 系统配置
  const configs = [
    { key: 'site_name', value: 'LLM Hub', description: '站点名称' },
    { key: 'site_description', value: '大模型API中转站', description: '站点描述' },
    { key: 'default_rate_limit', value: '60', description: '默认每分钟请求限制' },
    { key: 'maintenance_mode', value: 'false', description: '维护模式' },
  ];

  for (const config of configs) {
    await prisma.config.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }
  console.log('✅ System configs seeded');

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
