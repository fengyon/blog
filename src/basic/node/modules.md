# node 常用模块

Node.js 的强大功能很大程度上源于其丰富的模块系统，这些模块为开发人员提供了处理各种任务的工具。从文件操作到网络通信，从路径处理到进程管理，Node.js 的内置模块和第三方包构成了一个完整的开发生态系统。掌握这些常用模块对于构建高效的 Node.js 应用程序至关重要。

## 文件系统模块

### fs 基础操作

`fs` 模块是 Node.js 中处理文件操作的核心模块，提供了文件的读取、写入、删除等操作。该模块提供同步、回调和 Promise 三种使用方式。

```javascript
import { readFile, writeFile, unlink } from 'node:fs/promises';

// 异步读取文件
try {
  const data = await readFile('example.txt', 'utf8');
  console.log('文件内容:', data);
} catch (error) {
  console.error('读取文件失败:', error.message);
}

// 异步写入文件
await writeFile('output.txt', '这是写入的内容', 'utf8');

// 删除文件
await unlink('/tmp/hello');
```

文件操作流程示意图：
```
打开文件 → 读取/写入数据 → 关闭文件
     ↓
   错误处理 ← 异常检查
```

### 流式文件处理

对于大文件，使用流式处理可以显著提高内存效率和性能。

```javascript
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';

// 使用流复制大文件
async function copyLargeFile(source, target) {
  const readStream = createReadStream(source);
  const writeStream = createWriteStream(target);
  
  await pipeline(readStream, writeStream);
  console.log('文件复制完成');
}

// 使用示例
await copyLargeFile('source.mp4', 'copy.mp4');
```

流处理优势示意图：
```
传统方式: [整个文件加载到内存] → 处理 → 写入
流式方式: [小块数据] → 处理 → 写入 → [下一块数据] → ...
```

## 路径处理模块

### path 常用方法

`path` 模块提供了一系列处理文件路径的工具函数，帮助解决不同操作系统的路径差异问题。

```javascript
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 获取当前模块的目录名
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 路径拼接
const fullPath = path.join(__dirname, 'files', 'data.txt');
console.log('完整路径:', fullPath);

// 获取文件名和扩展名
const filename = path.basename('/path/to/file.html');
// 返回: 'file.html'

const nameWithoutExt = path.basename('/path/to/file.html', '.html');
// 返回: 'file'

const ext = path.extname('/path/to/file.html');
// 返回: '.html'

// 路径解析
const pathObj = path.parse('/home/user/dir/file.txt');
console.log(pathObj);
// 返回: { root: '/', dir: '/home/user/dir', base: 'file.txt', ext: '.txt', name: 'file' }
```

路径解析示意图：
```
/home/user/dir/file.txt
  root: /
  dir: /home/user/dir  
  base: file.txt
  name: file
  ext: .txt
```

### 路径标准化和解析

```javascript
// 路径标准化
const normalized = path.normalize('/foo/bar//baz/asdf/quux/..');
console.log(normalized); // '/foo/bar/baz/asdf'

// 相对路径计算
const relativePath = path.relative('/data/oracle', '/data/mysql');
console.log(relativePath); // '../mysql'

// 绝对路径解析
const absolutePath = path.resolve('config', 'app.json');
console.log(absolutePath); // 当前工作目录 + /config/app.json
```

## HTTP 网络模块

### 创建 HTTP 服务器

`http` 模块允许创建 HTTP 服务器和客户端，是构建 Web 应用的基础。

```javascript
import { createServer } from 'node:http';
import { URL } from 'node:url';

const server = createServer(async (req, res) => {
  // 解析 URL
  const parsedUrl = new URL(req.url || '', `http://${req.headers.host}`);
  
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  // 路由处理
  if (parsedUrl.pathname === '/api/users' && req.method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify({ users: ['Alice', 'Bob'] }));
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(3000, () => {
  console.log('服务器运行在 http://localhost:3000');
});
```

HTTP 请求处理流程：
```
客户端请求 → 服务器接收 → 解析请求 → 路由匹配 → 处理逻辑 → 生成响应 → 返回客户端
```

### 发起 HTTP 请求

```javascript
import { request } from 'node:http';

// 发起 HTTP 请求
function httpRequest(options) {
  return new Promise((resolve, reject) => {
    const req = request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

// 使用示例
const response = await httpRequest({
  hostname: 'api.example.com',
  port: 80,
  path: '/data',
  method: 'GET'
});
```

## 实用工具模块

### util 工具函数

`util` 模块提供了各种实用函数，包括类型检查、调试工具等。

```javascript
import util from 'node:util';
import { inspect } from 'node:util';

// 回调函数转 Promise
const sleep = util.promisify(setTimeout);
await sleep(1000); // 等待1秒

// 格式化字符串
const formatted = util.format('%s:%s', 'foo', 'bar', 'baz');
console.log(formatted); // 'foo:bar baz'

// 对象深度检查
const obj = {
  name: 'Alice',
  address: {
    city: 'Beijing',
    street: { name: 'Main St', number: 123 }
  }
};

console.log(inspect(obj, { 
  depth: null, // 无限递归
  colors: true // 彩色输出
}));

// 调试日志
const debuglog = util.debuglog('app');
debuglog('这是调试信息 [%d]', 123);
// 需要设置环境变量: NODE_DEBUG=app
```

### 类型检查工具

```javascript
import util from 'node:util';

// 类型检查
console.log(util.types.isDate(new Date())); // true
console.log(util.types.isRegExp(/abc/)); // true
console.log(util.types.isAnyArrayBuffer(new ArrayBuffer(16))); // true

// 错误检查
const error = new Error('测试错误');
console.log(util.types.isNativeError(error)); // true
```

## 子进程模块

### 创建和管理子进程

`child_process` 模块允许创建和管理子进程，用于执行系统命令或其他脚本。

```javascript
import { spawn, exec, fork } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

// 使用 spawn 执行命令
async function runCommand(command, args) {
  const child = spawn(command, args);
  
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Process exited with code ${code}: ${stderr}`));
      }
    });
  });
}

// 执行示例
try {
  const result = await runCommand('ls', ['-la']);
  console.log('目录列表:', result);
} catch (error) {
  console.error('命令执行失败:', error.message);
}
```

子进程通信示意图：
```
父进程 ← IPC通道 → 子进程
    ↓               ↓
  标准输入        标准输出
    ↓               ↓
  错误处理        信号处理
```

### 进程间通信

```javascript
// master.js
import { fork } from 'node:child_process';

const child = fork('./worker.js');

child.on('message', (message) => {
  console.log('来自子进程的消息:', message);
});

child.send({ hello: 'world' });

// worker.js
process.on('message', (message) => {
  console.log('来自父进程的消息:', message);
  process.send({ response: '消息已收到' });
});
```

## 第三方实用模块

### Axios HTTP 客户端

Axios 是一个基于 Promise 的 HTTP 客户端，简化了 HTTP 请求的处理。

```javascript
import axios from 'axios';

// 发起 GET 请求
const response = await axios.get('https://api.example.com/data', {
  timeout: 5000,
  headers: { 'Authorization': 'Bearer token' }
});

console.log(response.data);

// 并发请求
const [userData, productData] = await Promise.all([
  axios.get('/api/users'),
  axios.get('/api/products')
]);

// 创建实例配置
const apiClient = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 10000
});

// 请求拦截器
apiClient.interceptors.request.use((config) => {
  config.headers['X-Requested-With'] = 'XMLHttpRequest';
  return config;
});

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API请求错误:', error);
    return Promise.reject(error);
  }
);
```

### Dotenv 环境变量管理

Dotenv 是一个零依赖模块，用于从 `.env` 文件加载环境变量。

```javascript
import dotenv from 'dotenv';
dotenv.config();

// 使用环境变量
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASS
};

// 自定义环境文件
dotenv.config({ path: '.env.production' });

console.log('数据库配置:', dbConfig);
```

环境变量加载流程：
```
.env文件 → dotenv解析 → process.env对象 → 应用使用
```

### 日期处理库 date-fns

date-fns 提供了丰富的日期处理函数，类似于 lodash 但对于日期对象。

```javascript
import { 
  format, 
  addDays, 
  differenceInDays, 
  isBefore,
  parseISO 
} from 'date-fns';

const today = new Date();

// 日期格式化
console.log(format(today, 'yyyy-MM-dd')); // '2024-01-18'

// 日期计算
const nextWeek = addDays(today, 7);
console.log('下周:', format(nextWeek, 'yyyy-MM-dd'));

// 日期比较
const startDate = parseISO('2024-01-01');
const daysDiff = differenceInDays(today, startDate);
console.log(`今年已经过去了 ${daysDiff} 天`);

// 日期验证
const isPast = isBefore(nextWeek, today);
console.log('是否过去:', isPast);
```

### 调试工具 Debug

Debug 是一个小型的 JavaScript 调试实用程序，可以方便地控制调试输出。

```javascript
import debug from 'debug';

// 创建调试器
const dbDebug = debug('app:database');
const apiDebug = debug('app:api');
const errorDebug = debug('app:error');

// 调试输出
dbDebug('连接数据库...');
apiDebug('API请求开始: %s', '/api/users');

try {
  // 模拟操作
  dbDebug('数据库查询执行');
  apiDebug('API响应接收');
} catch (error) {
  errorDebug('操作失败: %o', error);
}

// 启用调试
// 在终端设置: DEBUG=app:* node app.js
// 或指定模块: DEBUG=app:database,app:api node app.js
```

调试输出示意图：
```
app:database 连接数据库... +0ms
app:api API请求开始: /api/users +2ms
app:error 操作失败: <错误对象> +1ms
```

## 压缩与加密模块

### Zlib 压缩解压

Zlib 模块提供了数据压缩和解压功能，支持 gzip、deflate 等算法。

```javascript
import { createGzip, createGunzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { createReadStream, createWriteStream } from 'node:fs';

// 文件压缩
async function compressFile(input, output) {
  const source = createReadStream(input);
  const destination = createWriteStream(output);
  const gzip = createGzip();
  
  await pipeline(source, gzip, destination);
  console.log('文件压缩完成');
}

// 文件解压
async function decompressFile(input, output) {
  const source = createReadStream(input);
  const destination = createWriteStream(output);
  const gunzip = createGunzip();
  
  await pipeline(source, gunzip, destination);
  console.log('文件解压完成');
}

// 使用示例
await compressFile('large-file.log', 'large-file.log.gz');
await decompressFile('large-file.log.gz', 'decompressed-file.log');
```

### Crypto 加密模块

Crypto 模块提供了加密功能，包括哈希、HMAC、加密解密等。

```javascript
import { 
  createHash, 
  randomBytes, 
  createCipheriv, 
  createDecipheriv 
} from 'node:crypto';

// 哈希计算
function hashPassword(password) {
  return createHash('sha256')
    .update(password)
    .digest('hex');
}

// 密码验证
const hashed = hashPassword('myPassword123');
console.log('密码哈希:', hashed);

// 生成随机数据
const token = randomBytes(32).toString('hex');
console.log('安全令牌:', token);

// AES 加密解密
function encryptText(text, key) {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { iv: iv.toString('hex'), content: encrypted };
}

function decryptText(encrypted, key, iv) {
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encrypted.content, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

## 事件模块

### EventEmitter 事件管理

`events` 模块提供了事件驱动编程的实现，是 Node.js 异步架构的基础。

```javascript
import { EventEmitter } from 'node:events';

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();

// 监听事件
myEmitter.on('event', (data) => {
  console.log('事件触发，数据:', data);
});

// 一次性监听
myEmitter.once('firstEvent', () => {
  console.log('这个监听器只会执行一次');
});

// 错误处理
myEmitter.on('error', (error) => {
  console.error('发生错误:', error);
});

// 触发事件
myEmitter.emit('event', { message: 'Hello' });
myEmitter.emit('firstEvent');
myEmitter.emit('firstEvent'); // 这次不会触发

// 获取监听器信息
console.log('事件监听器数量:', myEmitter.listenerCount('event'));
```

事件系统示意图：
```
事件发射器 → 注册监听器 → 触发事件 → 执行回调
    ↓
   错误事件 → 错误处理
```

### 自定义事件系统

```javascript
import { EventEmitter } from 'node:events';

class Database extends EventEmitter {
  constructor() {
    super();
    this.connected = false;
  }
  
  connect() {
    // 模拟连接过程
    setTimeout(() => {
      this.connected = true;
      this.emit('connected', { timestamp: Date.now() });
    }, 1000);
  }
  
  query(sql) {
    if (!this.connected) {
      this.emit('error', new Error('数据库未连接'));
      return;
    }
    
    this.emit('query', { sql, time: Date.now() });
    // 执行查询...
  }
}

const db = new Database();

db.on('connected', (data) => {
  console.log('数据库连接成功:', data);
});

db.on('query', (data) => {
  console.log('执行查询:', data.sql);
});

db.on('error', (error) => {
  console.error('数据库错误:', error.message);
});

db.connect();
db.query('SELECT * FROM users');
```

这些常用模块构成了 Node.js 开发的基础，熟练掌握它们能够大大提高开发效率和代码质量。在实际项目中，根据具体需求选择合适的模块和第三方库，可以构建出高效、可靠的应用程序。