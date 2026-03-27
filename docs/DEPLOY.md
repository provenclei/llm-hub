# 部署指南

本文档详细说明如何部署 LLM Hub 平台。

## 部署要求

### 硬件要求

| 环境 | CPU | 内存 | 存储 | 网络 |
|------|-----|------|------|------|
| 最小 | 2核 | 4GB | 50GB SSD | 10Mbps |
| 推荐 | 4核 | 8GB | 100GB SSD | 50Mbps |
| 生产 | 8核+ | 16GB+ | 200GB+ SSD | 100Mbps+ |

### 软件要求

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ (开发环境)
- Git

## 快速部署

### 1. 克隆项目

```bash
git clone https://github.com/yourusername/llm-hub.git
cd llm-hub
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下必要项：

```env
# 数据库
DATABASE_URL="postgresql://postgres:password@localhost:5432/llm_hub?schema=public"
REDIS_URL="redis://localhost:6379"

# 安全密钥（生成随机字符串）
JWT_SECRET="your-super-secret-jwt-key-$(openssl rand -hex 16)"
API_KEY_SALT="$(openssl rand -hex 16)"

# 渠道商 API Keys（至少配置一个）
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
# ... 其他厂商
```

### 3. 使用 Docker Compose 启动

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f api

# 停止服务
docker-compose down
```

### 4. 初始化数据库

```bash
# 执行数据库迁移
docker-compose exec api npx prisma migrate deploy

# 填充初始数据
docker-compose exec api npx prisma db seed
```

### 5. 验证部署

```bash
# 健康检查
curl http://localhost:3000/health

# 预期响应
{"status":"ok","timestamp":"2024-..."}
```

## 生产部署

### 使用云服务

#### 阿里云 ECS

```bash
# 1. 购买 ECS 实例（推荐 4核8G）
# 2. 安装 Docker
curl -fsSL https://get.docker.com | sh

# 3. 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. 部署项目
git clone https://github.com/yourusername/llm-hub.git
cd llm-hub
# 编辑 .env 文件
docker-compose up -d
```

#### 腾讯云 CVM

步骤类似，参考腾讯云文档。

### 使用 Kubernetes

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: llm-hub-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: llm-hub-api
  template:
    metadata:
      labels:
        app: llm-hub-api
    spec:
      containers:
      - name: api
        image: your-registry/llm-hub-api:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: llm-hub-config
        - secretRef:
            name: llm-hub-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

部署：

```bash
kubectl apply -f k8s-deployment.yaml
```

## 配置 SSL

### 使用 Let's Encrypt

```bash
# 安装 certbot
sudo apt-get install certbot

# 生成证书
sudo certbot certonly --standalone -d api.yourdomain.com

# 配置 nginx 使用证书
# 编辑 nginx.conf，添加 SSL 配置
```

### 使用 Cloudflare

1. 在 Cloudflare 添加 A 记录指向服务器 IP
2. 开启 SSL/TLS 加密模式（完全）
3. 无需额外配置

## 监控与日志

### 配置 Prometheus + Grafana

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  grafana_data:
```

### 配置日志收集

```yaml
# 在 docker-compose.yml 中添加
services:
  api:
    logging:
      driver: "fluentd"
      options:
        fluentd-address: localhost:24224
        tag: docker.llm-hub
```

## 备份策略

### 数据库备份

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 备份 PostgreSQL
docker exec llm-hub-postgres pg_dump -U postgres llm_hub > $BACKUP_DIR/db_$DATE.sql

# 保留最近 30 天的备份
find $BACKUP_DIR -name "db_*.sql" -mtime +30 -delete

# 上传到 S3（可选）
aws s3 cp $BACKUP_DIR/db_$DATE.sql s3://your-bucket/backups/
```

添加到 crontab：

```bash
0 2 * * * /path/to/backup.sh
```

## 升级维护

### 更新代码

```bash
# 拉取最新代码
git pull origin main

# 重新构建并部署
docker-compose down
docker-compose up -d --build

# 执行数据库迁移
docker-compose exec api npx prisma migrate deploy
```

### 零停机部署

```bash
# 使用滚动更新
docker-compose up -d --scale api=2
sleep 10
docker-compose up -d --scale api=1
```

## 故障排查

### 常见问题

#### 1. 数据库连接失败

```bash
# 检查 PostgreSQL 状态
docker-compose ps postgres
docker-compose logs postgres

# 检查网络
docker network ls
docker network inspect llm-hub_default
```

#### 2. API 响应慢

```bash
# 查看资源使用
docker stats

# 检查日志
docker-compose logs -f api --tail 100

# 检查数据库性能
docker-compose exec postgres psql -U postgres -c "SELECT * FROM pg_stat_activity;"
```

#### 3. Redis 连接问题

```bash
# 测试 Redis
docker-compose exec redis redis-cli ping

# 查看 Redis 状态
docker-compose exec redis redis-cli info
```

### 性能优化

#### 数据库优化

```sql
-- 添加索引
CREATE INDEX idx_usage_user_created ON usages(user_id, created_at);
CREATE INDEX idx_usage_model_created ON usages(model_id, created_at);

-- 定期清理旧数据
DELETE FROM usages WHERE created_at < NOW() - INTERVAL '90 days';
```

#### Nginx 优化

```nginx
# nginx.conf 优化项
worker_processes auto;
worker_connections 4096;

# 开启 gzip
gzip on;
gzip_types application/json;

# 长连接保持
keepalive_timeout 300s;
```

## 安全建议

1. **使用防火墙**：仅开放 80/443 端口
2. **定期更新**：及时更新 Docker 镜像和依赖
3. **密钥管理**：使用 Vault 或 AWS Secrets Manager
4. **访问控制**：配置 IP 白名单
5. **审计日志**：记录所有管理操作

## 扩展阅读

- [Docker 官方文档](https://docs.docker.com/)
- [Prisma 迁移指南](https://www.prisma.io/docs/guides/migrate)
- [PostgreSQL 性能调优](https://wiki.postgresql.org/wiki/Performance_Optimization)
