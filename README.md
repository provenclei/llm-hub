# LLM-Hub 大模型调用服务平台

[![GitHub stars](https://img.shields.io/github/stars/provenclei/llm-hub?style=social)](https://github.com/provenclei/llm-hub)
[![License](https://img.shields.io/github/license/provenclei/llm-hub)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)

> 🚀 一站式大模型API聚合服务平台，对接全球主流大模型，提供统一接口、智能路由、按量计费服务。
> 
> **全新**: 现已支持完整的前端界面，包括用户门户和管理后台！

---

## 🎨 界面展示

### 登录页面
简洁优雅的登录界面，支持用户和管理员登录。

![登录页面](https://via.placeholder.com/800x500/667eea/ffffff?text=LLM+Hub+Login+Page)

### 用户仪表板
完整的用户管理界面，展示账户余额、API Keys、使用统计。

![用户仪表板](https://via.placeholder.com/800x500/f3f4f6/1f2937?text=User+Dashboard)

### API Keys 管理
轻松创建、查看和撤销 API Keys。

![API Keys](https://via.placeholder.com/800x500/f3f4f6/1f2937?text=API+Keys+Management)

### 管理后台
管理员专用后台，实时监控系统运行状态。

![管理后台](https://via.placeholder.com/800x500/f3f4f6/1f2937?text=Admin+Dashboard)

> 💡 **在线预览**: [查看完整界面展示](./screenshots/index.html)

---

## ✨ 核心特性

### 后端服务
- 🤖 **多模型支持**：OpenAI、Anthropic Claude、Google Gemini、Azure OpenAI、百度文心、阿里通义、字节豆包等
- 🔌 **统一接口**：OpenAI兼容格式，一行代码切换模型
- 💰 **灵活计费**：按Token计费，支持预付费套餐和按量付费
- 🚀 **智能路由**：根据模型可用性、延迟、成本自动选择最优节点
- 📊 **实时监控**：请求量、Token消耗、成本分析、用户行为分析
- 🔐 **安全可靠**：API Key管理、请求限流、IP白名单、敏感词过滤
- 🌍 **高可用架构**：多节点部署、自动故障转移、负载均衡

### 前端界面 🆕
- 💻 **现代化UI**：基于 Next.js 14 + React + TypeScript
- 🎨 **精美设计**：使用 Tailwind CSS，响应式布局
- 📱 **多端适配**：支持桌面、平板、手机访问
- ⚡ **高性能**：SSR 服务端渲染，快速加载
- 🔒 **安全认证**：JWT Token 认证，自动刷新
- 📊 **数据可视化**：实时展示统计数据和图表
- 🌙 **主题支持**：亮色/暗色模式（即将支持）

---

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              前端层 (Frontend)                            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Next.js 14 (React + TypeScript)                                  │  │
│  │  ├── 用户门户 (User Portal)       ├── 管理后台 (Admin Dashboard)  │  │
│  │  ├── Tailwind CSS                 ├── Radix UI Components         │  │
│  │  ├── Zustand State Management     ├── Axios HTTP Client           │  │
│  │  └── Responsive Design            └── JWT Authentication          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │ HTTP/REST
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              接入层 (Gateway)                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  API Key    │  │  限流控制    │  │  负载均衡    │  │   SSL/TLS       │  │
│  │  认证中间件  │  │  Rate Limit │  │  Load Balancer│  │   加密传输       │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              业务服务层                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   用户服务   │  │   模型服务   │  │   计费服务   │  │    监控服务      │  │
│  │   User      │  │   Model     │  │   Billing   │  │   Monitoring    │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   请求路由   │  │   缓存服务   │  │   日志服务   │  │    告警服务      │  │
│  │   Router    │  │   Cache     │  │   Logging   │  │   Alerting      │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              模型适配层                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
│  │  OpenAI  │ │  Claude  │ │  Gemini  │ │ Azure    │ │   国产模型      │  │
│  │  Adapter │ │  Adapter │ │  Adapter │ │ Adapter  │ │   Adapters     │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              数据存储层                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  PostgreSQL │  │    Redis    │  │ ClickHouse  │  │     MinIO       │  │
│  │  主数据库    │  │   缓存队列   │  │  分析数据库  │  │   文件存储       │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 项目结构

```
llm-hub/
├── 📁 apps/
│   ├── api/                    # 主API服务 (Fastify + TypeScript)
│   └── web/                    # 前端应用 (Next.js 14)
│       ├── app/               # Next.js App Router
│       │   ├── login/        # 登录页面
│       │   ├── dashboard/    # 用户仪表板
│       │   └── admin/        # 管理后台
│       ├── components/       # React 组件
│       │   └── ui/          # UI 基础组件
│       ├── lib/             # 工具函数
│       │   ├── api.ts       # API 客户端
│       │   └── utils.ts     # 工具函数
│       └── store/           # 状态管理 (Zustand)
├── 📁 packages/
│   ├── database/              # Prisma 数据库模型
│   └── providers/             # 模型提供商适配器
├── 📁 screenshots/            # 界面截图展示
├── 📁 docs/                   # 文档
└── docker-compose.yml         # Docker 部署配置
```

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 6.0
- Docker (可选)

### 1. 克隆项目

```bash
git clone https://github.com/provenclei/llm-hub.git
cd llm-hub
```

### 2. 启动后端服务

```bash
# 方式一：Docker 一键启动
docker-compose up -d

# 方式二：手动启动
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接和API密钥

# 数据库迁移
npm run db:migrate
npm run db:seed

# 启动开发服务
npm run dev
```

后端服务将运行在 http://localhost:3000

### 3. 启动前端界面

```bash
# 进入前端目录
cd apps/web

# 安装依赖
npm install

# 开发模式启动
npm run dev
```

前端服务将运行在 http://localhost:3001

### 4. 访问应用

- **前端界面**: http://localhost:3001
- **后端 API**: http://localhost:3000
- **API 文档**: http://localhost:3000/documentation

---

## 📖 API 文档

### 统一接口格式

所有模型使用 OpenAI 兼容的 API 格式：

```bash
curl https://api.llm-hub.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4-turbo",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### 主要接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/auth/login` | POST | 用户登录 |
| `/auth/register` | POST | 用户注册 |
| `/auth/me` | GET | 获取当前用户 |
| `/chat/completions` | POST | 聊天补全 |
| `/models` | GET | 获取模型列表 |
| `/users/api-keys` | GET/POST | API Key 管理 |
| `/users/usage` | GET | 使用统计 |
| `/billing/balance` | GET | 账户余额 |
| `/admin/stats` | GET | 系统统计 (Admin) |

### 模型列表

| 模型ID | 提供商 | 输入价格 | 输出价格 | 上下文长度 |
|--------|--------|----------|----------|------------|
| gpt-4-turbo | OpenAI | ¥0.07/1K | ¥0.21/1K | 128K |
| gpt-3.5-turbo | OpenAI | ¥0.0035/1K | ¥0.0105/1K | 16K |
| claude-3-opus | Anthropic | ¥0.105/1K | ¥0.525/1K | 200K |
| claude-3-sonnet | Anthropic | ¥0.021/1K | ¥0.063/1K | 200K |
| qwen-max | 阿里 | ¥0.028/1K | ¥0.084/1K | 32K |
| moonshot-v1-128k | Moonshot | ¥0.03/1K | ¥0.03/1K | 128K |

---

## 💰 定价策略

### Token计费规则

```typescript
// 计费公式
const cost = (inputTokens * inputPrice + outputTokens * outputPrice) * markupRate;

// 示例：GPT-4调用
// 输入: 1000 tokens, 输出: 500 tokens
// 平台采购价: ¥0.07/1K输入, ¥0.21/1K输出
// 加价率: 1.5倍
cost = (1000 * 0.07/1000 + 500 * 0.21/1000) * 1.5 = ¥0.2625
```

### 套餐设计

| 套餐名称 | 月费 | Token额度 | 单价折扣 | 适合人群 |
|----------|------|-----------|----------|----------|
| 体验版 | ¥0 | 10万 | 原价 | 个人开发者体验 |
| 开发者版 | ¥99 | 200万 | 9折 | 个人开发者 |
| 团队版 | ¥499 | 1000万 | 8折 | 小型团队 |
| 企业版 | ¥1999 | 5000万 | 7折 | 中型企业 |
| 定制版 | 联系销售 | 无限 | 面议 | 大型企业 |

---

## 🛠️ 技术栈

### 后端
- **框架**: Fastify + TypeScript
- **数据库**: PostgreSQL + Prisma ORM
- **缓存**: Redis
- **文档**: Swagger/OpenAPI

### 前端
- **框架**: Next.js 14 + React 18 + TypeScript
- **样式**: Tailwind CSS
- **组件**: Radix UI
- **状态**: Zustand
- **HTTP**: Axios
- **图标**: Lucide React

### 部署
- **容器**: Docker + Docker Compose
- **代理**: Nginx
- **CI/CD**: GitHub Actions

---

## 📊 运营指标

关键指标监控面板：

```
┌──────────────────────────────────────────────────────────────┐
│                     今日运营数据                              │
├──────────────────────────────────────────────────────────────┤
│  💰 收入: ¥12,450 (+23%)    📊 Token消耗: 45.2M (+15%)      │
│  👥 活跃用户: 234 (+5%)     🔗 API请求: 1.2M (+18%)          │
│  🎯 转化率: 12.5%           💸 毛利率: 35.2%                 │
├──────────────────────────────────────────────────────────────┤
│                     模型使用分布                              │
│  GPT-4      ████████████████████████████████  45%           │
│  Claude-3   ██████████████████████            28%           │
│  GPT-3.5    ████████████                      15%           │
│  其他        ████████                         12%           │
└──────────────────────────────────────────────────────────────┘
```

---

## 🤝 贡献指南

我们欢迎各种形式的贡献！

1. **Fork** 项目
2. 创建 **Feature Branch** (`git checkout -b feature/amazing-feature`)
3. **Commit** 更改 (`git commit -m 'Add amazing feature'`)
4. **Push** 到分支 (`git push origin feature/amazing-feature`)
5. 创建 **Pull Request**

### 开发规范

- 使用 TypeScript 编写代码
- 遵循 ESLint 和 Prettier 配置
- 提交前运行测试：`npm test`
- 更新相关文档

---

## 📜 开源协议

[MIT](LICENSE) © 2024 LLM-Hub Team

---

## 🔗 相关链接

- 📘 [官方文档](https://docs.llm-hub.com)
- 🌐 [在线演示](https://demo.llm-hub.com)
- 💻 [前端界面展示](./screenshots/index.html)
- 🐛 [问题反馈](https://github.com/provenclei/llm-hub/issues)
- 💬 [Discord社区](https://discord.gg/llm-hub)

---

## 🙏 鸣谢

感谢所有为这个项目做出贡献的开发者！

---

> ⚠️ **免责声明**: 本项目仅供学习和研究使用。使用大模型API请遵守相关服务条款和当地法律法规。
