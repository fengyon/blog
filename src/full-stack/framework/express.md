# Express.js

Express.js 是 Node.js 生态系统中最受欢迎的 Web 应用程序框架，以其极简、灵活和高性能的特性而闻名。它提供了一系列强大的功能，帮助开发者快速构建各种 Web 和移动应用程序。

## 核心特性

- **轻量与灵活性**：Express 保持了最小的核心设计，你不必被强制的模式或组件束缚，可以自由选择中间件来扩展功能，这使得应用既轻便又可高度定制。

- **强大的路由系统**：Express 提供了直观且强大的路由 API，可以轻松定义基于不同 HTTP 方法和 URL 路径的请求处理逻辑。它支持动态路由参数和正则表达式匹配，使得路由定义既清晰又灵活。

- **丰富的中间件支持**：中间件是 Express 的核心。这些函数在请求和响应周期中执行，允许你以可组合的方式处理请求、添加功能 (如身份验证、日志记录、数据解析) 并影响响应。

- **广泛的模板引擎支持**：框架支持 Jade (现称 Pug)、EJS 和 Handlebars 等多种模板引擎，使开发人员能够轻松创建动态 HTML 内容。

- **高性能**：基于 Node.js 的非阻塞、事件驱动特性，Express 能够高效处理大量并发连接，非常适合 I/O 密集型应用。

- **庞大的生态系统**：作为 Node.js 的基石，Express 拥有丰富的中间件和插件生态，并且社区活跃，可以轻松找到问题的解决方案。

## 应用结构

一个基本的 Express 应用结构如下所示：

```
my-app/
├── app.js          # 应用入口文件
├── package.json    # 项目配置文件
├── public/         # 静态资源目录 (CSS, JS, images)
├── views/          # 模板文件目录
└── routes/         # 路由处理文件目录
```

## 路由系统

路由是指确定应用程序如何响应客户端对特定端点的请求，该端点是 URI (或路径) 和特定的 HTTP 请求方法 (例如 GET、POST)。

**路由的基本结构：**
```
app.METHOD(PATH, HANDLER)
```
- `app`：Express 的实例
- `METHOD`：HTTP 请求方法 (小写)
- `PATH`：服务器上的路径
- `HANDLER`：匹配路径时执行的函数

**示例代码：**
```javascript
const express = require('express');
const app = express();

// 响应根路径的GET请求
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// 响应POST请求
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  // 验证逻辑...
  res.send('Login successful!');
});

// 带参数的路由
app.get('/user/:id', (req, res) => {
  res.send(`用户 ID: ${req.params.id}`);
});

// 使用正则表达式的路由
app.get('/ab*cd', (req, res) => {
  res.send('正则匹配路径');
});
```

## 中间件机制

中间件函数是能够访问请求对象 (req)、响应对象 (res) 以及应用程序请求-响应周期中下一个中间件函数的函数。它们可以执行任何代码、修改请求和响应对象、结束请求-响应周期，或者调用下一个中间件。

**中间件执行流程：**
```
请求 → MIDDLEWARE1 → MIDDLEWARE2 → ... → 路由处理 → 响应
```

**自定义中间件示例：**
```javascript
const express = require('express');
const app = express();

// 简单的日志记录中间件
const logRequest = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next(); // 将控制权传递给下一个中间件
};

// 解析 JSON 请求体的中间件
app.use(express.json());

// 应用日志中间件
app.use(logRequest);

// 路由
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.listen(3000, () => {
  console.log('服务器运行在端口 3000');
});
```

**常用内置中间件：**
- `express.json()`：解析 Content-Type 为 application/json 的请求体
- `express.urlencoded()`：解析 Content-Type 为 application/x-www-form-urlencoded 的请求体
- `express.static()`：提供静态文件服务

## 请求与响应对象

### 请求对象 (Request)

Request 对象表示 HTTP 请求，包含了请求查询字符串、参数、内容、HTTP 头部等属性。

**常用属性和方法：**
- `req.params`：获取路由参数
- `req.query`：获取 URL 查询参数
- `req.body`：获取请求主体 (需要 body-parser 中间件)
- `req.path`：获取请求路径
- `req.method`：获取 HTTP 方法
- `req.get(field)`：获取指定的 HTTP 请求头

### 响应对象 (Response)

Response 对象表示 HTTP 响应，即在接收到请求时向客户端发送的 HTTP 响应数据。

**常用方法：**
- `res.send()`：发送各种类型的响应
- `res.json()`：发送 JSON 响应
- `res.render()`：渲染视图模板
- `res.status()`：设置 HTTP 状态码
- `res.redirect()`：重定向请求
- `res.sendFile()`：发送文件作为响应
- `res.set()`：设置响应头

## 常用 API 示例

### 基本服务器设置
```javascript
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// 提供静态文件服务
app.use(express.static('public'));

// 解析 application/json
app.use(express.json());

// 解析 application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});
```

### 路由 API
```javascript
// 响应不同类型的请求
app.get('/api/users', (req, res) => {
  // 获取用户列表逻辑
  res.json({ users: [{ id: 1, name: 'John' }] });
});

app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  // 创建新用户逻辑
  res.status(201).json({ message: 'User created', user: { name, email } });
});

app.put('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const { name, email } = req.body;
  // 更新用户逻辑
  res.json({ message: `User ${userId} updated` });
});

app.delete('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  // 删除用户逻辑
  res.json({ message: `User ${userId} deleted` });
});
```

### 错误处理中间件
```javascript
// 404 处理
app.use((req, res, next) => {
  res.status(404).send("抱歉，找不到此页面！");
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('服务器内部错误！');
});
```

### 路由模块化
```javascript
// routes/users.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('用户列表');
});

router.get('/:id', (req, res) => {
  res.send(`用户详情: ${req.params.id}`);
});

module.exports = router;

// app.js
const usersRouter = require('./routes/users');
app.use('/users', usersRouter);
```

### 模板引擎集成
```javascript
// 设置 EJS 作为模板引擎
app.set('view engine', 'ejs');

// 渲染视图
app.get('/about', (req, res) => {
  res.render('about', { title: '关于我们', pageName: '关于页面' });
});
```

Express.js 的简洁性和灵活性使它成为 Node.js Web 开发的首选框架。通过中间件和路由系统，你可以构建从简单网站到复杂企业级应用的各种项目。其丰富的生态系统和良好的文档支持，使得开发过程更加高效和愉快。