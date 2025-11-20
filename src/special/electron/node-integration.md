# Electron Node

Electron Node 是 Electron 框架的核心特性之一，它将 Node.js 运行时与 Chromium 渲染引擎深度集成，为桌面应用程序提供了完整的全栈 JavaScript 开发能力。这种独特的架构允许开发者在渲染进程和主进程中同时使用 Node.js API，打破了传统 Web 应用在浏览器环境中的限制。

## Node 集成架构

Electron 的 Node 集成采用分层架构设计，将 Node.js 运行时与 Chromium 渲染进程巧妙结合：

```
Electron 应用运行时环境
     |
     +-- 主进程 (Main Process)
     |     |
     |     +-- 完整的 Node.js 运行时
     |     |     |
     |     |     +-- 文件系统访问
     |     |     +-- 网络操作
     |     |     +-- 原生模块支持
     |     |
     |     +-- Chromium 窗口管理
     |
     +-- 渲染进程 (Renderer Processes)
           |
           +-- Chromium 渲染引擎
           |     |
           |     +-- HTML/CSS/JavaScript 渲染
           |     +-- Web API 支持
           |
           +-- Node.js 运行时 (可选集成)
                 |
                 +-- 通过预加载脚本安全访问
                 +-- 上下文隔离保护
```

## 主进程中的 Node.js

### 完整的 Node.js 环境

Electron 主进程运行在完整的 Node.js 环境中，可以直接使用所有 Node.js 内置模块和第三方包：

```javascript
// main.js
import { app, BrowserWindow } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class FileSystemManager {
  constructor() {
    this.userDataPath = app.getPath('userData');
    this.tempPath = os.tmpdir();
  }

  // 读取应用数据文件
  async readAppData(filename) {
    const filePath = path.join(this.userDataPath, filename);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // 文件不存在
      }
      throw error;
    }
  }

  // 写入应用数据
  async writeAppData(filename, data) {
    const filePath = path.join(this.userDataPath, filename);
    const dir = path.dirname(filePath);
    
    // 确保目录存在
    await fs.mkdir(dir, { recursive: true });
    
    // 写入文件
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  // 监控文件变化
  watchFile(filePath, callback) {
    const fs = require('fs'); // 使用 CommonJS 模块进行文件监控
    return fs.watch(filePath, { persistent: false }, callback);
  }
}

class NetworkManager {
  constructor() {
    this.net = require('net'); // TCP 网络
    this.dgram = require('dgram'); // UDP 网络
    this.http = require('http'); // HTTP 服务器
    this.https = require('https'); // HTTPS 服务器
  }

  // 创建 HTTP 服务器
  createHttpServer(port, requestHandler) {
    const server = this.http.createServer(requestHandler);
    
    server.listen(port, () => {
      console.log(`HTTP 服务器运行在端口 ${port}`);
    });
    
    return server;
  }

  // 创建 TCP 服务器
  createTcpServer(port, connectionHandler) {
    const server = this.net.createServer(connectionHandler);
    
    server.listen(port, () => {
      console.log(`TCP 服务器运行在端口 ${port}`);
    });
    
    return server;
  }

  // 检查网络连接
  async checkConnectivity(host, port) {
    return new Promise((resolve) => {
      const socket = this.net.createConnection(port, host);
      
      socket.setTimeout(5000);
      
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      
      socket.on('error', () => {
        resolve(false);
      });
    });
  }
}
```

### 进程管理与系统集成

主进程可以利用 Node.js 的进程管理能力实现复杂的系统集成：

```javascript
// main.js
import { app, ipcMain } from 'electron';
import { spawn, exec } from 'child_process';
import { EventEmitter } from 'events';

class SystemIntegration extends EventEmitter {
  constructor() {
    super();
    this.childProcesses = new Map();
    this.setupProcessManagement();
  }

  setupProcessManagement() {
    // 处理外部进程执行请求
    ipcMain.handle('process:execute', async (event, command, args = []) => {
      return this.executeCommand(command, args);
    });

    // 处理长时间运行的进程
    ipcMain.handle('process:spawn', async (event, command, args = [], options = {}) => {
      return this.spawnProcess(command, args, options);
    });

    // 终止进程
    ipcMain.handle('process:kill', async (event, pid) => {
      return this.killProcess(pid);
    });
  }

  // 执行命令并返回结果
  async executeCommand(command, args = []) {
    return new Promise((resolve, reject) => {
      exec(`${command} ${args.join(' ')}`, (error, stdout, stderr) => {
        if (error) {
          reject({ success: false, error: error.message });
        } else {
          resolve({ 
            success: true, 
            stdout: stdout.toString(), 
            stderr: stderr.toString() 
          });
        }
      });
    });
  }

  // 生成子进程
  spawnProcess(command, args = [], options = {}) {
    const child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options
    });

    const processId = Date.now().toString();
    
    this.childProcesses.set(processId, {
      process: child,
      command,
      args,
      startTime: new Date()
    });

    // 收集输出
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
      this.emit('process:output', { pid: processId, type: 'stdout', data: data.toString() });
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
      this.emit('process:output', { pid: processId, type: 'stderr', data: data.toString() });
    });

    child.on('close', (code) => {
      this.childProcesses.delete(processId);
      this.emit('process:exit', { pid: processId, code, stdout, stderr });
    });

    child.on('error', (error) => {
      this.childProcesses.delete(processId);
      this.emit('process:error', { pid: processId, error: error.message });
    });

    return { pid: processId, process: child };
  }

  // 终止进程
  killProcess(pid) {
    const processInfo = this.childProcesses.get(pid);
    if (processInfo) {
      processInfo.process.kill();
      this.childProcesses.delete(pid);
      return { success: true };
    }
    return { success: false, error: '进程不存在' };
  }

  // 获取系统信息
  getSystemInfo() {
    const os = require('os');
    
    return {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      memory: process.memoryUsage(),
      system: {
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        cpus: os.cpus().length,
        uptime: os.uptime()
      }
    };
  }
}
```

## 渲染进程中的 Node 集成

### 安全的 Node.js 访问

通过预加载脚本和上下文隔离，安全地在渲染进程中暴露 Node.js 功能：

```javascript
// preload.js
import { contextBridge, ipcRenderer } from 'electron';
import { crypto } from 'crypto';

// 安全地暴露 Node.js API 子集
contextBridge.exposeInMainWorld('nodeAPI', {
  // 加密功能
  crypto: {
    createHash: (algorithm, data) => {
      const hash = crypto.createHash(algorithm);
      hash.update(data);
      return hash.digest('hex');
    },
    
    randomBytes: (size) => {
      return crypto.randomBytes(size).toString('hex');
    }
  },

  // 工具函数
  utils: {
    getPlatform: () => process.platform,
    getVersions: () => ({
      node: process.versions.node,
      electron: process.versions.electron
    })
  },

  // 文件系统操作（通过 IPC）
  fs: {
    readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', filePath, content),
    readDir: (dirPath) => ipcRenderer.invoke('fs:readDir', dirPath)
  },

  // 进程管理
  process: {
    execute: (command, args) => ipcRenderer.invoke('process:execute', command, args),
    getSystemInfo: () => ipcRenderer.invoke('process:getSystemInfo')
  }
});
```

### 在渲染进程中使用 Node.js 功能

```javascript
// renderer.js
class NodeIntegrationExample {
  constructor() {
    this.setupEventListeners();
    this.loadSystemInfo();
  }

  async setupEventListeners() {
    // 文件操作示例
    document.getElementById('readFileBtn').addEventListener('click', () => {
      this.readFileExample();
    });

    // 加密操作示例
    document.getElementById('hashBtn').addEventListener('click', () => {
      this.hashExample();
    });

    // 系统命令示例
    document.getElementById('systemCmdBtn').addEventListener('click', () => {
      this.systemCommandExample();
    });
  }

  async readFileExample() {
    try {
      const content = await window.nodeAPI.fs.readFile('/path/to/file.txt');
      document.getElementById('fileContent').textContent = content;
    } catch (error) {
      console.error('读取文件失败:', error);
    }
  }

  async hashExample() {
    const data = document.getElementById('hashInput').value;
    const hash = window.nodeAPI.crypto.createHash('sha256', data);
    document.getElementById('hashResult').textContent = hash;
  }

  async systemCommandExample() {
    try {
      const result = await window.nodeAPI.process.execute('ls', ['-la']);
      if (result.success) {
        document.getElementById('cmdOutput').textContent = result.stdout;
      } else {
        document.getElementById('cmdOutput').textContent = '命令执行失败';
      }
    } catch (error) {
      console.error('执行命令失败:', error);
    }
  }

  async loadSystemInfo() {
    const info = await window.nodeAPI.process.getSystemInfo();
    this.displaySystemInfo(info);
  }

  displaySystemInfo(info) {
    const infoDiv = document.getElementById('systemInfo');
    infoDiv.innerHTML = `
      <h3>系统信息</h3>
      <p>平台: ${info.platform}</p>
      <p>架构: ${info.arch}</p>
      <p>Node.js 版本: ${info.nodeVersion}</p>
      <p>内存使用: ${Math.round(info.memory.heapUsed / 1024 / 1024)}MB</p>
    `;
  }
}

// 初始化应用
new NodeIntegrationExample();
```

## 原生模块集成

### 使用 Node.js 原生模块

Electron 支持使用 Node.js 原生模块，但需要注意与 Electron 版本的兼容性：

```javascript
// main.js
import { app } from 'electron';

class NativeModuleManager {
  constructor() {
    this.nativeModules = new Map();
    this.loadNativeModules();
  }

  loadNativeModules() {
    try {
      // 尝试加载 SQLite3
      const sqlite3 = require('sqlite3');
      this.nativeModules.set('sqlite3', sqlite3);
      console.log('SQLite3 模块加载成功');
    } catch (error) {
      console.warn('SQLite3 模块加载失败:', error.message);
    }

    try {
      // 尝试加载图像处理模块
      const sharp = require('sharp');
      this.nativeModules.set('sharp', sharp);
      console.log('Sharp 模块加载成功');
    } catch (error) {
      console.warn('Sharp 模块加载失败:', error.message);
    }
  }

  // 数据库操作
  setupDatabase() {
    const sqlite3 = this.nativeModules.get('sqlite3');
    if (!sqlite3) {
      throw new Error('SQLite3 模块不可用');
    }

    const dbPath = `${app.getPath('userData')}/app.db`;
    const db = new sqlite3.Database(dbPath);

    return {
      db,
      // 封装常用数据库操作
      run: (sql, params = []) => {
        return new Promise((resolve, reject) => {
          db.run(sql, params, function(error) {
            if (error) {
              reject(error);
            } else {
              resolve({ id: this.lastID, changes: this.changes });
            }
          });
        });
      },

      get: (sql, params = []) => {
        return new Promise((resolve, reject) => {
          db.get(sql, params, (error, row) => {
            if (error) {
              reject(error);
            } else {
              resolve(row);
            }
          });
        });
      },

      all: (sql, params = []) => {
        return new Promise((resolve, reject) => {
          db.all(sql, params, (error, rows) => {
            if (error) {
              reject(error);
            } else {
              resolve(rows);
            }
          });
        });
      }
    };
  }

  // 图像处理
  async processImage(inputPath, outputPath, operations = {}) {
    const sharp = this.nativeModules.get('sharp');
    if (!sharp) {
      throw new Error('Sharp 模块不可用');
    }

    let image = sharp(inputPath);

    // 应用操作
    if (operations.resize) {
      image = image.resize(operations.resize.width, operations.resize.height);
    }

    if (operations.rotate) {
      image = image.rotate(operations.rotate);
    }

    if (operations.format) {
      image = image.toFormat(operations.format);
    }

    // 保存图像
    await image.toFile(outputPath);
    return { success: true, outputPath };
  }
}
```

### 原生模块构建与兼容性

确保原生模块与 Electron 版本兼容：

```javascript
// build-tools.js
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class NativeModuleBuilder {
  constructor() {
    this.electronVersion = process.versions.electron;
  }

  // 检查模块兼容性
  checkModuleCompatibility(moduleName) {
    try {
      // 使用 electron-rebuild 检查兼容性
      const result = execSync(`npx electron-rebuild --module-dir node_modules/${moduleName} --electron-version ${this.electronVersion} --dry-run`, {
        encoding: 'utf-8'
      });
      return { compatible: true, message: result };
    } catch (error) {
      return { compatible: false, error: error.message };
    }
  }

  // 重建原生模块
  rebuildModule(moduleName) {
    try {
      console.log(`正在为 Electron ${this.electronVersion} 重建 ${moduleName}...`);
      
      execSync(`npx electron-rebuild --module-dir node_modules/${moduleName} --electron-version ${this.electronVersion}`, {
        stdio: 'inherit'
      });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 自动处理所有原生模块
  async rebuildAllModules() {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const nativeModules = await this.detectNativeModules();
    
    for (const moduleName of nativeModules) {
      console.log(`处理模块: ${moduleName}`);
      
      const compatibility = this.checkModuleCompatibility(moduleName);
      if (!compatibility.compatible) {
        console.log(`重建模块 ${moduleName}...`);
        const result = this.rebuildModule(moduleName);
        
        if (!result.success) {
          console.error(`重建 ${moduleName} 失败:`, result.error);
        }
      } else {
        console.log(`模块 ${moduleName} 兼容`);
      }
    }
  }

  // 检测项目中的原生模块
  async detectNativeModules() {
    const nodeModulesPath = 'node_modules';
    const nativeModules = [];
    
    try {
      const modules = fs.readdirSync(nodeModulesPath);
      
      for (const module of modules) {
        if (module.startsWith('.')) continue;
        
        const modulePath = path.join(nodeModulesPath, module);
        const bindingGypPath = path.join(modulePath, 'binding.gyp');
        
        if (fs.existsSync(bindingGypPath)) {
          nativeModules.push(module);
        }
      }
    } catch (error) {
      console.error('检测原生模块时出错:', error);
    }
    
    return nativeModules;
  }
}
```

## 性能优化与资源管理

### Node.js 进程优化

```javascript
// performance-manager.js
import { performance, PerformanceObserver } from 'perf_hooks';
import v8 from 'v8';

class NodePerformanceManager {
  constructor() {
    this.metrics = new Map();
    this.setupPerformanceMonitoring();
  }

  setupPerformanceMonitoring() {
    // 监控垃圾回收
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        console.log(`GC 事件: ${entry.name}`, entry.duration);
        this.recordMetric('gc', entry);
      });
    });

    observer.observe({ entryTypes: ['gc'] });

    // 定期收集性能指标
    setInterval(() => {
      this.collectPerformanceMetrics();
    }, 5000);
  }

  collectPerformanceMetrics() {
    const metrics = {
      timestamp: Date.now(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      heap: v8.getHeapStatistics(),
      activeHandles: process._getActiveHandles().length,
      activeRequests: process._getActiveRequests().length
    };

    this.metrics.set(metrics.timestamp, metrics);
    
    // 保持最近100个指标
    if (this.metrics.size > 100) {
      const firstKey = this.metrics.keys().next().value;
      this.metrics.delete(firstKey);
    }

    return metrics;
  }

  // 内存泄漏检测
  detectMemoryLeaks() {
    const metrics = Array.from(this.metrics.values());
    if (metrics.length < 10) return null;

    const recent = metrics.slice(-5);
    const older = metrics.slice(-10, -5);

    const recentAvg = this.averageMemory(recent);
    const olderAvg = this.averageMemory(older);

    const growth = (recentAvg - olderAvg) / olderAvg;
    
    if (growth > 0.1) { // 内存增长超过10%
      return {
        leakDetected: true,
        growthRate: growth,
        suggestion: '检查未释放的引用或定时器'
      };
    }

    return { leakDetected: false };
  }

  averageMemory(metrics) {
    const total = metrics.reduce((sum, m) => sum + m.memory.heapUsed, 0);
    return total / metrics.length;
  }

  // 强制垃圾回收（仅开发环境）
  forceGarbageCollection() {
    if (global.gc) {
      global.gc();
      return { success: true, message: '垃圾回收已执行' };
    } else {
      return { 
        success: false, 
        message: '请使用 --expose-gc 标志启动应用以启用强制垃圾回收' 
      };
    }
  }

  // 获取性能报告
  getPerformanceReport() {
    const metrics = Array.from(this.metrics.values());
    const latest = metrics[metrics.length - 1];
    
    return {
      summary: {
        uptime: process.uptime(),
        platform: process.platform,
        nodeVersion: process.version
      },
      current: latest,
      trends: this.calculateTrends(metrics),
      leaks: this.detectMemoryLeaks()
    };
  }

  calculateTrends(metrics) {
    if (metrics.length < 2) return {};
    
    const first = metrics[0];
    const last = metrics[metrics.length - 1];
    
    const memoryGrowth = (last.memory.heapUsed - first.memory.heapUsed) / first.memory.heapUsed;
    
    return {
      memoryGrowth,
      trend: memoryGrowth > 0.05 ? 'increasing' : memoryGrowth < -0.05 ? 'decreasing' : 'stable'
    };
  }
}
```

Electron 的 Node.js 集成提供了强大的能力，让开发者能够构建功能丰富的桌面应用程序。通过合理利用主进程的完整 Node.js 环境、安全地在渲染进程中暴露必要的 Node.js 功能、正确管理原生模块，以及实施性能监控和优化，可以创建出既具备 Web 应用灵活性又拥有原生应用能力的跨平台桌面应用。