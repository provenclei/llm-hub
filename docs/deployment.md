# 部署指南

## 1. 环境准备

### 1.1 服务器要求
- **CPU**: 4核+
- **内存**: 8GB+
- **存储**: 100GB SSD
- **带宽**: 10Mbps+
- **操作系统**: Ubuntu 22.04 LTS (推荐)

### 1.2 软件依赖
- Docker 24.0+
- Docker Compose 2.20+
- Git

## 2. 快速部署

### 2.1 使用 Docker Compose 一键部署

```bash
# 1. 克隆项目
git clone https://github.com/tenglei/llm-hub.git
cd llm-hub

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入必要配置

# 3. 启动服务
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# 4. 检查状态
docker-compose -f infrastructure/docker/docker-compose.yml ps
```

### 2.2 访问服务
- API服务: http://localhost:3000
- 管理后台: http://localhost:3001
- 用户门户: http://localhost:3002

## 3. 生产环境部署

### 3.1 配置 HTTPS

```bash
# 使用 Let's Encrypt 获取证书
docker run -it --rm \
  -v /data/certbot/conf:/etc/letsencrypt \
  -v /data/certbot/www:/var/www/certbot \
  certbot/certbot certonly \
  --standalone \
  -d api.llm-hub.com \
  -d admin.llm-hub.com \
  -d portal.llm-hub.com
```

### 3.2 配置 Nginx

```nginx
# /etc/nginx/sites-available/llm-hub

# API服务
server {
    listen 443 ssl http2;
    server_name api.llm-hub.com;
    
    ssl_certificate /etc/letsencrypt/live/llm-hub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/llm-hub.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }
}

# 管理后台
server {
    listen 443 ssl http2;
    server_name admin.llm-hub.com;
    
    ssl_certificate /etc/letsencrypt/live/llm-hub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/llm-hub.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}

# 用户门户
server {
    listen 443 ssl http2;
    server_name portal.llm-hub.com;
    
    ssl_certificate /etc/letsencrypt/live/llm-hub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/llm-hub.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}

# HTTP重定向到HTTPS
server {
    listen 80;
    server_name api.llm-hub.com admin.llm-hub.com portal.llm-hub.com;
    return 301 https://$server_name$request_uri;
}
```

### 3.3 数据库备份

```bash
# 创建备份脚本
cat > /opt/backup/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backup/postgres"
DATE=$(date +%Y%m%d_%H%M%S)

# 备份数据库
docker exec llm-hub-postgres pg_dump -U llmhub llmhub > $BACKUP_DIR/backup_$DATE.sql

# 保留最近30天备份
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete
EOF

chmod +x /opt/backup/backup.sh

# 添加定时任务 (每天凌晨2点备份)
echo "0 2 * * * /opt/backup/backup.sh" | crontab -
```

## 4. Kubernetes 部署

### 4.1 创建命名空间
```bash
kubectl create namespace llm-hub
```

### 4.2 部署数据库
```bash
kubectl apply -f infrastructure/k8s/postgres.yaml
kubectl apply -f infrastructure/k8s/redis.yaml
```

### 4.3 部署应用
```bash
kubectl apply -f infrastructure/k8s/api.yaml
kubectl apply -f infrastructure/k8s/admin.yaml
kubectl apply -f infrastructure/k8s/web.yaml
```

### 4.4 配置 Ingress
```bash
kubectl apply -f infrastructure/k8s/ingress.yaml
```

## 5. 监控与告警

### 5.1 部署 Prometheus + Grafana
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace
```

### 5.2 关键监控指标
- API请求量 (QPS)
- 响应时间 (P50, P95, P99)
- Token消耗速率
- 错误率
- 上游渠道可用性
- 用户余额不足告警

## 6. 故障排查

### 6.1 查看日志
```bash
# API服务日志
docker logs -f llm-hub-api

# 数据库日志
docker logs -f llm-hub-postgres
```

### 6.2 常见问题

**问题1**: API返回401错误
- 检查API Key是否正确
- 检查API Key是否过期或被撤销

**问题2**: 模型调用超时
- 检查上游渠道配置
- 增加超时时间设置
- 检查网络连接

**问题3**: 数据库连接失败
- 检查数据库容器状态
- 验证DATABASE_URL配置
- 检查数据库权限

## 7. 升级维护

### 7.1 滚动更新
```bash
# 拉取最新代码
git pull origin main

# 重新构建镜像
docker-compose -f infrastructure/docker/docker-compose.yml build

# 滚动更新
docker-compose -f infrastructure/docker/docker-compose.yml up -d
```

### 7.2 数据库迁移
```bash
# 执行迁移
docker exec -it llm-hub-api pnpm db:migrate
```
