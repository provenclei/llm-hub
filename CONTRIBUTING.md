# 贡献指南

感谢你对 LLM Hub 的兴趣！我们欢迎各种形式的贡献。

## 如何贡献

### 报告问题

如果你发现了 bug 或有功能建议：

1. 先搜索 [Issues](https://github.com/yourusername/llm-hub/issues) 确认是否已存在
2. 如果没有，创建新 Issue，请包含：
   - 问题描述
   - 复现步骤
   - 期望行为和实际行为
   - 环境信息（操作系统、Node 版本等）

### 提交代码

1. Fork 本项目
2. 创建你的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的修改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

### 开发环境搭建

```bash
# 1. Fork 并克隆项目
git clone https://github.com/YOUR_USERNAME/llm-hub.git
cd llm-hub

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 4. 启动数据库和缓存
docker-compose up -d postgres redis

# 5. 执行数据库迁移
npm run db:migrate
npm run db:seed

# 6. 启动开发服务器
npm run dev
```

### 代码规范

- 使用 TypeScript
- 遵循 ESLint 配置
- 提交前运行测试：`npm test`
- 保持代码简洁，添加必要注释

### 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/)：

- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档修改
- `style:` 代码格式修改
- `refactor:` 重构
- `test:` 测试相关
- `chore:` 构建/工具相关

示例：
```
feat: add support for Gemini model
fix: correct token calculation for streaming response
docs: update API documentation
```

## 行为准则

- 尊重他人，保持友善
- 接受建设性批评
- 关注对社区最有利的事情

## 联系方式

- GitHub Issues: https://github.com/yourusername/llm-hub/issues
- Email: contact@llm-hub.com

再次感谢你的贡献！
