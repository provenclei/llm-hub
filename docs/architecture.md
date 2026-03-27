# 架构设计文档

## 1. 系统概述

LLM-Hub 是一个大模型API聚合服务平台，通过统一接口提供多模型调用能力，采用批量采购+转售的商业模式。

## 2. 核心模块

### 2.1 API Gateway
- **职责**: 请求入口、认证鉴权、限流控制
- **技术栈**: Node.js + Fastify
- **关键功能**:
  - API Key验证
  - 请求签名验证
  - IP白名单
  - 速率限制（基于Redis）
  - 请求日志记录

### 2.2 模型路由服务 (Model Router)
- **职责**: 智能选择最优模型渠道
- **路由策略**:
  - 优先级路由（按成本、延迟）
  - 负载均衡（轮询、加权）
  - 故障转移
  - 地域就近

### 2.3 计费服务 (Billing Service)
- **职责**: Token计费、套餐管理、账单生成
- **计费规则**:
  - 实时Token消耗计算
  - 套餐余量扣除
  - 欠费熔断
  - 账单周期生成

### 2.4 上游适配层
- **职责**: 对接各模型提供商
- **适配器模式**:
  ```
  interface ModelAdapter {
    chat(request: ChatRequest): Promise<ChatResponse>;
    embeddings(request: EmbeddingRequest): Promise<EmbeddingResponse>;
    checkHealth(): Promise<HealthStatus>;
  }
  ```

## 3. 数据流

```
用户请求 → API Gateway → 认证鉴权 → 计费检查
                                    ↓
                              模型路由服务
                                    ↓
                              上游适配器
                                    ↓
                              模型提供商
                                    ↓
                              响应处理 ← Token计算
                                    ↓
                              用户响应
```

## 4. 数据库设计

### 4.1 核心表结构

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- API Key表
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  key_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  permissions JSONB DEFAULT '[]',
  rate_limit JSONB,
  expires_at TIMESTAMP,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 模型配置表
CREATE TABLE models (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  pricing_input DECIMAL(10,8) NOT NULL,
  pricing_output DECIMAL(10,8) NOT NULL,
  context_window INTEGER,
  features JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'active'
);

-- 上游渠道表
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  credentials JSONB NOT NULL,
  rate_limit JSONB,
  priority INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'active'
);

-- Token消耗记录表
CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  api_key_id UUID REFERENCES api_keys(id),
  model_id VARCHAR(100) REFERENCES models(id),
  channel_id UUID REFERENCES channels(id),
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cost DECIMAL(10,8) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 账单表
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_tokens INTEGER NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 5. 部署架构

### 5.1 Docker Compose 开发环境
```yaml
version: '3.8'
services:
  api:
    build: ./apps/api
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/llmhub
      - REDIS_URL=redis://redis:6379
  
  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
```

### 5.2 生产环境 (K8s)
- 多副本部署保证高可用
- HPA自动扩缩容
- Ingress负载均衡
- 数据库主从复制

## 6. 安全设计

### 6.1 API安全
- API Key使用bcrypt哈希存储
- 请求签名验证（可选HMAC）
- HTTPS强制
- CORS限制

### 6.2 数据安全
- 数据库连接加密
- 敏感配置使用Secret管理
- 日志脱敏处理
- 定期备份

### 6.3 内容安全
- 敏感词过滤
- 请求内容审计
- 异常行为检测
