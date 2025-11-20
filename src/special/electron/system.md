# Electron 系统功能开发

## 系统功能开发概述

Electron 系统功能开发指的是利用 Electron 提供的 API 与操作系统底层功能进行交互的能力。与传统 Web 应用不同，Electron 允许开发者突破浏览器沙箱限制，**直接访问文件系统、系统对话框、菜单栏、托盘图标等原生桌面功能**。这种能力主要通过在主进程中调用 Node.js API 和在渲染进程中通过预加载脚本安全地暴露系统功能来实现。

系统功能开发的核心在于理解 Electron 的**多进程架构**和**安全通信机制**。主进程作为应用的核心，拥有完整的 Node.js 访问权限，而渲染进程运行在相对安全的沙箱环境中，两者通过 IPC (进程间通信) 进行安全的数据交换。

## 进程间通信机制

### 主进程与渲染进程通信

Electron 应用由一个主进程和多个渲染进程组成。主进程负责创建和管理应用窗口，而每个窗口运行在独立的渲染进程中。进程间通信是系统功能开发的基础。

```
主进程 (Node.js 环境)
    ↑
    | IPC
    ↓
渲染进程 (Chromium 环境)
```

### 安全的上下文桥接

现代 Electron 应用推荐使用 `contextBridge` 在隔离的上下文中创建安全的桥梁。这可以防止渲染进程直接访问 Node.js API，同时暴露必要的系统功能。

```javascript
// preload.js (预加载脚本)
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (content) => ipcRenderer.invoke('file:save', content),
  getSystemInfo: () => ipcRenderer.invoke('system:info'),
})
```

在主进程中处理这些 IPC 调用：

```javascript
// main.js (主进程)
import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { readFile, writeFile } from 'fs/promises'
import { platform } from 'os'

function createWindow() {
  const win = new BrowserWindow({
    webPreferences: {
      preload: path.join(process.cwd(), 'preload.js'),
      contextIsolation: true, // 启用上下文隔离
      nodeIntegration: false, // 禁用 Node.js 集成以提高安全性
    },
  })

  win.loadFile('index.html')
}

// 处理文件打开请求
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  })

  if (!result.canceled && result.filePaths.length > 0) {
    const content = await readFile(result.filePaths[0], 'utf-8')
    return { content, path: result.filePaths[0] }
  }
  return null
})

// 处理文件保存请求
ipcMain.handle('file:save', async (event, content) => {
  const result = await dialog.showSaveDialog({
    filters: [
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  })

  if (!result.canceled) {
    await writeFile(result.filePath, content, 'utf-8')
    return { success: true, path: result.filePath }
  }
  return { success: false }
})

// 获取系统信息
ipcMain.handle('system:info', () => {
  return {
    platform: platform(),
    arch: process.arch,
    versions: process.versions,
    memory: process.memoryUsage(),
  }
})

app.whenReady().then(createWindow)
```

在渲染进程中调用暴露的 API：

```javascript
// renderer.js (渲染进程)
document.getElementById('open-file-btn').addEventListener('click', async () => {
  try {
    const fileData = await window.electronAPI.openFile()
    if (fileData) {
      document.getElementById('editor').value = fileData.content
      console.log('文件已加载:', fileData.path)
    }
  } catch (error) {
    console.error('打开文件失败:', error)
  }
})

// 获取系统信息
window.electronAPI.getSystemInfo().then((info) => {
  console.log('系统信息:', info)
})
```

## 常用系统功能开发

### 文件系统操作

Electron 通过 Node.js 的 fs 模块提供完整的文件系统访问能力。

```javascript
// main.js 中的文件操作处理程序
import { readdir, stat, mkdir, unlink, readFile, writeFile } from 'fs/promises'
import { homedir } from 'os'
import { join, basename, extname } from 'path'

// 列出目录内容
ipcMain.handle('fs:listDirectory', async (event, dirPath = homedir()) => {
  try {
    const items = await readdir(dirPath)
    const detailedItems = await Promise.all(
      items.map(async (item) => {
        const itemPath = join(dirPath, item)
        const itemStat = await stat(itemPath)
        return {
          name: item,
          path: itemPath,
          isDirectory: itemStat.isDirectory(),
          size: itemStat.size,
          modified: itemStat.mtime,
          extension: itemStat.isFile() ? extname(item) : '',
        }
      })
    )

    return {
      success: true,
      path: dirPath,
      items: detailedItems,
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 创建目录
ipcMain.handle('fs:createDirectory', async (event, parentPath, dirName) => {
  try {
    const newDirPath = join(parentPath, dirName)
    await mkdir(newDirPath)
    return { success: true, path: newDirPath }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 删除文件
ipcMain.handle('fs:deleteFile', async (event, filePath) => {
  try {
    await unlink(filePath)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})
```

在预加载脚本中暴露这些功能：

```javascript
// preload.js - 文件系统 API
contextBridge.exposeInMainWorld('fileSystemAPI', {
  listDirectory: (path) => ipcRenderer.invoke('fs:listDirectory', path),
  createDirectory: (parentPath, dirName) =>
    ipcRenderer.invoke('fs:createDirectory', parentPath, dirName),
  deleteFile: (filePath) => ipcRenderer.invoke('fs:deleteFile', filePath),
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath, content) =>
    ipcRenderer.invoke('fs:writeFile', filePath, content),
})
```

### 系统对话框与原生界面

Electron 的 `dialog` 模块提供系统原生对话框。

```javascript
// main.js - 对话框处理
import { dialog, shell, clipboard, nativeImage } from 'electron'

// 显示消息对话框
ipcMain.handle('dialog:showMessage', async (event, options) => {
  const result = await dialog.showMessageBox({
    type: options.type || 'info',
    title: options.title || '提示',
    message: options.message,
    detail: options.detail,
    buttons: options.buttons || ['确定'],
    defaultId: 0,
    cancelId: 1,
  })

  return { response: result.response, checkboxChecked: result.checkboxChecked }
})

// 显示错误对话框
ipcMain.handle('dialog:showError', async (event, title, content) => {
  dialog.showErrorBox(title, content)
})

// 打开外部链接
ipcMain.handle('shell:openExternal', async (event, url) => {
  await shell.openExternal(url)
})

// 剪贴板操作
ipcMain.handle('clipboard:writeText', async (event, text) => {
  clipboard.writeText(text)
  return { success: true }
})

ipcMain.handle('clipboard:readText', async () => {
  return clipboard.readText()
})

// 图像剪贴板操作
ipcMain.handle('clipboard:writeImage', async (event, imageData) => {
  const image = nativeImage.createFromDataURL(imageData)
  clipboard.writeImage(image)
  return { success: true }
})
```

### 系统托盘与菜单

系统托盘图标和自定义菜单是桌面应用的特色功能。

```javascript
// main.js - 系统托盘和菜单
import { Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'

let tray = null

function createTray() {
  // 创建托盘图标
  const iconPath = join(process.cwd(), 'assets', 'tray-icon.png')
  const trayIcon = nativeImage
    .createFromPath(iconPath)
    .resize({ width: 16, height: 16 })

  tray = new Tray(trayIcon)

  // 创建上下文菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主窗口',
      click: () => {
        const mainWindow = BrowserWindow.getAllWindows()[0]
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        }
      },
    },
    {
      label: '退出',
      click: () => {
        app.quit()
      },
    },
  ])

  tray.setToolTip('我的 Electron 应用')
  tray.setContextMenu(contextMenu)

  // 托盘图标点击事件
  tray.on('click', () => {
    const mainWindow = BrowserWindow.getAllWindows()[0]
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
        mainWindow.focus()
      }
    }
  })
}

// 创建应用菜单
function createApplicationMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            // 新建文件逻辑
          },
        },
        {
          label: '打开',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog({
              properties: ['openFile'],
            })
            // 处理打开的文件
          },
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          },
        },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'forceReload', label: '强制重新加载' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '实际大小' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '切换全屏' },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

app.whenReady().then(() => {
  createWindow()
  createTray()
  createApplicationMenu()
})
```

## 常用开源库与 API

### electron-store - 应用配置存储

`electron-store` 提供简单易用的持久化配置存储。

```javascript
// stores/configStore.js
import Store from 'electron-store'

// 初始化配置存储
const store = new Store({
  name: 'app-config',
  defaults: {
    windowBounds: { width: 800, height: 600 },
    recentFiles: [],
    userPreferences: {
      theme: 'light',
      language: 'zh-CN',
      autoSave: true,
      saveInterval: 30000,
    },
  },
})

// 在主进程中暴露存储操作
ipcMain.handle('store:get', (event, key, defaultValue) => {
  return store.get(key, defaultValue)
})

ipcMain.handle('store:set', (event, key, value) => {
  store.set(key, value)
  return { success: true }
})

ipcMain.handle('store:delete', (event, key) => {
  store.delete(key)
  return { success: true }
})

ipcMain.handle('store:clear', () => {
  store.clear()
  return { success: true }
})

export default store
```

在渲染进程中使用：

```javascript
// renderer.js - 使用配置存储
const configAPI = {
  async getConfig(key, defaultValue) {
    return await window.electronAPI.invoke('store:get', key, defaultValue)
  },

  async setConfig(key, value) {
    return await window.electronAPI.invoke('store:set', key, value)
  },

  async getUserPreferences() {
    return await this.getConfig('userPreferences')
  },

  async updateUserPreferences(updates) {
    const current = await this.getUserPreferences()
    const updated = { ...current, ...updates }
    return await this.setConfig('userPreferences', updated)
  },
}

// 使用示例
async function loadUserSettings() {
  const prefs = await configAPI.getUserPreferences()
  applyTheme(prefs.theme)
  setLanguage(prefs.language)
  setupAutoSave(prefs.autoSave, prefs.saveInterval)
}

async function saveWindowSize(width, height) {
  await configAPI.setConfig('windowBounds', { width, height })
}
```

### electron-updater - 自动更新

`electron-updater` 提供应用自动更新功能。

```javascript
// update/updateManager.js
import { autoUpdater } from 'electron-updater'
import { dialog, BrowserWindow } from 'electron'

class UpdateManager {
  constructor() {
    this.mainWindow = null
    this.setupAutoUpdater()
  }

  setMainWindow(window) {
    this.mainWindow = window
  }

  setupAutoUpdater() {
    // 配置自动更新
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = true

    // 更新可用
    autoUpdater.on('update-available', (info) => {
      if (this.mainWindow) {
        this.mainWindow.webContents.send('update-available', info)
      }

      dialog
        .showMessageBox(this.mainWindow, {
          type: 'info',
          title: '发现新版本',
          message: `发现新版本 ${info.version}，是否立即下载？`,
          detail: info.releaseNotes || '新版本包含功能改进和错误修复。',
          buttons: ['下载', '取消'],
          defaultId: 0,
          cancelId: 1,
        })
        .then((result) => {
          if (result.response === 0) {
            autoUpdater.downloadUpdate()
          }
        })
    })

    // 更新下载进度
    autoUpdater.on('download-progress', (progressObj) => {
      if (this.mainWindow) {
        this.mainWindow.webContents.send('download-progress', progressObj)
      }
    })

    // 更新下载完成
    autoUpdater.on('update-downloaded', (info) => {
      dialog
        .showMessageBox(this.mainWindow, {
          type: 'info',
          title: '更新下载完成',
          message: '新版本已下载完成，是否立即重启应用？',
          buttons: ['立即重启', '稍后重启'],
          defaultId: 0,
          cancelId: 1,
        })
        .then((result) => {
          if (result.response === 0) {
            autoUpdater.quitAndInstall()
          }
        })
    })

    // 错误处理
    autoUpdater.on('error', (error) => {
      if (this.mainWindow) {
        this.mainWindow.webContents.send('update-error', error)
      }
      console.error('自动更新错误:', error)
    })
  }

  // 检查更新
  checkForUpdates() {
    autoUpdater.checkForUpdates()
  }
}

export default UpdateManager
```

在主进程中初始化：

```javascript
// main.js - 初始化自动更新
import UpdateManager from './update/updateManager.js'

const updateManager = new UpdateManager()

app.whenReady().then(() => {
  const mainWindow = createWindow()
  updateManager.setMainWindow(mainWindow)

  // 应用启动后检查更新
  setTimeout(() => {
    updateManager.checkForUpdates()
  }, 5000)
})

// 暴露更新检查功能
ipcMain.handle('updater:checkForUpdates', () => {
  updateManager.checkForUpdates()
})
```

### electron-log - 日志记录

`electron-log` 提供跨平台的日志记录功能。

```javascript
// utils/logger.js
import log from 'electron-log'

// 配置日志
log.transports.file.resolvePath = (variables) => {
  return `${app.getPath('userData')}/logs/main.log`
}

log.transports.file.level = 'info'
log.transports.console.level = 'debug'

// 在主进程中暴露日志功能
ipcMain.handle('log:info', (event, message, ...meta) => {
  log.info(message, ...meta)
})

ipcMain.handle('log:error', (event, message, ...meta) => {
  log.error(message, ...meta)
})

ipcMain.handle('log:warn', (event, message, ...meta) => {
  log.warn(message, ...meta)
})

ipcMain.handle('log:debug', (event, message, ...meta) => {
  log.debug(message, ...meta)
})

export default log
```

在预加载脚本中暴露日志 API：

```javascript
// preload.js - 日志 API
contextBridge.exposeInMainWorld('loggerAPI', {
  info: (message, ...meta) => ipcRenderer.invoke('log:info', message, ...meta),
  error: (message, ...meta) =>
    ipcRenderer.invoke('log:error', message, ...meta),
  warn: (message, ...meta) => ipcRenderer.invoke('log:warn', message, ...meta),
  debug: (message, ...meta) =>
    ipcRenderer.invoke('log:debug', message, ...meta),
})
```

在渲染进程中使用：

```javascript
// renderer.js - 记录日志
try {
  window.loggerAPI.info('应用程序启动', { timestamp: new Date().toISOString() })

  // 业务逻辑...

  window.loggerAPI.debug('用户执行了某个操作', { userId: 123, action: 'click' })
} catch (error) {
  window.loggerAPI.error('操作执行失败', error)
}
```

## 模块化项目结构

推荐的项目结构组织方式：

```
your-electron-app/
├── package.json
├── main.js                      # 主进程入口文件
├── preload.js                   # 预加载脚本入口
├── src/
│   ├── main/                    # 主进程代码
│   │   ├── core/                # 核心模块
│   │   │   ├── windowManager.js # 窗口管理
│   │   │   ├── menuManager.js   # 菜单管理
│   │   │   └── ipcHandlers.js   # IPC 处理器
│   │   ├── modules/             # 功能模块
│   │   │   ├── fileSystem.js    # 文件系统操作
│   │   │   ├── autoUpdater.js   # 自动更新
│   │   │   └── systemTray.js    # 系统托盘
│   │   └── utils/               # 工具函数
│   │       ├── logger.js        # 日志工具
│   │       └── helpers.js       # 辅助函数
│   ├── renderer/                # 渲染进程代码
│   │   ├── public/              # 静态资源
│   │   └── src/
│   │       ├── components/      # UI 组件
│   │       ├── services/        # 业务服务
│   │       │   ├── electronAPI.js # Electron API 封装
│   │       │   └── configService.js # 配置服务
│   │       └── utils/           # 渲染进程工具
│   └── shared/                  # 共享代码
│       ├── constants.js         # 共享常量
│       └── ipcChannels.js       # IPC 通道定义
└── assets/                      # 应用资源
    ├── icons/                   # 图标文件
    └── images/                  # 图片资源
```

## 安全最佳实践

在开发系统功能时，安全至关重要。

```javascript
// 安全配置示例
function createSecureWindow() {
  const win = new BrowserWindow({
    webPreferences: {
      preload: path.join(process.cwd(), 'preload.js'),
      contextIsolation: true, // 启用上下文隔离
      nodeIntegration: false, // 禁用 Node.js 集成
      enableRemoteModule: false, // 禁用远程模块
      webSecurity: true, // 启用 Web 安全
      allowRunningInsecureContent: false, // 禁止运行不安全内容
      experimentalFeatures: false, // 禁用实验性功能
    },
  })

  // 加载内容安全策略
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: https:;",
        ],
      },
    })
  })

  return win
}
```
