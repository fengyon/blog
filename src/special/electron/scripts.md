# Electron 运行 Python/Go/Java

## 多语言集成概述

Electron 作为基于 Web 技术的跨平台桌面应用开发框架，通过集成 **Python**、**Go** 和 **Java** 等后端语言，实现了**前端界面**与**后端逻辑**的完美分离。这种架构既保留了 Electron 在用户界面开发上的优势，又充分利用了各语言在特定领域的专长，为构建功能丰富的桌面应用提供了更多可能性。

多语言集成的核心在于**进程间通信**，Electron 的主进程作为协调中心，管理与不同语言后端的通信桥梁：

```
Electron 渲染进程 (HTML/CSS/JavaScript)
        ↑↓ IPC 通信
Electron 主进程 (Node.js)
        ↑↓ 子进程/网络通信
Python/Go/Java 后端进程
        ↑
系统资源与原生功能
```

## Python 集成

### 集成架构与特点

Python 与 Electron 的集成主要通过**子进程创建**和**标准输入输出通信**实现。这种模式允许 Electron 应用调用 Python 的丰富生态库，特别是在**数据科学**、**机器学习**和**脚本自动化**领域。

**Python 集成架构示意图：**

```
Electron 前端界面
    ↑↓ 事件驱动
Node.js 子进程
    ↑↓ stdio/管道
Python 解释器
    ↑
NumPy/Pandas/Matplotlib 等科学计算库
```

### electron-python-shell 集成

`electron-python-shell` 库提供了高级的 Python 集成能力，简化了进程管理和通信复杂度。

```javascript
// python-integration.js
import { PythonShell } from 'electron-python-shell';

class PythonIntegration {
  constructor() {
    this.pythonShell = null;
    this.setupPythonEnvironment();
  }

  // 配置 Python 环境
  setupPythonEnvironment() {
    const pythonOptions = {
      mode: 'text',
      pythonPath: this.getPythonPath(),
      pythonOptions: ['-u'], // 无缓冲输出
      scriptPath: './python-scripts',
      args: []
    };

    this.pythonShell = new PythonShell('app.py', pythonOptions);
    this.setupMessageHandlers();
  }

  // 获取 Python 解释器路径
  getPythonPath() {
    // 开发环境下使用系统 Python
    if (process.env.NODE_ENV === 'development') {
      return process.platform === 'win32' ? 'python' : 'python3';
    }
    // 生产环境下使用打包的 Python
    return './python/python.exe';
  }

  // 设置消息处理器
  setupMessageHandlers() {
    this.pythonShell.on('message', (message) => {
      console.log('Python 输出:', message);
      this.handlePythonMessage(message);
    });

    this.pythonShell.on('stderr', (error) => {
      console.error('Python 错误:', error);
      this.handlePythonError(error);
    });

    this.pythonShell.on('close', () => {
      console.log('Python 进程已关闭');
      this.handlePythonExit();
    });
  }

  // 执行 Python 脚本
  async executePythonScript(scriptName, args = {}) {
    try {
      const message = {
        command: 'execute',
        script: scriptName,
        args: args,
        timestamp: Date.now()
      };

      this.pythonShell.send(JSON.stringify(message));
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Python 脚本执行超时'));
        }, 30000);

        this.pythonShell.once('message', (result) => {
          clearTimeout(timeout);
          resolve(JSON.parse(result));
        });
      });
    } catch (error) {
      console.error('执行 Python 脚本失败:', error);
      throw error;
    }
  }

  // 数据处理示例
  async processDataWithPandas(data) {
    return await this.executePythonScript('data_processor.py', {
      operation: 'analyze',
      data: data,
      method: 'pandas'
    });
  }

  // 机器学习推理
  async runMachineLearningInference(inputData) {
    return await this.executePythonScript('ml_model.py', {
      action: 'predict',
      input: inputData,
      model: 'random_forest'
    });
  }

  // 优雅关闭 Python 进程
  async shutdown() {
    if (this.pythonShell) {
      await this.pythonShell.kill();
      this.pythonShell = null;
    }
  }
}

export const pythonIntegration = new PythonIntegration();
```

### 原生子进程集成

对于需要更精细控制的场景，可以直接使用 Node.js 的 `child_process` 模块。

```javascript
// native-python.js
import { spawn } from 'child_process';
import { pathToPythonScripts } from '../config/paths.js';

export class NativePythonRunner {
  constructor() {
    this.activeProcesses = new Map();
  }

  // 执行 Python 脚本并返回 Promise
  executePythonScript(scriptPath, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const fullScriptPath = `${pathToPythonScripts}/${scriptPath}`;
      const pythonArgs = [fullScriptPath, ...args];
      
      const pythonProcess = spawn(this.getPythonCommand(), pythonArgs, {
        cwd: pathToPythonScripts,
        stdio: ['pipe', 'pipe', 'pipe'],
        ...options
      });

      const processId = Date.now().toString();
      this.activeProcesses.set(processId, pythonProcess);

      let stdoutData = '';
      let stderrData = '';

      pythonProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
        console.log(`Python stdout: ${data}`);
      });

      pythonProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
        console.error(`Python stderr: ${data}`);
      });

      pythonProcess.on('close', (code) => {
        this.activeProcesses.delete(processId);
        
        if (code === 0) {
          try {
            const result = JSON.parse(stdoutData);
            resolve(result);
          } catch (e) {
            resolve(stdoutData.trim());
          }
        } else {
          reject(new Error(`Python 进程退出，代码: ${code}, 错误: ${stderrData}`));
        }
      });

      pythonProcess.on('error', (error) => {
        this.activeProcesses.delete(processId);
        reject(new Error(`启动 Python 进程失败: ${error.message}`));
      });

      // 设置超时
      if (options.timeout) {
        setTimeout(() => {
          if (this.activeProcesses.has(processId)) {
            pythonProcess.kill();
            reject(new Error('Python 脚本执行超时'));
          }
        }, options.timeout);
      }
    });
  }

  getPythonCommand() {
    if (process.env.NODE_ENV === 'production') {
      return process.platform === 'win32' 
        ? './python/python.exe' 
        : './python/bin/python3';
    }
    return process.platform === 'win32' ? 'python' : 'python3';
  }

  // 向运行的 Python 进程发送数据
  sendToPythonProcess(processId, data) {
    const process = this.activeProcesses.get(processId);
    if (process && process.stdin.writable) {
      process.stdin.write(JSON.stringify(data) + '\n');
      return true;
    }
    return false;
  }

  // 终止 Python 进程
  terminateProcess(processId) {
    const process = this.activeProcesses.get(processId);
    if (process) {
      process.kill();
      this.activeProcesses.delete(processId);
      return true;
    }
    return false;
  }
}

export const nativePythonRunner = new NativePythonRunner();
```

## Go 语言集成

### 集成架构与特点

Go 语言与 Electron 的集成主要通过 **WebSocket 通信**或 **HTTP 服务**实现。Go 的**编译型特性**和**卓越的并发性能**使其特别适合处理高并发后端任务和系统级操作。

**Go 集成架构示意图：**

```
Electron 渲染进程
    ↑↓ WebSocket/HTTP
Go HTTP/WebSocket 服务
    ↑
Go 并发例程
    ↑
系统调用与高性能计算
```

### gotron 框架集成

`gotron` 提供了完整的 Go 语言 API 用于 Electron 应用开发，实现了 Go 后端与 Electron 前端的深度集成。

```javascript
// go-gotron-integration.js
import { EventEmitter } from 'events';

class GoTronIntegration extends EventEmitter {
  constructor() {
    super();
    this.websocket = null;
    this.backendPort = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    
    this.init();
  }

  // 初始化 Go 后端连接
  async init() {
    try {
      await this.startGoBackend();
      await this.connectToWebSocket();
      this.setupMessageHandlers();
    } catch (error) {
      console.error('Go 后端初始化失败:', error);
      this.scheduleReconnection();
    }
  }

  // 启动 Go 后端进程
  async startGoBackend() {
    // 在真实场景中，这里会启动编译好的 Go 可执行文件
    console.log('启动 Go 后端服务...');
    
    // 模拟获取后端端口（实际从环境变量或配置读取）
    this.backendPort = this.getBackendPort();
    return Promise.resolve();
  }

  // 连接到 WebSocket
  async connectToWebSocket() {
    return new Promise((resolve, reject) => {
      const port = this.backendPort || 8080;
      const wsUrl = `ws://localhost:${port}/web/app/events`;
      
      this.websocket = new WebSocket(wsUrl);
      
      this.websocket.onopen = () => {
        console.log('已连接到 Go 后端 WebSocket');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected');
        resolve();
      };
      
      this.websocket.onerror = (error) => {
        console.error('WebSocket 连接错误:', error);
        reject(error);
      };
      
      this.websocket.onclose = () => {
        console.log('WebSocket 连接关闭');
        this.isConnected = false;
        this.emit('disconnected');
        this.scheduleReconnection();
      };
    });
  }

  // 设置消息处理器
  setupMessageHandlers() {
    this.websocket.onmessage = (message) => {
      try {
        const data = JSON.parse(message.data);
        this.handleGoMessage(data);
      } catch (error) {
        console.error('解析 Go 消息失败:', error);
      }
    };
  }

  // 处理来自 Go 的消息
  handleGoMessage(data) {
    const { event, ...payload } = data;
    
    switch (event) {
      case 'performance-metrics':
        this.emit('performanceUpdate', payload);
        break;
      case 'system-info':
        this.emit('systemInfoUpdate', payload);
        break;
      case 'file-operation-result':
        this.emit('fileOperationComplete', payload);
        break;
      default:
        this.emit('message', { event, ...payload });
    }
  }

  // 发送消息到 Go 后端
  sendToGo(event, data = {}) {
    if (!this.isConnected || !this.websocket) {
      throw new Error('未连接到 Go 后端');
    }
    
    const message = {
      event,
      timestamp: Date.now(),
      ...data
    };
    
    this.websocket.send(JSON.stringify(message));
  }

  // 高性能计算任务
  async executeConcurrentTask(taskType, parameters) {
    return new Promise((resolve, reject) => {
      const taskId = `task-${Date.now()}`;
      
      const timeout = setTimeout(() => {
        this.removeListener(taskId, taskHandler);
        reject(new Error('任务执行超时'));
      }, 30000);
      
      const taskHandler = (result) => {
        clearTimeout(timeout);
        this.removeListener(taskId, taskHandler);
        resolve(result);
      };
      
      this.once(taskId, taskHandler);
      
      this.sendToGo('execute-task', {
        taskId,
        taskType,
        parameters
      });
    });
  }

  // 系统监控
  startSystemMonitoring() {
    this.sendToGo('start-monitoring', {
      metrics: ['cpu', 'memory', 'disk', 'network'],
      interval: 5000 // 5秒间隔
    });
  }

  // 文件系统操作
  async performFileOperation(operation, filePath, options = {}) {
    return this.executeConcurrentTask('file-operation', {
      operation,
      filePath,
      options
    });
  }

  // 重连机制
  scheduleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('达到最大重连次数，放弃连接');
      return;
    }
    
    const delay = Math.pow(2, this.reconnectAttempts) * 1000; // 指数退避
    this.reconnectAttempts++;
    
    console.log(`${delay}ms 后尝试重新连接...`);
    
    setTimeout(() => {
      this.init().catch(() => {
        this.scheduleReconnection();
      });
    }, delay);
  }

  getBackendPort() {
    return window.backendPort || 8080;
  }
}

export const goTronIntegration = new GoTronIntegration();
```

### WebAssembly 集成

Go 代码可以编译为 WebAssembly，在 Electron 的渲染进程中直接运行。

```javascript
// go-wasm-integration.js
export class GoWasmIntegration {
  constructor() {
    this.go = null;
    this.wasmModule = null;
    this.initialized = false;
  }

  // 初始化 Go WASM 模块
  async init() {
    if (this.initialized) return;

    try {
      // 加载 Go WASM 模块
      const go = new Go();
      
      const result = await WebAssembly.instantiateStreaming(
        fetch('./wasm/main.wasm'),
        go.importObject
      );
      
      this.wasmModule = result.instance;
      this.go = go;
      
      // 在单独的 Worker 中运行以避免阻塞 UI
      await this.runInWorker();
      
      this.initialized = true;
      console.log('Go WASM 模块初始化成功');
    } catch (error) {
      console.error('初始化 Go WASM 失败:', error);
      throw error;
    }
  }

  // 在 Web Worker 中运行 WASM
  async runInWorker() {
    if (typeof Worker === 'undefined') {
      // 回退到主线程运行
      this.go.run(this.wasmModule);
      return;
    }

    return new Promise((resolve) => {
      const worker = new Worker('./workers/go-wasm-worker.js');
      
      worker.onmessage = (e) => {
        if (e.data.type === 'ready') {
          resolve();
        }
        this.handleWorkerMessage(e);
      };
      
      this.worker = worker;
    });
  }

  // 调用 Go WASM 函数
  async callGoFunction(functionName, ...args) {
    await this.ensureInitialized();
    
    if (this.worker) {
      return this.callViaWorker(functionName, args);
    } else {
      return this.callDirectly(functionName, args);
    }
  }

  // 通过 Worker 调用
  callViaWorker(functionName, args) {
    return new Promise((resolve, reject) => {
      const callId = Date.now().toString();
      
      const handleResponse = (e) => {
        if (e.data.callId === callId) {
          this.worker.removeEventListener('message', handleResponse);
          
          if (e.data.error) {
            reject(new Error(e.data.error));
          } else {
            resolve(e.data.result);
          }
        }
      };
      
      this.worker.addEventListener('message', handleResponse);
      this.worker.postMessage({
        type: 'call',
        callId,
        functionName,
        args
      });
    });
  }

  // 直接调用（在主线程）
  callDirectly(functionName, args) {
    if (!this.wasmModule.exports[functionName]) {
      throw new Error(`Go 函数不存在: ${functionName}`);
    }
    
    try {
      const result = this.wasmModule.exports[functionName](...args);
      return Promise.resolve(result);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // 高性能计算示例
  async performComplexCalculation(inputData) {
    return this.callGoFunction('CalculateComplexAlgorithm', inputData);
  }

  // 数据加密/解密
  async encryptData(data, key) {
    return this.callGoFunction('EncryptData', data, key);
  }

  async decryptData(encryptedData, key) {
    return this.callGoFunction('DecryptData', encryptedData, key);
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.init();
    }
  }
}

export const goWasmIntegration = new GoWasmIntegration();
```

## Java 集成

### 集成架构与特点

Java 与 Electron 的集成通常通过**本地进程启动**和 **HTTP/WebSocket 通信**实现。这种架构充分利用了 Java 在**企业级应用**、**大规模数据处理**和**现有系统集成**方面的优势。

**Java 集成架构示意图：**

```
Electron 用户界面
    ↑↓ REST API/WebSocket
Java Spring Boot 服务
    ↑
Java 虚拟机 (JVM)
    ↑
企业级 Java 生态 (Spring/Hibernate等)
```

### 子进程与 HTTP 服务集成

通过启动 Java 进程并与其 HTTP 服务通信，实现 Electron 与 Java 后端的无缝集成。

```javascript
// java-integration.js
import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { EventEmitter } from 'events';

export class JavaIntegration extends EventEmitter {
  constructor() {
    super();
    this.javaProcess = null;
    this.servicePort = null;
    this.serviceBaseUrl = null;
    this.isServiceReady = false;
    
    this.init();
  }

  // 初始化 Java 服务
  async init() {
    try {
      await this.startJavaProcess();
      await this.waitForServiceReady();
      this.setupProcessHandlers();
    } catch (error) {
      console.error('Java 服务初始化失败:', error);
      this.emit('error', error);
    }
  }

  // 启动 Java 进程
  async startJavaProcess() {
    return new Promise((resolve, reject) => {
      const javaCommand = this.getJavaCommand();
      const classpath = this.getClasspath();
      const mainClass = 'com.example.MainApplication';
      
      const args = ['-cp', classpath, mainClass];
      
      this.javaProcess = spawn(javaCommand, args, {
        cwd: this.getJavaAppPath(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // 读取 Java 服务输出
      const rl = createInterface({
        input: this.javaProcess.stdout,
        terminal: false
      });

      rl.on('line', (line) => {
        console.log(`Java: ${line}`);
        this.parseJavaOutput(line);
      });

      this.javaProcess.stderr.on('data', (data) => {
        console.error(`Java 错误: ${data}`);
        this.emit('error', new Error(data.toString()));
      });

      this.javaProcess.on('close', (code) => {
        console.log(`Java 进程退出，代码: ${code}`);
        this.isServiceReady = false;
        this.emit('serviceStopped', code);
      });

      this.javaProcess.on('error', (error) => {
        console.error('启动 Java 进程失败:', error);
        reject(error);
      });

      // 设置超时
      setTimeout(() => {
        if (!this.isServiceReady) {
          reject(new Error('Java 服务启动超时'));
        }
      }, 30000);

      resolve();
    });
  }

  // 解析 Java 输出
  parseJavaOutput(line) {
    try {
      const logEntry = JSON.parse(line);
      
      if (logEntry.message && logEntry.message.includes('服务启动在端口')) {
        this.extractServicePort(logEntry.message);
      }
      
      this.emit('log', logEntry);
    } catch (e) {
      // 非 JSON 输出，直接处理
      if (line.includes('服务启动在端口')) {
        this.extractServicePort(line);
      }
    }
  }

  // 提取服务端口
  extractServicePort(message) {
    const portMatch = message.match(/端口[:：]?(\d+)/);
    if (portMatch) {
      this.servicePort = parseInt(portMatch[1]);
      this.serviceBaseUrl = `http://localhost:${this.servicePort}`;
      this.isServiceReady = true;
      this.emit('serviceReady', this.serviceBaseUrl);
    }
  }

  // 等待服务就绪
  async waitForServiceReady() {
    if (this.isServiceReady) return;
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('等待 Java 服务就绪超时'));
      }, 30000);
      
      this.once('serviceReady', (url) => {
        clearTimeout(timeout);
        resolve(url);
      });
    });
  }

  // 调用 Java REST API
  async callJavaService(endpoint, data = {}, method = 'GET') {
    await this.ensureServiceReady();
    
    const url = `${this.serviceBaseUrl}${endpoint}`;
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (method !== 'GET' && data) {
      options.body = JSON.stringify(data);
    }
    
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP 错误! 状态: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('调用 Java 服务失败:', error);
      throw error;
    }
  }

  // 企业级业务方法
  async processBusinessData(data) {
    return this.callJavaService('/api/business/process', data, 'POST');
  }

  async generateReport(reportConfig) {
    return this.callJavaService('/api/reports/generate', reportConfig, 'POST');
  }

  async getSystemHealth() {
    return this.callJavaService('/api/health', {}, 'GET');
  }

  // 数据库操作
  async executeDatabaseQuery(query) {
    return this.callJavaService('/api/database/query', { query }, 'POST');
  }

  // 确保服务就绪
  async ensureServiceReady() {
    if (!this.isServiceReady) {
      await this.waitForServiceReady();
    }
  }

  // 获取 Java 命令
  getJavaCommand() {
    if (process.env.NODE_ENV === 'production') {
      return './java/jre/bin/java';
    }
    return 'java';
  }

  // 获取类路径
  getClasspath() {
    const basePath = process.env.NODE_ENV === 'production' 
      ? './java/app' 
      : '../java-app/target/classes';
    
    return `${basePath}/*:${basePath}/lib/*`;
  }

  // 获取 Java 应用路径
  getJavaAppPath() {
    return process.env.NODE_ENV === 'production' 
      ? './java/app' 
      : '../java-app';
  }

  // 设置进程处理器
  setupProcessHandlers() {
    process.on('exit', () => {
      this.shutdown();
    });
  }

  // 优雅关闭
  async shutdown() {
    if (this.javaProcess) {
      try {
        await this.callJavaService('/api/shutdown', {}, 'POST');
      } catch (error) {
        // 强制终止进程
        this.javaProcess.kill();
      }
      this.javaProcess = null;
    }
  }
}

export const javaIntegration = new JavaIntegration();
```

### WebSocket 实时通信集成

对于需要实时双向通信的场景，WebSocket 提供了更好的解决方案。

```javascript
// java-websocket-integration.js
import { EventEmitter } from 'events';

export class JavaWebSocketIntegration extends EventEmitter {
  constructor() {
    super();
    this.socket = null;
    this.reconnectInterval = 5000;
    this.shouldReconnect = true;
    this.messageQueue = [];
  }

  // 连接到 Java WebSocket 服务
  async connect(port = 8080) {
    return new Promise((resolve, reject) => {
      const wsUrl = `ws://localhost:${port}/websocket`;
      
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log('已连接到 Java WebSocket 服务');
        this.flushMessageQueue();
        this.emit('connected');
        resolve();
      };
      
      this.socket.onmessage = (event) => {
        this.handleMessage(event);
      };
      
      this.socket.onclose = (event) => {
        console.log('Java WebSocket 连接关闭');
        this.emit('disconnected', event);
        this.scheduleReconnection();
      };
      
      this.socket.onerror = (error) => {
        console.error('Java WebSocket 错误:', error);
        this.emit('error', error);
        reject(error);
      };
    });
  }

  // 处理消息
  handleMessage(event) {
    try {
      const message = JSON.parse(event.data);
      const { type, payload, correlationId } = message;
      
      this.emit(type, payload);
      
      if (correlationId) {
        this.emit(correlationId, payload);
      }
    } catch (error) {
      console.error('解析 WebSocket 消息失败:', error);
    }
  }

  // 发送消息
  send(type, payload, waitForResponse = false) {
    const message = {
      type,
      payload,
      timestamp: Date.now()
    };
    
    if (waitForResponse) {
      return this.sendWithResponse(message);
    }
    
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  // 发送并等待响应
  sendWithResponse(message) {
    return new Promise((resolve, reject) => {
      const correlationId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      message.correlationId = correlationId;
      
      const timeout = setTimeout(() => {
        this.removeAllListeners(correlationId);
        reject(new Error('等待响应超时'));
      }, 30000);
      
      this.once(correlationId, (response) => {
        clearTimeout(timeout);
        resolve(response);
      });
      
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify(message));
      } else {
        reject(new Error('WebSocket 未连接'));
      }
    });
  }

  // 刷新消息队列
  flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.socket.send(JSON.stringify(message));
    }
  }

  // 调度重连
  scheduleReconnection() {
    if (!this.shouldReconnect) return;
    
    setTimeout(() => {
      this.connect().catch(() => {
        this.scheduleReconnection();
      });
    }, this.reconnectInterval);
  }

  // 实时数据订阅
  subscribeToDataUpdates(channel) {
    this.send('subscribe', { channel });
  }

  // 取消订阅
  unsubscribeFromDataUpdates(channel) {
    this.send('unsubscribe', { channel });
  }

  // 关闭连接
  disconnect() {
    this.shouldReconnect = false;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const javaWebSocketIntegration = new JavaWebSocketIntegration();
```

## 跨语言统一管理

### 多运行时协调器

在同时使用多种语言后端的复杂应用中，需要统一的协调机制来管理不同后端的生命周期和通信。

```javascript
// cross-language-manager.js
import { pythonIntegration } from './python-integration.js';
import { goTronIntegration } from './go-gotron-integration.js';
import { javaIntegration } from './java-integration.js';

export class CrossLanguageManager {
  constructor() {
    this.services = new Map();
    this.serviceStatus = new Map();
    this.init();
  }

  // 初始化所有服务
  async init() {
    this.registerService('python', pythonIntegration);
    this.registerService('go', goTronIntegration);
    this.registerService('java', javaIntegration);
    
    await this.initializeServices();
  }

  // 注册服务
  registerService(name, serviceInstance) {
    this.services.set(name, serviceInstance);
    this.serviceStatus.set(name, 'stopped');
    
    // 监听服务状态变化
    if (serviceInstance.on) {
      serviceInstance.on('connected', () => {
        this.serviceStatus.set(name, 'connected');
        this.emit('serviceStatusChanged', { name, status: 'connected' });
      });
      
      serviceInstance.on('disconnected', () => {
        this.serviceStatus.set(name, 'disconnected');
        this.emit('serviceStatusChanged', { name, status: 'disconnected' });
      });
      
      serviceInstance.on('error', (error) => {
        this.serviceStatus.set(name, 'error');
        this.emit('serviceError', { name, error });
      });
    }
  }

  // 初始化所有服务
  async initializeServices() {
    const initializationPromises = [];
    
    for (const [name, service] of this.services) {
      const promise = service.init ? service.init() : Promise.resolve();
      
      promise
        .then(() => {
          this.serviceStatus.set(name, 'initialized');
        })
        .catch((error) => {
          console.error(`初始化 ${name} 服务失败:`, error);
          this.serviceStatus.set(name, 'error');
        });
      
      initializationPromises.push(promise);
    }
    
    await Promise.allSettled(initializationPromises);
    this.emit('allServicesInitialized');
  }

  // 根据任务类型路由到合适的后端
  async executeTask(taskType, data) {
    const service = this.routeTaskToService(taskType);
    
    if (!service) {
      throw new Error(`没有找到适合处理 ${taskType} 的后端服务`);
    }
    
    if (this.serviceStatus.get(service.name) !== 'connected') {
      throw new Error(`${service.name} 服务未就绪`);
    }
    
    return await service.instance.executeTask(taskType, data);
  }

  // 任务路由逻辑
  routeTaskToService(taskType) {
    const routingRules = {
      // Python 处理数据分析和机器学习
      'data-analysis': 'python',
      'machine-learning': 'python',
      'statistical-analysis': 'python',
      
      // Go 处理高并发和系统级任务
      'concurrent-processing': 'go',
      'system-monitoring': 'go',
      'file-operations': 'go',
      'encryption-decryption': 'go',
      
      // Java 处理企业级业务逻辑
      'business-logic': 'java',
      'database-operations': 'java',
      'report-generation': 'java',
      'enterprise-integration': 'java'
    };
    
    const serviceName = routingRules[taskType];
    if (serviceName && this.services.has(serviceName)) {
      return {
        name: serviceName,
        instance: this.services.get(serviceName)
      };
    }
    
    return null;
  }

  // 获取服务状态
  getServiceStatus() {
    const status = {};
    for (const [name, serviceStatus] of this.serviceStatus) {
      status[name] = serviceStatus;
    }
    return status;
  }

  // 优雅关闭所有服务
  async shutdown() {
    const shutdownPromises = [];
    
    for (const [name, service] of this.services) {
      if (service.shutdown) {
        shutdownPromises.push(
          service.shutdown().catch(error => {
            console.error(`关闭 ${name} 服务失败:`, error);
          })
        );
      }
    }
    
    await Promise.allSettled(shutdownPromises);
    console.log('所有后端服务已关闭');
  }

  // 健康检查
  async healthCheck() {
    const health = {};
    
    for (const [name, service] of this.services) {
      try {
        if (service.healthCheck) {
          health[name] = await service.healthCheck();
        } else {
          health[name] = {
            status: this.serviceStatus.get(name),
            timestamp: Date.now()
          };
        }
      } catch (error) {
        health[name] = {
          status: 'error',
          error: error.message,
          timestamp: Date.now()
        };
      }
    }
    
    return health;
  }
}

export const crossLanguageManager = new CrossLanguageManager();
```

通过这种多语言集成架构，Electron 应用可以充分利用各种编程语言的优势，实现功能丰富且性能优异的桌面应用程序。