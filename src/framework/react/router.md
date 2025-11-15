# React Router

## 概述

React Router 是 React 应用的标准路由库，用于实现单页面应用 (SPA) 的路由管理。

## 安装

```bash
npm install react-router-dom
```

## 核心组件

### BrowserRouter

提供基于 HTML5 History API 的路由

```jsx
import { BrowserRouter } from 'react-router-dom'

function App() {
  return <BrowserRouter>{/* 应用内容 */}</BrowserRouter>
}
```

### Routes 和 Route

定义路由映射关系

```jsx
import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/users/:id" element={<UserProfile />} />
    </Routes>
  )
}
```

### Link

声明式导航组件

```jsx
import { Link } from 'react-router-dom'

function Navigation() {
  return (
    <nav>
      <Link to="/">首页</Link>
      <Link to="/about">关于</Link>
    </nav>
  )
}
```

## 路由参数

### 动态路由参数

```jsx
;<Route path="/users/:userId" element={<UserDetail />} />

// 组件内获取参数
import { useParams } from 'react-router-dom'

function UserDetail() {
  const { userId } = useParams()
  return <div>用户ID: {userId}</div>
}
```

### 查询参数

```jsx
import { useSearchParams } from 'react-router-dom'

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const keyword = searchParams.get('q')

  return (
    <div>
      搜索关键词: {keyword}
      <button onClick={() => setSearchParams({ q: 'react' })}>
        搜索 React
      </button>
    </div>
  )
}
```

## 编程式导航

### useNavigate Hook

```jsx
import { useNavigate } from 'react-router-dom'

function LoginButton() {
  const navigate = useNavigate()

  const handleLogin = () => {
    // 执行登录逻辑
    navigate('/dashboard')
  }

  return <button onClick={handleLogin}>登录</button>
}
```

### 导航选项

```jsx
// 替换当前历史记录
navigate('/new-path', { replace: true })

// 传递状态
navigate('/user', { state: { from: 'homepage' } })

// 获取传递的状态
const location = useLocation()
const state = location.state
```

## 嵌套路由

### 定义嵌套路由

```jsx
<Routes>
  <Route path="/dashboard" element={<Dashboard />}>
    <Route path="profile" element={<Profile />} />
    <Route path="settings" element={<Settings />} />
    <Route index element={<DashboardHome />} />
  </Route>
</Routes>
```

### Outlet 组件

在父组件中渲染子路由

```jsx
function Dashboard() {
  return (
    <div>
      <h1>仪表板</h1>
      <nav>{/* 子路由导航 */}</nav>
      <Outlet /> {/* 子路由将在这里渲染 */}
    </div>
  )
}
```

## 路由保护

### 身份验证保护

```jsx
import { Navigate, useLocation } from 'react-router-dom'

function RequireAuth({ children }) {
  const auth = useAuth() // 自定义认证Hook
  const location = useLocation()

  if (!auth.user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

// 使用
;<Route
  path="/protected"
  element={
    <RequireAuth>
      <ProtectedPage />
    </RequireAuth>
  }
/>
```

## 路由配置

### 集中式配置

```jsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'about',
        element: <About />,
      },
    ],
  },
])

// 在 main.jsx 中使用
import { RouterProvider } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
```

## 错误处理

### 错误边界路由

```jsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      // 子路由
    ],
  },
])
```

## 常用 Hooks

### useLocation

获取当前 location 对象

```jsx
import { useLocation } from 'react-router-dom'

function CurrentPath() {
  const location = useLocation()
  return <div>当前路径: {location.pathname}</div>
}
```

### useMatch

检查当前路径是否匹配指定模式

```jsx
import { useMatch } from 'react-router-dom'

function NavLink({ to, children }) {
  const match = useMatch(to)
  return (
    <Link to={to} className={match ? 'active' : ''}>
      {children}
    </Link>
  )
}
```

## 最佳实践

1. **路由结构扁平化**：避免过深的嵌套路由
2. **懒加载路由**：使用 React.lazy 实现代码分割
3. **错误处理**：为关键路由提供错误边界
4. **类型安全**：在 TypeScript 项目中定义路由类型
5. **测试友好**：将路由逻辑与组件逻辑分离

### 懒加载示例

```jsx
const LazyAbout = lazy(() => import('./pages/About'))

;<Route
  path="/about"
  element={
    <Suspense fallback={<div>加载中...</div>}>
      <LazyAbout />
    </Suspense>
  }
/>
```
