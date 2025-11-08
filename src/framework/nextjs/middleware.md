# nextjs 中间件

Next.js 中间件允许你在请求完成之前运行代码。它基于传入的请求，通过重写、重定向、修改请求或响应头，或者直接响应来修改响应。

示意图：
```
请求生命周期：
[请求到达] → [中间件执行] → [路由匹配/缓存内容] → [页面渲染]
        ↓
中间件可以：重定向、重写、修改头信息、直接响应
```

## 中间件的作用时机

中间件在缓存内容和路由匹配之前运行。它的执行顺序在 Next.js 请求处理流程中相对靠前。

示意图：
```
Next.js 请求处理流程：
1. headers 从 next.config.js
2. redirects 从 next.config.js  
3. 中间件 (rewrites, redirects 等)
4. beforeFiles (rewrites) 从 next.config.js
5. 文件系统路由 (public/, _next/static/, pages/, app/ 等)
6. afterFiles (rewrites) 从 next.config.js
7. 动态路由 (/blog/[slug])
8. fallback (rewrites) 从 next.config.js
```

## 适用场景

### 中间件有效的场景

- 读取部分传入请求后快速重定向
- 根据 A/B 测试或实验重写到不同的页面
- 修改所有页面或部分页面的标题

### 中间件不适用的场景

- 数据获取速度慢
- 会话管理

## 基本用法

### 文件约定

在项目根目录创建 `middleware.ts`（或 `.js`）文件来定义中间件。该文件应与 `pages` 或 `app` 目录处于同一级别，或者在 `src` 内部（如果使用的话）。

示意图：
```
项目结构：
my-project/
├── middleware.ts    # 中间件文件
├── app/ (或 pages/) # 路由目录
├── public/         # 静态资源
└── ...             # 其他文件
```

注意：每个项目仅支持一个 `middleware.ts` 文件，但你可以将中间件逻辑模块化，分解到单独的文件中，然后导入到主 `middleware.ts` 文件中。

### 基本示例

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 重定向到 /home
  return NextResponse.redirect(new URL('/home', request.url))
}

// 配置匹配路径
export const config = {
  matcher: '/about/:path*',
}
```

## 路径匹配

### 匹配器配置

使用 `matcher` 来过滤中间件在特定路径上运行。

```typescript
export const config = {
  matcher: [
    '/about/:path*',
    '/dashboard/:path*',
  ],
}
```

匹配器规则：
- 必须以 `/` 开头
- 可以包含命名参数：`/about/:path` 匹配 `/about/a` 和 `/about/b`，但不匹配 `/about/a/c`
- 可以包含修饰符：`*`（零个或多个）、`?`（零个或一个）、`+`（一个或多个）
- 支持正则表达式

示意图：
```
matcher 示例：
/about/:path*   匹配 /about, /about/a, /about/a/b/c
/blog/:slug?   匹配 /blog 和 /blog/any-slug  
/products/:id+ 匹配 /products/123 但不匹配 /products
```

### 条件语句匹配

除了匹配器配置，你也可以在中间件函数内使用条件语句进行路径匹配。

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/about')) {
    return NextResponse.rewrite(new URL('/about-2', request.url))
  }

  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.rewrite(new URL('/dashboard/user', request.url))
  }
}
```

## NextResponse API

`NextResponse` API 允许你执行多种操作：

### 重定向和重写

```typescript
// 重定向到不同 URL
return NextResponse.redirect(new URL('/new-page', request.url))

// 重写响应（显示不同 URL 的内容）
return NextResponse.rewrite(new URL('/hidden-page', request.url))
```

示意图：
```
重定向 vs 重写：
请求 /old → 重定向到 /new → 浏览器地址栏变化
请求 /old → 重写到 /hidden → 显示 /hidden 内容，地址栏保持 /old
```

### 设置请求和响应头

```typescript
export function middleware(request: NextRequest) {
  // 克隆请求头并设置新头信息
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-custom-header', 'hello')
  
  // 创建修改了头信息的响应
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  
  // 设置响应头
  response.headers.set('x-response-header', 'world')
  
  return response
}
```

## Cookie 操作

Next.js 通过 `NextRequest` 和 `NextResponse` 上的 `cookies` 扩展提供了便捷的 cookie 访问和操作方法。

示意图：
```
请求 Cookie: 存储在 Cookie 头中
响应 Cookie: 存储在 Set-Cookie 头中
```

### Cookie 基本操作

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 从请求中获取 cookie
  let cookie = request.cookies.get('session')
  console.log(cookie) // => { name: 'session', value: '123', Path: '/' }
  
  // 检查 cookie 是否存在
  if (request.cookies.has('session')) {
    // 删除 cookie
    request.cookies.delete('session')
  }
  
  // 在响应中设置 cookie
  const response = NextResponse.next()
  response.cookies.set('user-token', 'abc123')
  
  return response
}
```

## 实际应用示例

### A/B 测试

中间件非常适合实现 A/B 测试。

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 基于 cookie 或随机分配决定版本
  const variant = Math.random() > 0.5 ? 'a' : 'b'
  
  if (request.nextUrl.pathname === '/home' && variant === 'b') {
    return NextResponse.rewrite(new URL('/home-b', request.url))
  }
  
  return NextResponse.next()
}
```

### 身份验证检查

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')
  
  // 如果访问受保护页面且未登录，重定向到登录页
  if (request.nextUrl.pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // 如果已登录但访问登录页，重定向到仪表板
  if (request.nextUrl.pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}
```

### 地域重定向

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const country = request.geo?.country || 'US'
  
  // 根据用户地区重写 URL
  if (country === 'CN') {
    return NextResponse.rewrite(new URL('/zh-cn' + request.nextUrl.pathname))
  }
  
  return NextResponse.next()
}
```

## 性能考虑

由于中间件为每个匹配的请求运行，应确保其逻辑轻量高效。

优化建议：
- 使用精确的 matcher 配置减少不必要的执行
- 避免在中间件中进行慢速数据获取
- 将复杂逻辑模块化到单独文件中

示意图：
```
性能优化：
精确匹配: matcher: '/admin/:path*' 而非 matcher: '/:path*'
轻量逻辑: 避免数据库查询、复杂计算
快速返回: 尽早返回响应
```