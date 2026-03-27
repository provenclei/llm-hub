# API 文档

## 认证方式

所有API请求需要在Header中携带API Key：

```
Authorization: Bearer YOUR_API_KEY
```

API Key格式: `lh_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## 基础URL

```
https://api.llm-hub.com/v1
```

## 接口列表

### 1. 模型列表

获取所有可用的模型列表。

**请求**
```bash
GET /models
```

**响应**
```json
{
  "object": "list",
  "data": [
    {
      "id": "gpt-4-turbo",
      "object": "model",
      "created": 1687882411,
      "owned_by": "openai"
    },
    {
      "id": "claude-3-opus",
      "object": "model",
      "created": 1687882411,
      "owned_by": "anthropic"
    }
  ]
}
```

---

### 2. 对话完成 (Chat Completions)

创建对话完成请求，支持流式响应。

**请求**
```bash
POST /chat/completions
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "model": "gpt-4-turbo",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "temperature": 0.7,
  "max_tokens": 150,
  "stream": false
}
```

**参数说明**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| model | string | 是 | 模型ID |
| messages | array | 是 | 对话消息列表 |
| temperature | number | 否 | 采样温度 (0-2)，默认1 |
| max_tokens | integer | 否 | 最大生成token数 |
| top_p | number | 否 | 核采样概率阈值 |
| stream | boolean | 否 | 是否流式响应，默认false |
| stop | string/array | 否 | 停止生成标记 |

**响应 (非流式)**
```json
{
  "id": "chatcmpl-xxxxxxxx",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-4-turbo",
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
    "prompt_tokens": 20,
    "completion_tokens": 10,
    "total_tokens": 30
  }
}
```

**响应 (流式)**
```
data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","created":1677652288,"model":"gpt-4-turbo","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}

data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","created":1677652288,"model":"gpt-4-turbo","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}

data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","created":1677652288,"model":"gpt-4-turbo","choices":[{"index":0,"delta":{"content":"!"},"finish_reason":null}]}

data: [DONE]
```

---

### 3. 获取用户余额

获取当前账户余额信息。

**请求**
```bash
GET /billing/balance
Authorization: Bearer JWT_TOKEN
```

**响应**
```json
{
  "balance": 125.50
}
```

---

### 4. 获取使用统计

获取Token使用统计数据。

**请求**
```bash
GET /users/usage?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer JWT_TOKEN
```

**响应**
```json
{
  "period": {
    "start": "2024-01-01T00:00:00.000Z",
    "end": "2024-01-31T23:59:59.000Z"
  },
  "data": [
    {
      "modelId": "gpt-4-turbo",
      "requests": 150,
      "inputTokens": 45000,
      "outputTokens": 12000,
      "cost": 0.75
    }
  ]
}
```

---

### 5. 创建API Key

创建新的API Key。

**请求**
```bash
POST /users/api-keys
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "name": "Production Key",
  "permissions": ["chat"],
  "rateLimit": {
    "rpm": 60,
    "tpm": 100000
  }
}
```

**响应**
```json
{
  "id": "key-uuid",
  "key": "lh_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "name": "Production Key",
  "createdAt": "2024-01-15T08:30:00.000Z"
}
```

⚠️ **注意**: API Key只会在创建时显示一次，请妥善保存。

---

### 6. 获取定价信息

获取所有模型的定价信息。

**请求**
```bash
GET /billing/pricing
```

**响应**
```json
{
  "data": [
    {
      "model": "gpt-4-turbo",
      "name": "GPT-4 Turbo",
      "provider": "openai",
      "pricing": {
        "input": 0.01,
        "output": 0.03,
        "currency": "USD"
      },
      "contextWindow": 128000,
      "features": ["chat", "vision", "function-calling"]
    }
  ]
}
```

---

## 错误码

| 状态码 | 错误码 | 说明 |
|--------|--------|------|
| 400 | invalid_request_error | 请求参数错误 |
| 401 | authentication_error | 认证失败 |
| 402 | billing_error | 余额不足 |
| 403 | permission_error | 权限不足 |
| 404 | not_found_error | 资源不存在 |
| 429 | rate_limit_exceeded | 请求频率超限 |
| 500 | internal_error | 服务器内部错误 |
| 503 | service_error | 服务不可用 |

**错误响应格式**
```json
{
  "error": {
    "message": "错误描述信息",
    "type": "错误类型",
    "code": "错误码",
    "param": "相关参数(可选)",
    "details": "详细错误信息(可选)"
  }
}
```

---

## SDK使用示例

### JavaScript/TypeScript

```typescript
import { LLMHub } from '@llm-hub/sdk';

const client = new LLMHub({
  apiKey: 'lh_your_api_key'
});

// 非流式调用
const response = await client.chatCompletion({
  model: 'gpt-4-turbo',
  messages: [
    { role: 'user', content: 'Hello!' }
  ]
});

console.log(response.choices[0].message.content);

// 流式调用
for await (const chunk of client.streamChatCompletion({
  model: 'gpt-4-turbo',
  messages: [{ role: 'user', content: 'Hello!' }],
})) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```

### Python

```python
from llm_hub import LLMHub

client = LLMHub(api_key='lh_your_api_key')

# 非流式调用
response = client.chat.completions.create(
    model='gpt-4-turbo',
    messages=[{'role': 'user', 'content': 'Hello!'}]
)

print(response.choices[0].message.content)

# 流式调用
for chunk in client.chat.completions.create(
    model='gpt-4-turbo',
    messages=[{'role': 'user', 'content': 'Hello!'}],
    stream=True
):
    print(chunk.choices[0].delta.content or '', end='')
```

### cURL

```bash
curl https://api.llm-hub.com/v1/chat/completions \
  -H "Authorization: Bearer lh_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4-turbo",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```
