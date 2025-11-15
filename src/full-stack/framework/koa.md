# Koa.js

Koa.js 是一个基于 Node.js 平台的下一代 Web 开发框架，由 Express 原班人马打造。它旨在提供一个更小型、更富有表现力、更健壮的 Web 开发基础和 API。Koa 的核心思想是利用 async/await 彻底解决 Node.js 中的回调地狱问题，通过强大的中间件机制让 Web 开发变得更加简单和优雅。

## 核心特性

### 轻量级设计

Koa 本身非常精简，不包含任何内置的路由、模板引擎等功能。这种极简主义设计使得 Koa 的核心代码量仅有约 570 行，开发者可以根据需要灵活地通过第三方中间件添加功能，避免了功能冗余。

### 洋葱模型中间件

Koa 最著名的特性就是其洋葱模型中间件机制。中间件按照“先进后出”的原则执行，类似洋葱的结构，请求从外到内传递，响应再从内到外返回。

```
请求流向:
→ 中间件1 → 中间件2 → 中间件3 → 核心处理 → 中间件3 → 中间件2 → 中间件1 → 响应
```

这种模型允许在请求和响应阶段都能执行逻辑，非常适合日志记录、性能监控、权限校验等通用功能。

### 异步处理优势

Koa 完全基于 async/await 实现，从根源上解决了回调地狱问题。相比传统的回调函数或 Promise 链，async/await 让异步代码看起来更像是同步的，大大提高了代码的可读性和可维护性。

### 上下文对象

Koa 为每个请求创建一个 Context 对象，封装了 Node.js 的 request 和 response 对象。这个上下文对象提供了许多便利的方法和属性，同时保持了简洁的 API 设计。

## 快速开始

### 环境要求

Koa 需要 Node.js 7.6.0 或更高版本，这是为了支持 ES2015 和 async 函数功能。推荐使用 Node.js 14+ LTS 版本。

### 安装与创建基础应用

```bash
# 创建项目目录
mkdir koa-demo && cd koa-demo

# 初始化 npm 项目
npm init -y

# 安装 Koa
npm install koa
```

创建 `app.js` 文件：

```javascript
const Koa = require('koa');
const app = new Koa();

// 基础中间件示例
app.use(async (ctx, next) => {
  const start = Date.now();
  console.log('中间件开始');
  
  // 调用下一个中间件
  await next();
  
  const ms = Date.now() - start;
  console.log(`中间件结束 - 耗时 ${ms}ms`);
});

// 响应处理中间件
app.use(async (ctx) => {
  ctx.status = 200;
  ctx.type = 'text/html';
  ctx.body = '<h1>Hello Koa.js</h1>';
});

// 启动服务器
const port = 3000;
app.listen(port, () => {
  console.log(`Koa服务已启动，访问地址：http://localhost:${port}`);
});
```

运行应用：
```bash
node app.js
```

## 中间件机制详解

### 中间件基础

在 Koa 中，中间件是一个函数，接收 ctx (上下文) 和 next (下一个中间件函数) 两个参数。当中间件调用 `await next()` 时，执行流会暂停当前中间件，将控制权交给下一个中间件。

```javascript
app.use(async (ctx, next) => {
  // 请求阶段逻辑
  console.log('Before next()');
  
  await next();
  
  // 响应阶段逻辑
  console.log('After next()');
});
```

### 洋葱模型实践

```javascript
app.use(async (ctx, next) => {
  console.log('中间件1 - 开始');
  await next();
  console.log('中间件1 - 结束');
});

app.use(async (ctx, next) => {
  console.log('中间件2 - 开始');
  await next();
  console.log('中间件2 - 结束');
});

app.use(async (ctx) => {
  console.log('核心业务逻辑');
  ctx.body = 'Hello World';
});

// 执行顺序输出:
// 中间件1 - 开始
// 中间件2 - 开始
// 核心业务逻辑
// 中间件2 - 结束
// 中间件1 - 结束
```

### 错误处理中间件

```javascript
// 错误处理中间件
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.statusCode || err.status || 500;
    ctx.body = {
      message: err.message
    };
    // 触发应用的错误事件
    ctx.app.emit('error', err, ctx);
  }
});

// 统一错误事件监听
app.on('error', (err, ctx) => {
  console.error('服务器错误:', err, ctx);
});
```

## 核心 API 与使用

### Koa 应用实例

```javascript
const Koa = require('koa');
const app = new Koa();

// 应用属性配置
app.proxy = true; // 信任代理头部
app.keys = ['secret-key']; // 签名 cookie 密钥
```

### 上下文 Context

Context 封装了 request 和 response 对象，并提供了许多有用的方法：

```javascript
app.use(async (ctx) => {
  // 请求信息
  console.log(ctx.method); // HTTP 方法
  console.log(ctx.url); // 请求 URL
  console.log(ctx.query); // 查询参数
  console.log(ctx.headers); // 请求头
  
  // 响应控制
  ctx.status = 200; // 状态码
  ctx.type = 'application/json'; // 内容类型
  ctx.body = { message: 'Success' }; // 响应体
  ctx.redirect('/new-path'); // 重定向
  ctx.throw(404, '资源未找到'); // 抛出错误
  
  // 上下文快捷方式
  console.log(ctx.state); // 推荐的命名空间，用于通过中间件传递信息
  console.log(ctx.cookies); // cookie 操作
});
```

### 请求 Request 对象

```javascript
app.use(async (ctx) => {
  // 请求属性访问
  const method = ctx.request.method;
  const url = ctx.request.url;
  const header = ctx.request.header;
  const origin = ctx.request.origin;
  
  // 请求体处理
  const body = ctx.request.body;
  const query = ctx.request.query;
  const querystring = ctx.request.querystring;
  
  // 内容协商
  const accepts = ctx.request.accepts('json', 'html');
  const type = ctx.request.type;
  
  // IP 获取
  const ip = ctx.request.ip;
});
```

### 响应 Response 对象

```javascript
app.use(async (ctx) => {
  // 响应状态设置
  ctx.response.status = 201;
  
  // 响应头设置
  ctx.response.set('X-Custom-Header', 'value');
  ctx.response.type = 'application/json';
  
  // 响应体设置
  ctx.response.body = { data: 'example' };
  ctx.response.body = 'Hello World';
  ctx.response.body = require('fs').createReadStream('file.txt');
  
  // 重定向
  ctx.response.redirect('/new-location');
  
  // 附件下载
  ctx.response.attachment('file.pdf');
});
```

## 常用中间件与扩展

### 路由处理 - koa-router

```javascript
const Koa = require('koa');
const Router = require('koa-router');

const app = new Koa();
const router = new Router();

// 基础路由
router.get('/', (ctx) => {
  ctx.body = '首页';
});

// 参数路由
router.get('/users/:id', (ctx) => {
  ctx.body = `用户 ID: ${ctx.params.id}`;
});

// 嵌套路由
const postsRouter = new Router({ prefix: '/posts' });
postsRouter.get('/', (ctx) => {
  ctx.body = '文章列表';
});
postsRouter.get('/:id/comments', (ctx) => {
  ctx.body = `文章 ${ctx.params.id} 的评论`;
});

// 注册路由
app.use(router.routes());
app.use(router.allowedMethods());
app.use(postsRouter.routes());
```

### 请求体解析 - koa-bodyparser

```javascript
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');

const app = new Koa();
app.use(bodyParser());

app.use(async (ctx) => {
  // 解析 JSON、form-urlencoded 请求体
  if (ctx.method === 'POST') {
    const { name, email } = ctx.request.body;
    ctx.body = { received: { name, email } };
  }
});
```

### 静态文件服务 - koa-static

```javascript
const Koa = require('koa');
const serve = require('koa-static');

const app = new Koa();

// 提供静态文件服务
app.use(serve('public'));

// 多个静态目录
app.use(serve('uploads'));
```

### 文件上传 - koa-multer

```javascript
const Koa = require('koa');
const Router = require('koa-router');
const multer = require('koa-multer');

const app = new Koa();
const router = new Router();
const upload = multer({ dest: 'uploads/' });

// 单文件上传
router.post('/upload', upload.single('file'), (ctx) => {
  ctx.body = {
    filename: ctx.req.file.filename,
    originalname: ctx.req.file.originalname
  };
});

// 多文件上传
router.post('/photos', upload.array('photos', 10), (ctx) => {
  ctx.body = `成功上传 ${ctx.req.files.length} 个文件`;
});

app.use(router.routes());
```

## 项目结构与最佳实践

### 典型项目结构

```
koa-project/
├── app.js                 # 应用入口
├── package.json
├── config/               # 配置文件
│   └── index.js
├── src/
│   ├── controllers/      # 控制器
│   ├── models/           # 数据模型
│   ├── routes/           # 路由定义
│   ├── middleware/       # 自定义中间件
│   └── utils/            # 工具函数
├── public/               # 静态资源
└── uploads/              # 上传文件
```

### 模块化路由示例

```javascript
// routes/users.js
const Router = require('koa-router');
const router = new Router({ prefix: '/users' });

router.get('/', async (ctx) => {
  const users = await UserModel.findAll();
  ctx.body = users;
});

router.get('/:id', async (ctx) => {
  const user = await UserModel.findById(ctx.params.id);
  if (!user) {
    ctx.throw(404, '用户不存在');
  }
  ctx.body = user;
});

router.post('/', async (ctx) => {
  const { name, email } = ctx.request.body;
  const user = await UserModel.create({ name, email });
  ctx.status = 201;
  ctx.body = user;
});

module.exports = router;

// app.js 中注册路由
const userRoutes = require('./routes/users');
app.use(userRoutes.routes());
```

### 认证中间件示例

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

const auth = async (ctx, next) => {
  const token = ctx.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    ctx.throw(401, '访问被拒绝，缺少令牌');
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    ctx.state.user = decoded;
    await next();
  } catch (err) {
    ctx.throw(401, '无效的令牌');
  }
};

module.exports = auth;

// 使用认证中间件
router.get('/profile', auth, async (ctx) => {
  ctx.body = {
    user: ctx.state.user,
    message: '这是受保护的用户资料'
  };
});
```

Koa.js 通过其精巧的设计和强大的中间件机制，为现代 Node.js Web 开发提供了优雅的解决方案。其洋葱模型和基于 async/await 的异步处理让复杂应用的开发变得更加简单和可维护，而丰富的中间件生态系统则确保了框架的灵活性和扩展性。