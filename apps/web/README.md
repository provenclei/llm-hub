# LLM Hub 前端界面

本项目包含完整的前端界面，提供用户友好的大模型API管理平台。

## 🎨 界面预览

### 1. 登录页面
![登录页面](./screenshots/login.png)

简洁的登录界面，支持用户登录和管理员登录。

### 2. 用户仪表板
![用户仪表板](./screenshots/dashboard.png)

用户仪表板展示：
- 账户余额
- API Keys 管理
- 使用统计
- 模型定价

### 3. API Keys 管理
![API Keys](./screenshots/api-keys.png)

- 创建新的 API Key
- 查看已有 Keys
- 撤销不需要的 Keys

### 4. 使用统计
![使用统计](./screenshots/usage.png)

按模型统计使用情况：
- 请求次数
- Token 消耗
- 费用统计

### 5. 管理后台
![管理后台](./screenshots/admin.png)

管理员专用后台：
- 系统概览
- 用户管理
- 渠道管理
- 系统日志

## 🚀 启动前端

```bash
# 进入前端目录
cd apps/web

# 安装依赖
npm install

# 开发模式启动
npm run dev

# 构建生产版本
npm run build
```

前端服务将运行在 http://localhost:3001

## 📁 项目结构

```
apps/web/
├── app/                    # Next.js 应用目录
│   ├── login/             # 登录页面
│   ├── dashboard/         # 用户仪表板
│   ├── admin/             # 管理后台
│   └── layout.tsx         # 根布局
├── components/            # 组件目录
│   └── ui/               # UI 组件
├── lib/                  # 工具函数
│   ├── api.ts           # API 客户端
│   └── utils.ts         # 工具函数
├── store/               # 状态管理
│   └── index.ts        # Zustand store
└── package.json
```

## 🔧 技术栈

- **框架**: Next.js 14
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **组件库**: Radix UI
- **状态管理**: Zustand
- **HTTP 客户端**: Axios
- **图标**: Lucide React

## 📝 功能清单

### 用户端
- [x] 用户登录/注册
- [x] 仪表板概览
- [x] API Keys 管理
- [x] 使用统计查看
- [x] 模型定价查看
- [x] 账户余额查看

### 管理端
- [x] 系统统计概览
- [x] 用户管理
- [x] 渠道管理
- [x] 模型管理
- [x] 系统日志查看
- [x] 快捷操作面板

## 🌟 特性

- **响应式设计**: 支持桌面端和移动端
- **深色模式**: 支持亮色/暗色主题切换
- **实时数据**: 自动刷新统计数据
- **友好交互**: Toast 提示、加载状态
- **权限控制**: 根据用户角色显示不同功能

## 🔗 API 集成

前端通过 RESTful API 与后端通信：

```typescript
// API 基础配置
const API_BASE_URL = 'http://localhost:3000/v1'

// 主要 API
- POST   /auth/login          # 登录
- GET    /auth/me             # 获取用户信息
- GET    /users/api-keys      # 获取 API Keys
- POST   /users/api-keys      # 创建 API Key
- GET    /users/usage         # 获取使用统计
- GET    /billing/balance     # 获取余额
- GET    /billing/pricing     # 获取定价
- GET    /models              # 获取模型列表
- GET    /admin/stats         # 获取系统统计 (Admin)
```

## 🎨 UI 组件

使用 Radix UI 构建的无障碍组件：

- Button - 按钮
- Input - 输入框
- Card - 卡片
- Tabs - 标签页
- Alert - 警告提示
- Toast - 消息提示

## 📱 响应式断点

```css
sm: 640px   /* 手机 */
md: 768px   /* 平板 */
lg: 1024px  /* 小桌面 */
xl: 1280px  /* 大桌面 */
2xl: 1400px /* 超大屏 */
```

## 🔐 认证

使用 JWT Token 进行认证：

1. 登录成功后，Token 存储在 localStorage
2. 每次请求自动携带 Authorization 头部
3. Token 过期自动跳转登录页

## 🎯 下一步

- [ ] 深色模式切换
- [ ] 数据可视化图表
- [ ] 实时 WebSocket 通知
- [ ] 多语言支持
- [ ] PWA 支持
