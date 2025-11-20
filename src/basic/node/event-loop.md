# node 事件循环

Node.js 事件循环是其非阻塞 I/O 模型的核心机制，它允许 Node.js 在单线程中高效处理大量并发操作。事件循环是一个持续运行的进程，负责协调和执行 JavaScript 代码、处理回调函数和管理异步操作。理解事件循环对于编写高性能的 Node.js 应用至关重要。

## 事件循环基本概念

事件循环是 Node.js 实现非阻塞 I/O 的基础，它通过不断地检查和处理事件队列中的任务来实现并发。与传统的多线程模型不同，Node.js 使用单线程配合事件循环来处理多个并发连接。

基本工作原理示意图：
```
事件循环流程:
  开始 → 检查定时器 → 处理I/O回调 → 准备阶段 → 轮询新I/O → 检查阶段 → 关闭回调 → 循环
```

## 事件循环阶段

Node.js 事件循环分为六个主要阶段，每个阶段都有特定的任务队列：

### 定时器阶段 (Timers)

此阶段执行 `setTimeout()` 和 `setInterval()` 的回调函数。事件循环检查定时器队列，执行所有到达设定时间的回调。

```javascript
// 定时器示例
setTimeout(() => {
  console.log('定时器回调执行');
}, 100);

setImmediate(() => {
  console.log('Immediate 回调执行');
});
```

执行顺序示意图：
```
定时器阶段:
  检查定时器队列 → 执行到期回调 → 进入下一阶段
```

### 待定回调阶段 (Pending Callbacks)

此阶段执行某些系统操作的回调，如 TCP 错误处理等操作系统相关的回调。

### 空闲/准备阶段 (Idle，Prepare)

内部使用的阶段，为轮询阶段做准备。

### 轮询阶段 (Poll)

这是事件循环的核心阶段，主要职责是：
- 计算应该阻塞和轮询 I/O 的时间
- 处理轮询队列中的事件
- 执行与文件系统、网络等 I/O 相关的回调

轮询阶段工作机制：
```
轮询阶段:
  如果轮询队列不为空 → 同步执行队列回调直到清空或达到上限
  如果轮询队列为空:
    如果有setImmediate回调 → 结束轮询，进入检查阶段
    如果没有setImmediate回调 → 等待新回调加入队列
```

### 检查阶段 (Check)

此阶段专门执行 `setImmediate()` 的回调函数。

```javascript
// setImmediate 与 setTimeout 比较
setImmediate(() => {
  console.log('setImmediate 回调');
});

setTimeout(() => {
  console.log('setTimeout 回调');
}, 0);
```

### 关闭事件回调阶段 (Close Callbacks)

执行一些关闭事件的回调，如 `socket.on('close', ...)`。

## 微任务队列

除了事件循环的主要阶段，Node.js 还有微任务队列，包括：

### Promise 回调

Promise 的 `.then()`、`.catch()` 和 `.finally()` 回调进入微任务队列。

### process.nextTick

`process.nextTick()` 的回调具有最高优先级，在当前操作结束后立即执行。

```javascript
// 微任务执行顺序示例
Promise.resolve().then(() => {
  console.log('Promise 回调');
});

process.nextTick(() => {
  console.log('nextTick 回调');
});

console.log('主线程执行');
```

执行顺序示意图：
```
当前操作 → nextTick队列 → Promise队列 → 事件循环下一阶段
```

## 事件循环执行顺序

完整的事件循环执行顺序如下所示：

```javascript
// 事件循环阶段验证
console.log('开始');

setTimeout(() => {
  console.log('setTimeout');
}, 0);

setImmediate(() => {
  console.log('setImmediate');
});

Promise.resolve().then(() => {
  console.log('Promise');
});

process.nextTick(() => {
  console.log('nextTick');
});

console.log('结束');
```

典型输出顺序：
```
开始
结束
nextTick
Promise
setTimeout 或 setImmediate
setImmediate 或 setTimeout
```

执行流程详细示意图：
```
主线程执行
  ↓
nextTick 队列执行
  ↓
Promise 微任务队列执行  
  ↓
事件循环开始
  ↓ → 定时器阶段 → 待定回调 → 空闲准备 → 轮询阶段 → 检查阶段 → 关闭回调
```

## 事件循环与异步 I/O

Node.js 通过事件循环和线程池实现非阻塞 I/O：

### 文件 I/O 操作

```javascript
import fs from 'fs';

console.log('开始文件读取');

fs.readFile('example.txt', 'utf8', (err, data) => {
  console.log('文件读取完成');
});

setImmediate(() => {
  console.log('setImmediate 回调');
});

console.log('继续执行其他任务');
```

执行流程：
```
主线程: 开始文件读取 → 发起异步I/O → 继续执行其他任务
        ↓
      文件读取完成 → 回调加入轮询队列 → 事件循环处理回调
```

### 网络 I/O 操作

```javascript
import http from 'http';

const server = http.createServer((req, res) => {
  console.log('收到请求');
  res.end('Hello World');
});

server.listen(3000, () => {
  console.log('服务器启动');
});
```

网络 I/O 处理示意图：
```
请求到达 → 加入待处理队列 → 轮询阶段处理 → 执行请求回调
```

## 事件循环性能特征

### CPU 密集型任务的影响

```javascript
// CPU 密集型任务会阻塞事件循环
function heavyComputation() {
  let result = 0;
  for (let i = 0; i < 1000000000; i++) {
    result += Math.sqrt(i);
  }
  return result;
}

console.log('开始计算');
heavyComputation(); // 这会阻塞事件循环
console.log('计算完成');
```

阻塞问题示意图：
```
事件循环 → 遇到CPU密集型任务 → 主线程阻塞 → 其他任务等待
```

### 非阻塞模式的最佳实践

```javascript
// 使用 setImmediate 或 process.nextTick 分解任务
function chunkedHeavyComputation(callback) {
  let result = 0;
  let i = 0;
  
  function computeChunk() {
    const end = Math.min(i + 1000000, 1000000000);
    for (; i < end; i++) {
      result += Math.sqrt(i);
    }
    
    if (i < 1000000000) {
      setImmediate(() => computeChunk());
    } else {
      callback(result);
    }
  }
  
  computeChunk();
}

console.log('开始分块计算');
chunkedHeavyComputation((result) => {
  console.log('计算完成:', result);
});
console.log('继续处理其他任务');
```

非阻塞处理示意图：
```
主线程 → 处理小块任务 → 让出控制权 → 事件循环处理其他任务 → 继续下一块任务
```

## 事件循环与集群

对于多核 CPU，可以使用集群模式充分利用系统资源：

```javascript
import cluster from 'cluster';
import os from 'os';

if (cluster.isPrimary) {
  // 主进程 - 创建工作进程
  const numCPUs = os.cpus().length;
  console.log(`主进程 ${process.pid} 正在运行`);
  
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker) => {
    console.log(`工作进程 ${worker.process.pid} 已退出`);
  });
} else {
  // 工作进程 - 共享同一个端口
  import http from 'http';
  
  http.createServer((req, res) => {
    res.writeHead(200);
    res.end(`请求由进程 ${process.pid} 处理`);
  }).listen(3000);
  
  console.log(`工作进程 ${process.pid} 已启动`);
}
```

集群架构示意图：
```
主进程 (负载均衡)
  ├── 工作进程1 (独立事件循环)
  ├── 工作进程2 (独立事件循环) 
  ├── 工作进程3 (独立事件循环)
  └── 工作进程4 (独立事件循环)
```

## 事件循环监控与调试

### 监控事件循环延迟

```javascript
import { monitorEventLoopDelay } from 'perf_hooks';

const histogram = monitorEventLoopDelay({ resolution: 10 });
histogram.enable();

setInterval(() => {
  console.log(`事件循环延迟:
    最小值: ${histogram.min / 1000000}ms
    最大值: ${histogram.max / 1000000}ms  
    平均值: ${(histogram.mean / 1000000).toFixed(2)}ms
    P50: ${(histogram.percentile(50) / 1000000).toFixed(2)}ms
    P99: ${(histogram.percentile(99) / 1000000).toFixed(2)}ms
  `);
  histogram.reset();
}, 5000);
```

### 检测事件循环阻塞

```javascript
let lastLoopTime = Date.now();

function checkEventLoop() {
  const now = Date.now();
  const loopDelay = now - lastLoopTime;
  
  if (loopDelay > 100) {
    console.warn(`事件循环延迟: ${loopDelay}ms`);
  }
  
  lastLoopTime = now;
  setImmediate(checkEventLoop);
}

checkEventLoop();
```

## 事件循环最佳实践

### 避免阻塞操作

- 将 CPU 密集型任务分解为小块
- 使用工作线程处理复杂计算
- 避免在主线程中进行大量同步操作

### 合理使用异步模式

```javascript
// 好的实践 - 使用异步API
import fs from 'fs/promises';

async function readFiles() {
  try {
    const data = await fs.readFile('file.txt', 'utf8');
    return data;
  } catch (error) {
    console.error('读取文件失败:', error);
  }
}

// 避免 - 使用同步API阻塞事件循环
function readFilesSync() {
  try {
    const data = fs.readFileSync('file.txt', 'utf8'); // 阻塞!
    return data;
  } catch (error) {
    console.error('读取文件失败:', error);
  }
}
```

### 合理设置定时器

```javascript
// 避免设置大量短期定时器
// 不好的做法
for (let i = 0; i < 1000; i++) {
  setTimeout(() => {
    // 处理任务
  }, i * 10);
}

// 好的做法 - 批量处理
function processBatch(items, batchSize = 100) {
  let index = 0;
  
  function processNextBatch() {
    const batch = items.slice(index, index + batchSize);
    index += batchSize;
    
    // 处理当前批次
    batch.forEach(processItem);
    
    if (index < items.length) {
      setImmediate(processNextBatch);
    }
  }
  
  processNextBatch();
}
```

事件循环优化示意图：
```
优化前: 大量短期任务 → 频繁上下文切换 → 性能下降
优化后: 批次处理任务 → 减少切换次数 → 性能提升
```