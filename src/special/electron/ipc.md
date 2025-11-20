# Electron 进程通信

Electron 进程通信是 Electron 应用架构中的核心技术，它实现了主进程与渲染进程之间的数据交换和功能调用。由于 Electron 的多进程架构特性，进程间通信成为连接应用程序各个部分的桥梁，确保了安全、高效的跨进程协作。

## 进程通信基础架构

Electron 采用基于 Chromium IPC 的进程通信机制，为不同的进程上下文提供了安全的通信通道。整个通信架构建立在事件驱动模型之上，支持异步和同步两种通信模式。

```
进程通信架构示意图：
    
    主进程 (Main Process)
         |
         +-- ipcMain 模块
         |     |
         |     +-- 处理来自渲染进程的消息
         |     +-- 发送消息到渲染进程
         |
         +-- webContents 对象
               |
               +-- 直接向特定窗口发送消息
               +-- 管理渲染进程通信

    渲染进程 (Renderer Process)
         |
         +-- ipcRenderer 模块
         |     |
         |     +-- 发送消息到主进程
         |     +-- 接收主进程消息
         |
         +-- 预加载脚本 (Preload Script)
               |
               +-- 安全地暴露 IPC API
               +-- 上下文隔离桥梁
```

## IPC 核心模块

### ipcMain 模块

ipcMain 模块在主进程中运行，用于处理从渲染进程发送的异步和同步消息：

```javascript
// main.js (主进程)
import { ipcMain, dialog, app } from 'electron';
import fs from 'fs/promises';

// 处理异步消息 - 推荐方式
ipcMain.handle('file:read', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, data: content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 处理单向消息
ipcMain.on('window:minimize', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  window.minimize();
});

// 发送消息到渲染进程
function sendToRenderer(channel, data) {
  const windows = BrowserWindow.getAllWindows();
  windows.forEach(window => {
    if (!window.isDestroyed()) {
      window.webContents.send(channel, data);
    }
  });
}
```

### ipcRenderer 模块

ipcRenderer 模块在渲染进程中运行，通过预加载脚本安全地暴露给渲染进程：

```javascript
// preload.js (预加载脚本)
import { contextBridge, ipcRenderer } from 'electron';

// 通过 contextBridge 安全地暴露 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 文件操作
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('file:write', filePath, content),
  
  // 窗口控制
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  
  // 事件监听
  onUpdateAvailable: (callback) => 
    ipcRenderer.on('update:available', callback),
  
  // 移除监听器
  removeAllListeners: (channel) => 
    ipcRenderer.removeAllListeners(channel)
});
```

## 通信模式详解

### 请求-响应模式

请求-响应模式是最常用的通信方式，渲染进程发送请求，主进程处理并返回结果：

```javascript
// 渲染进程中使用 (通过预加载脚本暴露的 API)
import { useState, useEffect } from 'react';

function FileViewer() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const loadFile = async (filePath) => {
    setLoading(true);
    try {
      const result = await window.electronAPI.readFile(filePath);
      if (result.success) {
        setContent(result.data);
      } else {
        console.error('读取文件失败:', result.error);
      }
    } catch (error) {
      console.error('通信错误:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {loading && <div>加载中...</div>}
      <pre>{content}</pre>
      <button onClick={() => loadFile('/path/to/file.txt')}>
        加载文件
      </button>
    </div>
  );
}
```

**通信流程**：
```
渲染进程: window.electronAPI.readFile() 
    → 
主进程: ipcMain.handle('file:read') 
    → 
文件系统操作 
    → 
返回结果: { success, data/error }
```

### 事件广播模式

主进程可以向所有或特定的渲染进程发送事件通知：

```javascript
// main.js (主进程)
import { ipcMain, BrowserWindow } from 'electron';

class ApplicationManager {
  constructor() {
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // 应用状态变化时通知所有窗口
    ipcMain.handle('app:getStatus', () => this.status);
  }

  // 广播到所有窗口
  broadcastToAll(channel, data) {
    BrowserWindow.getAllWindows().forEach(window => {
      if (!window.isDestroyed()) {
        window.webContents.send(channel, data);
      }
    });
  }

  // 发送到特定窗口
  sendToWindow(window, channel, data) {
    if (window && !window.isDestroyed()) {
      window.webContents.send(channel, data);
    }
  }

  // 状态更新示例
  updateStatus(newStatus) {
    this.status = newStatus;
    this.broadcastToAll('app:statusChanged', newStatus);
  }
}
```

### 双向通信模式

支持复杂的双向通信场景，多个消息来回交互：

```javascript
// main.js (主进程)
import { ipcMain } from 'electron';

class DatabaseService {
  constructor() {
    this.setupIPC();
  }

  setupIPC() {
    // 复杂的数据库操作流程
    ipcMain.handle('db:transaction', async (event, operations) => {
      const results = [];
      
      for (const op of operations) {
        try {
          switch (op.type) {
            case 'insert':
              const inserted = await this.insert(op.data);
              results.push({ success: true, data: inserted });
              break;
              
            case 'update':
              const updated = await this.update(op.id, op.data);
              results.push({ success: true, data: updated });
              break;
              
            case 'delete':
              await this.delete(op.id);
              results.push({ success: true });
              break;
          }
          
          // 发送进度更新
          event.sender.send('db:progress', {
            completed: results.length,
            total: operations.length
          });
        } catch (error) {
          results.push({ success: false, error: error.message });
        }
      }
      
      return results;
    });
  }
}
```

## 高级通信技术

### 流式数据传输

对于大量数据或实时数据流，可以使用流式传输：

```javascript
// main.js (主进程)
import { ipcMain } from 'electron';
import { createReadStream } from 'fs';
import { Readable } from 'stream';

ipcMain.handle('stream:largeFile', async (event, filePath) => {
  const stream = createReadStream(filePath);
  const chunks = [];
  
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => {
      // 发送数据块到渲染进程
      event.sender.send('stream:chunk', chunk.toString('base64'));
    });
    
    stream.on('end', () => {
      event.sender.send('stream:end');
      resolve({ success: true });
    });
    
    stream.on('error', (error) => {
      reject({ success: false, error: error.message });
    });
  });
});
```

```javascript
// 渲染进程中的流处理
class StreamProcessor {
  constructor() {
    this.buffer = [];
    this.setupStreamListeners();
  }

  setupStreamListeners() {
    window.electronAPI.onStreamChunk((event, chunkBase64) => {
      const chunk = Buffer.from(chunkBase64, 'base64');
      this.buffer.push(chunk);
      this.onChunkReceived(chunk);
    });

    window.electronAPI.onStreamEnd(() => {
      this.onStreamComplete(Buffer.concat(this.buffer));
    });
  }

  async processLargeFile(filePath) {
    await window.electronAPI.streamLargeFile(filePath);
  }

  onChunkReceived(chunk) {
    // 处理每个数据块
    console.log('收到数据块:', chunk.length, 'bytes');
  }

  onStreamComplete(completeData) {
    // 处理完整数据
    console.log('流传输完成:', completeData.length, 'bytes');
  }
}
```

### 共享内存通信

对于性能要求极高的场景，可以使用 SharedArrayBuffer：

```javascript
// main.js (主进程)
import { ipcMain } from 'electron';

ipcMain.handle('memory:createBuffer', (event, size) => {
  // 创建共享内存缓冲区
  const sharedBuffer = new SharedArrayBuffer(size);
  return sharedBuffer;
});

ipcMain.handle('memory:processData', (event, bufferId, operation) => {
  // 处理共享内存中的数据
  const view = new Int32Array(sharedBuffers.get(bufferId));
  
  switch (operation) {
    case 'increment':
      for (let i = 0; i < view.length; i++) {
        Atomics.add(view, i, 1);
      }
      break;
      
    case 'sort':
      view.sort();
      break;
  }
  
  return { success: true };
});
```

## 安全通信实践

### 上下文隔离安全

使用 contextBridge 确保安全的进程通信：

```javascript
// preload.js (预加载脚本)
import { contextBridge, ipcRenderer } from 'electron';

// 验证和过滤输入
const sanitizePath = (path) => {
  if (typeof path !== 'string') {
    throw new Error('路径必须是字符串');
  }
  // 防止路径遍历攻击
  if (path.includes('..')) {
    throw new Error('非法路径');
  }
  return path;
};

// 安全地暴露 API
contextBridge.exposeInMainWorld('electronAPI', {
  readFile: (filePath) => {
    const sanitizedPath = sanitizePath(filePath);
    return ipcRenderer.invoke('file:read', sanitizedPath);
  },
  
  // 添加速率限制
  rateLimitedCall: (() => {
    let lastCall = 0;
    return (channel, data) => {
      const now = Date.now();
      if (now - lastCall < 1000) {
        throw new Error('调用过于频繁');
      }
      lastCall = now;
      return ipcRenderer.invoke(channel, data);
    };
  })()
});
```

### 消息验证

在主进程中验证所有传入的消息：

```javascript
// main.js (主进程)
import { ipcMain } from 'electron';

// 消息验证中间件
const createValidatedHandler = (schema, handler) => {
  return async (event, ...args) => {
    try {
      // 验证消息结构
      const validatedArgs = schema.validate(args);
      return await handler(event, ...validatedArgs);
    } catch (error) {
      return { success: false, error: `消息验证失败: ${error.message}` };
    }
  };
};

// 定义消息模式
const fileReadSchema = {
  validate: ([filePath]) => {
    if (typeof filePath !== 'string') {
      throw new Error('文件路径必须是字符串');
    }
    if (!filePath.startsWith('/allowed/path/')) {
      throw new Error('无权访问该路径');
    }
    return [filePath];
  }
};

// 使用验证过的处理器
ipcMain.handle('file:read', createValidatedHandler(
  fileReadSchema,
  async (event, filePath) => {
    // 安全的处理逻辑
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, data: content };
  }
));
```

## 错误处理与调试

### 健壮的错误处理

```javascript
// 通信错误处理工具类
class IPCErrorHandler {
  static async safeInvoke(channel, ...args) {
    try {
      const result = await window.electronAPI[channel](...args);
      
      if (result && result.success === false) {
        throw new Error(result.error || `调用 ${channel} 失败`);
      }
      
      return result;
    } catch (error) {
      console.error(`IPC调用失败 [${channel}]:`, error);
      
      // 根据错误类型采取不同策略
      if (error.message.includes('频繁')) {
        // 频率限制错误
        await this.delay(1000);
        return this.safeInvoke(channel, ...args);
      }
      
      throw error;
    }
  }
  
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 使用示例
async function loadUserData(userId) {
  try {
    const result = await IPCErrorHandler.safeInvoke('user:load', userId);
    return result.data;
  } catch (error) {
    // 显示用户友好的错误信息
    showErrorMessage('加载用户数据失败，请重试');
    return null;
  }
}
```

### 通信监控与调试

```javascript
// 开发环境的通信监控
class IPCMonitor {
  constructor() {
    this.messages = [];
    this.setupMonitoring();
  }
  
  setupMonitoring() {
    if (process.env.NODE_ENV === 'development') {
      // 监控所有 IPC 消息
      this.monitorAllChannels();
    }
  }
  
  monitorAllChannels() {
    const originalInvoke = window.electronAPI.invoke;
    
    window.electronAPI.invoke = async (channel, ...args) => {
      const startTime = performance.now();
      
      try {
        const result = await originalInvoke.call(window.electronAPI, channel, ...args);
        const duration = performance.now() - startTime;
        
        this.logMessage({
          type: 'success',
          channel,
          args,
          result,
          duration,
          timestamp: new Date()
        });
        
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        
        this.logMessage({
          type: 'error',
          channel,
          args,
          error: error.message,
          duration,
          timestamp: new Date()
        });
        
        throw error;
      }
    };
  }
  
  logMessage(message) {
    this.messages.push(message);
    
    // 保持最近1000条消息
    if (this.messages.length > 1000) {
      this.messages.shift();
    }
    
    // 开发环境下输出到控制台
    if (process.env.NODE_ENV === 'development') {
      console.log('IPC Message:', message);
    }
  }
  
  getStats() {
    const stats = {
      totalMessages: this.messages.length,
      successCount: this.messages.filter(m => m.type === 'success').length,
      errorCount: this.messages.filter(m => m.type === 'error').length,
      averageDuration: this.messages.reduce((sum, m) => sum + m.duration, 0) / this.messages.length
    };
    
    return stats;
  }
}

// 初始化监控
const ipcMonitor = new IPCMonitor();
```

Electron 进程通信机制为构建复杂的跨进程应用提供了强大的基础。通过合理运用不同的通信模式、实施严格的安全措施、建立健壮的错误处理机制，开发者可以构建出高效、安全、可靠的桌面应用程序。