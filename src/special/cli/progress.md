# 进程控制

## Node.js 进程控制概述

Node.js 虽然是单线程模型，但通过强大的进程控制能力，可以充分利用多核 CPU 资源，构建高性能的应用程序。进程控制是现代 Node.js 应用开发中的核心技能，涉及子进程管理、进程间通信、集群部署等关键领域。

```
主进程 (Parent Process)
    │
    ├── 子进程 1 (Child Process) → 独立 V8 实例
    ├── 子进程 2 (Child Process) → 独立 V8 实例
    ├── 子进程 3 (Child Process) → 独立 V8 实例
    └── 子进程 N (Child Process) → 独立 V8 实例
```

## 进程基础概念

### 进程与线程的区别

**进程**是操作系统分配资源的基本单位，每个进程都有独立的内存空间和系统资源。**线程**是进程中的执行单元，多个线程共享进程的内存空间。

在 Node.js 中：

- 每个进程都是独立的 V8 实例
- 进程间内存不共享，需要通过 IPC 通信
- 多进程可充分利用多核 CPU 优势

### Node.js 的单线程与多进程

Node.js 采用单线程事件循环模型，适合 I/O 密集型任务。但对于 CPU 密集型任务，单线程会遇到性能瓶颈。通过多进程架构，Node.js 可以：

- 避免 CPU 密集型任务阻塞事件循环
- 提高应用程序的健壮性
- 充分利用多核 CPU 资源

## 原生进程控制模块

### Process 全局对象

`process` 是 Node.js 的全局对象，提供当前进程的信息和控制能力。

```javascript
// process-info.mjs
import process from 'node:process'

// 获取进程信息
console.log('进程ID:', process.pid)
console.log('Node.js 版本:', process.version)
console.log('运行平台:', process.platform)
console.log('当前工作目录:', process.cwd())
console.log('启动参数:', process.argv)

// 内存使用情况
const memoryUsage = process.memoryUsage()
console.log('内存使用:')
console.log(`  RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)}MB`)
console.log(`  堆总量: ${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`)
console.log(`  堆使用: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`)

// 运行时间
console.log(`进程已运行: ${process.uptime()}秒`)
```

### 进程事件处理

```javascript
// process-events.mjs
import process from 'node:process'

// 优雅退出处理
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，开始优雅退出')
  // 清理资源，完成当前请求
  server.close(() => {
    console.log('服务已关闭')
    process.exit(0)
  })
})

// Ctrl+C 处理
process.on('SIGINT', () => {
  console.log('\n收到 SIGINT 信号，退出进程')
  process.exit(0)
})

// 未捕获异常处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error)
  // 记录日志，清理资源后退出
  process.exit(1)
})

// 未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason)
  // 记录日志，可以选择退出或继续
})

// beforeExit 事件 - 还可以执行异步操作
process.on('beforeExit', (code) => {
  console.log('进程准备退出，代码:', code)
})

// exit 事件 - 只能执行同步操作
process.on('exit', (code) => {
  console.log('进程退出，代码:', code)
})
```

## Child Process 模块

### 子进程创建方法

Child Process 模块提供了四种创建子进程的方式，各有适用场景。

#### spawn - 基础进程创建

```javascript
// spawn-demo.mjs
import { spawn } from 'node:child_process'
import { createWriteStream } from 'node:fs'

// 执行系统命令
const ls = spawn('ls', ['-lh', '/usr'])

ls.stdout.on('data', (data) => {
  console.log(`标准输出: ${data}`)
})

ls.stderr.on('data', (data) => {
  console.error(`错误输出: ${data}`)
})

ls.on('close', (code) => {
  console.log(`子进程退出，代码: ${code}`)
})

// 带管道配置的示例
const child = spawn('node', ['server.js'], {
  stdio: ['pipe', 'pipe', 'pipe'], // [stdin, stdout, stderr]
})
```

#### exec - 执行 Shell 命令

```javascript
// exec-demo.mjs
import { exec } from 'node:child_process'

// 执行 shell 命令
exec('find . -name "*.js" | wc -l', (error, stdout, stderr) => {
  if (error) {
    console.error(`执行错误: ${error}`)
    return
  }
  console.log(`文件数量: ${stdout}`)
  if (stderr) {
    console.error(`错误输出: ${stderr}`)
  }
})

// 带选项的 exec
exec(
  'ls -la',
  {
    cwd: '/tmp', // 工作目录
    timeout: 5000, // 超时时间
    maxBuffer: 1024 * 1024, // 输出缓冲区大小
  },
  (error, stdout, stderr) => {
    // 处理结果
  }
)
```

#### execFile - 执行可执行文件

```javascript
// execfile-demo.mjs
import { execFile } from 'node:child_process'

// 直接执行可执行文件，不启动 shell
execFile(
  '/path/to/executable',
  ['--arg1', 'value1'],
  (error, stdout, stderr) => {
    if (error) {
      throw error
    }
    console.log(stdout)
  }
)

// 执行脚本文件
execFile('python', ['script.py', 'arg1'], (error, stdout, stderr) => {
  if (error) {
    console.error(`Python 脚本执行失败: ${error}`)
    return
  }
  console.log(`Python 输出: ${stdout}`)
})
```

#### fork - 创建 Node.js 子进程

```javascript
// fork-demo.mjs
import { fork } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// 创建 Node.js 子进程
const child = fork(join(__dirname, 'child-process.mjs'))

// 向子进程发送消息
child.send({ hello: 'world', pid: process.pid })

// 接收子进程消息
child.on('message', (message) => {
  console.log('来自子进程的消息:', message)

  if (message === 'exit') {
    child.kill('SIGTERM')
  }
})

child.on('exit', (code, signal) => {
  console.log(`子进程退出，代码: ${code}, 信号: ${signal}`)
})

child.on('error', (error) => {
  console.error('子进程错误:', error)
})
```

```javascript
// child-process.mjs
import process from 'node:process'

// 处理父进程消息
process.on('message', (message) => {
  console.log('来自父进程的消息:', message)

  // 执行一些工作
  const result = heavyComputation()

  // 发送结果回父进程
  process.send({
    result: result,
    childPid: process.pid,
  })
})

function heavyComputation() {
  // 模拟 CPU 密集型任务
  let sum = 0
  for (let i = 0; i < 1e8; i++) {
    sum += i
  }
  return sum
}

// 告诉父进程准备就绪
process.send('ready')
```

### 进程间通信 (IPC)

父子进程之间可以通过 IPC 通道进行通信。

```javascript
// ipc-demo.mjs
import { fork } from 'node:child_process'

class ProcessManager {
  constructor(scriptPath) {
    this.scriptPath = scriptPath
    this.children = new Map()
    this.messageId = 0
    this.pendingMessages = new Map()
  }

  createChild(id) {
    const child = fork(this.scriptPath)
    this.children.set(id, child)

    child.on('message', (message) => {
      if (message.type === 'response') {
        const resolver = this.pendingMessages.get(message.id)
        if (resolver) {
          resolver(message.data)
          this.pendingMessages.delete(message.id)
        }
      } else if (message.type === 'error') {
        console.error(`子进程 ${id} 错误:`, message.error)
      }
    })

    child.on('exit', (code) => {
      console.log(`子进程 ${id} 退出，代码: ${code}`)
      this.children.delete(id)
    })

    return child
  }

  sendMessage(childId, data) {
    return new Promise((resolve, reject) => {
      const child = this.children.get(childId)
      if (!child) {
        reject(new Error(`子进程 ${childId} 不存在`))
        return
      }

      const messageId = this.messageId++
      this.pendingMessages.set(messageId, resolve)

      child.send({
        id: messageId,
        type: 'request',
        data: data,
      })

      // 超时处理
      setTimeout(() => {
        if (this.pendingMessages.has(messageId)) {
          this.pendingMessages.delete(messageId)
          reject(new Error('消息超时'))
        }
      }, 5000)
    })
  }

  broadcast(data) {
    const promises = []
    for (const childId of this.children.keys()) {
      promises.push(this.sendMessage(childId, data))
    }
    return Promise.all(promises)
  }
}

// 使用示例
const manager = new ProcessManager('./worker.mjs')
manager.createChild('worker1')
manager.createChild('worker2')

setTimeout(async () => {
  try {
    const results = await manager.broadcast({ task: 'process_data' })
    console.log('所有工作进程完成:', results)
  } catch (error) {
    console.error('广播消息失败:', error)
  }
}, 1000)
```

## Cluster 模块

Cluster 模块允许在多个进程中运行同一个应用，实现负载均衡。

### 基础集群设置

```javascript
// cluster-basic.mjs
import cluster from 'node:cluster'
import http from 'node:http'
import { availableParallelism } from 'node:os'
import process from 'node:process'

const numCPUs = availableParallelism()

if (cluster.isPrimary) {
  console.log(`主进程 ${process.pid} 正在运行`)

  // 衍生工作进程
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork()
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`工作进程 ${worker.process.pid} 已退出`)
    // 可以在这里重新启动工作进程
    console.log('在 2 秒后重新启动工作进程...')
    setTimeout(() => {
      cluster.fork()
    }, 2000)
  })

  // 监听工作进程消息
  cluster.on('message', (worker, message) => {
    console.log(`收到工作进程 ${worker.process.pid} 的消息:`, message)
  })
} else {
  // 工作进程共享同一个端口
  http
    .createServer((req, res) => {
      res.writeHead(200)
      res.end(`你好来自进程 ${process.pid}\n`)

      // 向主进程发送消息
      process.send({
        pid: process.pid,
        url: req.url,
        time: new Date().toISOString(),
      })
    })
    .listen(8000)

  console.log(`工作进程 ${process.pid} 已启动`)
}
```

### 高级集群管理

```javascript
// cluster-advanced.mjs
import cluster from 'node:cluster'
import http from 'node:http'
import { availableParallelism } from 'node:os'
import process from 'node:process'

class ClusterManager {
  constructor() {
    this.workers = new Map()
    this.restartCounts = new Map()
    this.maxRestarts = 3
  }

  start() {
    if (!cluster.isPrimary) {
      this.startWorker()
      return
    }

    console.log(`🚀 启动集群，CPU 核心数: ${availableParallelism()}`)
    this.setupPrimary()
    this.forkWorkers()
    this.setupEventHandlers()
  }

  setupPrimary() {
    // 设置集群设置
    cluster.setupPrimary({
      exec: new URL(import.meta.url),
      args: process.argv.slice(2),
      silent: false,
    })
  }

  forkWorkers() {
    const numCPUs = availableParallelism()

    for (let i = 0; i < numCPUs; i++) {
      this.forkWorker()
    }
  }

  forkWorker() {
    const worker = cluster.fork()
    this.workers.set(worker.id, worker)
    this.restartCounts.set(worker.id, 0)

    worker.on('message', (message) => {
      this.handleWorkerMessage(worker, message)
    })
  }

  setupEventHandlers() {
    cluster.on('exit', (worker, code, signal) => {
      console.log(
        `⚠️ 工作进程 ${worker.process.pid} 退出 (代码: ${code}, 信号: ${signal})`
      )

      const restartCount = this.restartCounts.get(worker.id) || 0

      if (restartCount < this.maxRestarts) {
        console.log(`🔄 重启工作进程 (${restartCount + 1}/${this.maxRestarts})`)
        this.restartCounts.set(worker.id, restartCount + 1)
        setTimeout(() => this.forkWorker(), 1000)
      } else {
        console.error(
          `❌ 工作进程 ${worker.process.pid} 重启次数过多，停止重启`
        )
        this.workers.delete(worker.id)
      }
    })

    cluster.on('online', (worker) => {
      console.log(`✅ 工作进程 ${worker.process.pid} 上线`)
    })
  }

  handleWorkerMessage(worker, message) {
    switch (message.type) {
      case 'health_check':
        console.log(
          `❤️ 工作进程 ${worker.process.pid} 健康检查: ${message.status}`
        )
        break
      case 'metrics':
        this.handleMetrics(worker, message.metrics)
        break
    }
  }

  handleMetrics(worker, metrics) {
    // 处理工作进程指标
    console.log(`📊 工作进程 ${worker.process.pid} 指标:`, metrics)
  }

  broadcastToWorkers(message) {
    for (const worker of Object.values(cluster.workers)) {
      worker.send(message)
    }
  }
}

// 工作进程逻辑
ClusterManager.prototype.startWorker = function () {
  const server = http.createServer((req, res) => {
    // 模拟一些处理时间
    const startTime = Date.now()

    // 处理请求
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          status: 'healthy',
          pid: process.pid,
          uptime: process.uptime(),
        })
      )

      // 发送健康检查消息
      process.send({ type: 'health_check', status: 'healthy' })
      return
    }

    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end(`请求由进程 ${process.pid} 处理\n`)

    // 发送指标
    const processingTime = Date.now() - startTime
    process.send({
      type: 'metrics',
      metrics: {
        processingTime,
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      },
    })
  })

  server.listen(8000, () => {
    console.log(`🟢 工作进程 ${process.pid} 监听端口 8000`)
  })

  // 定期健康报告
  setInterval(() => {
    process.send({ type: 'health_check', status: 'healthy' })
  }, 30000)
}

// 启动集群管理器
const manager = new ClusterManager()
manager.start()
```

## 第三方进程管理库

### CDPC - 坚强的进程管理模块

CDPC 是一个专门用于进程管理的 npm 模块，可以管理任何需要托管的程序。

```javascript
// cdpc-demo.mjs
import CDPC from 'cdpc'

// 创建进程管理器实例
const cm = new CDPC({
  debug: true,
  notExit: true, // 收到信号不退出
})

// 启用强模式，捕获未处理异常
cm.strong()

// 运行子进程
cm.runChilds([
  {
    name: 'api-server',
    file: './api-server.js',
    args: ['--port', '3000'],
    options: {
      stdio: ['ignore', 'pipe', 'pipe'],
    },
    restart: 'always',
    restartDelay: 1000,
    monitor: true, // 开启监控
  },
  {
    name: 'worker',
    file: './worker.js',
    args: ['--queue', 'high-priority'],
    restart: 'fail-count',
    restartLimit: 5,
    restartDelay: 2000,
    monitor: true,
  },
  {
    name: 'scheduled-task',
    command: 'node',
    args: ['./scheduler.js', '--interval', '5000'],
    restart: 'none',
    options: {
      stdio: ['ignore', 1, 2],
    },
  },
])

// 处理进程事件
cm.on('process:exit', (name, code) => {
  console.log(`进程 ${name} 退出，代码: ${code}`)
})

cm.on('process:restart', (name, count) => {
  console.log(`进程 ${name} 第 ${count} 次重启`)
})

cm.on('process:error', (name, error) => {
  console.error(`进程 ${name} 错误:`, error)
})
```

### PM2 风格的进程管理

虽然搜索结果中没有直接提供 PM2 的代码示例，但我们可以实现类似的进程管理功能：

```javascript
// pm2-like.mjs
import { fork, spawn } from 'node:child_process'
import { watchFile, unwatchFile } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

class ProcessManager {
  constructor() {
    this.processes = new Map()
    this.configs = new Map()
  }

  start(name, config) {
    const { script, args = [], options = {}, watch = false } = config

    const child = fork(script, args, {
      stdio: 'inherit',
      env: { ...process.env, ...options.env },
      ...options,
    })

    this.processes.set(name, child)
    this.configs.set(name, config)

    child.on('exit', (code, signal) => {
      console.log(`进程 ${name} (${child.pid}) 退出: ${code || signal}`)
      this.processes.delete(name)

      // 自动重启
      if (config.autorestart !== false) {
        console.log(`重启进程 ${name}...`)
        setTimeout(() => this.start(name, config), 1000)
      }
    })

    // 文件监视
    if (watch && config.watch) {
      this.setupFileWatching(name, config.watch)
    }

    console.log(`✅ 启动进程 ${name} (PID: ${child.pid})`)
    return child
  }

  setupFileWatching(name, watchPatterns) {
    const config = this.configs.get(name)
    const child = this.processes.get(name)

    watchPatterns.forEach((pattern) => {
      watchFile(pattern, (curr, prev) => {
        if (curr.mtime !== prev.mtime) {
          console.log(`📁 文件 ${pattern} 发生变化，重启进程 ${name}`)
          this.restart(name)
        }
      })
    })
  }

  restart(name) {
    const child = this.processes.get(name)
    if (child) {
      console.log(`🔄 重启进程 ${name}`)
      child.kill('SIGTERM')
      // exit 事件处理程序会自动重启
    } else {
      const config = this.configs.get(name)
      if (config) {
        this.start(name, config)
      }
    }
  }

  stop(name) {
    const child = this.processes.get(name)
    if (child) {
      const config = this.configs.get(name)
      config.autorestart = false // 禁用自动重启
      child.kill('SIGTERM')
      console.log(`🛑 停止进程 ${name}`)
    }
  }

  list() {
    console.log('\n运行中的进程:')
    this.processes.forEach((child, name) => {
      console.log(`  ${name} (PID: ${child.pid})`)
    })
  }

  monitor() {
    setInterval(() => {
      this.processes.forEach((child, name) => {
        // 这里可以添加健康检查逻辑
        // 比如发送 ping 消息，检查响应时间等
      })
    }, 30000)
  }
}

// 使用示例
const pm = new ProcessManager()

// 启动多个进程
pm.start('api', {
  script: './api-server.js',
  args: ['--port', '3000'],
  watch: true,
  autorestart: true,
})

pm.start('worker', {
  script: './worker.js',
  args: ['--queue', 'default'],
  autorestart: true,
})

pm.start('scheduler', {
  script: './scheduler.js',
  autorestart: false,
})

// 显示进程列表
setTimeout(() => {
  pm.list()
}, 2000)

// 5秒后重启 API 进程
setTimeout(() => {
  pm.restart('api')
}, 5000)
```

## 实际应用场景

### CPU 密集型任务处理

```javascript
// cpu-intensive.mjs
import { fork } from 'node:child_process'
import { availableParallelism } from 'node:os'

class ParallelProcessor {
  constructor() {
    this.workers = []
    this.taskQueue = []
    this.busyWorkers = new Set()
  }

  async initialize() {
    const workerCount = availableParallelism()

    for (let i = 0; i < workerCount; i++) {
      const worker = fork(new URL('./cpu-worker.mjs', import.meta.url))

      worker.on('message', (result) => {
        this.busyWorkers.delete(worker)

        const task = this.taskQueue.shift()
        if (task) {
          this.executeTask(worker, task)
        }
      })

      worker.on('exit', () => {
        const index = this.workers.indexOf(worker)
        if (index > -1) {
          this.workers.splice(index, 1)
        }
        this.busyWorkers.delete(worker)
      })

      this.workers.push(worker)
    }
  }

  async processTask(data) {
    return new Promise((resolve) => {
      const task = { data, resolve }

      const availableWorker = this.workers.find(
        (worker) => !this.busyWorkers.has(worker)
      )
      if (availableWorker) {
        this.executeTask(availableWorker, task)
      } else {
        this.taskQueue.push(task)
      }
    })
  }

  executeTask(worker, task) {
    this.busyWorkers.add(worker)
    worker.send(task.data)

    const messageHandler = (result) => {
      worker.off('message', messageHandler)
      task.resolve(result)
      this.busyWorkers.delete(worker)

      // 处理队列中的下一个任务
      const nextTask = this.taskQueue.shift()
      if (nextTask) {
        this.executeTask(worker, nextTask)
      }
    }

    worker.on('message', messageHandler)
  }

  async close() {
    for (const worker of this.workers) {
      worker.kill('SIGTERM')
    }
  }
}

// 使用示例
const processor = new ParallelProcessor()
await processor.initialize()

// 并行处理多个 CPU 密集型任务
const tasks = [
  { type: 'fibonacci', n: 40 },
  { type: 'prime', max: 1000000 },
  {
    type: 'sort',
    data: Array(1000000)
      .fill(0)
      .map(() => Math.random()),
  },
]

const results = await Promise.all(
  tasks.map((task) => processor.processTask(task))
)

console.log('所有任务完成')
await processor.close()
```

```javascript
// cpu-worker.mjs
import process from 'node:process'

process.on('message', (data) => {
  let result

  switch (data.type) {
    case 'fibonacci':
      result = fibonacci(data.n)
      break
    case 'prime':
      result = findPrimes(data.max)
      break
    case 'sort':
      result = data.data.sort((a, b) => a - b)
      break
    default:
      result = null
  }

  process.send({ result, pid: process.pid })
})

function fibonacci(n) {
  if (n <= 1) return n
  return fibonacci(n - 1) + fibonacci(n - 2)
}

function findPrimes(max) {
  const primes = []
  for (let i = 2; i <= max; i++) {
    if (isPrime(i)) primes.push(i)
  }
  return primes
}

function isPrime(num) {
  for (let i = 2; i <= Math.sqrt(num); i++) {
    if (num % i === 0) return false
  }
  return num > 1
}
```

### 进程池管理

```javascript
// process-pool.mjs
import { fork } from 'node:child_process'

class ProcessPool {
  constructor(scriptPath, size = require('os').availableParallelism()) {
    this.scriptPath = scriptPath
    this.size = size
    this.workers = []
    this.taskQueue = []
    this.workerStates = new Map()

    this.initializeWorkers()
  }

  initializeWorkers() {
    for (let i = 0; i < this.size; i++) {
      const worker = fork(this.scriptPath)

      worker.on('message', (message) => {
        this.handleWorkerMessage(worker, message)
      })

      worker.on('exit', (code) => {
        console.log(`工作进程 ${worker.pid} 退出，代码: ${code}`)
        this.replaceWorker(worker)
      })

      this.workers.push(worker)
      this.workerStates.set(worker, 'idle')
    }
  }

  handleWorkerMessage(worker, message) {
    if (message.type === 'task_complete') {
      this.workerStates.set(worker, 'idle')

      // 处理任务回调
      const task = this.workerStates.get(worker).currentTask
      if (task && task.resolve) {
        task.resolve(message.result)
      }

      // 处理下一个任务
      this.processNextTask(worker)
    } else if (message.type === 'error') {
      const task = this.workerStates.get(worker).currentTask
      if (task && task.reject) {
        task.reject(new Error(message.error))
      }
      this.workerStates.set(worker, 'idle')
      this.processNextTask(worker)
    }
  }

  processNextTask(worker) {
    if (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift()
      this.executeTask(worker, task)
    }
  }

  executeTask(worker, task) {
    this.workerStates.set(worker, {
      status: 'busy',
      currentTask: task,
    })

    worker.send({
      type: 'execute',
      data: task.data,
    })
  }

  async execute(data) {
    return new Promise((resolve, reject) => {
      const task = { data, resolve, reject }

      const idleWorker = this.workers.find((worker) => {
        const state = this.workerStates.get(worker)
        return (
          state === 'idle' ||
          (typeof state === 'object' && state.status === 'idle')
        )
      })

      if (idleWorker) {
        this.executeTask(idleWorker, task)
      } else {
        this.taskQueue.push(task)
      }
    })
  }

  replaceWorker(deadWorker) {
    const index = this.workers.indexOf(deadWorker)
    if (index > -1) {
      this.workers.splice(index, 1)
      this.workerStates.delete(deadWorker)

      const newWorker = fork(this.scriptPath)

      newWorker.on('message', (message) => {
        this.handleWorkerMessage(newWorker, message)
      })

      newWorker.on('exit', (code) => {
        console.log(`工作进程 ${newWorker.pid} 退出，代码: ${code}`)
        this.replaceWorker(newWorker)
      })

      this.workers.push(newWorker)
      this.workerStates.set(newWorker, 'idle')
    }
  }

  getStats() {
    const stats = {
      totalWorkers: this.workers.length,
      idleWorkers: 0,
      busyWorkers: 0,
      queuedTasks: this.taskQueue.length,
    }

    for (const state of this.workerStates.values()) {
      if (
        state === 'idle' ||
        (typeof state === 'object' && state.status === 'idle')
      ) {
        stats.idleWorkers++
      } else {
        stats.busyWorkers++
      }
    }

    return stats
  }

  async drain() {
    // 等待所有任务完成
    while (this.taskQueue.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // 等待所有工作进程完成当前任务
    const busyWorkers = Array.from(this.workerStates.values()).filter(
      (state) => state !== 'idle' && state.status !== 'idle'
    )

    if (busyWorkers.length > 0) {
      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          const stillBusy = Array.from(this.workerStates.values()).filter(
            (state) => state !== 'idle' && state.status !== 'idle'
          )
          if (stillBusy.length === 0) {
            clearInterval(checkInterval)
            resolve()
          }
        }, 100)
      })
    }
  }

  close() {
    // 先排空任务
    return this.drain().then(() => {
      for (const worker of this.workers) {
        worker.kill('SIGTERM')
      }
      this.workers = []
      this.workerStates.clear()
      this.taskQueue = []
    })
  }
}

export default ProcessPool
```

通过以上方法和工具，Node.js 开发者可以构建出强大、灵活的进程控制系统，充分利用多核 CPU 资源，提高应用程序的性能和可靠性。
