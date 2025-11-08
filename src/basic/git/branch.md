# Git 分支管理

## 什么是 Git 分支？

Git 分支是 Git 版本控制系统的核心功能，它允许开发者在同一个代码库中并行开发多个功能或修复不同的问题。每个分支都是一条独立的开发线，拥有自己的提交历史。

### 分支的核心概念

- **主分支（main/master）**：默认的主开发分支
- **特性分支**：用于开发新功能的分支
- **发布分支**：用于准备发布的版本
- **热修复分支**：用于快速修复生产环境问题

## 分支的基本操作

### 查看分支

```bash
# 查看本地分支
git branch

# 查看所有分支（包括远程）
git branch -a

# 查看分支详细信息（最后提交）
git branch -v

# 查看已合并到当前分支的分支
git branch --merged

# 查看未合并到当前分支的分支
git branch --no-merged
```

### 创建分支

```bash
# 基于当前分支创建新分支
git branch feature-new

# 创建并切换到新分支
git checkout -b feature-new

# 使用新语法创建并切换分支
git switch -c feature-new

# 基于特定提交创建分支
git branch feature-new <commit-hash>

# 基于远程分支创建本地分支
git branch feature-remote origin/feature-remote
```

### 切换分支

```bash
# 切换到已有分支
git checkout feature-new

# 新语法切换分支
git switch feature-new

# 切换到上一个分支
git checkout -

# 创建并切换到新分支（简写）
git switch -c feature-new
```

### 删除分支

```bash
# 删除已合并的分支
git branch -d feature-old

# 强制删除未合并的分支
git branch -D feature-unmerged

# 删除远程分支
git push origin --delete feature-old

# 删除远程分支（旧语法）
git push origin :feature-old
```

## 高级分支操作

### 分支合并

```bash
# 将 feature 分支合并到当前分支
git merge feature-branch

# 使用快进合并（默认）
git merge --ff feature-branch

# 禁用快进，创建合并提交
git merge --no-ff feature-branch

# 合并时创建提交信息
git merge --no-ff -m "Merge feature X" feature-branch
```

### 变基操作

```bash
# 将当前分支变基到 main 分支
git rebase main

# 交互式变基（最近3个提交）
git rebase -i HEAD~3

# 继续变基（解决冲突后）
git rebase --continue

# 终止变基
git rebase --abort
```

### 分支重命名

```bash
# 重命名当前分支
git branch -m new-name

# 重命名指定分支
git branch -m old-name new-name
```

## 远程分支管理

### 跟踪远程分支

```bash
# 查看远程分支
git branch -r

# 创建本地分支并跟踪远程分支
git checkout -b feature-remote origin/feature-remote

# 设置上游分支
git branch --set-upstream-to=origin/feature-remote feature-remote

# 推送本地分支到远程
git push -u origin feature-new
```

### 同步远程分支

```bash
# 获取远程所有分支信息
git fetch --all

# 获取远程分支并清理已删除的远程分支
git fetch -p

# 拉取远程分支更新
git pull origin feature-branch
```

## 分支管理策略

### Git Flow 工作流

```bash
# 功能开发
git checkout -b feature/user-authentication develop

# 发布准备
git checkout -b release/1.2.0 develop

# 热修复
git checkout -b hotfix/critical-bug main
```

### 常用分支命名规范

- `feature/` - 新功能开发
- `bugfix/` - bug 修复
- `hotfix/` - 紧急修复
- `release/` - 发布准备
- `experiment/` - 实验性功能

## 实用技巧和最佳实践

### 快速创建功能分支

```bash
# 从最新 develop 创建功能分支
git checkout develop && git pull
git checkout -b feature/$(date +%Y%m%d)-feature-name
```

### 清理已合并分支

```bash
# 删除所有已合并到 main 的分支
git branch --merged main | grep -v "main" | xargs git branch -d
```

### 分支可视化

```bash
# 图形化显示分支历史
git log --oneline --graph --all

# 显示分支拓扑图
git log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit
```

## 常见场景解决方案

### 场景1：误删分支恢复

```bash
# 查找删除的分支提交记录
git reflog

# 基于提交记录恢复分支
git branch feature-recovered <commit-hash>
```

### 场景2：同步远程已删除分支

```bash
# 清理本地已不存在的远程分支引用
git fetch -p
```

### 场景3：强制更新分支

```bash
# 丢弃本地更改，与远程保持一致
git fetch origin
git reset --hard origin/feature-branch
```

