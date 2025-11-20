# node 全局变量

Node.js 全局变量是在所有模块中均可直接访问的变量和对象，无需使用 `require()` 导入。这些变量提供了 Node.js 运行时环境的核心功能，包括进程控制、模块系统、定时器等。与浏览器环境不同，Node.js 的全局对象是 `global` 而不是 `window`。

## 全局对象与作用域

在 Node.js 中，全局变量存在于多个层次的作用域中。最顶层的全局对象是 `global`，其属性在所有模块中均可直接访问。

作用域示意图：
```
global (顶层对象)
  ├── 模块作用域 (当前文件)
  ├── 函数作用域
  └── 块级作用域
```

### global 对象

`global` 对象是 Node.js 的顶层命名空间，其属性在任何地方都可直接访问：

```javascript
// 直接访问 global 属性
console.log(global === globalThis); // true

// 在 global 上定义属性
global.appName = 'MyNodeApp';

// 在任何地方都可访问
console.log(appName); // 'MyNodeApp'
```

### 模块作用域变量

每个模块都有自己独立的作用域，但可以通过特定变量访问模块信息：

```javascript
// 当前模块的目录名
console.log(__dirname); // /path/to/current/directory

// 当前模块的文件名
console.log(__filename); // /path/to/current/file.js

// 模块导出对象
console.log(typeof module); // object

// 模块导出对象
console.log(typeof exports); // object

// require 函数
console.log(typeof require); // function
```

## 进程控制全局变量

### process 对象

`process` 对象提供当前 Node.js 进程的信息和控制：

```javascript
// 进程信息
console.log('进程ID:', process.pid);
console.log('Node版本:', process.version);
console.log('平台:', process.platform);

// 环境变量
console.log('用户HOME目录:', process.env.HOME);
console.log('Node环境:', process.env.NODE_ENV);

// 工作目录
console.log('当前工作目录:', process.cwd());

// 内存使用情况
console.log('内存使用:', process.memoryUsage());

// 命令行参数
console.log('命令行参数:', process.argv);

// 设置环境变量
process.env.MY_VAR = 'custom value';
```

### 进程事件处理

```javascript
// 进程退出事件
process.on('exit', (code) => {
  console.log(`进程即将退出，退出码: ${code}`);
});

// 未捕获异常处理
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  process.exit(1);
});

// 信号处理
process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号');
  process.exit(0);
});

// 强制退出
process.exit(0); // 正常退出
```

## 定时器全局变量

Node.js 提供了与浏览器类似的定时器函数，但基于不同的实现机制：

### setTimeout 和 setInterval

```javascript
// setTimeout - 一次性定时器
const timeoutId = setTimeout(() => {
  console.log('这段代码在 1 秒后执行');
}, 1000);

// 清除定时器
clearTimeout(timeoutId);

// setInterval - 间隔定时器
let count = 0;
const intervalId = setInterval(() => {
  count++;
  console.log(`第 ${count} 次执行`);
  
  if (count >= 5) {
    clearInterval(intervalId);
    console.log('定时器已停止');
  }
}, 500);

// setImmediate - 在当前事件循环结束时执行
setImmediate(() => {
  console.log('立即执行回调');
});

// 执行顺序示例
console.log('开始');
setTimeout(() => console.log('setTimeout'), 0);
setImmediate(() => console.log('setImmediate'));
console.log('结束');

// 输出顺序:
// 开始
// 结束  
// setTimeout 或 setImmediate (顺序不确定)
// setImmediate 或 setTimeout
```

执行流程示意图：
```
主线程 --> 定时器注册 --> 事件循环 --> 回调执行
    ↑        ↓            ↓
    └--------检查定时器---执行
```

## 缓冲区与编码全局变量

### Buffer 类

`Buffer` 类用于处理二进制数据，是 Node.js 中处理文件、网络流等的核心：

```javascript
// 创建 Buffer
const buf1 = Buffer.from('Hello World');
const buf2 = Buffer.from([1, 2, 3, 4, 5]);
const buf3 = Buffer.alloc(10); // 创建 10 字节的 Buffer

// Buffer 操作
console.log(buf1.toString()); // 'Hello World'
console.log(buf1.toString('base64')); // 'SGVsbG8gV29ybGQ='

// Buffer 拼接
const buf4 = Buffer.concat([buf1, buf2]);

// Buffer 比较
console.log(Buffer.compare(buf1, buf2));

// Buffer 填充
buf3.fill(0); // 用 0 填充

// 获取 Buffer 信息
console.log('Buffer 长度:', buf1.length);
console.log('Buffer 内容:', buf1);
```

### 文本编码器

```javascript
// TextEncoder 和 TextDecoder (在较新 Node.js 版本中可用)
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const uint8Array = encoder.encode('Hello World');
console.log('编码结果:', uint8Array);

const text = decoder.decode(uint8Array);
console.log('解码结果:', text);
```

## 控制台全局变量

### console 对象

`console` 对象提供了丰富的输出方法，支持格式化输出：

```javascript
// 基本输出
console.log('普通日志');
console.info('信息日志');
console.warn('警告日志');
console.error('错误日志');

// 断言
console.assert(2 + 2 === 5, '数学出错了!');

// 计数
console.count('计数器');
console.count('计数器');
console.countReset('计数器');

// 分组输出
console.group('用户信息');
console.log('姓名: John');
console.log('年龄: 30');
console.groupEnd();

// 表格输出
console.table([
  { name: 'John', age: 30 },
  { name: 'Jane', age: 25 }
]);

// 时间测量
console.time('操作计时');
// 模拟耗时操作
setTimeout(() => {
  console.timeEnd('操作计时');
}, 100);

// 堆栈跟踪
console.trace('当前位置');
```

## URL 处理全局变量

### URL 类

`URL` 类提供了符合标准的 URL 解析和构造功能：

```javascript
// URL 解析
const myURL = new URL('https://example.com:8080/path/name?query=string#hash');

console.log('协议:', myURL.protocol); // https:
console.log('主机名:', myURL.hostname); // example.com
console.log('端口:', myURL.port); // 8080
console.log('路径:', myURL.pathname); // /path/name
console.log('查询参数:', myURL.search); // ?query=string
console.log('哈希:', myURL.hash); // #hash

// 获取查询参数
const params = myURL.searchParams;
console.log('query 参数:', params.get('query'));

// 设置查询参数
params.set('page', '1');
params.append('sort', 'name');

console.log('完整URL:', myURL.href);

// URL 格式化
console.log('字符串形式:', myURL.toString());
```

### URLSearchParams 类

```javascript
// 操作查询参数
const searchParams = new URLSearchParams('key1=value1&key2=value2');

// 遍历参数
for (const [key, value] of searchParams) {
  console.log(`${key}: ${value}`);
}

// 操作方法
searchParams.append('key3', 'value3');
searchParams.set('key1', 'newvalue');
searchParams.delete('key2');

console.log('是否有 key1:', searchParams.has('key1'));
console.log('所有值:', searchParams.toString());
```

## 工具函数全局变量

### 性能测量

`performance` 对象提供了高精度的时间测量功能：

```javascript
// 性能测量
const { performance } = require('perf_hooks');

const startTime = performance.now();

// 模拟耗时操作
let sum = 0;
for (let i = 0; i < 1000000; i++) {
  sum += i;
}

const endTime = performance.now();
console.log(`操作耗时: ${(endTime - startTime).toFixed(2)} 毫秒`);

// 性能标记
performance.mark('start');
// 执行一些操作
performance.mark('end');

performance.measure('操作耗时', 'start', 'end');
const measure = performance.getEntriesByName('操作耗时')[0];
console.log('测量结果:', measure);
```

### 实用工具

```javascript
// 文本格式化
const name = 'John';
const age = 30;
console.log(util.format('姓名: %s, 年龄: %d', name, age));

// 回调转 Promise
const { promisify } = require('util');
const fs = require('fs');

const readFileAsync = promisify(fs.readFile);

// 现在可以使用 async/await
async function readConfig() {
  try {
    const data = await readFileAsync('config.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取配置失败:', error);
  }
}

// 类型检查
console.log(util.types.isDate(new Date())); // true
console.log(util.types.isRegExp(/abc/)); // true
```

## 全局变量使用最佳实践

### 避免全局污染

```javascript
// 不好的做法 - 污染全局命名空间
global.myData = { /* 大量数据 */ };

// 好的做法 - 使用模块导出
// config.js
export const appConfig = {
  // 配置数据
};

// 其他文件
import { appConfig } from './config.js';
```

### 环境特定代码

```javascript
// 检查运行环境
if (typeof window !== 'undefined') {
  // 浏览器环境代码
  console.log('运行在浏览器中');
} else {
  // Node.js 环境代码
  console.log('运行在 Node.js 中');
}

// 特性检测
if (typeof Buffer !== 'undefined') {
  // 可以使用 Buffer
  const buf = Buffer.from('text');
}
```

### 错误处理模式

```javascript
// 全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
});

// 异步错误处理
async function main() {
  try {
    const result = await someAsyncOperation();
    return result;
  } catch (error) {
    console.error('操作失败:', error);
    throw error;
  }
}

// 使用 process.exit 的注意事项
function gracefulShutdown() {
  console.log('正在关闭应用...');
  // 清理资源
  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

process.on('SIGTERM', gracefulShutdown);
```