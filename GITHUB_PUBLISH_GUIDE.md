# GitHub 发布步骤

## 1. 登录 GitHub CLI

运行以下命令并跟随提示完成登录：

```powershell
& "C:\Program Files\GitHub CLI\gh.exe" auth login
```

选择：
- **What account do you want to log into?** → GitHub.com
- **What is your preferred protocol for Git operations on this host?** → HTTPS
- **Authenticate Git with your GitHub credentials?** → Yes
- **How would you like to authenticate GitHub CLI?** → Login with a web browser

然后复制显示的 8 位 code，按 Enter 打开浏览器完成授权。

## 2. 创建仓库并推送

登录成功后，运行以下命令创建仓库并推送代码：

```powershell
# 进入项目目录
cd C:\Users\tenglei\.qclaw\workspace\llm-hub

# 使用 GitHub CLI 创建仓库（替换 YOUR_USERNAME 为你的 GitHub 用户名）
& "C:\Program Files\GitHub CLI\gh.exe" repo create YOUR_USERNAME/llm-hub --public --source=. --remote=origin --push
```

或者手动创建仓库并推送：

```powershell
# 1. 创建远程仓库
& "C:\Program Files\GitHub CLI\gh.exe" repo create llm-hub --public

# 2. 添加远程地址（替换 YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/llm-hub.git

# 3. 推送代码
git branch -M main
git push -u origin main
```

## 3. 验证发布

```powershell
# 打开仓库页面
& "C:\Program Files\GitHub CLI\gh.exe" repo view --web
```

---

请先在终端中执行第 1 步登录，然后告诉我，我帮你完成后续操作。
