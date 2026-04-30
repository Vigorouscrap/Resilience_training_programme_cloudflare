# GitHub 上传指南

## 前置准备

在上传到 GitHub 之前，请完成以下步骤：

### 1. 创建 GitHub 账户（如果还没有）
访问 https://github.com 并注册账户

### 2. 创建新仓库
1. 登录 GitHub
2. 点击右上角 "+" 图标，选择 "New repository"
3. 设置仓库名称为 `resilience-programme`
4. 添加描述：`心理弹性训练 - 基于正念和接纳承诺疗法的个人成长计划`
5. 选择 "Public" 或 "Private"（根据需要）
6. **不要** 初始化任何文件（README、.gitignore等）
7. 点击 "Create repository"

## 上传步骤

### 方法 1：使用 HTTPS（推荐用于初次上传）

在终端中运行以下命令：

```bash
cd "/Users/songxiaoqi/Library/CloudStorage/OneDrive-TheUniversityofHongKong-Connect/phd/resilience-programme-app"

# 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/resilience-programme.git

# 将主分支重命名为 main（如果还不是）
git branch -M main

# 推送到 GitHub
git push -u origin main
```

系统会提示输入 GitHub 用户名和密码（或个人访问令牌）

### 方法 2：使用 SSH（高级用户）

如果已配置 SSH 密钥：

```bash
cd "/Users/songxiaoqi/Library/CloudStorage/OneDrive-TheUniversityofHongKong-Connect/phd/resilience-programme-app"

# 添加远程仓库
git remote add origin git@github.com:YOUR_USERNAME/resilience-programme.git

# 推送到 GitHub
git push -u origin main
```

## 完成后的步骤

### 1. 验证上传
访问 `https://github.com/YOUR_USERNAME/resilience-programme` 确认文件已上传

### 2. 启用 GitHub Pages（可选）
使项目可以在线访问：

1. 进入仓库设置（Settings）
2. 找到 "Pages" 选项
3. 在 "Build and deployment" 下，选择 "Deploy from a branch"
4. 选择 "main" 分支和 "/src" 文件夹
5. 保存

然后访问 `https://YOUR_USERNAME.github.io/resilience-programme/` 即可在线使用

### 3. 添加项目徽章（可选）
在 README.md 中添加：

```markdown
[![GitHub](https://img.shields.io/github/license/YOUR_USERNAME/resilience-programme)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/YOUR_USERNAME/resilience-programme)](https://github.com/YOUR_USERNAME/resilience-programme/stargazers)
```

## 故障排除

### 问题 1：认证失败
**解决方案**：
- 确保用户名和密码正确
- 如果使用密码，可能需要生成个人访问令牌
- 访问 GitHub Settings → Developer settings → Personal access tokens

### 问题 2：分支冲突
**解决方案**：
```bash
# 如果仓库已有内容，先拉取
git pull origin main --allow-unrelated-histories

# 解决冲突后提交
git add .
git commit -m "Merge remote and local repositories"
git push origin main
```

### 问题 3：远程仓库已存在
**解决方案**：
```bash
# 查看现有远程仓库
git remote -v

# 移除旧的远程仓库
git remote remove origin

# 添加新的远程仓库
git remote add origin https://github.com/YOUR_USERNAME/resilience-programme.git
```

## 后续维护

### 提交新的更改

```bash
# 进行修改后
git add .
git commit -m "描述你的修改"
git push origin main
```

### 创建分支进行开发

```bash
# 创建新分支
git checkout -b feature/新功能

# 进行修改和提交
git add .
git commit -m "添加新功能"

# 推送分支
git push origin feature/新功能

# 在 GitHub 上创建 Pull Request 将分支合并到 main
```

## 推荐的 .gitignore 内容

项目已包含 .gitignore，包括：
- 依赖文件夹和日志
- IDE 配置文件
- 操作系统特定文件
- 临时和备份文件

## 更新本地仓库

如果在 GitHub 上直接编辑了文件（例如 README），需要在本地更新：

```bash
git pull origin main
```

---

**提示**：将 `YOUR_USERNAME` 替换为您的 GitHub 用户名
