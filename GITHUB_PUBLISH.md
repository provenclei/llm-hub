# 🚀 GitHub 发布指南

## 快速发布步骤

### 方式1: 使用脚本自动发布

```bash
# 运行发布脚本
./scripts/publish-to-github.sh
```

### 方式2: 手动发布

#### 第1步: 在GitHub创建仓库

1. 访问 https://github.com/new
2. 仓库名称: `llm-hub`
3. 选择 **Public** (公开仓库)
4. ❌ **不要**勾选 "Initialize this repository with a README"
5. 点击 **Create repository**

#### 第2步: 推送代码

```bash
# 添加远程仓库 (替换 YOUR_USERNAME 为你的GitHub用户名)
git remote add origin https://github.com/YOUR_USERNAME/llm-hub.git

# 推送到GitHub
git branch -M main
git push -u origin main
```

#### 第3步: 创建第一个Release

```bash
# 创建标签
git tag -a v1.0.0 -m "Initial release"

# 推送标签
git push origin v1.0.0
```

GitHub Actions会自动创建Release。

---

## 📁 项目结构概览

```
llm-hub/
├── 📄 README.md                    # 项目主文档
├── 📄 LICENSE                      # MIT许可证
├── 📄 CHANGELOG.md                 # 版本更新记录
├── 📄 CONTRIBUTING.md              # 贡献指南
├── 📄 ROADMAP.md                   # 路线图
├── 📄 package.json                 # 根package.json
├── 📄 turbo.json                   # Turbo配置
├── 📄 .env.example                 # 环境变量示例
├── 📄 docker-compose.yml           # Docker Compose配置
│
├── 📁 .github/
│   └── 📁 workflows/
│       ├── ci.yml                  # CI/CD工作流
│       └── release.yml             # 发布工作流
│
├── 📁 apps/                        # 应用程序
│   ├── 📁 api/                     # 后端API服务
│   │   ├── 📁 src/
│   │   │   ├── 📁 plugins/         # 插件 (认证、限流、错误处理)
│   │   │   ├── 📁 routes/          # 路由定义
│   │   │   ├── 📁 services/        # 业务服务
│   │   │   ├── 📁 schemas/         # 数据验证
│   │   │   └── index.ts            # 入口文件
│   │   ├── 📁 prisma/
│   │   │   ├── schema.prisma       # 数据库模型
│   │   │   └── seed.ts             # 种子数据
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   │
│   └── 📁 admin/                   # 管理后台
│       └── package.json
│
├── 📁 packages/                    # 共享包
│   ├── 📁 sdk/                     # JavaScript SDK
│   │   ├── src/index.ts
│   │   └── package.json
│   └── ...
│
├── 📁 docs/                        # 文档
│   ├── api.md                      # API文档
│   ├── architecture.md             # 架构设计
│   ├── deployment.md               # 部署指南
│   └── pricing-strategy.md         # 定价策略
│
├── 📁 infrastructure/              # 基础设施
│   └── 📁 docker/
│       └── docker-compose.yml      # 完整部署配置
│
└── 📁 scripts/
    └── publish-to-github.sh        # 发布脚本
```

---

## ⚙️ 配置GitHub Secrets (可选)

如果要启用CI/CD自动发布到Docker Hub，需要在GitHub设置中添加Secrets:

1. 访问 `Settings` > `Secrets and variables` > `Actions`
2. 添加以下Secrets:
   - `DOCKER_USERNAME` - Docker Hub用户名
   - `DOCKER_PASSWORD` - Docker Hub密码或Token

---

## 🎯 发布后的配置

### 1. 设置仓库信息

- 添加描述: "大模型调用服务平台 - 一站式API聚合服务"
- 添加Topics标签: `llm`, `openai`, `api-gateway`, `ai`, `nodejs`
- 添加网站链接: `https://docs.llm-hub.com` (如果有)

### 2. 启用功能

- ✅ Issues (问题反馈)
- ✅ Discussions (讨论区)
- ✅ Projects (项目管理)
- ✅ Wiki (文档)

### 3. 分支保护 (推荐)

```
Settings > Branches > Add rule
- Branch name pattern: main
- ✅ Require a pull request before merging
- ✅ Require status checks to pass
```

---

## ✅ 发布检查清单

- [ ] 代码已推送到GitHub
- [ ] README文档完整
- [ ] 添加了LICENSE文件
- [ ] 创建了第一个Release
- [ ] 配置了Topics标签
- [ ] 启用了Issues功能
- [ ] 设置了分支保护规则 (可选)
- [ ] 配置了CI/CD Secrets (可选)

---

## 🐛 常见问题

### Q: 推送时提示权限错误
**A:** 需要配置GitHub认证:
- SSH方式: `git@github.com:username/repo.git`
- HTTPS方式: 使用Personal Access Token代替密码

### Q: 如何更新项目
```bash
git add .
git commit -m "描述你的更改"
git push origin main
```

### Q: 如何删除仓库重新发布
1. GitHub上删除仓库: `Settings` > `Danger Zone` > `Delete this repository`
2. 本地删除git历史: `rm -rf .git`
3. 重新执行发布步骤
