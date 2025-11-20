# Electron 安全

Electron 安全是构建跨平台桌面应用程序的核心考量。由于 Electron 融合了 Node.js 的后端能力与 Chromium 的前端渲染能力，这种独特的架构在为开发者提供强大功能的同时，也引入了特有的安全挑战。理解并实施全面的安全防护策略，对于保护应用程序和用户数据至关重要。

## 安全架构基础

Electron 的安全架构建立在进程隔离和权限控制的基础之上。应用程序分为主进程和渲染进程，每个进程具有不同的权限级别和能力范围。

```
Electron 安全架构层次：

    应用程序层面
    |
    +-- 主进程 (完全系统权限)
    |     |
    |     +-- Node.js 完整访问权限
    |     +-- 文件系统操作
    |     +-- 系统 API 调用
    |
    +-- 渲染进程 (受限环境)
          |
          +-- Web 内容渲染
          +-- 通过预加载脚本有限访问 Node.js
          +-- 沙盒环境执行
```

主进程作为应用程序的入口点，拥有完整的 Node.js 环境访问权限，可以执行系统级操作。渲染进程负责显示用户界面，默认情况下应该运行在受限环境中，通过精心控制的通道与主进程通信。

## 上下文隔离

上下文隔离是 Electron 中一项关键的安全特性，它确保预加载脚本和 Electron 内部逻辑运行在独立于网页内容的上下文环境中。

### 上下文隔离的工作原理

启用上下文隔离后，预加载脚本中的 `window` 对象与网页中的 `window` 对象完全隔离。这意味着网页内容无法直接访问预加载脚本中暴露的高权限 API。

```
隔离前（危险）：
渲染进程网页 → 直接访问 → 预加载脚本的 Node.js API

隔离后（安全）：
渲染进程网页 → 上下文隔离边界 → 预加载脚本的 Node.js API
                     |
                     +-- 通过 contextBridge 安全通信
```

### 配置上下文隔离

在主进程创建 BrowserWindow 时启用上下文隔离：

```javascript
// main.js
const { app, BrowserWindow } = require('electron')

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true, // 启用上下文隔离
      preload: path.join(__dirname, 'preload.js'),
    },
  })
  win.loadFile('index.html')
}
```

在预加载脚本中使用 contextBridge 安全地暴露 API：

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
  showDialog: (options) => ipcRenderer.invoke('show-dialog', options),
})
```

从 Electron 12 开始，上下文隔离默认启用，这是官方强烈推荐的安全配置。

## 沙盒机制

沙盒是 Chromium 的关键安全特性，它使用操作系统功能来严格限制渲染器进程可以访问的资源。

### 沙盒的工作原理

沙盒化的进程只能自由使用 CPU 周期和内存。为了执行需要额外权限的操作，沙盒化的进程通过专用通信渠道将任务委托给更高权限的进程。

```
沙盒化渲染进程：

    渲染进程 (沙盒内)
    |
    +-- 只能访问 CPU 和内存
    +-- 无法直接访问：
          |
          +-- 文件系统
          +-- 网络
          +-- 系统设备
    |
    +-- 通过 IPC 将特权操作委托给主进程
```

### 沙盒配置

从 Electron 20 开始，渲染进程默认启用了沙盒，无需进一步配置。但你也可以显式配置沙盒设置：

```javascript
// main.js
app.whenReady().then(() => {
  const win = new BrowserWindow({
    webPreferences: {
      sandbox: true, // 显式启用沙盒
    },
  })
  win.loadURL('https://google.com')
})
```

需要注意的是，沙盒与 Node.js 集成是互斥的。启用渲染进程的 Node.js 集成 (通过设置 `nodeIntegration: true`) 会禁用该进程的沙盒。

## 进程间通信安全

进程间通信是 Electron 应用中连接主进程和渲染进程的桥梁，确保 IPC 通信的安全至关重要。

### 安全的 IPC 模式

所有从渲染进程发起的特权操作都应该通过 IPC 请求主进程执行：

```javascript
// main.js - IPC 处理器
const { ipcMain, dialog } = require('electron')
const fs = require('fs').promises

// 安全地处理文件读取请求
ipcMain.handle('file:read', async (event, filePath) => {
  // 验证文件路径合法性
  if (!isValidPath(filePath)) {
    throw new Error('无效的文件路径')
  }

  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return content
  } catch (error) {
    console.error('文件读取失败:', error)
    throw error
  }
})

// 显示对话框的 IPC 处理器
ipcMain.handle('show-dialog', async (event, options) => {
  return dialog.showMessageBox(options)
})
```

### 输入验证和清理

对所有从渲染进程接收的输入进行严格验证：

```javascript
// 输入验证工具函数
function isValidPath(filePath) {
  // 防止路径遍历攻击
  if (filePath.includes('..')) return false

  // 限制文件路径到特定目录
  const allowedBase = process.cwd()
  const resolvedPath = path.resolve(filePath)

  return resolvedPath.startsWith(allowedBase)
}

function sanitizeInput(input) {
  // 移除潜在的恶意字符
  return input.replace(/[<>'";()]/g, '')
}
```

## 内容安全策略

内容安全策略是防御跨站脚本攻击的关键技术，通过白名单机制控制应用程序可以加载和执行的资源。

### CSP 配置

在 HTML 文件中通过 meta 标签设置 CSP：

```html
<!DOCTYPE html>
<html>
  <head>
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self'; 
                   script-src 'self' 'unsafe-inline'; 
                   style-src 'self' 'unsafe-inline'; 
                   img-src 'self' data: https:;"
    />
    <title>安全的 Electron 应用</title>
  </head>
  <body>
    <div id="app"></div>
    <script src="./renderer.js"></script>
  </body>
</html>
```

### CSP 指令说明

- **default-src ‘self’**：默认只允许加载同源资源
- **script-src ‘self’**：只允许执行同源脚本
- **style-src ‘self’ ‘unsafe-inline’**：允许同源样式和内联样式
- **img-src ‘self’ data：https：**：允许同源图片、data URL 和 HTTPS 图片

## Node.js 集成安全

Node.js 集成为渲染进程提供了强大的系统访问能力，但同时也带来了显著的安全风险。

### 安全的 Node.js 配置

最安全的做法是在渲染进程中完全禁用 Node.js 集成：

```javascript
// main.js
function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false, // 禁用 Node.js 集成
      contextIsolation: true, // 启用上下文隔离
      sandbox: true, // 启用沙盒
      preload: path.join(__dirname, 'preload.js'),
    },
  })
  win.loadFile('index.html')
}
```

### 预加载脚本安全实践

预加载脚本在特权上下文中运行，需要特别小心：

```javascript
// preload.js - 安全的预加载脚本示例
const { contextBridge, ipcRenderer } = require('electron')

// 输入验证函数
const validateInput = (input) => {
  if (typeof input !== 'string') return false
  // 实施具体的验证逻辑
  return true
}

// 安全地暴露 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 只暴露必要的功能
  readFile: (filePath) => {
    if (!validateInput(filePath)) {
      return Promise.reject(new Error('无效输入'))
    }
    return ipcRenderer.invoke('file:read', filePath)
  },

  // 记录所有操作
  logOperation: (operation) => {
    if (!validateInput(operation)) return
    ipcRenderer.invoke('log-operation', operation)
  },
})
```

## 安全配置汇总

以下是 Electron 应用的安全配置最佳实践汇总：

```javascript
// 安全的主进程配置
function createSecureWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // 核心安全设置
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,

      // 预加载脚本
      preload: path.join(__dirname, 'preload.js'),

      // 实验性功能
      experimentalFeatures: false,

      // 其他安全设置
      webgl: false,
      plugins: false,
    },
  })

  // 加载本地文件或可信的 HTTPS 源
  win.loadFile('index.html')

  // 开发时打开开发者工具，生产环境关闭
  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools()
  }
}
```

## 常见漏洞防护

### XSS 防护

跨站脚本攻击是 Electron 应用中最常见的安全威胁：

```javascript
// 渲染进程中的 XSS 防护
function safeHTML(unsafeText) {
  const div = document.createElement('div')
  div.textContent = unsafeText
  return div.innerHTML
}

// 安全地显示用户内容
function displayUserContent(userContent) {
  const element = document.getElementById('content')
  // 错误做法：直接设置 innerHTML
  // element.innerHTML = userContent

  // 正确做法：使用 textContent 或 sanitize
  element.textContent = userContent
}
```

### 安全依赖管理

定期更新 Electron 和依赖包以修复已知漏洞：

```javascript
// package.json 中的安全实践
{
  "name": "secure-electron-app",
  "version": "1.0.0",
  "dependencies": {
    "electron": "^37.2.5" // 使用已知安全的版本
  },
  "scripts": {
    "audit": "npm audit", // 定期运行安全审计
    "update": "npm update --save-dev"
  }
}
```

根据安全公告，确保使用不受已知漏洞影响的 Electron 版本非常重要。

## 生产环境加固

### 应用程序打包加固

使用 ASAR 打包和完整性检查：

```javascript
// 启用 ASAR 完整性验证
app.enableSandbox()
app.configureHostResolver({ enableBuiltInResolver: true })

// 防止篡改检测
function verifyApplicationIntegrity() {
  // 实现应用程序完整性检查逻辑
  const expectedHashes = loadExpectedHashes()
  const currentHashes = calculateFileHashes()

  return compareHashes(expectedHashes, currentHashes)
}
```

### 运行时安全监控

实施安全监控和异常检测：

```javascript
// 安全事件监控
const securityEvents = {
  logSecurityEvent: (eventType, details) => {
    console.log(`安全事件: ${eventType}`, details)
    // 发送到安全监控服务
    ipcRenderer.invoke('log-security-event', {
      type: eventType,
      details: details,
      timestamp: Date.now(),
    })
  },

  detectAnomalies: () => {
    // 检测异常行为模式
    const suspiciousPatterns = ['多次认证失败', '异常文件访问', '可疑网络连接']
    // 实现检测逻辑
  },
}
```

Electron 安全是一个持续的过程，需要结合严格的安全策略、适当的技术控制和持续的监控维护。通过实施这些安全措施，你可以显著降低 Electron 应用程序的安全风险，保护用户数据和系统资源免受威胁。
