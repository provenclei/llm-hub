import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { loginSchema, registerSchema } from '../schemas/chat';
import { authenticateJwt } from '../plugins/auth';

const prisma = new PrismaClient();

export async function authRoutes(app: FastifyInstance) {
  // 用户注册
  app.post('/register', async (request, reply) => {
    const { email, password, name } = registerSchema.parse(request.body);

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return reply.code(409).send({
        error: {
          message: 'Email already registered',
          type: 'conflict_error',
          code: 'email_exists',
        },
      });
    }

    // 创建用户
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        balance: 0,
      },
    });

    // 生成JWT
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  });

  // 用户登录
  app.post('/login', async (request, reply) => {
    const { email, password } = loginSchema.parse(request.body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return reply.code(401).send({
        error: {
          message: 'Invalid email or password',
          type: 'authentication_error',
          code: 'invalid_credentials',
        },
      });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return reply.code(401).send({
        error: {
          message: 'Invalid email or password',
          type: 'authentication_error',
          code: 'invalid_credentials',
        },
      });
    }

    // 生成JWT
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  });

  // 获取当前用户信息
  app.get('/me', { preHandler: [authenticateJwt] }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        balance: true,
        createdAt: true,
      },
    });

    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    return {
      ...user,
      balance: Number(user.balance),
    };
  });
}
