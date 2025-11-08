# Git 安装与配置

## 1. Git 安装

### Windows 系统安装

1. **下载 Git**

   - 访问 [git-scm.com](https://git-scm.com/)
   - 下载 Windows 版本安装包

2. **安装步骤**
   - 运行安装程序，按提示操作
   - 推荐使用默认配置
   - 选择 Git Bash 作为命令行工具
   - 配置行结束符转换（推荐选择 "Checkout Windows-style, commit Unix-style"）

### macOS 系统安装

**方法一：使用 Homebrew**

```bash
brew install git
```

**方法二：下载官方安装包**

- 从 [git-scm.com](https://git-scm.com/) 下载 macOS 版本

### Linux 系统安装

**Ubuntu/Debian:**

```bash
sudo apt update && sudo apt install git
```

**CentOS/RHEL:**

```bash
sudo yum install git
# 或
sudo dnf install git
```

## 2. 基础配置

### 用户信息配置

```bash
# 设置全局用户名和邮箱
git config --global user.name "你的姓名"
git config --global user.email "你的邮箱@example.com"

# 为特定项目设置不同用户信息
git config user.name "项目专用姓名"
git config user.email "project@example.com"
```

### 常用基础配置

```bash
# 设置默认编辑器
git config --global core.editor "code --wait"  # VS Code
git config --global core.editor "vim"          # Vim

# 设置默认分支名称
git config --global init.defaultBranch main

# 优化命令行显示
git config --global color.ui auto

# 配置行结束符处理
git config --global core.autocrlf true        # Windows
git config --global core.autocrlf input       # Linux/macOS
```

## 3. 高级配置

### 别名配置

```bash
# 常用命令别名
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'

# 图形化日志显示
git config --global alias.lg "log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"
```

### 忽略文件配置

创建全局忽略文件 `~/.gitignore_global`：

```
# 编辑器文件
.vscode/
.idea/
*.swp
*.swo

# 系统文件
.DS_Store
Thumbs.db

# 日志文件
*.log

# 依赖目录
node_modules/
```

启用全局忽略：

```bash
git config --global core.excludesfile ~/.gitignore_global
```

## 4. SSH 密钥配置

### 生成 SSH 密钥

```bash
# 生成新的 SSH 密钥
ssh-keygen -t ed25519 -C "your_email@example.com"

# 或使用 RSA
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

### 添加密钥到 SSH 代理

```bash
# 启动 SSH 代理
eval "$(ssh-agent -s)"

# 添加私钥
ssh-add ~/.ssh/id_ed25519
```

### 配置 GitHub/GitLab

```bash
# 复制公钥内容
cat ~/.ssh/id_ed25519.pub

# 将公钥内容添加到 GitHub/GitLab 的 SSH Keys 设置中
```

## 5. 仓库特定配置

### 项目级配置

```bash
# 进入项目目录
cd /path/to/your/project

# 设置项目特定配置
git config user.email "project-specific@email.com"

# 设置远程仓库 URL
git remote add origin git@github.com:username/repo.git
```

### 多账户配置

编辑 `~/.ssh/config`：

```
# 个人账户
Host github-personal
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_personal

# 工作账户
Host github-work
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_work
```

使用不同账户克隆：

```bash
git clone git@github-personal:username/repo.git
```

## 6. 验证配置

### 检查配置

```bash
# 查看所有配置
git config --list

# 查看特定配置
git config user.name
git config user.email

# 检查 SSH 连接
ssh -T git@github.com
```

### 测试基本操作

```bash
# 创建测试仓库
mkdir test-repo && cd test-repo
git init
echo "# Test Project" > README.md
git add .
git commit -m "Initial commit"

# 验证提交信息
git log --oneline
```

## 7. 故障排除

### 常见问题解决

```bash
# 重置错误配置
git config --global --unset <key>

# 检查 Git 版本
git --version

# 查看帮助
git help <command>
```
