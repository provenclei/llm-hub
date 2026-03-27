import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function hashApiKey(apiKey: string): Promise<string> {
  return bcrypt.hash(apiKey, 10);
}

export async function verifyApiKey(apiKey: string): Promise<{
  id: string;
  userId: string;
  permissions: string[];
  rateLimit: any;
} | null> {
  // API Key格式: lh_xxxxxxxxxxxxxxxx
  if (!apiKey.startsWith('lh_')) {
    return null;
  }

  // 查询数据库中的所有活跃API Key
  const keys = await prisma.apiKey.findMany({
    where: {
      status: 'active',
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    select: {
      id: true,
      userId: true,
      keyHash: true,
      permissions: true,
      rateLimit: true,
    },
  });

  // 逐个验证
  for (const key of keys) {
    const isValid = await bcrypt.compare(apiKey, key.keyHash);
    if (isValid) {
      // 更新最后使用时间
      await prisma.apiKey.update({
        where: { id: key.id },
        data: { lastUsedAt: new Date() },
      });

      return {
        id: key.id,
        userId: key.userId,
        permissions: key.permissions as string[],
        rateLimit: key.rateLimit,
      };
    }
  }

  return null;
}

export async function createApiKey(
  userId: string,
  name: string,
  permissions: string[] = ['chat'],
  rateLimit?: any,
  expiresAt?: Date
): Promise<{ key: string; id: string }> {
  // 生成API Key
  const randomBytes = Buffer.from(Math.random().toString()).toString('base64');
  const key = `lh_${randomBytes.replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)}`;
  const keyHash = await hashApiKey(key);

  const record = await prisma.apiKey.create({
    data: {
      userId,
      keyHash,
      name,
      permissions,
      rateLimit,
      expiresAt,
    },
  });

  return { key, id: record.id };
}
