# Node 事件循环

## 什么是事件循环

Node 事件循环是 Node.js 实现**非阻塞 I/O** 的核心机制。它允许单线程的 JavaScript 通过将操作卸载到系统内核，同时处理大量并发连接。

```
JavaScript 代码 -> 事件循环 -> 系统内核（多线程）
```

当异步操作完成时，内核会通知 Node.js，相应的回调函数被加入到事件队列中，最终在合适时机被执行。

## 事件循环阶段

事件循环是一个循环机制，每轮循环包含多个阶段，每个阶段都有特定的任务队列：

```
   ┌───────────────────────────┐
┌─>│           timers          │ 执行 setTimeout、setInterval 回调
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │     pending callbacks     │ 执行延迟到下一个循环的 I/O 回调
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │       idle, prepare       │ 内部使用
│  └─────────────┬─────────────┘      ┌───────────────┐
│  ┌─────────────┴─────────────┐      │   incoming:   │
│  │           poll            │<─────┤  connections, │
│  └─────────────┬─────────────┘      │   data, etc.  │
│  ┌─────────────┴─────────────┐      └───────────────┘
│  │           check           │ 执行 setImmediate 回调
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
└──┤      close callbacks      │ 关闭回调，如 socket.on('close')
   └───────────────────────────┘
```

事件循环会按顺序处理这些阶段，每个阶段执行完毕后才会进入下一个阶段。

## 阶段详解

### timers 阶段

此阶段执行 `setTimeout` 和 `setInterval` 的回调函数。

定时器指定的是**回调函数可能被执行的最早时间**，而非精确执行时间。实际执行时间可能被操作系统调度或其他回调延迟。

示例：
```javascript
setTimeout(() => {
  console.log('定时器回调');
}, 100);
// 实际执行时间可能超过100ms
```

### poll 阶段

poll 阶段有两个主要功能：
1. 计算应该阻塞和轮询 I/O 的时间
2. 处理 poll 队列中的事件

poll 阶段运作方式：
```
如果 poll 队列不为空：
  执行队列中的回调，直到清空或达到系统限制

如果 poll 队列为空：
  如果有 setImmediate 回调，转到 check 阶段
  否则等待新的回调加入队列
```

### check 阶段

此阶段执行 `setImmediate` 的回调函数。

`setImmediate` 是一个特殊的定时器，它在当前 poll 阶段完成后执行。

## setImmediate 与 setTimeout

`setImmediate` 和 `setTimeout` 相似，但执行时机不同：

- `setImmediate`：在当前 poll 阶段完成后执行
- `setTimeout`：在指定的阈值过后尽快执行

在 I/O 循环内，`setImmediate` 总是先于 `setTimeout` 执行：

```javascript
const fs = require('fs');

fs.readFile('file.txt', () => {
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
});
// 输出顺序：immediate → timeout
```

## process.nextTick

`process.nextTick` 不属于事件循环的任何阶段，它在当前操作完成后、事件循环继续下一个阶段前执行。

```
当前操作完成 → process.nextTick 回调 → 继续事件循环下一阶段
```

这使得 `process.nextTick` 的回调总是先于其他异步操作执行：

```javascript
setImmediate(() => console.log('immediate'));
setTimeout(() => console.log('timeout'), 0);
process.nextTick(() => console.log('nextTick'));

// 输出顺序：
// nextTick
// timeout
// immediate
```

## 微任务队列

除了事件循环的各个阶段，Node.js 还有微任务队列，包括：

- nextTick 队列：`process.nextTick`
- Promise 队列：Promise 的 then 回调、`queueMicrotask`

执行顺序为：
```
1. nextTick 队列
2. Promise 队列
3. 事件循环下一阶段
```

## 事件循环与性能

理解事件循环对编写高性能 Node.js 应用至关重要：

- **避免阻塞事件循环**：长时间运行的同步代码会阻塞事件循环
- **合理使用微任务**：`process.nextTick` 和 Promise 可用于分解CPU密集型任务
- **理解定时器时机**：定时器不是精确的，可能被其他操作延迟

Node.js 通过这种事件驱动架构，实现了单线程下的高并发处理能力，特别适合 I/O 密集型应用。