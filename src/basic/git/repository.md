# Git 仓库管理

## Git 仓库的概念

**Git 仓库 (Repository)** 是用于存储项目代码及其历史版本信息的地方。
每个仓库都包含两类核心数据：

1. **工作区 (Working Directory)**：开发者实际编辑代码的地方。
2. **版本库 (。git 目录)**：Git 用于追踪、管理版本历史和分支的隐藏目录。

Git 仓库分为两种类型：

- **本地仓库 (Local Repository)**：存储在开发者电脑上。
- **远程仓库 (Remote Repository)**：托管在服务器或平台上 (如 GitHub、Gitee、GitLab)。


## 新建仓库

### 初始化本地仓库

```bash
git init
```

在当前目录创建 `.git` 文件夹，初始化一个新的 Git 仓库。

### 克隆远程仓库

```bash
git clone <repo_url>
```

克隆远程仓库到本地，同时自动建立远程连接 (默认名为 `origin`)。

示例：

```bash
git clone https://github.com/user/project.git
```

---

## 查看仓库信息

### 查看当前仓库状态

```bash
git status
```

显示工作区与暂存区的差异、未提交文件等信息。

### 查看仓库配置

```bash
git config --list
```

列出当前仓库的所有配置项。

### 查看远程仓库信息

```bash
git remote -v
```

显示所有远程仓库地址。

---

## 修改仓库

### 添加远程仓库

```bash
git remote add origin <repo_url>
```

### 修改远程仓库地址

```bash
git remote set-url origin <new_repo_url>
```

### 删除远程仓库

```bash
git remote remove origin
```

## 仓库同步操作

### 拉取更新

```bash
git pull origin main
```

从远程分支拉取最新代码并合并到本地分支。

### 推送本地更改

```bash
git push origin main
```

将本地提交推送至远程仓库。

### 获取远程更新 (不合并)

```bash
git fetch origin
```

仅下载更新，不自动合并。

---

## 删除仓库

### 删除本地仓库

直接删除项目文件夹即可：

```bash
rm -rf my-project
```

### 删除远程仓库 (GitHub 示例)

可通过 GitHub 网页界面：

> Repository → Settings → Danger Zone → Delete this repository


## 仓库常见维护操作

### 重命名本地仓库文件夹

```bash
mv old-name new-name
```

### 清理未跟踪文件

```bash
git clean -fd
```

### 检查仓库历史

```bash
git log --oneline --graph --decorate
```

### 压缩优化仓库

```bash
git gc
```

清理冗余数据，减少仓库体积。
