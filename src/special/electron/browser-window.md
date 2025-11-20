# Electron BrowserWindow

Electron BrowserWindow 是创建和控制浏览器窗口的核心模块，它提供了丰富的 API 来创建原生桌面应用程序窗口。每个 BrowserWindow 实例都运行在独立的渲染进程中，可以加载本地 HTML 文件或远程 URL，并支持高度自定义的窗口行为和外观。

## BrowserWindow 基础架构

BrowserWindow 是 Electron 应用的用户界面载体，它将 Chromium 的渲染能力与原生窗口控制相结合，形成统一的跨平台窗口管理解决方案。

```
BrowserWindow 实例架构：

BrowserWindow 实例
     |
     +-- 原生窗口控件 (Native Window)
     |     |
     |     +-- 窗口边框和标题栏
     |     +-- 最小化/最大化/关闭按钮
     |     +-- 系统菜单和托盘
     |
     +-- WebContents 实例
     |     |
     |     +-- Chromium 渲染引擎
     |     +-- 页面加载和导航控制
     |     +-- 开发者工具集成
     |
     +-- 事件系统
           |
           +-- 窗口生命周期事件
           +-- 用户交互事件
           +-- Web 内容事件
```

## 窗口创建与基础配置

### 基础窗口创建

创建基本的 BrowserWindow 实例只需要几行代码：

```javascript
// main.js
import { BrowserWindow } from 'electron';

// 创建基础窗口
const createBasicWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // 初始不显示，避免视觉闪烁
  });

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // 加载应用内容
  mainWindow.loadFile('index.html');
  
  return mainWindow;
};
```

### 完整配置选项

BrowserWindow 支持丰富的配置选项，涵盖外观、行为和安全各个方面：

```javascript
// main.js
import { BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const createConfiguredWindow = () => {
  const window = new BrowserWindow({
    // 基础尺寸配置
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    maxWidth: 1600,
    maxHeight: 1200,
    
    // 窗口位置
    x: 100,
    y: 100,
    center: true, // 在屏幕居中
    
    // 窗口外观
    title: '我的 Electron 应用',
    icon: path.join(__dirname, 'assets/icon.png'),
    show: false,
    frame: true, // 是否显示窗口边框
    transparent: false, // 透明窗口
    titleBarStyle: 'default', // 'default' | 'hidden' | 'hiddenInset' | 'customButtonsOnHover'
    thickFrame: true, // Windows 厚边框
    vibrancy: 'under-window', // macOS 毛玻璃效果
    
    // 窗口行为
    resizable: true,
    movable: true,
    minimizable: true,
    maximizable: true,
    closable: true,
    focusable: true,
    alwaysOnTop: false,
    fullscreenable: true,
    skipTaskbar: false,
    kiosk: false, // 自助服务模式
    
    // 安全配置
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      webgl: true,
      plugins: true,
      scrollBounce: true, // macOS 弹性滚动
    },
    
    // 平台特定配置
    ...(process.platform === 'darwin' && {
      titleBarStyle: 'hiddenInset',
      trafficLightPosition: { x: 16, y: 16 }
    }),
    
    ...(process.platform === 'win32' && {
      thickFrame: true,
      titleBarStyle: 'hidden'
    }),
    
    ...(process.platform === 'linux' && {
      icon: path.join(__dirname, 'assets/icon.png')
    })
  });

  return window;
};
```

## 窗口生命周期管理

### 窗口状态控制

BrowserWindow 提供完整的方法来控制窗口状态和行为：

```javascript
// main.js
import { BrowserWindow, ipcMain } from 'electron';

class WindowManager {
  constructor() {
    this.windows = new Map();
    this.setupWindowControls();
  }

  setupWindowControls() {
    // IPC 控制窗口
    ipcMain.handle('window:minimize', (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      window.minimize();
    });

    ipcMain.handle('window:maximize', (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window.isMaximized()) {
        window.unmaximize();
      } else {
        window.maximize();
      }
    });

    ipcMain.handle('window:close', (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      window.close();
    });

    ipcMain.handle('window:fullscreen', (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      window.setFullScreen(!window.isFullScreen());
    });
  }

  createWindow(id, options = {}) {
    const window = new BrowserWindow({
      width: 1200,
      height: 800,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
      ...options
    });

    this.windows.set(id, window);

    // 窗口事件处理
    window.on('closed', () => {
      this.windows.delete(id);
    });

    window.on('focus', () => {
      this.onWindowFocus(id);
    });

    window.on('blur', () => {
      this.onWindowBlur(id);
    });

    return window;
  }

  onWindowFocus(windowId) {
    console.log(`窗口 ${windowId} 获得焦点`);
    // 更新应用状态，比如菜单栏
  }

  onWindowBlur(windowId) {
    console.log(`窗口 ${windowId} 失去焦点`);
  }

  getWindow(id) {
    return this.windows.get(id);
  }

  closeAllWindows() {
    this.windows.forEach((window) => {
      if (!window.isDestroyed()) {
        window.close();
      }
    });
    this.windows.clear();
  }
}
```

### 多窗口管理

复杂的应用通常需要管理多个窗口：

```javascript
// main.js
import { BrowserWindow, screen } from 'electron';

class MultiWindowManager {
  constructor() {
    this.windows = new Map();
    this.windowStates = new Map();
  }

  // 创建主窗口
  createMainWindow() {
    const mainWindow = this.createWindow('main', {
      width: 1200,
      height: 800,
      webPreferences: {
        preload: path.join(__dirname, 'preload-main.js')
      }
    });

    mainWindow.loadFile('main.html');
    return mainWindow;
  }

  // 创建设置窗口
  createSettingsWindow() {
    const mainWindow = this.getWindow('main');
    const settingsWindow = this.createWindow('settings', {
      width: 600,
      height: 400,
      parent: mainWindow,
      modal: true,
      resizable: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload-settings.js')
      }
    });

    settingsWindow.loadFile('settings.html');
    return settingsWindow;
  }

  // 创建工具窗口
  createToolWindow() {
    const { workArea } = screen.getPrimaryDisplay();
    
    const toolWindow = this.createWindow('tool', {
      width: 300,
      height: 200,
      x: workArea.width - 320,
      y: workArea.height - 220,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload-tool.js')
      }
    });

    toolWindow.loadFile('tool.html');
    return toolWindow;
  }

  // 保存窗口状态
  saveWindowState(windowId, state) {
    this.windowStates.set(windowId, {
      ...state,
      timestamp: Date.now()
    });
  }

  // 恢复窗口状态
  restoreWindowState(windowId) {
    return this.windowStates.get(windowId) || null;
  }
}
```

## 高级窗口特性

### 无边框窗口与自定义标题栏

创建无边框窗口并实现自定义标题栏：

```javascript
// main.js
import { BrowserWindow } from 'electron';

const createFramelessWindow = () => {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false, // 无边框
    titleBarStyle: 'hidden', // 隐藏标题栏
    backgroundColor: '#2e3440',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // 自定义窗口控制
  window.on('maximize', () => {
    window.webContents.send('window:maximized');
  });

  window.on('unmaximize', () => {
    window.webContents.send('window:unmaximized');
  });

  window.loadFile('frameless.html');
  return window;
};
```

```javascript
// preload.js
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  windowControl: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
    onMaximized: (callback) => ipcRenderer.on('window:maximized', callback),
    onUnmaximized: (callback) => ipcRenderer.on('window:unmaximized', callback)
  }
});
```

### 透明窗口与视觉效果

创建具有视觉效果的透明窗口：

```javascript
// main.js
import { BrowserWindow } from 'electron';

const createVisualEffectWindow = () => {
  const window = new BrowserWindow({
    width: 800,
    height: 600,
    transparent: true, // 透明背景
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      backgroundThrottling: false
    },
    ...(process.platform === 'darwin' && {
      vibrancy: 'ultra-dark', // macOS 毛玻璃效果
      visualEffectState: 'active'
    })
  });

  // 设置窗口形状
  window.setShape([
    { x: 0, y: 0, width: 800, height: 600, borderRadius: 20 }
  ]);

  window.loadFile('visual.html');
  return window;
};
```

### 多显示器支持

处理多显示器环境的窗口管理：

```javascript
// main.js
import { BrowserWindow, screen } from 'electron';

class MultiDisplayManager {
  constructor() {
    this.displays = screen.getAllDisplays();
  }

  // 在指定显示器创建窗口
  createWindowOnDisplay(displayIndex, options = {}) {
    const display = this.displays[displayIndex];
    if (!display) {
      throw new Error(`显示器 ${displayIndex} 不存在`);
    }

    const { workArea } = display;
    
    const window = new BrowserWindow({
      x: workArea.x + 50,
      y: workArea.y + 50,
      width: workArea.width - 100,
      height: workArea.height - 100,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      ...options
    });

    // 监听显示器变化
    screen.on('display-added', this.handleDisplayChange.bind(this));
    screen.on('display-removed', this.handleDisplayChange.bind(this));
    screen.on('display-metrics-changed', this.handleDisplayChange.bind(this));

    return window;
  }

  handleDisplayChange() {
    this.displays = screen.getAllDisplays();
    // 更新窗口位置和大小
    this.updateWindowPositions();
  }

  updateWindowPositions() {
    // 根据新的显示器配置更新所有窗口
    BrowserWindow.getAllWindows().forEach((window, index) => {
      const display = this.displays[index % this.displays.length];
      if (display && !window.isDestroyed()) {
        const { workArea } = display;
        window.setBounds({
          x: workArea.x + 50,
          y: workArea.y + 50,
          width: Math.min(window.getBounds().width, workArea.width - 100),
          height: Math.min(window.getBounds().height, workArea.height - 100)
        });
      }
    });
  }

  // 获取窗口所在的显示器
  getWindowDisplay(window) {
    const bounds = window.getBounds();
    return screen.getDisplayNearestPoint({
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2
    });
  }
}
```

## WebContents 控制与内容管理

### 页面加载与导航控制

```javascript
// main.js
import { BrowserWindow, session } from 'electron';

const createControlledWindow = () => {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // 页面加载事件
  window.webContents.on('did-start-loading', () => {
    console.log('开始加载页面');
    window.webContents.send('loading:start');
  });

  window.webContents.on('did-finish-load', () => {
    console.log('页面加载完成');
    window.webContents.send('loading:finish');
  });

  window.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('页面加载失败:', errorDescription);
    window.webContents.send('loading:error', { errorCode, errorDescription });
  });

  // 导航控制
  window.webContents.on('will-navigate', (event, navigationUrl) => {
    console.log('即将导航到:', navigationUrl);
    
    // 阻止外部链接在应用内打开
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== 'file://') {
      event.preventDefault();
      require('electron').shell.openExternal(navigationUrl);
    }
  });

  // 新窗口控制
  window.webContents.setWindowOpenHandler(({ url }) => {
    // 所有新窗口都在外部浏览器打开
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });

  return window;
};
```

### 开发者工具集成

```javascript
// main.js
import { BrowserWindow } from 'electron';

class DevToolsManager {
  constructor(window) {
    this.window = window;
    this.setupDevTools();
  }

  setupDevTools() {
    // 开发环境自动打开开发者工具
    if (process.env.NODE_ENV === 'development') {
      this.window.webContents.openDevTools();
    }

    // 监听开发者工具事件
    this.window.webContents.on('devtools-opened', () => {
      console.log('开发者工具已打开');
      this.window.webContents.send('devtools:changed', true);
    });

    this.window.webContents.on('devtools-closed', () => {
      console.log('开发者工具已关闭');
      this.window.webContents.send('devtools:changed', false);
    });

    // 添加快捷键
    this.window.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12' || (input.control && input.key === 'i')) {
        event.preventDefault();
        this.toggleDevTools();
      }
    });
  }

  toggleDevTools() {
    if (this.window.webContents.isDevToolsOpened()) {
      this.window.webContents.closeDevTools();
    } else {
      this.window.webContents.openDevTools();
    }
  }

  // 检查元素模式
  inspectElement(x, y) {
    this.window.webContents.inspectElement(x, y);
    if (!this.window.webContents.isDevToolsOpened()) {
      this.window.webContents.openDevTools();
    }
  }
}
```

## 性能优化与最佳实践

### 内存管理与性能优化

```javascript
// main.js
import { BrowserWindow, app } from 'electron';

class OptimizedWindowManager {
  constructor() {
    this.windows = new Map();
    this.setupPerformanceOptimizations();
  }

  setupPerformanceOptimizations() {
    // 应用级别性能优化
    app.commandLine.appendSwitch('--disable-background-timer-throttling');
    app.commandLine.appendSwitch('--disable-renderer-backgrounding');
    
    // 内存警告处理
    app.on('memory-warning', () => {
      this.cleanupMemory();
    });
  }

  createOptimizedWindow(id, options = {}) {
    const window = new BrowserWindow({
      width: 1200,
      height: 800,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        backgroundThrottling: false, // 防止后台节流
        webSecurity: true,
        allowRunningInsecureContent: false,
        ...options.webPreferences
      },
      ...options
    });

    this.windows.set(id, window);

    // 性能优化事件
    window.on('ready-to-show', () => {
      window.show();
      this.initializeWindowPerformance(window);
    });

    window.on('focus', () => {
      this.onWindowFocusOptimizations(window);
    });

    window.on('blur', () => {
      this.onWindowBlurOptimizations(window);
    });

    // 内存使用监控
    setInterval(() => {
      this.monitorWindowMemory(window);
    }, 30000);

    return window;
  }

  initializeWindowPerformance(window) {
    // 启用硬件加速
    window.webContents.setBackgroundThrottling(false);
    
    // 设置帧率
    window.webContents.setFrameRate(60);
  }

  onWindowFocusOptimizations(window) {
    // 恢复高性能模式
    window.webContents.setBackgroundThrottling(false);
    window.webContents.setFrameRate(60);
  }

  onWindowBlurOptimizations(window) {
    // 降低非活动窗口的资源使用
    if (!window.isFocused()) {
      window.webContents.setFrameRate(30);
    }
  }

  monitorWindowMemory(window) {
    const memoryInfo = window.webContents.getProcessMemoryInfo();
    
    if (memoryInfo.privateBytes > 500 * 1024 * 1024) { // 500MB
      console.warn('窗口内存使用过高:', memoryInfo.privateBytes);
      this.triggerMemoryCleanup(window);
    }
  }

  triggerMemoryCleanup(window) {
    // 强制垃圾回收（如果启用）
    if (process.env.NODE_ENV === 'development') {
      window.webContents.forcefullyCrashRenderer();
      window.reload();
    } else {
      window.webContents.executeJavaScript('window.gc && window.gc();');
    }
  }

  cleanupMemory() {
    this.windows.forEach((window, id) => {
      if (!window.isFocused() && !window.isDestroyed()) {
        window.webContents.executeJavaScript('window.gc && window.gc();');
      }
    });
  }
}
```

BrowserWindow 作为 Electron 应用的核心组件，提供了强大的窗口管理能力和丰富的自定义选项。通过合理配置窗口属性、优化资源使用、实现多窗口协同，开发者可以创建出既美观又高效的桌面应用程序。