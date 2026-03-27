# LLM-Hub 大模型调用服务平台

[![GitHub stars](https://img.shields.io/github/stars/tenglei/llm-hub?style=social)](https://github.com/tenglei/llm-hub)
[![License](https://img.shields.io/github/license/tenglei/llm-hub)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

> 🚀 一站式大模型API聚合服务平台，对接全球主流大模型，提供统一接口、智能路由、按量计费服务。

## ✨ 核心特性

- 🤖 **多模型支持**：OpenAI、Anthropic Claude、Google Gemini、Azure OpenAI、百度文心、阿里通义、字节豆包等
- 🔌 **统一接口**：OpenAI兼容格式，一行代码切换模型
- 💰 **灵活计费**：按Token计费，支持预付费套餐和按量付费
- 🚀 **智能路由**：根据模型可用性、延迟、成本自动选择最优节点
- 📊 **实时监控**：请求量、Token消耗、成本分析、用户行为分析
- 🔐 **安全可靠**：API Key管理、请求限流、IP白名单、敏感词过滤
- 🌍 **高可用架构**：多节点部署、自动故障转移、负载均衡

## 📦 商业模式

```
┌─────────────────────────────────────────────────────────────┐
│                    LLM-Hub 商业模式                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   上游采购                    平台层                      终端用户  │
│   ────────                   ──────                      ──────  │
│                                                             │
│  ┌──────────┐              ┌──────────┐              ┌──────────┐│
│  │ OpenAI   │──────────────│          │──────────────│ 开发者A  ││
│  │ 企业账号 │   批量采购    │          │   按Token    │  100万   ││
│  │ $0.002/K │              │          │   转售       │  $0.003/K││
│  └──────────┘              │          │              └──────────┘│
│                            │  LLM-Hub │                         │
│  ┌──────────┐              │  聚合平台 │              ┌──────────┐│
│  │ Claude   │──────────────│          │──────────────│ 开发者B  ││
│  │ 企业套餐 │   批发价      │          │   套餐销售   │  50万    ││
│  │ $0.008/M │              │          │   $0.012/M   └──────────┘│
│  └──────────┘              │          │                         │
│                            │          │              ┌──────────┐│
│  ┌──────────┐              │          │──────────────│ 企业客户 ││
│  │ 国产模型  │──────────────│          │              │  定制   ││
│  │ 代理协议  │              │          │              └──────────┘│
│  └──────────┘              └──────────┘                         │
│                                                             │
│  利润率: 20%-50% (取决于批量采购折扣和终端定价策略)               │
└─────────────────────────────────────────────────────────────┘
```

## 🏗️ 技术架构

```
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

## 📁 项目结构

```
llm-hub/
├── 📁 apps/
│   ├── api/                    # 主API服务
│   ├── admin/                  # 管理后台 (Next.js)
│   └── web/                    # 用户门户 (Next.js)
├── 📁 packages/
│   ├── shared/                 # 共享类型和工具
│   ├── sdk/                    # 客户端SDK
│   └── ui/                     # 共享UI组件
├── 📁 services/
│   ├── gateway/                # API网关服务
│   ├── model-router/           # 模型路由服务
│   ├── billing/                # 计费服务
│   └── analytics/              # 数据分析服务
├── 📁 adapters/                # 模型适配器
│   ├── openai/
│   ├── anthropic/
│   ├── google/
│   └── domestic/               # 国产模型适配器
├── 📁 infrastructure/
│   ├── docker/                 # Docker配置
│   ├── k8s/                    # Kubernetes配置
│   └── terraform/              # 基础设施即代码
├── 📁 docs/                    # 文档
└── 📁 scripts/                 # 部署脚本
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 6.0
- Docker (可选)

### 安装部署

```bash
# 1. 克隆项目
git clone https://github.com/tenglei/llm-hub.git
cd llm-hub

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接和API密钥

# 4. 数据库迁移
pnpm db:migrate

# 5. 启动开发服务
pnpm dev
```

### Docker 一键部署

```bash
# 使用 Docker Compose 部署完整环境
docker-compose up -d

# 服务将运行在:
# - API Gateway: http://localhost:3000
# - Admin Panel: http://localhost:3001
# - User Portal: http://localhost:3002
```

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

### 模型列表

| 模型ID | 提供商 | 输入价格 | 输出价格 | 上下文长度 |
|--------|--------|----------|----------|------------|
| gpt-4-turbo | OpenAI | $0.01/1K | $0.03/1K | 128K |
| gpt-3.5-turbo | OpenAI | $0.0005/1K | $0.0015/1K | 16K |
| claude-3-opus | Anthropic | $0.015/1K | $0.075/1K | 200K |
| claude-3-sonnet | Anthropic | $0.003/1K | $0.015/1K | 200K |
| gemini-pro | Google | $0.00025/1K | $0.0005/1K | 1M |
| ernie-bot | 百度 | ¥0.012/1K | ¥0.012/1K | 8K |
| qwen-turbo | 阿里 | ¥0.002/1K | ¥0.002/1K | 8K |

完整API文档请访问: [https://docs.llm-hub.com](https://docs.llm-hub.com)

## 💰 定价策略

### Token计费规则

```typescript
// 计费公式
const cost = (inputTokens * inputPrice + outputTokens * outputPrice) * markupRate;

// 示例：GPT-4调用
// 输入: 1000 tokens, 输出: 500 tokens
// 平台采购价: $0.01/1K输入, $0.03/1K输出
// 加价率: 1.5倍
cost = (1000 * 0.01/1000 + 500 * 0.03/1000) * 1.5 = $0.0375
```

### 套餐设计

| 套餐名称 | 月费 | Token额度 | 单价折扣 | 适合人群 |
|----------|------|-----------|----------|----------|
| 体验版 | ¥0 | 10万 | 原价 | 个人开发者体验 |
| 开发者版 | ¥99 | 200万 | 9折 | 个人开发者 |
| 团队版 | ¥499 | 1000万 | 8折 | 小型团队 |
| 企业版 | ¥1999 | 5000万 | 7折 | 中型企业 |
| 定制版 | 联系销售 | 无限 | 面议 | 大型企业 |

## 🔧 配置指南

### 添加新模型

```typescript
// config/models.ts
export const models: ModelConfig[] = [
  {
    id: 'custom-model',
    name: 'Custom Model',
    provider: 'custom-provider',
    adapter: 'openai',  // 使用 OpenAI 兼容适配器
    pricing: {
      input: 0.001,     // $/1K tokens
      output: 0.002,
    },
    contextWindow: 32000,
    features: ['chat', 'function-calling'],
    credentials: {
      apiKey: process.env.CUSTOM_PROVIDER_KEY,
      baseUrl: process.env.CUSTOM_PROVIDER_URL,
    },
  },
];
```

### 上游渠道配置

```typescript
// config/channels.ts
export const channels: ChannelConfig[] = [
  {
    id: 'openai-enterprise',
    provider: 'openai',
    type: 'enterprise',  // enterprise / reseller / proxy
    credentials: {
      apiKey: process.env.OPENAI_ENTERPRISE_KEY,
      organization: process.env.OPENAI_ORG_ID,
    },
    rateLimit: {
      rpm: 10000,        // requests per minute
      tpm: 2000000,      // tokens per minute
    },
    cost: {
      input: 0.008,      // 批量采购价
      output: 0.024,
    },
    priority: 1,         // 优先级，数字越小优先级越高
  },
];
```

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

## 🤝 贡献指南

我们欢迎各种形式的贡献！

1. **Fork** 项目
2. 创建 **Feature Branch** (`git checkout -b feature/amazing-feature`)
3. **Commit** 更改 (`git commit -m 'Add amazing feature'`)
4. **Push** 到分支 (`git push origin feature/amazing-feature`)
5. 创建 **Pull Request**

## 📜 开源协议

[MIT](LICENSE) © 2024 LLM-Hub Team

## 🔗 相关链接

- 📘 [官方文档](https://docs.llm-hub.com)
- 🌐 [在线演示](https://demo.llm-hub.com)
- 💬 [Discord社区](https://discord.gg/llm-hub)
- 🐦 [Twitter](https://twitter.com/llm_hub)

---

> ⚠️ **免责声明**: 本项目仅供学习和研究使用。使用大模型API请遵守相关服务条款和当地法律法规。
