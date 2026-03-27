import { prisma } from '@llm-hub/database';
import { providerManager, ProviderType } from '@llm-hub/providers';

export async function initializeProviders(): Promise<void> {
  console.log('🔌 Initializing providers...');

  // 从数据库加载所有激活的提供商账号
  const accounts = await prisma.providerAccount.findMany({
    where: { isActive: true },
    include: {
      providerModels: {
        include: { model: true },
      },
    },
  });

  for (const account of accounts) {
    try {
      // 确定提供商类型
      const providerType = account.provider.toLowerCase() as ProviderType;

      // 获取支持的模型列表
      const supportedModels = account.providerModels
        .filter((pm) => pm.isActive)
        .map((pm) => pm.model.modelId);

      // 注册到管理器
      providerManager.registerProvider(
        account.id,
        providerType,
        {
          apiKey: account.apiKey,
          apiSecret: account.apiSecret || undefined,
          baseUrl: account.baseUrl || undefined,
        },
        {
          weight: account.weight,
          priority: account.priority,
          supportedModels,
        }
      );

      console.log(`✅ Registered provider: ${account.name} (${account.provider})`);
    } catch (error) {
      console.error(`❌ Failed to register provider ${account.name}:`, error);
    }
  }

  console.log(`🚀 ${accounts.length} providers initialized`);
}
