# 贡献指南

感谢您对LLM-Hub项目的关注！我们欢迎各种形式的贡献。

## 如何贡献

### 1. 报告问题

如果您发现了bug或有新功能建议，请通过[GitHub Issues](https://github.com/tenglei/llm-hub/issues)提交。

提交问题时请包含：
- 问题的清晰描述
- 复现步骤
- 期望行为 vs 实际行为
- 环境信息（操作系统、Node版本等）
- 相关日志或截图

### 2. 提交代码

#### 开发流程

1. **Fork项目**
   ```bash
   git clone https://github.com/YOUR_USERNAME/llm-hub.git
   cd llm-hub
   ```

2. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

3. **安装依赖**
   ```bash
   pnpm install
   ```

4. **进行开发**
   - 遵循现有的代码风格
   - 编写测试用例
   - 更新相关文档

5. **提交更改**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

   提交信息格式：
   - `feat:` 新功能
   - `fix:` 修复bug
   - `docs:` 文档更新
   - `style:` 代码格式调整
   - `refactor:` 代码重构
   - `test:` 测试相关
   - `chore:` 构建/工具相关

6. **推送到Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **创建Pull Request**
   - 在GitHub上创建PR
   - 描述你的更改
   - 关联相关Issue

#### 代码规范

- 使用TypeScript
- 遵循ESLint规则
- 编写清晰的注释
- 保持函数简洁（不超过50行）

### 3. 代码审查

所有提交都需要经过代码审查：
- 至少1个维护者批准
- CI检查通过
- 无冲突

### 4. 发布流程

- 版本号遵循[SemVer](https://semver.org/)
- 发布说明包含所有变更

## 开发指南

### 项目结构

```
llm-hub/
├── apps/
│   ├── api/          # 后端API服务
│   ├── admin/        # 管理后台
│   └── web/          # 用户门户
├── packages/
│   ├── sdk/          # JavaScript SDK
│   └── shared/       # 共享代码
└── docs/             # 文档
```

### 本地开发

```bash
# 1. 启动数据库
docker-compose -f infrastructure/docker/docker-compose.yml up postgres redis -d

# 2. 配置环境变量
cp .env.example .env
# 编辑.env文件

# 3. 数据库迁移
cd apps/api && pnpm db:migrate && pnpm db:seed

# 4. 启动开发服务器
pnpm dev
```

## 社区

- 💬 [Discord](https://discord.gg/llm-hub)
- 🐦 [Twitter](https://twitter.com/llm_hub)
- 📧 Email: dev@llm-hub.com

## 行为准则

- 互相尊重
- 友善交流
- 欢迎新人
- 关注问题而非个人

## 许可证

通过提交代码，您同意您的贡献将在[MIT许可证](LICENSE)下发布。
