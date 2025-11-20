# Electron 快速开始

Electron 是一个用于构建跨平台桌面应用程序的框架，它允许你使用 Web 技术 (如 JavaScript、HTML 和 CSS) 来开发应用。通过将 Chromium 和 Node.js 嵌入到一个二进制文件中，Electron 让你可以维护一个代码库，并创建能在 Windows、macOS 和 Linux 上运行的应用程序，而无需原生开发经验。

## 环境搭建与项目初始化

### 环境准备

在开始之前，确保你的系统已安装 Node.js 和 npm。Electron 依赖于 Node.js 运行时环境，你可以从 Node.js 官网下载并安装最新版本。

避免使用 WSL

如果你在 Windows 机器上，请避免使用 Windows Subsystem for Linux (WSL) 来跟随本教程，因为在尝试执行应用程序时可能会遇到问题。

### 初始化项目

首先创建一个新目录并初始化 npm 项目：

```
mkdir my-electron-app && cd my-electron-app
npm init
```

初始化过程中，系统会提示你配置 package.json 中的一些字段。遵循以下规则：

- 入口点应设置为 `main.js` (你稍后将创建此文件)
- 作者、许可证和描述可以是任意值，但对于后续的打包是必要的

### 安装 Electron

将 Electron 安装到项目的 devDependencies 中：

```
npm install electron --save-dev
```

为什么 Electron 是开发依赖？

这可能看起来违反直觉，因为你的生产代码运行着 Electron API。在底层，Electron 的 JavaScript API 绑定到一个包含其实现的二进制文件。Electron 的打包步骤会处理此二进制的捆绑，因此无需将其指定为生产依赖。

安装完成后，你的 package.json 应该类似这样：

```json
{
  "name": "my-electron-app",
  "version": "1.0.0",
  "description": "Hello World!",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "Jane Doe",
  "license": "MIT",
  "devDependencies": {
    "electron": "23.1.3"
  }
}
```

注意我们添加了一个 `start` 脚本，用于运行 Electron 应用程序。

## Electron 应用架构

### 进程模型

Electron 应用采用多进程架构，主要包括两个部分：

```
主进程 (Main Process)
 |
 +-- 创建和管理渲染器进程
 +-- 控制应用生命周期 (app)
 +-- 使用原生 GUI 相关 API
 |
 +-- 渲染器进程 (Renderer Process)
      |
      +-- 显示 Web 内容 (基于 Chromium)
      +-- 运行在独立的进程中
      +-- 可通过 Node.js 访问系统资源
```

**主进程**作为应用程序的入口点，控制应用的生命周期，并负责创建和管理渲染器进程。它在 Node.js 环境中运行，可以访问操作系统 API。

**渲染器进程**负责显示用户界面。每个 Electron 窗口运行在自己的渲染器进程中，这些进程基本上是独立的 Chromium 浏览器实例。

### 进程间通信 (IPC)

主进程和渲染器进程通过进程间通信 (IPC) 机制进行通信：

```
主进程 (ipcMain) <---> 渲染器进程 (ipcRenderer)
```

Electron 提供了 `ipcMain` 和 `ipcRenderer` 模块，允许进程之间发送异步和同步消息。

## 创建第一个应用程序

### 主进程脚本

创建 `main.js` 文件作为应用程序的入口点：

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  // 创建浏览器窗口
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js') // 预加载脚本
    }
  });

  // 加载 index.html
  mainWindow.loadFile('index.html');
  
  // 打开开发工具 (可选)
  // mainWindow.webContents.openDevTools();
}

// 当 Electron 完成初始化并准备创建浏览器窗口时，调用此方法
app.whenReady().then(() => {
  createWindow();

  // 在 macOS 上，当单击 dock 图标并且没有其他窗口打开时，
  // 通常会在应用程序中重新创建一个窗口
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 当所有窗口都关闭时退出应用程序，macOS 除外
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
```

### 预加载脚本

创建 `preload.js` 文件，用于安全地在渲染器进程和主进程之间暴露 API：

```javascript
const { contextBridge, ipcRenderer } = require('electron');

// 通过 contextBridge 将受保护的 API 暴露给渲染器进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 这里可以暴露一些安全的 Node.js API 或自定义功能
});
```

### 创建用户界面

创建 `index.html` 文件作为应用程序的用户界面：

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Hello Electron!</title>
    <meta http-equiv="Content-Security-Policy" content="script-src 'self' 'unsafe-inline';" />
</head>
<body>
    <h1>Hello Electron!</h1>
    <p>
        我们正在使用 Node.js <span id="node-version"></span>,
        Chromium <span id="chrome-version"></span>,
        和 Electron <span id="electron-version"></span>.
    </p>

    <script>
        // 显示版本信息
        window.addEventListener('DOMContentLoaded', () => {
            const replaceText = (selector, text) => {
                const element = document.getElementById(selector)
                if (element) element.innerText = text
            }

            for (const type of ['chrome', 'node', 'electron']) {
                replaceText(`${type}-version`, process.versions[type])
            }
        })
    </script>
</body>
</html>
```

### 运行应用程序

现在你可以运行你的第一个 Electron 应用程序：

```
npm start
```

这将启动 Electron 并显示一个包含“Hello Electron！”的窗口。

## 核心 API 详解

### BrowserWindow 选项

BrowserWindow 是 Electron 中最核心的模块之一，用于创建和控制浏览器窗口。常用配置选项包括：

```javascript
const win = new BrowserWindow({
  width: 800,           // 窗口宽度
  height: 600,          // 窗口高度
  minWidth: 400,        // 最小宽度
  minHeight: 300,       // 最小高度
  show: false,          // 初始不显示，等准备好后再显示
  webPreferences: {
    nodeIntegration: false,     // 不建议启用，安全性考虑
    contextIsolation: true,     // 推荐启用，安全性考虑
    preload: path.join(__dirname, 'preload.js') // 预加载脚本
  }
});

// 窗口准备好后显示，避免视觉闪烁
win.once('ready-to-show', () => {
  win.show();
});
```

### 进程间通信示例

以下是主进程与渲染器进程之间通信的完整示例：

**主进程 (main.js) 中添加：**

```javascript
const { app, BrowserWindow, ipcMain } = require('electron');

// 处理来自渲染器进程的异步消息
ipcMain.handle('perform-action', async (event, data) => {
  console.log('收到来自渲染器的数据:', data);
  
  // 执行一些操作，可能是文件系统操作或其他原生功能
  const result = await someAsyncOperation(data);
  
  // 返回结果给渲染器
  return { success: true, result };
});
```

**预加载脚本 (preload.js) 中暴露 API：**

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  performAction: (data) => ipcRenderer.invoke('perform-action', data)
});
```

**渲染器进程 (在 HTML 的 script 标签中) 调用：**

```javascript
// 在渲染器进程中调用暴露的 API
window.electronAPI.performAction({ message: 'Hello from renderer' })
  .then(response => {
    console.log('收到主进程的响应:', response);
  });
```

## 打包与分发

### 使用 Electron Forge

Electron Forge 是一个完整的工具，用于打包和分发 Electron 应用程序。

首先安装 Electron Forge：

```
npm install --save-dev @electron-forge/cli
npx electron-forge import
```

然后使用以下命令打包应用程序：

```
npm run make
```

这将为当前平台生成可分发的应用程序包。

### 构建配置

你可以在 `package.json` 或 `forge.config.js` 中配置构建选项：

```json
{
  "name": "my-electron-app",
  "version": "1.0.0",
  "config": {
    "forge": {
      "packagerConfig": {
        "name": "MyElectronApp",
        "executableName": "my-electron-app",
        "icon": "./assets/icon" // 不同平台需要不同格式的图标
      },
      "makers": [
        {
          "name": "@electron-forge/maker-squirrel",
          "config": {
            "name": "my_electron_app"
          }
        },
        {
          "name": "@electron-forge/maker-zip",
          "platforms": ["darwin"]
        },
        {
          "name": "@electron-forge/maker-deb",
          "config": {}
        }
      ]
    }
  }
}
```

## 开发技巧与最佳实践

### 开发环境调试

- **渲染器进程调试**：使用 `mainWindow.webContents.openDevTools()` 或在窗口打开后按 F12
- **主进程调试**：使用 `--inspect` 或 `--inspect-brk` 参数启动 Electron，然后在 Chrome 中访问 `chrome://inspect`

### 安全性建议

1. **禁用 Node.js 集成**：在不必要的渲染器中设置 `nodeIntegration: false`
2. **启用上下文隔离**：设置 `contextIsolation: true`
3. **使用预加载脚本**：安全地暴露必要的 API 给渲染器
4. **实施 CSP**：在 HTML 中添加内容安全策略元标签

### 性能优化

- 使用多个窗口时，合理管理窗口生命周期
- 对于重型任务，考虑在单独的 Node.js 子进程中执行
- 使用 `webFrame` API 优化渲染性能
- 合理使用懒加载和代码分割技术