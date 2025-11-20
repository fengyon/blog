# Electron 调试

## 调试概述

Electron 调试是一个多层次、多进程的复杂过程，涉及**主进程**、**渲染进程**、**预加载脚本**和**原生模块**等多个执行环境。与传统的 Web 应用调试不同，Electron 应用需要同时处理 Node.js 运行时和 Chromium 渲染引擎的调试需求，这要求开发者掌握跨环境调试技术。

Electron 的特殊架构决定了其调试工作的分布性：

```
主进程调试 (Node.js 环境)
    ↑
    | IPC 通信跟踪
    ↓
渲染进程调试 (Chromium DevTools)
    ↑
预加载脚本调试 (上下文隔离)
    ↑
原生模块调试 (Native Addons)
```

有效的 Electron 调试需要在这些不同层面都具备相应的工具和技术支持。

## 开发工具配置

### 开发环境搭建

配置合适的开发环境是高效调试的基础，需要集成代码编辑器、终端和调试工具。

```javascript
// package.json - 开发脚本配置
{
  "name": "electron-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "electron .",
    "dev": "NODE_ENV=development electron .",
    "debug": "electron --inspect=9222 .",
    "debug-brk": "electron --inspect-brk=9222 .",
    "devtools": "electron --remote-debugging-port=8315 .",
    "test": "NODE_ENV=test electron ."
  },
  "devDependencies": {
    "electron": "^22.0.0",
    "electron-builder": "^23.6.0"
  }
}
```

### 环境变量配置

通过环境变量控制调试行为，实现开发和生产环境的差异化配置。

```javascript
// config/debug-config.js
import { app } from 'electron';

class DebugConfig {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isDebug = process.env.DEBUG === 'true';
    this.isTest = process.env.NODE_ENV === 'test';
  }

  getDebugOptions() {
    const baseOptions = {
      enableDevTools: this.isDevelopment || this.isDebug,
      enableReload: this.isDevelopment,
      enableLogging: this.isDevelopment || this.isDebug,
      enablePerformanceMonitor: this.isDevelopment
    };

    // 开发环境特定的调试选项
    if (this.isDevelopment) {
      return {
        ...baseOptions,
        devToolsMode: 'detach',
        consoleLevel: 'verbose',
        nodeIntegrationInWorker: true
      };
    }

    return baseOptions;
  }

  setupEnvironment() {
    if (this.isDevelopment) {
      // 设置开发环境变量
      process.env.ELECTRON_IS_DEV = '1';
      process.env.ELECTRON_DEBUG = 'true';
      
      // 启用更详细的日志
      process.env.DEBUG = 'electron*,node*';
      
      // 禁用硬件加速以提高调试性能
      app.disableHardwareAcceleration();
    }
  }
}

export default DebugConfig;
```

## 主进程调试

### 命令行调试

使用 Node.js 内置的调试器通过命令行参数启动 Electron 主进程调试。

```bash
# 启动调试，在9222端口监听
electron --inspect=9222 .

# 启动调试并在第一行中断
electron --inspect-brk=9222 .

# 指定IP地址进行远程调试
electron --inspect=0.0.0.0:9222 .

# 启用远程调试
electron --remote-debugging-port=8315 .
```

### Chrome DevTools 连接

通过 Chrome 浏览器连接到 Electron 主进程进行调试。

```javascript
// 在 Chrome 地址栏输入：
chrome://inspect

// 配置发现目标
// 添加 localhost:9222 到 Target discovery settings
```

调试界面示意图：

```
Chrome DevTools
    |
    | 连接到 localhost:9222
    |
Electron 主进程
    ├── Sources (源代码调试)
    ├── Console (控制台输出)
    ├── Memory (内存分析)
    └── Performance (性能分析)
```

### VS Code 调试配置

配置 VS Code 的 launch.json 文件实现集成调试体验。

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Main Process",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "windows": {
        "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron.cmd"
      },
      "args": [
        ".",
        "--remote-debugging-port=9223"
      ],
      "env": {
        "NODE_ENV": "development",
        "ELECTRON_IS_DEV": "1"
      },
      "console": "integratedTerminal",
      "protocol": "inspector",
      "sourceMaps": true,
      "timeout": 20000
    },
    {
      "name": "Attach to Main Process",
      "type": "node",
      "request": "attach",
      "port": 9222,
      "timeout": 20000,
      "localRoot": "${workspaceFolder}",
      "remoteRoot": ".",
      "sourceMaps": true
    },
    {
      "name": "Debug Renderer Process",
      "type": "chrome",
      "request": "attach",
      "port": 9223,
      "webRoot": "${workspaceFolder}/src",
      "sourceMaps": true,
      "timeout": 20000
    }
  ],
  "compounds": [
    {
      "name": "Debug All",
      "configurations": [
        "Debug Main Process",
        "Debug Renderer Process"
      ],
      "stopAll": true
    }
  ]
}
```

### 程序化调试控制

在代码中动态控制调试行为，实现条件断点和调试输出。

```javascript
// debug/main-process-debug.js
import { app, BrowserWindow } from 'electron';
import util from 'util';

class MainProcessDebug {
  constructor() {
    this.debugEnabled = process.env.NODE_ENV === 'development';
    this.breakpoints = new Map();
  }

  // 条件调试输出
  debugLog(message, ...args) {
    if (this.debugEnabled) {
      const timestamp = new Date().toISOString();
      const formattedMessage = util.format(message, ...args);
      console.log(`[MAIN ${timestamp}] ${formattedMessage}`);
    }
  }

  // 内存使用监控
  logMemoryUsage(context = '') {
    if (this.debugEnabled) {
      const memoryUsage = process.memoryUsage();
      this.debugLog('Memory Usage %s:', context, {
        rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`
      });
    }
  }

  // 进程信息监控
  logProcessInfo() {
    if (this.debugEnabled) {
      this.debugLog('Process Info:', {
        pid: process.pid,
        platform: process.platform,
        arch: process.arch,
        version: process.version,
        electronVersion: process.versions.electron,
        chromeVersion: process.versions.chrome
      });
    }
  }

  // IPC 通信跟踪
  setupIPCDebugging(ipcMain) {
    if (!this.debugEnabled) return;

    const originalHandle = ipcMain.handle;
    ipcMain.handle = function(channel, listener) {
      return originalHandle.call(ipcMain, channel, async (event, ...args) => {
        console.log(`[IPC →] ${channel}`, args);
        const startTime = Date.now();
        
        try {
          const result = await listener(event, ...args);
          const duration = Date.now() - startTime;
          console.log(`[IPC ←] ${channel} (${duration}ms)`, result);
          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          console.error(`[IPC ✗] ${channel} (${duration}ms)`, error);
          throw error;
        }
      });
    };
  }

  // 窗口创建调试
  debugWindowCreation(window, options) {
    if (!this.debugEnabled) return;

    this.debugLog('Creating window:', {
      id: window.id,
      options: {
        width: options.width,
        height: options.height,
        webPreferences: {
          nodeIntegration: options.webPreferences?.nodeIntegration,
          contextIsolation: options.webPreferences?.contextIsolation,
          enableRemoteModule: options.webPreferences?.enableRemoteModule
        }
      }
    });

    // 监听窗口事件
    window.on('ready-to-show', () => {
      this.debugLog('Window ready to show:', { id: window.id });
    });

    window.on('closed', () => {
      this.debugLog('Window closed:', { id: window.id });
    });

    window.webContents.on('did-finish-load', () => {
      this.debugLog('Window finished loading:', { id: window.id });
    });
  }
}

export default MainProcessDebug;
```

## 渲染进程调试

### 开发者工具集成

在渲染进程中集成开发者工具，支持动态打开和配置。

```javascript
// debug/renderer-debug.js
class RendererDebug {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.devToolsOpened = false;
    this.consoleHistory = [];
  }

  // 初始化渲染进程调试
  initialize() {
    if (!this.isDevelopment) return;

    this.setupConsoleOverride();
    this.setupErrorHandling();
    this.injectDebugHelpers();
  }

  // 打开开发者工具
  openDevTools() {
    if (this.isDevelopment && !this.devToolsOpened) {
      try {
        const { remote } = require('electron');
        const currentWindow = remote.getCurrentWindow();
        currentWindow.webContents.openDevTools({ mode: 'detach' });
        this.devToolsOpened = true;
        
        console.debug('开发者工具已打开');
      } catch (error) {
        console.warn('无法打开开发者工具:', error);
      }
    }
  }

  // 重写 console 方法进行增强
  setupConsoleOverride() {
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug
    };

    // 重写 console.log
    console.log = (...args) => {
      this.consoleHistory.push({
        type: 'log',
        timestamp: new Date().toISOString(),
        args: args.map(arg => this.safeStringify(arg))
      });
      originalConsole.log(...args);
    };

    // 重写 console.error
    console.error = (...args) => {
      this.consoleHistory.push({
        type: 'error',
        timestamp: new Date().toISOString(),
        args: args.map(arg => this.safeStringify(arg))
      });
      originalConsole.error(...args);
    };

    // 保存原始方法供外部访问
    window.originalConsole = originalConsole;
  }

  // 安全序列化对象
  safeStringify(obj) {
    try {
      if (typeof obj === 'object' && obj !== null) {
        return JSON.stringify(obj, (key, value) => {
          // 处理循环引用
          if (typeof value === 'object' && value !== null) {
            if (key && value.constructor.name === 'Window') {
              return '[Window]';
            }
            if (key && value.constructor.name === 'Document') {
              return '[Document]';
            }
          }
          return value;
        });
      }
      return String(obj);
    } catch (error) {
      return `[Unserializable: ${error.message}]`;
    }
  }

  // 设置错误处理
  setupErrorHandling() {
    window.addEventListener('error', (event) => {
      console.error('全局错误:', event.error);
      this.logErrorToServer(event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('未处理的 Promise 拒绝:', event.reason);
      this.logErrorToServer(event.reason);
    });

    // 重写 window.onerror
    const originalOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      console.error('窗口错误:', {
        message, source, lineno, colno, error
      });
      
      if (originalOnError) {
        return originalOnError.call(window, message, source, lineno, colno, error);
      }
      return false;
    };
  }

  // 注入调试辅助函数
  injectDebugHelpers() {
    // 全局调试对象
    window.__DEBUG__ = {
      // 获取控制台历史
      getConsoleHistory: () => [...this.consoleHistory],
      
      // 清空控制台历史
      clearConsoleHistory: () => {
        this.consoleHistory = [];
      },
      
      // 性能测量工具
      measure: (name, fn) => {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
        return result;
      },
      
      // 内存快照
      memorySnapshot: () => {
        if (performance.memory) {
          const memory = performance.memory;
          return {
            used: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
            total: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
            limit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`
          };
        }
        return '内存信息不可用';
      },
      
      // DOM 元素统计
      domStats: () => {
        return {
          elements: document.getElementsByTagName('*').length,
          nodes: document.querySelectorAll('*').length,
          memory: window.performance.memory
        };
      }
    };

    // 添加键盘快捷键
    document.addEventListener('keydown', (event) => {
      // Ctrl+Shift+I 打开开发者工具
      if (event.ctrlKey && event.shiftKey && event.key === 'I') {
        event.preventDefault();
        this.openDevTools();
      }
      
      // Ctrl+Shift+L 清空控制台
      if (event.ctrlKey && event.shiftKey && event.key === 'L') {
        event.preventDefault();
        console.clear();
      }
    });
  }

  // 记录错误到服务器（开发环境）
  logErrorToServer(error) {
    if (!this.isDevelopment) return;

    const errorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // 在实际应用中，这里可以发送到错误收集服务
    console.error('错误信息:', errorInfo);
  }
}

export default RendererDebug;
```

### 渲染进程调试集成

在主窗口中集成渲染进程调试功能。

```javascript
// main.js - 渲染进程调试集成
import { app, BrowserWindow } from 'electron';
import MainProcessDebug from './debug/main-process-debug.js';

const mainDebug = new MainProcessDebug();

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      // 开发环境启用调试功能
      devTools: mainDebug.debugEnabled,
      webSecurity: !mainDebug.debugEnabled // 开发环境禁用web安全以方便调试
    }
  });

  // 调试窗口创建
  mainDebug.debugWindowCreation(mainWindow, {
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // 开发环境自动打开开发者工具
  if (mainDebug.debugEnabled) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
    
    // 监听开发者工具事件
    mainWindow.webContents.on('devtools-opened', () => {
      mainDebug.debugLog('开发者工具已打开');
    });
    
    mainWindow.webContents.on('devtools-closed', () => {
      mainDebug.debugLog('开发者工具已关闭');
    });
  }

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  mainDebug.setupEnvironment();
  mainDebug.logProcessInfo();
  createWindow();
});
```

## 预加载脚本调试

### 上下文隔离调试

预加载脚本运行在特殊的上下文中，需要特定的调试技术。

```javascript
// preload.js - 预加载脚本调试
import { contextBridge, ipcRenderer } from 'electron';

class PreloadDebug {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.initialize();
  }

  initialize() {
    if (this.isDevelopment) {
      this.setupPreloadDebugging();
    }
  }

  setupPreloadDebugging() {
    // 预加载脚本特定的控制台输出
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog('[PRELOAD]', ...args);
    };

    // IPC 通信调试
    this.debugIPC();
    
    // 错误处理
    this.setupErrorHandling();
  }

  debugIPC() {
    const originalInvoke = ipcRenderer.invoke;
    ipcRenderer.invoke = (channel, ...args) => {
      console.log(`[IPC → PRELOAD] ${channel}`, args);
      return originalInvoke.call(ipcRenderer, channel, ...args)
        .then(result => {
          console.log(`[IPC ← PRELOAD] ${channel}`, result);
          return result;
        })
        .catch(error => {
          console.error(`[IPC ✗ PRELOAD] ${channel}`, error);
          throw error;
        });
    };

    // 调试事件监听器
    const originalOn = ipcRenderer.on;
    ipcRenderer.on = (channel, listener) => {
      console.log(`[IPC ☁ PRELOAD] 监听 ${channel}`);
      return originalOn.call(ipcRenderer, channel, (event, ...args) => {
        console.log(`[IPC ← PRELOAD] ${channel}`, args);
        return listener(event, ...args);
      });
    };
  }

  setupErrorHandling() {
    window.addEventListener('error', (event) => {
      console.error('[PRELOAD ERROR]', event.error);
    });

    // 暴露调试工具到渲染进程
    contextBridge.exposeInMainWorld('preloadDebug', {
      getPreloadInfo: () => ({
        isDevelopment: this.isDevelopment,
        nodeVersion: process.versions.node,
        electronVersion: process.versions.electron,
        chromeVersion: process.versions.chrome
      }),
      testIPC: () => {
        return ipcRenderer.invoke('debug-test', { test: 'preload-debug' });
      }
    });
  }
}

// 初始化预加载调试
new PreloadDebug();

// 暴露安全的 API 到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 正常的 API 暴露...
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  // ... 其他 API
});
```

## 性能调试与分析

### 性能监控集成

集成性能监控工具，分析应用性能瓶颈。

```javascript
// debug/performance-debug.js
class PerformanceDebug {
  constructor() {
    this.metrics = new Map();
    this.performanceEntries = [];
    this.enabled = process.env.NODE_ENV === 'development';
  }

  // 开始性能测量
  startMeasure(name) {
    if (!this.enabled) return;

    this.metrics.set(name, {
      startTime: performance.now(),
      startMemory: this.getMemoryUsage(),
      startHrtime: process.hrtime()
    });
  }

  // 结束性能测量
  endMeasure(name, context = {}) {
    if (!this.enabled || !this.metrics.has(name)) return;

    const metric = this.metrics.get(name);
    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    const memoryDiff = this.getMemoryUsage();

    const performanceEntry = {
      name,
      duration,
      context,
      memory: {
        rss: memoryDiff.rss - metric.startMemory.rss,
        heapUsed: memoryDiff.heapUsed - metric.startMemory.heapUsed,
        heapTotal: memoryDiff.heapTotal - metric.startMemory.heapTotal
      },
      timestamp: new Date().toISOString()
    };

    this.performanceEntries.push(performanceEntry);
    
    console.log(`📊 性能测量 ${name}:`, {
      时长: `${duration.toFixed(2)}ms`,
      内存变化: `${((memoryDiff.heapUsed - metric.startMemory.heapUsed) / 1024 / 1024).toFixed(2)} MB`,
      上下文: context
    });

    this.metrics.delete(name);
    return performanceEntry;
  }

  // 获取内存使用情况
  getMemoryUsage() {
    if (process.memoryUsage) {
      return process.memoryUsage();
    }
    return { rss: 0, heapTotal: 0, heapUsed: 0, external: 0 };
  }

  // 自动测量函数性能
  async measureFunction(name, fn, context = {}) {
    this.startMeasure(name);
    
    try {
      const result = await fn();
      this.endMeasure(name, { ...context, success: true });
      return result;
    } catch (error) {
      this.endMeasure(name, { ...context, success: false, error: error.message });
      throw error;
    }
  }

  // 获取性能报告
  getPerformanceReport() {
    const entries = this.performanceEntries;
    const totalDuration = entries.reduce((sum, entry) => sum + entry.duration, 0);
    const averageDuration = totalDuration / entries.length;
    
    const slowest = entries.reduce((slowest, entry) => 
      entry.duration > slowest.duration ? entry : slowest, { duration: 0 }
    );
    
    const fastest = entries.reduce((fastest, entry) => 
      entry.duration < fastest.duration ? entry : fastest, { duration: Infinity }
    );

    return {
      summary: {
        totalEntries: entries.length,
        totalDuration: `${totalDuration.toFixed(2)}ms`,
        averageDuration: `${averageDuration.toFixed(2)}ms`,
        slowestOperation: slowest.name,
        slowestDuration: `${slowest.duration.toFixed(2)}ms`,
        fastestOperation: fastest.name,
        fastestDuration: `${fastest.duration.toFixed(2)}ms`
      },
      entries: entries
    };
  }

  // 重置性能数据
  reset() {
    this.metrics.clear();
    this.performanceEntries = [];
  }

  // 导出性能数据
  exportData() {
    return {
      report: this.getPerformanceReport(),
      rawEntries: this.performanceEntries
    };
  }
}

export default PerformanceDebug;
```

### 内存泄漏检测

集成内存泄漏检测工具，识别和解决内存问题。

```javascript
// debug/memory-debug.js
class MemoryDebug {
  constructor() {
    this.snapshots = new Map();
    this.leakDetectionEnabled = process.env.NODE_ENV === 'development';
  }

  // 创建内存快照
  takeSnapshot(name) {
    if (!this.leakDetectionEnabled) return null;

    if (global.gc) {
      global.gc(); // 强制垃圾回收（需要 --expose-gc 参数）
    }

    const snapshot = {
      name,
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      heapSnapshot: this.getHeapInfo()
    };

    this.snapshots.set(name, snapshot);
    console.log(`📸 内存快照 ${name}:`, snapshot.memory);
    
    return snapshot;
  }

  // 获取堆信息
  getHeapInfo() {
    const memory = process.memoryUsage();
    return {
      heapUsed: `${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      rss: `${(memory.rss / 1024 / 1024).toFixed(2)} MB`
    };
  }

  // 比较快照检测内存泄漏
  compareSnapshots(snapshot1Name, snapshot2Name) {
    const snapshot1 = this.snapshots.get(snapshot1Name);
    const snapshot2 = this.snapshots.get(snapshot2Name);

    if (!snapshot1 || !snapshot2) {
      console.warn('快照不存在');
      return null;
    }

    const memory1 = snapshot1.memory;
    const memory2 = snapshot2.memory;

    const diff = {
      heapUsed: memory2.heapUsed - memory1.heapUsed,
      heapTotal: memory2.heapTotal - memory1.heapTotal,
      rss: memory2.rss - memory1.rss,
      external: memory2.external - memory1.external
    };

    const leaksDetected = diff.heapUsed > 5 * 1024 * 1024; // 5MB 阈值

    console.log(`🔍 内存比较 ${snapshot1Name} → ${snapshot2Name}:`, {
      堆使用变化: `${(diff.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      堆总量变化: `${(diff.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      RSS变化: `${(diff.rss / 1024 / 1024).toFixed(2)} MB`,
      检测到泄漏: leaksDetected ? '⚠️ 是' : '✅ 否'
    });

    return {
      diff,
      leaksDetected,
      snapshot1: snapshot1.name,
      snapshot2: snapshot2.name
    };
  }

  // 自动内存监控
  startAutoMonitoring(interval = 30000) {
    if (!this.leakDetectionEnabled) return;

    this.monitoringInterval = setInterval(() => {
      const snapshotName = `auto_${Date.now()}`;
      this.takeSnapshot(snapshotName);
      
      // 保留最近10个快照
      const autoSnapshots = Array.from(this.snapshots.entries())
        .filter(([name]) => name.startsWith('auto_'))
        .sort(([,a], [,b]) => new Date(a.timestamp) - new Date(b.timestamp));
      
      if (autoSnapshots.length > 10) {
        const [oldestName] = autoSnapshots[0];
        this.snapshots.delete(oldestName);
      }
    }, interval);
  }

  // 停止自动监控
  stopAutoMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  // 获取内存报告
  getMemoryReport() {
    const snapshots = Array.from(this.snapshots.values());
    return {
      currentMemory: this.getHeapInfo(),
      snapshots: snapshots,
      snapshotCount: snapshots.length
    };
  }
}

export default MemoryDebug;
```

## 网络调试

### 网络请求监控

监控和分析应用中的网络请求行为。

```javascript
// debug/network-debug.js
class NetworkDebug {
  constructor() {
    this.requests = new Map();
    this.enabled = process.env.NODE_ENV === 'development';
  }

  // 监控 fetch 请求
  monitorFetch() {
    if (!this.enabled) return;

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const requestId = this.generateRequestId();
      const startTime = performance.now();
      
      this.requests.set(requestId, {
        id: requestId,
        url: args[0],
        method: 'GET', // 默认为 GET
        startTime,
        status: 'pending'
      });

      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;

        const request = this.requests.get(requestId);
        request.endTime = endTime;
        request.duration = duration;
        request.status = response.ok ? 'success' : 'error';
        request.statusCode = response.status;
        request.responseSize = this.getResponseSize(response);

        console.log(`🌐 网络请求 ${requestId}:`, {
          url: request.url,
          状态: request.status,
          状态码: request.statusCode,
          时长: `${duration.toFixed(2)}ms`,
          大小: request.responseSize
        });

        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;

        const request = this.requests.get(requestId);
        request.endTime = endTime;
        request.duration = duration;
        request.status = 'error';
        request.error = error.message;

        console.error(`🌐 网络请求错误 ${requestId}:`, {
          url: request.url,
          错误: error.message,
          时长: `${duration.toFixed(2)}ms`
        });

        throw error;
      }
    };
  }

  // 生成请求ID
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 获取响应大小
  getResponseSize(response) {
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      return `${(parseInt(contentLength) / 1024).toFixed(2)} KB`;
    }
    return '未知';
  }

  // 获取网络统计
  getNetworkStats() {
    const requests = Array.from(this.requests.values());
    const successful = requests.filter(req => req.status === 'success');
    const failed = requests.filter(req => req.status === 'error');
    
    const totalDuration = successful.reduce((sum, req) => sum + req.duration, 0);
    const averageDuration = successful.length > 0 ? totalDuration / successful.length : 0;

    return {
      totalRequests: requests.length,
      successfulRequests: successful.length,
      failedRequests: failed.length,
      successRate: requests.length > 0 ? (successful.length / requests.length * 100).toFixed(2) : 0,
      averageDuration: `${averageDuration.toFixed(2)}ms`,
      lastRequest: requests[requests.length - 1]
    };
  }

  // 清空请求记录
  clearRequests() {
    this.requests.clear();
  }
}

export default NetworkDebug;
```

## 调试工具集成

### 综合调试管理器

集成所有调试工具的统一管理界面。

```javascript
// debug/debug-manager.js
import MainProcessDebug from './main-process-debug.js';
import PerformanceDebug from './performance-debug.js';
import MemoryDebug from './memory-debug.js';
import NetworkDebug from './network-debug.js';

class DebugManager {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.tools = new Map();
    
    this.initializeTools();
  }

  initializeTools() {
    if (!this.isDevelopment) return;

    // 初始化各个调试工具
    this.tools.set('main', new MainProcessDebug());
    this.tools.set('performance', new PerformanceDebug());
    this.tools.set('memory', new MemoryDebug());
    this.tools.set('network', new NetworkDebug());

    console.log('🔧 调试管理器已初始化');
  }

  // 获取调试报告
  getDebugReport() {
    const report = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        platform: process.platform,
        electronVersion: process.versions.electron
      },
      tools: {}
    };

    // 收集各个工具的报告
    for (const [name, tool] of this.tools) {
      if (typeof tool.getPerformanceReport === 'function') {
        report.tools[name] = tool.getPerformanceReport();
      } else if (typeof tool.getMemoryReport === 'function') {
        report.tools[name] = tool.getMemoryReport();
      } else if (typeof tool.getNetworkStats === 'function') {
        report.tools[name] = tool.getNetworkStats();
      }
    }

    return report;
  }

  // 导出调试数据
  exportDebugData() {
    const report = this.getDebugReport();
    
    // 在实际应用中，这里可以保存到文件或发送到服务器
    console.log('📋 调试报告:', report);
    
    return report;
  }

  // 启用/禁用特定调试工具
  setToolEnabled(toolName, enabled) {
    const tool = this.tools.get(toolName);
    if (tool && typeof tool.enabled !== 'undefined') {
      tool.enabled = enabled;
      console.log(`🔧 ${toolName} ${enabled ? '启用' : '禁用'}`);
    }
  }

  // 重置所有调试数据
  resetAll() {
    for (const [name, tool] of this.tools) {
      if (typeof tool.reset === 'function') {
        tool.reset();
      }
    }
    console.log('🔄 所有调试数据已重置');
  }
}

export default DebugManager;
```

### 调试界面集成

在应用中集成调试控制界面。

```javascript
// debug/debug-ui.js
class DebugUI {
  constructor(debugManager) {
    this.debugManager = debugManager;
    this.uiElement = null;
    this.isVisible = false;
  }

  // 创建调试UI
  createDebugUI() {
    if (!this.debugManager.isDevelopment) return;

    const debugPanel = document.createElement('div');
    debugPanel.id = 'electron-debug-panel';
    debugPanel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 10px;
      border-radius: 5px;
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
      max-width: 300px;
      max-height: 400px;
      overflow: auto;
    `;

    this.uiElement = debugPanel;
    this.updateUI();
    document.body.appendChild(debugPanel);

    // 添加键盘快捷键
    this.setupKeyboardShortcuts();
  }

  // 更新UI内容
  updateUI() {
    if (!this.uiElement) return;

    const report = this.debugManager.getDebugReport();
    
    this.uiElement.innerHTML = `
      <div style="margin-bottom: 10px;">
        <strong>Electron 调试面板</strong>
        <button onclick="debugUI.toggleVisibility()" style="float: right;">隐藏</button>
      </div>
      <div style="font-size: 10px;">
        <div>平台: ${report.environment.platform}</div>
        <div>Electron: ${report.environment.electronVersion}</div>
        <div>环境: ${report.environment.nodeEnv}</div>
        <hr style="margin: 5px 0;">
        <div>性能测量: ${report.tools.performance?.summary?.totalEntries || 0} 次</div>
        <div>内存快照: ${report.tools.memory?.snapshotCount || 0} 个</div>
        <div>网络请求: ${report.tools.network?.totalRequests || 0} 次</div>
        <hr style="margin: 5px 0;">
        <button onclick="debugManager.exportDebugData()">导出报告</button>
        <button onclick="debugManager.resetAll()">重置数据</button>
      </div>
    `;
  }

  // 切换UI可见性
  toggleVisibility() {
    this.isVisible = !this.isVisible;
    this.uiElement.style.display = this.isVisible ? 'block' : 'none';
  }

  // 设置键盘快捷键
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      // Ctrl+Shift+D 切换调试面板
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        this.toggleVisibility();
      }
    });
  }

  // 定期更新UI
  startAutoUpdate(interval = 2000) {
    setInterval(() => {
      if (this.isVisible) {
        this.updateUI();
      }
    }, interval);
  }
}

// 全局调试实例
window.debugManager = new DebugManager();
window.debugUI = new DebugUI(window.debugManager);

// 初始化调试UI
document.addEventListener('DOMContentLoaded', () => {
  window.debugUI.createDebugUI();
  window.debugUI.startAutoUpdate();
});
```

## 生产环境调试

### 远程调试配置

配置生产环境的远程调试能力，支持现场问题诊断。

```javascript
// debug/remote-debug.js
import { app, BrowserWindow, ipcMain } from 'electron';

class RemoteDebug {
  constructor() {
    this.remoteDebuggingEnabled = false;
    this.debugPort = 8315;
  }

  // 启用远程调试
  enableRemoteDebugging() {
    if (this.remoteDebuggingEnabled) return;

    // 设置远程调试端口
    app.commandLine.appendSwitch('remote-debugging-port', this.debugPort.toString());
    
    this.setupRemoteDebugHandlers();
    this.remoteDebuggingEnabled = true;

    console.log(`🔧 远程调试已启用，端口: ${this.debugPort}`);
  }

  setupRemoteDebugHandlers() {
    // 处理远程调试命令
    ipcMain.handle('remote-debug-command', (event, command, data) => {
      switch (command) {
        case 'get-debug-info':
          return this.getDebugInfo();
        case 'take-heap-snapshot':
          return this.takeHeapSnapshot();
        case 'get-performance-metrics':
          return this.getPerformanceMetrics();
        default:
          throw new Error(`未知的调试命令: ${command}`);
      }
    });
  }

  getDebugInfo() {
    return {
      platform: process.platform,
      arch: process.arch,
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      nodeVersion: process.versions.node,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      remoteDebuggingPort: this.debugPort
    };
  }

  takeHeapSnapshot() {
    // 在实际应用中，这里可以实现堆快照功能
    console.log('📸 堆快照请求已接收');
    return { success: true, message: '堆快照功能需要额外实现' };
  }

  getPerformanceMetrics() {
    const performanceMetrics = {
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime()
    };

    return performanceMetrics;
  }

  // 生成调试访问URL
  getDebugURL() {
    return `http://localhost:${this.debugPort}`;
  }
}

export default RemoteDebug;
```

通过系统化的调试工具和技术的集成，Electron 应用可以实现从开发到生产全生命周期的有效调试和问题诊断。