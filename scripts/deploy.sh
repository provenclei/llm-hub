#!/bin/bash

# LLM Hub 部署脚本
# 用法: ./deploy.sh [环境]
# 示例: ./deploy.sh production

set -e

ENV=${1:-production}
echo "🚀 Deploying LLM Hub to $ENV environment..."

# 检查依赖
echo "📦 Checking dependencies..."
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting." >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required but not installed. Aborting." >&2; exit 1; }

# 检查环境变量
if [ ! -f .env ]; then
    echo "⚠️  .env file not found, creating from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your actual configuration before continuing."
    exit 1
fi

# 拉取最新代码
echo "📥 Pulling latest code..."
git pull origin main || echo "⚠️  Not a git repository or no remote configured"

# 构建并启动
echo "🔨 Building and starting services..."
docker-compose -f docker-compose.yml down
docker-compose -f docker-compose.yml pull
docker-compose -f docker-compose.yml build --no-cache
docker-compose -f docker-compose.yml up -d

# 等待数据库就绪
echo "⏳ Waiting for database to be ready..."
sleep 10

# 执行数据库迁移
echo "🗄️  Running database migrations..."
docker-compose exec -T api npx prisma migrate deploy

# 健康检查
echo "🏥 Health check..."
sleep 5
if curl -s http://localhost:3000/health | grep -q "ok"; then
    echo "✅ Deployment successful!"
    echo ""
    echo "📊 API is running at: http://localhost:3000"
    echo "📊 Nginx is running at: http://localhost"
    echo ""
    echo "📚 Next steps:"
    echo "   1. Configure your API keys in .env file"
    echo "   2. Register admin account: POST /v1/auth/register"
    echo "   3. Add provider accounts via admin API"
    echo "   4. Start using the API!"
else
    echo "❌ Health check failed. Please check the logs:"
    echo "   docker-compose logs -f api"
    exit 1
fi
