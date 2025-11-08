# Node 安装与配置

## 为何选择 Node

Node 是一个基于 Chrome V8 引擎的 JavaScript 运行时环境，让开发者能够使用 JavaScript 编写服务器端代码。它采用事件驱动、非阻塞 I/O 模型，使其轻量且高效，非常适合数据密集型实时应用。

## 安装方式概览

安装 Node 主要有三种方式，适用于不同场景：

| 安装方式 | 适用场景 | 优点 | 缺点 |
|---------|----------|------|------|
| 官方安装包 | 新手、快速入门 | 简单直观，一键安装 | 难以切换版本 |
| NVM（Node版本管理器） | 多项目开发、需要切换版本 | 灵活管理多个Node版本 | 需要额外安装工具 |
| 系统包管理器 | Linux/macOS 用户 | 与系统集成度高 | 版本可能不是最新 |

## 使用安装包安装

### Windows 系统

从 Node.js 官网 (https://nodejs.org) 下载 Windows 安装包 (.msi 文件)。

```
1. 访问 Node.js 官网
2. 下载 LTS（长期支持）版本
3. 双击 .msi 文件安装
4. 一路 "Next" 完成安装
```

安装完成后，打开命令提示符验证：

```
node --version
npm --version
```

若显示版本号，则安装成功。

### macOS 系统

**方式一：使用 PKG 安装包**
```
1. 从 Node.js 官网下载 .pkg 文件
2. 双击打开安装程序
3. 按照指引完成安装
```

**方式二：使用 Homebrew**
```
brew install node
```

### Linux 系统

**使用已编译的二进制包**

```bash
# 下载并解压 Node.js
VERSION=25.1.0
wget https://nodejs.org/dist/v${VERSION}/node-v${VERSION}-linux-x64.tar.xz
tar -xf node-v${VERSION}-linux-x64.tar.xz -C /usr/local/

# 创建软链接
ln -s /usr/local/node-v${VERSION}-linux-x64/bin/node /usr/local/bin/
ln -s /usr/local/node-v${VERSION}-linux-x64/bin/npm /usr/local/bin/
```

## 使用 NVM 安装和管理 Node

NVM (Node Version Manager) 允许你在同一台机器上安装和使用多个 Node.js 版本。

### 安装 NVM

**Linux/macOS**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```

安装后重新加载 shell 配置：
```bash
source ~/.bashrc  # Bash 用户
source ~/.zshrc   # Zsh 用户
```

**Windows**
Windows 用户需使用 nvm-windows，从 GitHub 发布页面下载安装程序。

### 使用 NVM 管理 Node

```bash
# 安装最新 Node.js 版本
nvm install node

# 安装最新的 LTS 版本
nvm install --lts

# 安装特定版本
nvm install 20.11.0

# 查看已安装版本
nvm ls

# 切换版本
nvm use 20.11.0

# 设置默认版本
nvm alias default 20.11.0
```

## 环境配置

### 配置 npm

npm 是 Node.js 的包管理器，安装 Node 时会自动安装。为提高效率，可进行以下配置：

**设置镜像源**
```bash
# 设置国内淘宝镜像（中国用户推荐）
npm config set registry https://registry.npm.taobao.org/
```

**配置全局安装路径**
```bash
# 避免使用 sudo 安装全局包
npm config set prefix $HOME/.node
```

然后将以下内容添加到 ~/.bashrc 或 ~/.zshrc：
```bash
export PATH=$PATH:$HOME/.node/bin
```

### 项目特定配置

**使用 .nvmrc 文件**
在项目根目录创建 .nvmrc 文件，内容为 Node.js 版本号：
```
20.11.0
```
然后运行：
```bash
nvm use
```
NVM 会自动切换到指定版本。

## 验证安装

安装完成后，通过以下命令验证：

```bash
node --version  # 检查 Node.js 版本
npm --version   # 检查 npm 版本
npx --version   # 检查 npx 版本（通常与 npm 一起安装）
```

## 常见问题解决

### 命令未找到 (command not found)

**Linux/macOS**
- 确保已正确配置 shell 配置文件（~/.bashrc、~/.zshrc）
- 重新加载配置：`source ~/.bashrc` 或 `source ~/.zshrc`

**Windows**
- 检查环境变量 PATH 是否包含 Node.js 安装路径
- 通常路径为：`C:\Program Files\nodejs\`

### 权限问题

**避免使用 sudo**
```bash
# 错误做法
sudo npm install -g package

# 正确做法
npm install -g package
```

如遇权限错误，可按照前面所述配置 npm 的全局安装路径。

### 版本切换不生效

- 确保使用的是 NVM 管理的 Node，而非系统安装的 Node
- 运行 `which node` 检查当前使用的 Node 路径

### 全局包丢失

切换 Node 版本后，全局安装的包不会自动迁移。可使用以下命令迁移：
```bash
nvm install 20 --reinstall-packages-from=18
```