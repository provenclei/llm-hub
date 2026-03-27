#!/bin/bash

# LLM-Hub GitHub 发布脚本
# 使用方法: ./scripts/publish-to-github.sh

echo "🚀 LLM-Hub GitHub 发布助手"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查Git
echo "✅ 检查Git..."
if ! command -v git &> /dev/null; then
    echo "${RED}❌ Git未安装${NC}"
    exit 1
fi

# 获取GitHub用户名
echo ""
read -p "请输入你的GitHub用户名: " GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    echo "${RED}❌ GitHub用户名不能为空${NC}"
    exit 1
fi

REPO_NAME="llm-hub"
REPO_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME"

echo ""
echo "📦 仓库信息:"
echo "   仓库名: $REPO_NAME"
echo "   用户名: $GITHUB_USERNAME"
echo "   URL: $REPO_URL"
echo ""

# 提示用户在GitHub创建仓库
echo "${YELLOW}⚠️  请先完成以下步骤:${NC}"
echo ""
echo "1. 打开 https://github.com/new"
echo "2. 填写仓库名称: llm-hub"
echo "3. 选择公开仓库 (Public)"
echo "4. 不要勾选 'Initialize this repository with a README'"
echo "5. 点击 'Create repository'"
echo ""

read -p "完成上述步骤后按回车继续..."

# 添加远程仓库
echo ""
echo "🔗 添加远程仓库..."
git remote remove origin 2>/dev/null
git remote add origin "git@github.com:$GITHUB_USERNAME/$REPO_NAME.git"

# 测试连接
echo ""
echo "🧪 测试GitHub连接..."
if ! git ls-remote origin &> /dev/null; then
    echo "${YELLOW}⚠️  SSH连接失败，尝试使用HTTPS...${NC}"
    git remote remove origin
    git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
    
    if ! git ls-remote origin &> /dev/null; then
        echo "${RED}❌ 无法连接到GitHub仓库${NC}"
        echo "   请确保:"
        echo "   1. 已在GitHub创建仓库"
        echo "   2. 配置了正确的GitHub认证 (SSH Key 或 Personal Access Token)"
        exit 1
    fi
fi

echo "${GREEN}✅ 连接成功!${NC}"

# 推送到GitHub
echo ""
echo "📤 推送到GitHub..."
git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "${GREEN}✅ 发布成功!${NC}"
    echo ""
    echo "🎉 你的项目已发布到:"
    echo "   $REPO_URL"
    echo ""
    echo "📋 下一步建议:"
    echo "   1. 完善README文档"
    echo "   2. 设置GitHub Secrets用于CI/CD"
    echo "   3. 创建第一个Release"
    echo "   4. 添加项目Topics标签"
    echo ""
else
    echo ""
    echo "${RED}❌ 推送失败${NC}"
    echo "   请检查错误信息并手动重试:"
    echo "   git push -u origin main"
    exit 1
fi
