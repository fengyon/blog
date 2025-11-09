# nuxtjs 服务端API

## 什么是服务端API

在Nuxt.js中，服务端API允许您在服务器端创建和处理HTTP端点，用于执行后端逻辑，如数据库操作或身份验证。它基于Nitro服务器引擎构建，提供无缝的集成。

示意图：
```
浏览器请求 -> Nuxt服务器 -> 服务端API处理 -> 返回JSON/数据
```

## 创建服务端API

在Nuxt.js项目中，您可以通过在`server/api`目录下创建文件来定义API路由。每个文件对应一个端点，使用事件处理程序响应请求。

文件结构示例：
```
项目根目录/
├── server/
│   └── api/
│       └── hello.get.js
```

代码示例（在`server/api/hello.get.js`中）：
```javascript
export default defineEventHandler((event) => {
  return { message: 'Hello from server API!' }
})
```
这创建了一个GET端点，返回JSON响应。

## 使用服务端API

从客户端调用服务端API时，您可以使用`$fetch`或`useFetch`直接访问路由路径，无需额外配置。Nuxt.js自动处理路由映射。

示意图：
```
客户端组件 -> 调用 /api/hello -> 服务端执行逻辑 -> 返回数据到前端
```

示例调用（在Vue组件中）：
```javascript
const data = await $fetch('/api/hello')
console.log(data.message) // 输出: Hello from server API!
```

## 优势与用例

服务端API简化了全栈开发，支持服务端渲染(SSR)、静态站点生成(SSG)和中间件集成。常见用例包括构建RESTful API、处理表单提交或实现用户认证。

示意图：
```
用例：用户登录
前端输入 -> API验证凭据 -> 返回令牌 -> 更新UI
```

通过内置类型安全和对H3的兼容，Nuxt.js服务端API提升了开发效率和性能。