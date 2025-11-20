# Electron 主进程

Electron 主进程是 Electron 应用程序的核心和控制中心，它作为整个应用的入口点，负责管理应用的生命周期、创建和管理所有窗口，以及与操作系统进行底层交互。每个 Electron 应用有且仅有一个主进程，它在 Node.js 环境中运行，拥有完整的系统 API 访问权限。

## 主进程的核心特性

主进程在 Electron 架构中扮演着独一无二的角色，具有以下关键特性：

- **单例模式**：整个应用程序中只存在一个主进程实例
- **Node.js 环境**：运行在完整的 Node.js 运行时中，可以访问所有 Node.js API
- **系统权限**：拥有访问文件系统、网络、系统对话框等操作系统功能的权限
- **生命周期管理**：控制应用程序的启动、运行和退出全过程
- **进程管理**：负责创建、管理和销毁所有渲染器进程

## 主进程的职责与功能

### 应用程序生命周期管理

主进程负责监听和处理应用程序的生命周期事件，从启动到退出的完整过程：

```
应用启动
    |
    +-- app.whenReady() → 应用初始化完成
    |         |
    |         +-- 创建第一个窗口
    |
    +-- app.on('window-all-closed') → 所有窗口关闭
    |         |
    |         +-- 判断是否退出应用 (macOS 特殊处理)
    |
    +-- app.on('before-quit') → 退出前清理
    |         |
    |         +-- 保存数据、释放资源
    |
    +-- app.on('will-quit') → 最终退出
```

### 窗口管理

主进程负责创建和管理所有 BrowserWindow 实例：

```javascript
const { BrowserWindow } = require('electron');

function createMainWindow() {
  // 创建主窗口
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false, // 初始不显示，避免视觉闪烁
    titleBarStyle: 'default',
    trafficLightPosition: { x: 16, y: 16 } // macOS 交通灯位置
  });

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // 处理窗口关闭事件
  mainWindow.on('close', (event) => {
    if (mainWindow.isDocumentEdited()) {
      // 阻止关闭，先保存文档
      event.preventDefault();
      saveDocumentBeforeClose();
    }
  });

  return mainWindow;
}
```

### 菜单系统管理

主进程负责创建应用程序菜单、上下文菜单和系统托盘菜单：

```javascript
const { Menu, MenuItem, Tray } = require('electron');

// 创建应用菜单
function createApplicationMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建',
          accelerator: 'CmdOrCtrl+N',
          click: () => { createNewDocument(); }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => { app.quit(); }
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 创建上下文菜单
function createContextMenu() {
  const contextMenu = new Menu();
  contextMenu.append(new MenuItem({
    label: '刷新',
    click: () => { reloadCurrentWindow(); }
  }));
  
  // 在渲染器中通过 IPC 显示上下文菜单
  ipcMain.on('show-context-menu', (event) => {
    contextMenu.popup(BrowserWindow.fromWebContents(event.sender));
  });
}
```

## 核心模块详解

### app 模块

app 模块控制应用程序的事件生命周期，是主进程中最核心的模块：

```javascript
const { app } = require('electron');

// 应用准备就绪
app.whenReady().then(() => {
  createMainWindow();
  createApplicationMenu();
  initializeAppServices();
});

// 所有窗口关闭时的处理
app.on('window-all-closed', () => {
  // 在 macOS 上，除非用户明确按 Cmd + Q，否则应用和菜单栏保持活动状态
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// macOS 重新激活应用
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// 阻止应用多个实例
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // 当运行第二个实例时，聚焦到主窗口
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
```

### BrowserWindow 模块

BrowserWindow 模块用于创建和控制浏览器窗口，支持丰富的配置选项：

```javascript
const { BrowserWindow } = require('electron');

// 高级窗口配置示例
function createAdvancedWindow() {
  const win = new BrowserWindow({
    // 基础配置
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    
    // 窗口特性
    title: '我的应用',
    icon: path.join(__dirname, 'assets/icon.png'), // 窗口图标
    show: false, // 初始隐藏，避免闪烁
    frame: true, // 是否显示窗口边框
    titleBarStyle: 'hiddenInset', // macOS 隐藏标题栏风格
    thickFrame: true, // Windows 厚边框
    
    // 窗口行为
    resizable: true,
    maximizable: true,
    minimizable: true,
    closable: true,
    alwaysOnTop: false,
    fullscreenable: true,
    
    // 安全配置
    webPreferences: {
      nodeIntegration: false, // 禁用 Node.js 集成
      contextIsolation: true, // 启用上下文隔离
      enableRemoteModule: false, // 禁用远程模块
      preload: path.join(__dirname, 'preload.js'), // 预加载脚本
      webSecurity: true, // 启用 Web 安全
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    },
    
    // 平台特定配置
    ...(process.platform === 'linux' && { 
      icon: path.join(__dirname, 'assets/icon.png')
    })
  });

  // 窗口事件处理
  win.on('closed', () => {
    mainWindow = null;
  });
  
  win.on('focus', () => {
    // 窗口获得焦点时的处理
  });
  
  win.on('blur', () => {
    // 窗口失去焦点时的处理
  });

  return win;
}
```

### ipcMain 模块

ipcMain 模块处理从渲染器进程发送的异步和同步消息，是实现进程间通信的核心：

```javascript
const { ipcMain, dialog, shell } = require('electron');

// 处理异步消息
ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

// 处理同步消息（不推荐，可能阻塞主进程）
ipcMain.on('get-sync-data', (event, data) => {
  event.returnValue = processDataSync(data);
});

// 处理渲染器进程的请求
ipcMain.handle('file-operation', async (event, operation, filePath) => {
  try {
    const fs = require('fs').promises;
    
    switch (operation) {
      case 'read':
        const content = await fs.readFile(filePath, 'utf-8');
        return { success: true, data: content };
      
      case 'write':
        await fs.writeFile(filePath, data);
        return { success: true };
        
      case 'delete':
        await fs.unlink(filePath);
        return { success: true };
        
      default:
        return { success: false, error: '未知操作' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 主动向渲染器发送消息
function sendToRenderer(channel, data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data);
  }
}

// 广播到所有窗口
function broadcastToAllWindows(channel, data) {
  BrowserWindow.getAllWindows().forEach(window => {
    if (!window.isDestroyed()) {
      window.webContents.send(channel, data);
    }
  });
}
```

## 主进程架构模式

### 单一职责模式

将主进程的功能模块化，每个模块负责特定的功能：

```
主进程 (Main Process)
     |
     +-- 窗口管理器 (WindowManager)
     |     |
     |     +-- 创建、销毁窗口
     |     +-- 窗口状态管理
     |
     +-- 菜单管理器 (MenuManager)
     |     |
     |     +-- 应用菜单
     |     +-- 上下文菜单
     |
     +-- 通信管理器 (IPCManager)
     |     |
     |     +-- 处理 IPC 消息
     |     +-- 进程间数据同步
     |
     +-- 服务管理器 (ServiceManager)
           |
           +-- 自动更新服务
           +-- 文件监控服务
           +-- 数据库服务
```

### 事件驱动架构

主进程采用事件驱动的方式组织代码：

```javascript
// 事件发射器模式
const EventEmitter = require('events');

class ApplicationManager extends EventEmitter {
  constructor() {
    super();
    this.initialize();
  }
  
  initialize() {
    // 监听应用事件
    app.whenReady().then(() => this.emit('app-ready'));
    app.on('window-all-closed', () => this.emit('all-windows-closed'));
    
    // 监听自定义事件
    this.on('window-created', (window) => this.trackWindow(window));
    this.on('service-started', (service) => this.logServiceStart(service));
  }
  
  createWindow() {
    const window = createMainWindow();
    this.emit('window-created', window);
    return window;
  }
}

// 使用事件驱动架构
const appManager = new ApplicationManager();
appManager.on('app-ready', () => {
  appManager.createWindow();
  startBackgroundServices();
});
```

## 性能优化与最佳实践

### 资源管理

主进程需要有效管理系统资源，避免内存泄漏：

```javascript
// 窗口资源管理
class WindowManager {
  constructor() {
    this.windows = new Map();
  }
  
  createWindow(id, options) {
    const win = new BrowserWindow(options);
    this.windows.set(id, win);
    
    win.on('closed', () => {
      this.windows.delete(id);
    });
    
    return win;
  }
  
  getWindow(id) {
    return this.windows.get(id);
  }
  
  closeAllWindows() {
    this.windows.forEach((win, id) => {
      if (!win.isDestroyed()) {
        win.close();
      }
    });
    this.windows.clear();
  }
}

// 使用 WeakMap 管理临时资源
const temporaryResources = new WeakMap();

function manageTemporaryResource(object, resource) {
  temporaryResources.set(object, resource);
  
  // 自动清理
  setTimeout(() => {
    if (temporaryResources.has(object)) {
      cleanupResource(temporaryResources.get(object));
      temporaryResources.delete(object);
    }
  }, 300000); // 5分钟后自动清理
}
```

### 错误处理与恢复

主进程需要健壮的错误处理机制：

```javascript
// 全局错误处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  // 记录错误日志
  logError(error);
  // 根据错误类型决定是否退出应用
  if (isFatalError(error)) {
    dialog.showErrorBox('应用错误', '发生致命错误，应用即将退出');
    app.exit(1);
  }
});

// 渲染器进程崩溃处理
mainWindow.webContents.on('render-process-gone', (event, details) => {
  console.log('渲染器进程崩溃:', details);
  
  if (details.reason === 'crashed') {
    const result = dialog.showMessageBoxSync(mainWindow, {
      type: 'error',
      title: '渲染器崩溃',
      message: '页面渲染进程崩溃，是否重新加载？',
      buttons: ['重新加载', '关闭'],
      defaultId: 0
    });
    
    if (result === 0) {
      mainWindow.reload();
    }
  }
});

// IPC 错误处理
ipcMain.handle('safe-operation', async (event, data) => {
  try {
    const result = await performRiskyOperation(data);
    return { success: true, data: result };
  } catch (error) {
    console.error('操作失败:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.code 
    };
  }
});
```

Electron 主进程作为应用程序的中枢神经系统，其设计和实现质量直接决定了整个应用的稳定性、性能和用户体验。通过合理的主进程架构和良好的编程实践，可以构建出高效可靠的跨平台桌面应用程序。