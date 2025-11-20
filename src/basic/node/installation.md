# node 安装与配置

Node.js 是一个开源的、跨平台的 JavaScript 运行时环境，它基于 Chrome 的 V8 JavaScript 引擎构建。它使开发者能够使用 JavaScript 编写服务器端代码，采用事件驱动、非阻塞 I/O 模型，使其能够处理大量并发请求，非常适合构建高性能的网络应用。

## Node.js 的特点

了解 Node.js 的核心特点有助于理解其安装配置的最佳实践：

- **事件驱动与非阻塞 I/O**：Node.js 基于事件驱动模型，通过事件和回调函数处理请求，实现非阻塞 I/O 操作。这使得 Node.js 能够高效处理大量并发连接。
  ```
  请求到达 --> 事件循环处理 --> 执行回调 --> 返回响应
       ↑         |
       |         ↓
       非阻塞，继续接收新请求
  ```

- **单线程与高并发**：Node.js 采用单线程模型，通过事件循环和异步 I/O 操作，能够充分利用系统资源。

- **跨平台支持**：Node.js 可以在 Windows、macOS 和 Linux 等多个操作系统上运行。

- **丰富的生态系统**：通过 npm (Node Package Manager) 可以访问庞大的第三方模块库，极大提高了开发效率。

## 安装前的准备

在安装 Node.js 之前，需要了解一些关键概念：

- **LTS 与当前版本**：Node.js 提供长期支持 (LTS) 版本和当前版本。LTS 版本更加稳定可靠，适合生产环境。
  ```
  版本选择:
    LTS版本 - 稳定、可靠、长期支持 (推荐用于生产)
    当前版本 - 最新功能、前沿特性 (适合尝鲜)
  ```

- **运行时与环境**：Node.js 是一个 JavaScript 运行时环境，它使 JavaScript 能够脱离浏览器运行在服务器端。

## 安装方法

### 直接从官网下载安装

这是最简单直接的安装方式，适合初学者：

1. 访问 [Node.js 官方网站](https://nodejs.org/zh-cn)
2. 选择 LTS (长期支持) 版本或当前版本进行下载
3. 运行安装程序并按照提示完成安装
4. 验证安装：打开终端，输入以下命令检查安装是否成功
   ```
   node -v  # 显示Node.js版本
   npm -v   # 显示npm版本
   ```

### 使用包管理器安装

不同操作系统有各自的包管理器，可以简化安装过程：

**Windows**：使用官方安装程序或 Chocolatey 包管理器

**macOS**：使用官方安装程序或 Homebrew 包管理器

**Linux**：使用系统自带的包管理器或 NodeSource 仓库
```
# Ubuntu/Debian 使用 NodeSource
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_16.x | sudo -E bash -
sudo yum install -y nodejs
```

### 使用 NVM (Node Version Manager) 安装

NVM 允许在同一台机器上安装和管理多个 Node.js 版本，非常适合开发和测试环境：

**安装 NVM**：
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
```

**使用 NVM 安装和管理 Node.js**：
```
nvm install node      # 安装最新版本
nvm install 16.14.0   # 安装特定版本
nvm use 16.14.0       # 切换到指定版本
nvm ls                # 列出所有已安装版本
```

NVM 的工作原理：
```
命令行 --> nvm --> 切换节点版本
               --> 管理全局模块
               --> 隔离项目环境
```

## 环境配置

### 配置环境变量

在某些情况下，可能需要手动配置环境变量：

编辑 shell 配置文件 (如 `~/.bashrc` 或 `~/.zshrc`)：
```
export NODE_HOME=/usr/local/node
export PATH=$PATH:$NODE_HOME/bin
```
然后执行 `source ~/.bashrc` 使配置生效。

### 项目环境变量配置

在项目根目录创建 `.env` 文件：
```
PORT=3000
DB_HOST=localhost
DB_USER=username
DB_PASSWORD=password
```
在代码中使用 `dotenv` 模块加载环境变量：
```javascript
require('dotenv').config()
```

### npm 配置

npm 是 Node.js 的包管理器，安装 Node.js 时会自动安装 npm。

**配置 npm 镜像加速**：
对于国内用户，可以配置淘宝镜像加速 npm 下载：
```
npm config set registry https://registry.npmmirror.com/
```

**全局模块路径配置**：
```
npm config set prefix /path/to/global/modules
```

## 验证安装

安装完成后，需要验证 Node.js 环境是否正常工作：

1. **检查版本信息**：
   ```
   node -v  # 输出示例: v16.14.0
   npm -v   # 输出示例: 8.3.1
   ```

2. **运行简单测试**：
   创建一个 `test.js` 文件，内容为：
   ```javascript
   console.log('Node.js 运行正常！');
   ```
   执行：`node test.js`

3. **创建并运行 Web 服务器**：
   创建 `server.js` 文件：
   ```javascript
   const http = require('node:http');
   
   const server = http.createServer((req, res) => {
     res.statusCode = 200;
     res.setHeader('Content-Type', 'text/plain');
     res.end('Hello, World!\n');
   });
   
   server.listen(3000, '127.0.0.1', () => {
     console.log('服务器运行在 http://127.0.0.1:3000/');
   });
   ```
   运行 `node server.js` 并访问 http://127.0.0.1:3000 验证。

## 多版本管理

在实际开发中，经常需要同时管理多个 Node.js 版本以适应不同项目的需求：

使用 NVM 管理多版本：
```
nvm install 14.0.0    # 安装 v14.0.0
nvm install 16.0.0    # 安装 v16.0.0
nvm use 14.0.0        # 切换到 v14.0.0
nvm alias default 16.0.0  # 设置默认版本
```

版本切换示意图：
```
项目A (需要v14) --> nvm use 14 --> 节点v14环境
项目B (需要v16) --> nvm use 16 --> 节点v16环境
```

## 性能优化配置

根据应用需求调整 Node.js 配置可以提升性能：

- **调整内存限制**：
  ```
  node --max-old-space-size=4096 app.js
  ```

- **启用严格模式**：
  在代码开头添加：`'use strict';`

- **使用 ECMAScript 模块**：
  在 `package.json` 中添加：`"type": "module"`

- **优化异步操作**：
  使用 Promise 和 async/await 替代回调函数，提升代码可读性和可维护性。

## 常见问题解决

**权限问题**：在 Linux/macOS 中，避免使用 sudo 安装全局包，可配置 npm 使用用户目录。

**路径问题**：确保 Node.js 安装路径已添加到系统的 PATH 环境变量中。

**端口占用**：如果 3000 端口被占用，可在启动服务器时使用其他端口。

**版本冲突**：使用 NVM 管理多版本，避免全局版本冲突。