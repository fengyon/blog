# Git 工作流

## 什么是 Git 工作流？

Git 工作流是团队在协作开发过程中使用 Git 的一套约定和规范。它定义了代码如何流动、分支如何管理以及团队成员如何协作。

## 基础工作流

### 1. 集中式工作流

最简单的 Git 工作流，适合小型团队。

```
中央仓库 (origin/main)
    ↑
开发者A (main)    开发者B (main)
    ↑              ↑
本地提交A1       本地提交B1
```

**工作流程：**

1. 克隆中央仓库：`git clone <repo>`
2. 修改代码并提交：`git commit -m "message"`
3. 推送更改：`git push origin main`
4. 如有冲突，先拉取再推送

### 2. 功能分支工作流

每个新功能在独立分支上开发。

```
main分支: o---o---o---o---o (稳定版本)
           \         /
feature分支: o---o---o
```

**工作流程：**

```bash
# 创建功能分支
git checkout -b feature/new-feature

# 开发并提交
git add .
git commit -m "实现新功能"

# 完成后合并到main
git checkout main
git merge feature/new-feature
```

## 高级工作流

### 3. Gitflow 工作流

Vincent Driessen 提出的标准化工作流，适合有固定发布周期的项目。

```
主要分支结构：
main: o----------------o---------------o (生产版本)
       \              /               /
develop: o---o---o---o---o---o---o---o (开发主线)
         \   \       /   /   /
feature:  o---o     o---o   o---o (功能分支)
                 \         /
release:          o---o---o (发布分支)
                       \
hotfix:                  o---o (热修复分支)
```

**分支类型：**

- `main` - 生产代码
- `develop` - 开发主线
- `feature/*` - 功能开发
- `release/*` - 版本发布准备
- `hotfix/*` - 生产问题修复

**工作流程示例：**

```bash
# 开始新功能
git checkout develop
git checkout -b feature/user-authentication

# 完成功能
git checkout develop
git merge --no-ff feature/user-authentication

# 开始发布
git checkout -b release/1.2.0 develop

# 紧急修复
git checkout main
git checkout -b hotfix/critical-bug
git checkout main
git merge --no-ff hotfix/critical-bug
git checkout develop
git merge --no-ff hotfix/critical-bug
```

### 4. Forking 工作流

适合开源项目，贡献者没有直接推送权限。

```
官方仓库: o---o---o---o
              \
贡献者仓库:     o---o---o
                    ↑
                Pull Request
```

**工作流程：**

1. Fork 官方仓库
2. 克隆自己的仓库
3. 开发并推送到自己的仓库
4. 创建 Pull Request
5. 维护者审查并合并

## 现代工作流实践

### 5. 基于主干开发 (Trunk-Based Development)

强调小批量、频繁集成。

```
main: o-o-o-o-o-o-o-o-o-o (持续集成)
      |\ |\ |\ |\ |\ |\
特性: o o o o o o o o o o (小提交)
```

**特点：**

- 所有开发者每天至少向主干合并一次
- 特性开关控制未完成功能
- 短期特性分支（最多 1-2 天）

### 6. GitHub Flow

简化的工作流，适合持续部署。

```
main: o---o---o---o---o (始终可部署)
       \   \   /   /
分支:    o---o o---o
        ↑     ↑
    Pull Request
```

**核心原则：**

1. main 分支永远可部署
2. 从 main 创建功能分支
3. 定期向 main 推送
4. 只有通过 PR 才能合并到 main
5. 合并后立即部署

## 分支策略对比

```
工作流类型     分支复杂度  发布频率  团队规模  学习曲线
集中式工作流    低        低       小团队     低
功能分支工作流  中        中       中小团队   中
Gitflow        高        低       大团队     高
Forking        中        可变     开源项目   中
主干开发        低        高       敏捷团队   中
GitHub Flow    低        高       现代团队   低
```

## 实用命令参考

### 分支管理

```bash
# 查看分支
git branch -av

# 清理已合并分支
git branch --merged | grep -v "\*" | xargs -n 1 git branch -d

# 重命名分支
git branch -m old-name new-name
```

### 合并策略

```bash
# 普通合并
git merge feature-branch

# 变基合并（保持线性历史）
git rebase main
git merge --ff-only feature-branch

# 压缩合并
git merge --squash feature-branch
```

### 冲突解决

```bash
# 查看冲突文件
git status

# 使用工具解决冲突
git mergetool

# 完成冲突解决
git add resolved-file
git commit
```
