# Node 常用模块

## 核心模块概览

Node.js 提供了丰富的内置模块，无需安装即可直接使用。这些模块涵盖了文件系统、网络、路径处理等常见需求，是构建 Node.js 应用的基础。

## 文件系统模块 (fs)

fs 模块提供了文件操作的功能，包括读写文件、目录操作等。所有方法都有同步和异步两种形式。

### 异步文件读写

```javascript
const fs = require('fs');

// 异步读取文件
fs.readFile('file.txt', 'utf8', (err, data) => {
  if (err) throw err;
  console.log(data);
});

// 异步写入文件
fs.writeFile('output.txt', 'Hello Node.js', (err) => {
  if (err) throw err;
  console.log('文件已保存');
});
```

### Promise 形式的文件操作

```javascript
const fs = require('fs').promises;

async function fileOperations() {
  try {
    const data = await fs.readFile('file.txt', 'utf8');
    await fs.writeFile('copy.txt', data);
    console.log('文件复制成功');
  } catch (error) {
    console.error('操作失败:', error);
  }
}
```

## 路径处理模块 (path)

path 模块用于处理文件和目录的路径，提供跨平台的路径操作方法。

```javascript
const path = require('path');

// 路径拼接
const fullPath = path.join(__dirname, 'files', 'data.txt');

// 获取扩展名
const ext = path.extname('data.json'); // '.json'

// 解析路径
const pathObj = path.parse('/home/user/file.txt');
// { root: '/', dir: '/home/user', base: 'file.txt', ext: '.txt', name: 'file' }

// 规范化路径
const normalized = path.normalize('/foo/bar//baz/asdf/quux/..');
```

路径操作示意图：
```
原始路径: /home/user/../documents/./file.txt
规范化后: /home/documents/file.txt
```

## HTTP 模块

http 模块用于创建 HTTP 服务器和客户端，是构建 Web 应用的基础。

### 创建 HTTP 服务器

```javascript
const http = require('http');

const server = http.createServer((req, res) => {
  // 设置响应头
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  
  // 根据请求 URL 路由
  if (req.url === '/') {
    res.end('首页');
  } else if (req.url === '/about') {
    res.end('关于我们');
  } else {
    res.end('页面未找到');
  }
});

server.listen(3000, () => {
  console.log('服务器运行在 http://localhost:3000');
});
```

HTTP 请求流程：
```
客户端请求 -> HTTP 服务器 -> 路由处理 -> 生成响应 -> 返回客户端
```

## 事件模块 (events)

events 模块提供了事件驱动的编程接口，是 Node.js 异步架构的基础。

```javascript
const EventEmitter = require('events');

// 创建事件发射器
class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();

// 注册事件监听器
myEmitter.on('event', (data) => {
  console.log('事件触发，数据:', data);
});

// 触发事件
myEmitter.emit('event', { message: 'Hello' });

// 一次性监听器
myEmitter.once('connection', () => {
  console.log('连接建立');
});
```

事件处理流程：
```
事件发射器 -> 注册监听器 -> 触发事件 -> 执行回调 -> 传递数据
```

## 操作系统模块 (os)

os 模块提供与操作系统相关的信息和功能。

```javascript
const os = require('os');

// 系统信息
console.log('平台:', os.platform());
console.log('架构:', os.arch());
console.log('CPU 核心数:', os.cpus().length);
console.log('总内存:', os.totalmem() / 1024 / 1024 / 1024, 'GB');
console.log('空闲内存:', os.freemem() / 1024 / 1024 / 1024, 'GB');
console.log('主机名:', os.hostname());
console.log('家目录:', os.homedir());
```

## 工具模块 (util)

util 模块提供实用工具函数，包括类型检查、回调转换等。

```javascript
const util = require('util');

// 回调风格转换为 Promise
const readFile = util.promisify(fs.readFile);

// 类型检查
util.types.isDate(new Date()); // true
util.types.isRegExp(/abc/); // true

// 格式化字符串
console.log(util.format('Hello %s, you have %d messages', 'Alice', 5));

// 继承
function Animal(name) {
  this.name = name;
}

Animal.prototype.speak = function() {
  console.log(this.name + ' makes a noise.');
};

function Dog(name) {
  Animal.call(this, name);
}

util.inherits(Dog, Animal);
```

## 流模块 (stream)

流模块用于处理流式数据，适合处理大文件或连续数据。

```javascript
const fs = require('fs');
const zlib = require('zlib');

// 文件压缩管道
fs.createReadStream('input.txt')
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream('input.txt.gz'))
  .on('finish', () => {
    console.log('文件压缩完成');
  });
```

流处理示意图：
```
数据源 -> 可读流 -> 转换流 -> 可写流 -> 输出目标
```

## URL 模块

url 模块用于解析和格式化 URL。

```javascript
const url = require('url');

// 解析 URL
const urlObj = url.parse('https://example.com:8080/path?query=string#hash');

// 创建 URL
const myUrl = new URL('https://example.org');
myUrl.pathname = '/a/b/c';
myUrl.search = '?d=e';
```

## 查询字符串模块 (querystring)

querystring 模块用于处理 URL 查询字符串。

```javascript
const querystring = require('querystring');

// 对象转为查询字符串
const str = querystring.stringify({
  name: 'Alice',
  age: 25,
  hobbies: ['reading', 'music']
});
// 'name=Alice&age=25&hobbies=reading&hobbies=music'

// 查询字符串转为对象
const obj = querystring.parse('name=Alice&age=25');
// { name: 'Alice', age: '25' }
```

## 第三方模块生态

除了内置模块，Node.js 拥有庞大的第三方模块生态系统，通过 npm 管理：

```
常用第三方模块：
- express: Web 应用框架
- mongoose: MongoDB 对象建模
- socket.io: 实时通信
- axios: HTTP 客户端
- lodash: 实用工具库
```