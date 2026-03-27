# LLM Hub API 文档

本文档详细说明 LLM Hub 平台的所有 API 接口。

## 基础信息

- **API Base URL**: `https://api.llm-hub.com/v1`
- **认证方式**: Bearer Token (API Key)
- **数据格式**: JSON

## 认证

所有 API 请求（除了登录/注册）都需要在请求头中提供 API Key：

```
Authorization: Bearer sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 错误处理

错误响应遵循 OpenAI 兼容格式：

```json
{
  "error": {
    "message": "错误描述",
    "type": "error_type",
    "code": "error_code"
  }
}
```

常见错误码：

| HTTP Code | 类型 | 说明 |
|-----------|------|------|
| 400 | invalid_request | 请求参数错误 |
| 401 | authentication_error | 认证失败 |
| 402 | insufficient_balance | 余额不足 |
| 403 | authorization_error | 权限不足 |
| 404 | not_found | 资源不存在 |
| 429 | rate_limit_error | 请求频率超限 |
| 500 | internal_error | 服务器内部错误 |
| 503 | service_unavailable | 服务不可用 |

---

## 聊天补全

### POST /v1/chat/completions

创建聊天补全，与 OpenAI API 完全兼容。

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| model | string | 是 | 模型ID |
| messages | array | 是 | 消息列表 |
| temperature | number | 否 | 采样温度 (0-2)，默认1 |
| top_p | number | 否 | 核采样，默认1 |
| max_tokens | integer | 否 | 最大生成token数 |
| stream | boolean | 否 | 是否流式输出 |
| tools | array | 否 | 可用工具列表 |
| tool_choice | string/object | 否 | 工具选择策略 |

**请求示例：**

```bash
curl https://api.llm-hub.com/v1/chat/completions \
  -H "Authorization: Bearer $LLM_HUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "system", "content": "你是一个 helpful assistant."},
      {"role": "user", "content": "Hello!"}
    ],
    "temperature": 0.7
  }'
```

**响应示例：**

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-4o",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I assist you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 10,
    "total_tokens": 35
  },
  "system_fingerprint": "fp_44709d6fcb"
}
```

### 流式响应

设置 `stream: true` 获取 SSE 流式响应：

```bash
curl https://api.llm-hub.com/v1/chat/completions \
  -H "Authorization: Bearer $LLM_HUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }'
```

响应格式：
```
data: {"id":"...","object":"chat.completion.chunk",...}

data: {"id":"...","object":"chat.completion.chunk",...}

data: [DONE]
```

---

## 模型管理

### GET /v1/models

获取所有可用模型列表。

**响应示例：**

```json
{
  "object": "list",
  "data": [
    {
      "id": "gpt-4o",
      "object": "model",
      "created": 1677610602,
      "owned_by": "llm-hub",
      "metadata": {
        "name": "GPT-4o",
        "description": "OpenAI 最新多模态模型",
        "context_window": 128000,
        "supports_chat": true,
        "supports_streaming": true,
        "supports_vision": true
      }
    }
  ]
}
```

### GET /v1/models/pricing/all

获取所有模型的定价信息。

**响应示例：**

```json
{
  "currency": "CNY",
  "models": [
    {
      "id": "gpt-4o",
      "name": "GPT-4o",
      "input_price_per_1k": 0.035,
      "output_price_per_1k": 0.105,
      "context_window": 128000
    }
  ]
}
```

---

## 用户管理

### GET /v1/user/me

获取当前用户信息。

**响应示例：**

```json
{
  "id": "usr_abc123",
  "email": "user@example.com",
  "name": "Test User",
  "role": "USER",
  "balance": 100.50,
  "quota": {
    "requests_per_min": 60,
    "tokens_per_min": 100000
  },
  "created_at": "2024-01-01T00:00:00Z"
}
```

### GET /v1/user/balance

获取当前余额。

**响应示例：**

```json
{
  "balance": 100.50,
  "currency": "CNY"
}
```

### GET /v1/user/usage

获取使用统计。

**查询参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| days | integer | 统计天数，默认30 |

**响应示例：**

```json
{
  "summary": {
    "total_requests": 1523,
    "total_input_tokens": 456789,
    "total_output_tokens": 234567,
    "total_tokens": 691356,
    "total_cost": 45.67
  },
  "daily": [
    {
      "date": "2024-03-20",
      "input_tokens": 15000,
      "output_tokens": 8000,
      "cost": 1.23,
      "requests": 45
    }
  ],
  "by_model": [
    {
      "model_id": "gpt-4o",
      "requests": 800,
      "tokens": 400000,
      "cost": 30.00
    }
  ]
}
```

---

## API Key 管理

### GET /v1/user/api-keys

获取所有 API Keys。

### POST /v1/user/api-keys

创建新的 API Key。

**请求参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| name | string | API Key 名称 |
| permissions | array | 权限列表 (CHAT, COMPLETIONS, EMBEDDINGS, IMAGES) |
| allowed_models | array | 允许访问的模型ID列表 |

**响应示例：**

```json
{
  "id": "key_abc123",
  "name": "Production Key",
  "prefix": "sk-abc123def",
  "api_key": "sk-abc123def456ghi789jkl...",
  "permissions": ["CHAT"],
  "warning": "Please save this API key. It will not be shown again."
}
```

⚠️ **注意**：`api_key` 只在创建时返回一次，请务必保存。

### DELETE /v1/user/api-keys/:id

撤销 API Key。

---

## 交易记录

### GET /v1/user/transactions

获取充值/消费记录。

**查询参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| page | integer | 页码，默认1 |
| limit | integer | 每页数量，默认20 |

**响应示例：**

```json
{
  "data": [
    {
      "id": "txn_abc123",
      "type": "CONSUMPTION",
      "amount": -0.035,
      "currency": "CNY",
      "balance_after": 99.965,
      "description": "API调用: GPT-4o (1000 + 500 tokens)",
      "created_at": "2024-03-20T10:30:00Z"
    },
    {
      "id": "txn_def456",
      "type": "RECHARGE",
      "amount": 100,
      "currency": "CNY",
      "balance_after": 100,
      "description": "充值: 100 CNY",
      "created_at": "2024-03-19T15:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "total_pages": 3
  }
}
```

---

## 管理员接口

以下接口需要管理员权限。

### GET /v1/admin/stats

获取系统统计信息。

### GET /v1/admin/users

获取用户列表。

### POST /v1/admin/users/:id/balance

为用户充值。

**请求参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| amount | number | 充值金额 |
| reason | string | 充值原因 |

### GET /v1/admin/providers

获取所有渠道商账号。

### POST /v1/admin/providers

添加渠道商账号。

**请求参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| provider | enum | 厂商类型 |
| name | string | 账号名称 |
| api_key | string | API Key |
| cost_per_1k_input | number | 输入成本/1k tokens |
| cost_per_1k_output | number | 输出成本/1k tokens |
| priority | number | 优先级 |
| weight | number | 负载权重 |

### GET /v1/admin/models

获取所有模型配置。

### POST /v1/admin/models

添加模型配置。

**请求参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| provider | enum | 厂商类型 |
| model_id | string | 厂商原始模型ID |
| name | string | 显示名称 |
| price_per_1k_input | number | 输入价格/1k tokens |
| price_per_1k_output | number | 输出价格/1k tokens |
| context_window | number | 上下文窗口大小 |

---

## 支持的模型

### OpenAI

| 模型ID | 说明 | 上下文 | 价格(输入/输出) |
|--------|------|--------|-----------------|
| gpt-4o | 最新多模态模型 | 128K | ¥0.035/¥0.105 |
| gpt-4o-mini | 轻量级模型 | 128K | ¥0.0035/¥0.0105 |
| gpt-4-turbo | 高性能模型 | 128K | ¥0.07/¥0.21 |
| gpt-3.5-turbo | 快速经济模型 | 16K | ¥0.0035/¥0.0105 |

### Anthropic

| 模型ID | 说明 | 上下文 | 价格(输入/输出) |
|--------|------|--------|-----------------|
| claude-3-5-sonnet-20241022 | Claude 3.5 Sonnet | 200K | ¥0.021/¥0.063 |
| claude-3-opus-20240229 | Claude 3 Opus | 200K | ¥0.105/¥0.525 |

### 国产模型

| 模型ID | 厂商 | 上下文 | 价格(输入/输出) |
|--------|------|--------|-----------------|
| qwen-max | 阿里 | 32K | ¥0.028/¥0.084 |
| moonshot-v1-128k | Moonshot | 128K | ¥0.03/¥0.03 |
| glm-4 | 智谱 | 128K | ¥0.014/¥0.014 |

---

## SDK 示例

### Python

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.llm-hub.com/v1",
    api_key="your-api-key"
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "user", "content": "Hello!"}
    ]
)

print(response.choices[0].message.content)
```

### JavaScript

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://api.llm-hub.com/v1',
  apiKey: 'your-api-key',
});

const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }],
});

console.log(response.choices[0].message.content);
```

### cURL

```bash
curl https://api.llm-hub.com/v1/chat/completions \
  -H "Authorization: Bearer $LLM_HUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

---

## 计费说明

### Token 计算

- **输入 Token**: 包括 system message、user message、tools 定义
- **输出 Token**: 模型生成的内容
- **计费公式**: `费用 = (input_tokens / 1000 × input_price) + (output_tokens / 1000 × output_price)`

### 计费精度

- 精确到小数点后 6 位
- 最小计费单位：0.000001 CNY

### 余额预警

- 余额低于 10 元时发送预警
- 余额为 0 时自动暂停 API 调用

---

## 速率限制

| 等级 | 请求/分钟 | Token/分钟 | 请求/天 |
|------|-----------|------------|---------|
| 免费 | 20 | 20,000 | 500 |
| 标准 | 60 | 100,000 | 10,000 |
| 专业 | 300 | 500,000 | 100,000 |
| 企业 | 定制 | 定制 | 无限制 |

---

## 技术支持

- **文档**: https://docs.llm-hub.com
- **邮箱**: support@llm-hub.com
- **社区**: https://discord.gg/llmhub
