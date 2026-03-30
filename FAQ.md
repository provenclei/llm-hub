# Frequently Asked Questions

## 一般问题

### Q: LLM Hub 是什么？

A: LLM Hub 是一个大模型API聚合服务平台，提供统一接口访问多个大模型提供商（OpenAI、Claude、Gemini等），支持按Token计费、智能路由、用户管理等功能。适合需要统一管理多个模型API的企业和开发者。

### Q: 这个项目是开源的吗？

A: 是的，LLM Hub 采用 MIT 开源协议，你可以免费使用、修改和分发。

### Q: 商业模式是什么？

A: 通过批量采购大模型API获取折扣价，再以零售价提供给终端用户，赚取中间差价。同时提供会员订阅、企业定制等增值服务。

## 技术问题

### Q: 支持哪些模型？

A: 目前支持以下模型：
- **OpenAI**: GPT-4、GPT-4 Turbo、GPT-3.5 Turbo
- **Anthropic**: Claude 3 Opus、Claude 3 Sonnet、Claude 3 Haiku
- **Google**: Gemini Pro、Gemini Ultra
- **国产模型**: 百度文心、阿里通义、字节豆包等

完整列表请参考 [模型定价](./docs/API.md#支持的模型)。

### Q: API 接口兼容 OpenAI 吗？

A: 是的，我们提供与 OpenAI 完全兼容的 API 格式，你可以直接使用 OpenAI SDK 或其他兼容的客户端。

### Q: 如何部署？

A: 提供多种部署方式：
1. **Docker Compose** (推荐): `docker-compose up -d`
2. **手动部署**: Node.js + PostgreSQL + Redis
3. **Kubernetes**: 提供 K8s 配置文件

详细部署指南请参考 [DEPLOY.md](./docs/DEPLOY.md)。

### Q: 数据库支持哪些？

A: 目前主要支持 PostgreSQL，使用 Prisma ORM 管理数据库。未来计划支持 MySQL。

## 使用问题

### Q: 如何获取 API Key？

A: 
1. 注册账户
2. 登录后访问用户面板
3. 创建新的 API Key
4. 保存好 API Key（只显示一次）

### Q: 如何计费？

A: 按实际使用的 Token 数量计费：
- 输入 Token：按输入文本长度计算
- 输出 Token：按模型返回文本长度计算
- 费用 = 输入Token数 × 输入单价 + 输出Token数 × 输出单价

### Q: 支持流式响应吗？

A: 是的，支持 SSE 流式响应，与 OpenAI 的流式接口完全兼容。

### Q: 有使用限制吗？

A: 是的，根据用户等级有不同的限制：
- 免费用户：20 次/分钟，20K tokens/分钟
- 付费用户：60-600 次/分钟，100K-1M tokens/分钟

## 商业问题

### Q: 如何赚钱？

A: 主要收入来源：
1. **差价模式**: 批发价采购，零售价销售（40-60% 利润率）
2. **会员订阅**: 月费会员享受折扣价
3. **企业定制**: 专属通道、私有化部署

详细请参考 [BUSINESS.md](./docs/BUSINESS.md)。

### Q: 需要什么资质？

A: 建议准备：
- 企业营业执照（正规运营）
- 渠道商账号（获取批发价）
- 服务器和域名
- 实名认证系统（合规要求）

### Q: 启动成本多少？

A: 粗略估算：
- 服务器：¥500-2000/月
- 域名和SSL：¥100/月
- 渠道商预充值：¥5000-10000（可选项）
- 总计：约 ¥6000-13000 启动成本

### Q: 多久能盈利？

A: 根据用户增长情况：
- 月活跃用户 100+：可能盈亏平衡
- 月活跃用户 500+：稳定盈利
- 月活跃用户 1000+：可观收入

## 安全问题

### Q: 数据安全吗？

A: 我们采取多层安全措施：
- API Key 加密存储
- HTTPS/TLS 传输加密
- 数据库加密
- 不存储用户对话内容（仅记录元数据）

详细请参考 [SECURITY.md](./SECURITY.md)。

### Q: 合规吗？

A: 建议遵守以下法规：
- 《网络安全法》
- 《数据安全法》
- 《个人信息保护法》
- 大模型服务相关管理办法

实施内容审核、实名认证等合规措施。

## 开发问题

### Q: 如何添加新的模型提供商？

A: 
1. 在 `packages/providers/src/adapters/` 创建适配器
2. 实现 `LLMProvider` 接口
3. 在管理后台添加提供商账号
4. 配置支持的模型列表

### Q: 可以二次开发吗？

A: 当然可以！MIT 协议允许你自由修改。建议：
- Fork 仓库
- 创建分支进行开发
- 保持上游同步

### Q: 如何贡献代码？

A: 欢迎贡献！请参考 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 故障排除

### Q: 启动失败怎么办？

A: 检查以下几点：
1. Node.js 版本 >= 18
2. PostgreSQL 和 Redis 已启动
3. 环境变量配置正确
4. 数据库迁移已执行

### Q: API 调用返回 401？

A: 可能原因：
- API Key 无效或已撤销
- API Key 已过期
- 用户账户被禁用
- 余额不足（402错误）

### Q: 模型响应慢怎么办？

A: 优化建议：
1. 检查渠道商账号状态
2. 启用负载均衡
3. 配置多个渠道商
4. 启用流式响应

## 联系支持

还有其他问题？

- 📧 Email: [contact@llm-hub.com](mailto:contact@llm-hub.com)
- 💬 GitHub Issues: [https://github.com/provenclei/llm-hub/issues](https://github.com/provenclei/llm-hub/issues)
- 🐦 Twitter: [@llm_hub](https://twitter.com/llm_hub)
