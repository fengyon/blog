# node 后端基础

## 介绍

Node.js 是一个基于 Chrome V8 引擎的 JavaScript 运行时环境，用于构建高性能、可扩展的网络应用程序。它采用事件驱动、非阻塞 I/O 模型，使得 JavaScript 能够脱离浏览器在服务器端运行。Node.js 的出现彻底改变了 JavaScript 只能在前端使用的局面，让开发者能够使用同一种语言开发全栈应用。

## 历史

Node.js 由 Ryan Dahl 于 2009 年创建，旨在解决传统 Web 服务器在处理高并发时的性能瓶颈。其核心创新在于将 Google 的 V8 JavaScript 引擎与事件循环机制结合，实现了高效的异步 I/O 处理。2010 年，npm 包管理器的推出极大促进了 Node.js 生态的发展。2015 年，Node.js 基金会成立，标志着项目的成熟和稳定。如今，Node.js 已成为全球最流行的后端技术之一。

## 核心架构

### 事件循环机制

Node.js 采用单线程事件循环模型，通过异步非阻塞方式处理并发请求：

```
请求到达 -> 事件循环接收 -> 分发给对应处理器 -> 非阻塞操作（如I/O）交给线程池
         -> 事件循环继续处理其他请求 -> 操作完成 -> 回调函数执行 -> 返回响应
```

### 模块系统

Node.js 使用 CommonJS 模块规范：

```javascript
// 导入模块
const fs = require('fs')

// 导出模块
module.exports = { myFunction }
```

## 核心特点

### 非阻塞 I/O

Node.js 使用异步操作处理 I/O 任务，不会阻塞主线程：

```javascript
// 同步方式（阻塞）
const data = fs.readFileSync('file.txt') // 阻塞直到文件读取完成
console.log(data)

// 异步方式（非阻塞）
fs.readFile('file.txt', (err, data) => {
  // 立即返回，完成后回调
  if (err) throw err
  console.log(data)
})
```

### 事件驱动架构

基于观察者模式，通过 EventEmitter 实现事件处理：

```javascript
const EventEmitter = require('events')
class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter()
myEmitter.on('event', () => {
  console.log('事件触发!')
})
myEmitter.emit('event')
```

### 单线程与集群

Node.js 运行在单线程中，但可通过集群模式利用多核 CPU：

```javascript
const cluster = require('cluster')
const os = require('os')

if (cluster.isMaster) {
  // 主进程：fork工作进程
  for (let i = 0; i < os.cpus().length; i++) {
    cluster.fork()
  }
} else {
  // 工作进程：启动服务器
  require('./server.js')
}
```

### 跨平台支持

Node.js 可在 Windows、Linux、macOS 等主流操作系统上运行，提供一致的开发体验。

## 核心模块

### HTTP 模块

创建 Web 服务器的核心模块：

```javascript
const http = require('http')

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Hello World\n')
})

server.listen(3000, () => {
  console.log('服务器运行在 3000 端口')
})
```

### 文件系统模块

提供文件操作功能，支持同步和异步两种方式：

```javascript
const fs = require('fs')

// 异步文件读取
fs.readFile('/path/to/file', 'utf8', (err, data) => {
  if (err) throw err
  console.log(data)
})

// 文件写入
fs.writeFile('message.txt', 'Hello Node.js', (err) => {
  if (err) throw err
  console.log('文件已保存')
})
```

### 路径处理模块

简化文件路径操作：

```javascript
const path = require('path')

path.join('/foo', 'bar', 'baz/asdf', 'quux', '..')
// 返回: '/foo/bar/baz/asdf'

path.resolve('/foo/bar', './baz')
// 返回: '/foo/bar/baz'
```

### 事件模块

实现事件驱动编程的基础：

```javascript
const EventEmitter = require('events')

class MyClass extends EventEmitter {
  constructor() {
    super()
  }

  doSomething() {
    // 触发事件
    this.emit('somethingHappened', { data: 'example' })
  }
}
```

## 包管理

### npm 生态系统

Node.js 自带 npm (Node Package Manager)，拥有全球最大的开源库生态系统：

```
项目初始化: npm init
安装包: npm install package-name
全局安装: npm install -g package-name
开发依赖: npm install --save-dev package-name
```

### package.json 文件

项目配置文件，定义依赖、脚本和元数据：

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js"
  },
  "dependencies": {
    "express": "^4.18.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.0"
  }
}
```

## 异步编程

### 回调函数

传统的异步处理方式：

```javascript
function readData(callback) {
  fs.readFile('data.txt', 'utf8', (err, data) => {
    if (err) return callback(err)
    callback(null, data)
  })
}
```

### Promise

更现代的异步解决方案：

```javascript
function readFilePromise(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) reject(err)
      else resolve(data)
    })
  })
}

readFilePromise('file.txt')
  .then((data) => console.log(data))
  .catch((err) => console.error(err))
```

### async/await

基于 Promise 的语法糖，使异步代码看起来像同步代码：

```javascript
async function processFile() {
  try {
    const data = await readFilePromise('file.txt')
    console.log(data)
  } catch (error) {
    console.error('读取文件失败:', error)
  }
}
```

## Web 框架

### Express.js

最流行的 Node.js Web 框架：

```javascript
const express = require('express')
const app = express()

// 中间件
app.use(express.json())

// 路由
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/users', (req, res) => {
  const user = req.body
  // 处理用户创建逻辑
  res.status(201).json(user)
})

app.listen(3000, () => {
  console.log('Express 服务器运行中')
})
```

### 路由系统

组织 API 端点的结构化方式：

```javascript
const router = express.Router()

router.get('/users', (req, res) => {
  // 获取用户列表
})

router.get('/users/:id', (req, res) => {
  const userId = req.params.id
  // 获取特定用户
})

app.use('/api', router)
```

## 数据库连接

### MongoDB 连接

使用 Mongoose ODM：

```javascript
const mongoose = require('mongoose')

mongoose.connect('mongodb://localhost/myapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
})

const User = mongoose.model('User', userSchema)

// 使用模型
const newUser = new User({ name: 'John', email: 'john@example.com' })
newUser.save()
```

### MySQL 连接

使用 mysql2 包：

```javascript
const mysql = require('mysql2')

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'myapp',
})

connection.execute(
  'SELECT * FROM users WHERE id = ?',
  [userId],
  (err, results) => {
    if (err) throw err
    console.log(results)
  }
)
```

## 中间件

### 概念与使用

中间件是在请求和响应周期中执行的函数：

```javascript
// 日志中间件
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  next() // 传递给下一个中间件
})

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('服务器错误!')
})
```

### 常用中间件

```javascript
// 解析 JSON 请求体
app.use(express.json())

// 解析 URL 编码请求体
app.use(express.urlencoded({ extended: true }))

// 静态文件服务
app.use(express.static('public'))

// CORS 跨域支持
app.use(require('cors')())
```

## 错误处理

### 同步错误捕获

```javascript
app.get('/dangerous', (req, res) => {
  throw new Error('意外错误!')
})

// 错误处理中间件（必须放在最后）
app.use((err, req, res, next) => {
  res.status(500).json({
    error:
      process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message,
  })
})
```

### 异步错误处理

```javascript
// 使用 try/catch 与 async/await
app.get('/async-route', async (req, res, next) => {
  try {
    const data = await someAsyncOperation()
    res.json(data)
  } catch (error) {
    next(error)
  }
})
```

## 配置管理

### 环境变量

使用 dotenv 管理环境相关配置：

```javascript
require('dotenv').config()

const config = {
  port: process.env.PORT || 3000,
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  jwtSecret: process.env.JWT_SECRET,
}
```

### 配置结构化

```javascript
// config.js
module.exports = {
  development: {
    database: 'myapp_dev',
    logging: true,
  },
  production: {
    database: 'myapp_prod',
    logging: false,
  },
}[process.env.NODE_ENV || 'development']
```

## 部署与性能

### 进程管理

使用 PM2 管理 Node.js 进程：

```bash
# 启动应用
pm2 start app.js

# 集群模式
pm2 start app.js -i max

# 监控
pm2 monit

# 重启应用
pm2 restart app
```

### 性能优化策略

```javascript
// 启用 gzip 压缩
const compression = require('compression')
app.use(compression())

// 设置缓存头
app.use(
  express.static('public', {
    maxAge: '1d',
  })
)

// 数据库连接池
const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'myapp',
})
```

### 健康检查

```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})
```
