# node 安装与配置

## 为什么需要 Node.js

Node.js 是一个基于 Chrome V8 JavaScript 引擎构建的 JavaScript 运行时环境，它允许开发者使用 JavaScript 编写服务器端代码。Node.js 采用事件驱动、非阻塞 I/O 模型，使其成为构建高性能、可扩展网络应用的理想选择。

作为第一个允许 JavaScript 在浏览器外运行的运行时，Node.js 开创了服务器端 JavaScript 的新纪元。其庞大的生态系统和优异的性能特征，使其成为现代 Web 开发中不可或缺的技术。

## 安装前的准备

### 环境兼容性检查

在安装 Node.js 前，需要了解不同版本对操作系统的要求。例如，Node.js 23 及以上版本已不再支持 Windows 32 位系统。请确保你的操作系统与目标 Node.js 版本兼容。

### 版本管理工具的选择

**nvm** (Node Version Manager) 是官方推荐的安装方式，它解决了开发中的常见痛点：
- **项目依赖冲突**：不同项目可能需要特定的 Node 版本
- **环境切换繁琐**：手动安装卸载版本耗时且易出错
- **下载速度缓慢**：特别是在国内网络环境下

使用 nvm 可以在一台机器上安装多个 Node 版本，并根据项目需求快速切换。

## 使用 nvm 安装 Node.js

### nvm 的安装过程

**Windows 系统**：
1. 卸载已存在的 Node.js（必须）
2. 从 GitHub 发布页面下载 nvm-windows 安装包
3. 以管理员身份运行安装程序
4. 验证安装：`nvm version`

**macOS/Linux 系统**：
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```
安装后重启终端或执行：
```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

### Node.js 版本安装与管理

**安装最新 LTS 版本**：
```bash
nvm install --lts
```

**安装特定版本**：
```bash
nvm install 16.14.2
```

**查看已安装版本**：
```bash
nvm ls
```

**切换 Node.js 版本**：
```bash
nvm use 16.14.2
```

**设置默认版本**：
```bash
nvm alias default 16.14.2
```

### nvm 工作原理

nvm 通过修改 **PATH 环境变量** 来实现版本切换。当你使用 `nvm use` 命令时，它实际上是将指定版本的 Node.js 二进制文件路径添加到环境变量最前面：

```
原始 PATH: /usr/local/bin:/usr/bin:/bin
使用 nvm use 16.14.2 后:
PATH: ~/.nvm/versions/node/v16.14.2/bin:/usr/local/bin:/usr/bin:/bin
```

这种设计使得系统会优先使用 nvm 管理的 Node.js 版本，而不会影响系统全局安装的其他软件。

## 使用安装包直接安装

### 官方安装包

可以从 Node.js 官网下载页面获取官方安装包。建议选择标记为 **LTS** (长期支持) 的版本，因为这些版本更加稳定且与 npm 充分测试过。

### 包管理器安装

**Ubuntu/Debian**：
```bash
sudo apt-get update
sudo apt-get install -y nodejs
```

**CentOS/RHEL**：
```bash
sudo yum install -y nodejs npm --enablerepo epel
```

### 直接安装的优缺点

**优点**：
- 安装过程简单直接
- 系统环境变量自动配置

**缺点**：
- 可能导致权限错误
- 难以管理多个 Node.js 版本
- 全局安装包可能产生冲突

## 环境配置详解

### 环境变量配置

**Linux/macOS 永久配置**：
编辑 `~/.bashrc` 或 `~/.zshrc` 文件，添加：
```bash
export PATH=$PATH:/usr/local/node/bin
```
然后重新加载配置：`source ~/.bashrc`

**Windows 环境变量**：
1. 打开"系统属性"→"高级"→"环境变量"
2. 在用户变量中添加：
   - `NVM_HOME: C:\Users\用户名\AppData\Roaming\nvm`
   - `NVM_SYMLINK: C:\Program Files\nodejs`
3. 修改 Path 变量，添加：`%NVM_HOME%` 和 `%NVM_SYMLINK%`

### npm 全局路径配置

为避免全局模块占用 C 盘空间，可以配置自定义全局路径：

```bash
# 创建全局模块目录
mkdir node_global node_cache

# 配置 npm 使用自定义路径
npm config set prefix D:\app_install\nodejs\node_global
npm config set cache D:\app_install\nodejs\node_cache
```

### 项目级环境配置

在项目根目录创建 `.env` 文件：
```env
PORT=3000
DB_HOST=localhost
DB_USER=username
DB_PASSWORD=password
```

在代码中使用 `dotenv` 加载环境变量：
```javascript
require('dotenv').config()
console.log(process.env.PORT); // 输出: 3000
```

## 镜像源优化配置

### npm 镜像配置

**临时使用淘宝镜像**：
```bash
npm install --registry=https://registry.npmmirror.com
```

**永久配置镜像**：
```bash
npm config set registry https://registry.npmmirror.com
```

**验证配置**：
```bash
npm config get registry
```

### 使用 nrm 管理镜像源

nrm 是专门的 npm 镜像源管理工具：

```bash
# 安装 nrm
npm install -g nrm

# 查看可用镜像列表
nrm ls

# 使用淘宝镜像
nrm use taobao

# 测试镜像速度
nrm test
```

### 其他包管理器镜像配置

**yarn 镜像配置**：
```bash
yarn config set registry https://registry.npmmirror.com/
```

**pnpm 镜像配置**：
```bash
pnpm config set registry https://registry.npmmirror.com/
```

## 验证安装与基本使用

### 安装验证

检查 Node.js 和 npm 是否成功安装：
```bash
node -v
npm -v
```

### 创建简单的 HTTP 服务器

创建一个 `example.js` 文件：
```javascript
const http = require('node:http');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello, Node.js!\n');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
```

运行服务器：
```bash
node example.js
```

在浏览器中访问 `http://127.0.0.1:3000`，将看到 "Hello, Node.js!" 消息。

### 包管理基础操作

**安装项目依赖**：
```bash
# 生产环境依赖
npm install express --save

# 开发环境依赖
npm install typescript --save-dev
```

**全局包管理**：
```bash
# 全局安装
npm install -g pm2

# 全局卸载
npm uninstall -g pm2
```

## 故障排除与最佳实践

### 常见问题解决

**问题1：nvm: command not found**
- 原因：环境变量未正确配置
- 解决：重新加载 shell 配置（`source ~/.bashrc`）或检查系统环境变量

**问题2：版本切换无效**
- 原因：存在全局安装的 Node
- 解决：卸载全局 Node，检查 PATH 顺序确保 nvm 路径优先

**问题3：权限错误**
- 原因：使用 Node 安装程序时，npm 被安装在具有本地权限的目录中
- 解决：使用 nvm 安装 Node.js，或手动更改 npm 默认目录权限

### 最佳实践建议

1. **版本策略**：
   - 主开发环境使用最新 LTS 版本
   - 为每个项目创建 `.nvmrc` 文件
   - 定期清理未使用的旧版本

2. **项目配置**：
   在项目根目录创建 `.nvmrc` 文件：
   ```
   16.14.2
   ```
   进入项目目录后执行：`nvm use`

3. **性能优化**：
   - 使用异步编程避免阻塞事件循环
   - 处理大量数据时使用 Streams
   - 合理管理内存，避免内存泄漏

4. **安全建议**：
   - 仅从官方源安装 nvm
   - 定期更新 nvm 版本
   - 验证下载包的校验和