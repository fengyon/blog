# node 简介

## 什么是Node.js？

Node.js 是一个基于 Chrome V8 JavaScript 引擎构建的 JavaScript 运行时环境，它允许开发者使用 JavaScript 编写服务器端代码。Node.js 采用事件驱动、非阻塞 I/O 模型，使得它能够高效处理大量并发连接，尤其适合 I/O 密集型应用。它由 Ryan Dahl 于 2009 年创建，旨在解决传统服务器端语言在处理高并发时的性能瓶颈。

## 核心特点

Node.js 的核心特点包括事件驱动架构、非阻塞 I/O 和单线程事件循环。这些特点使其在性能上优于许多传统服务器端技术。

事件驱动架构意味着 Node.js 通过事件和回调函数处理操作，而不是依赖多线程。当异步操作（如文件读取或网络请求）完成时，会触发事件，并执行相应的回调函数。这种模型避免了线程阻塞，提高了资源利用率。

非阻塞 I/O 是 Node.js 的另一个关键特点。在传统阻塞 I/O 模型中，每个 I/O 操作都会阻塞当前线程，直到操作完成。而 Node.js 使用异步 I/O，允许主线程继续处理其他任务，而不会等待 I/O 操作结束。这通过底层 libuv 库实现，该库提供了跨平台的异步 I/O 支持。

单线程事件循环是 Node.js 的核心机制。尽管 JavaScript 是单线程的，但事件循环通过轮询和处理事件队列，实现了高并发。事件循环不断检查事件队列，执行回调函数，从而避免创建大量线程的开销。

示意图：
```
+-------------------+     +-------------------+
|   异步 I/O 操作    | --> |   事件队列        |
|   - 文件读取       |     |   - I/O 回调      |
|   - 网络请求       |     |   - 定时器回调    |
+-------------------+     +-------------------+
                                  |
                                  v
+-------------------+     +-------------------+
|  事件循环         | <-- |   执行栈          |
|  - 轮询队列       |     |   - 同步代码       |
|  - 执行回调       |     +-------------------+
+-------------------+
```
在这个示意图中，异步操作完成后，回调被放入事件队列，事件循环则从队列中取出回调并执行。

## 事件循环原理

事件循环是 Node.js 实现非阻塞 I/O 的核心机制。它基于 libuv 库，负责管理异步操作和回调执行。事件循环由多个阶段组成，每个阶段处理特定类型的事件。

事件循环的阶段包括：
- 定时器阶段：执行 setTimeout 和 setInterval 的回调。
- I/O 回调阶段：处理大部分 I/O 回调，如网络错误。
- 空闲和准备阶段：内部使用。
- 轮询阶段：检索新的 I/O 事件并执行相关回调。
- 检查阶段：执行 setImmediate 的回调。
- 关闭回调阶段：处理关闭事件，如 socket 关闭。

事件循环的工作原理是：在每个迭代中，它首先检查定时器阶段，然后依次处理其他阶段。如果在某个阶段没有回调可执行，事件循环会等待新事件。这种机制确保了异步操作的高效处理。

示例代码：使用 setTimeout 和 setImmediate 演示事件循环阶段。
```javascript
setTimeout(() => {
  console.log('setTimeout 回调');
}, 0);

setImmediate(() => {
  console.log('setImmediate 回调');
});

// 输出顺序可能因环境而异，但通常 setImmediate 在 setTimeout 之前执行。
```

## 模块系统

Node.js 使用 CommonJS 模块系统来组织代码。每个文件被视为一个模块，可以通过 require 函数导入其他模块，使用 module.exports 或 exports 导出功能。这种模块化设计提高了代码的可维护性和复用性。

模块加载过程包括路径解析、文件读取和执行。Node.js 会缓存已加载的模块，避免重复加载。模块路径解析遵循特定规则，例如，如果 require 的参数是相对路径，Node.js 会从当前文件目录开始查找。

示例代码：创建一个自定义模块并导入。
```javascript
// math.js 模块
exports.add = (a, b) => a + b;
exports.multiply = (a, b) => a * b;

// main.js 文件
const math = require('./math');
console.log(math.add(2, 3)); // 输出: 5
console.log(math.multiply(2, 3)); // 输出: 6
```

## 常用API示例

Node.js 提供了丰富的内置 API，用于处理文件系统、网络、流等操作。以下是一些常用 API 的示例。

文件系统 API（fs 模块）：支持异步和同步文件操作。异步方法使用回调函数，避免阻塞事件循环。
```javascript
const fs = require('fs');

// 异步读取文件
fs.readFile('example.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('读取文件错误:', err);
    return;
  }
  console.log('文件内容:', data);
});

// 同步读取文件（不推荐在高并发场景使用）
try {
  const data = fs.readFileSync('example.txt', 'utf8');
  console.log('文件内容:', data);
} catch (err) {
  console.error('读取文件错误:', err);
}
```

HTTP 服务器 API：Node.js 可以轻松创建 Web 服务器，处理 HTTP 请求和响应。
```javascript
const http = require('http');

const server = http.createServer((req, res) => {
  // 设置响应头
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  // 发送响应体
  res.end('Hello, Node.js!\n');
});

server.listen(3000, () => {
  console.log('服务器运行在 http://localhost:3000/');
});
```

流 API：Node.js 的流（Stream）用于处理大量数据，如文件读写或网络传输。流分为可读流、可写流、双工流和转换流，它们通过事件处理数据块。
```javascript
const fs = require('fs');

// 创建可读流
const readableStream = fs.createReadStream('input.txt');
// 创建可写流
const writableStream = fs.createWriteStream('output.txt');

// 通过管道将数据从可读流传输到可写流
readableStream.pipe(writableStream);

// 处理流事件
readableStream.on('data', (chunk) => {
  console.log('接收到数据块:', chunk.toString());
});

readableStream.on('end', () => {
  console.log('数据读取完成');
});
```

## 应用场景

Node.js 适用于多种场景，包括 Web 服务器、API 网关、实时应用和微服务架构。由于其非阻塞特性，它在 I/O 密集型任务中表现优异，例如处理大量并发连接的数据流或实时通信。

在 Web 开发中，Node.js 常与 Express 等框架结合，构建高性能的 RESTful API。对于实时应用，如聊天室或在线游戏，Node.js 通过 WebSocket 实现双向通信。此外，Node.js 在工具开发中也很流行，例如构建构建脚本或 CLI 工具。