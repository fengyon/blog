# React Concurrent

## 概述

React 19 引入了强大的 Concurrent (并发) 特性，让应用能够保持响应性，同时提供更流畅的用户体验。这些特性允许 React 在渲染过程中中断和恢复工作，优先处理更紧急的更新。

## 核心并发 API

### 1. use Hook

`use` 是一个新的 React Hook，用于读取类似 Promise 或 context 的资源值。

#### API 说明

- **参数**：接受 Promise 或 React context
- **返回值**：直接返回解析后的值 (如果是 Promise)
- **特性**：与 Suspense 天然集成，在 Promise pending 时会触发最近的 Suspense 边界

#### 示例代码

```jsx
import { use, Suspense } from 'react'

// 异步数据获取函数
async function fetchUserData(userId) {
  const response = await fetch(`/api/users/${userId}`)
  return response.json()
}

function UserProfile({ userId }) {
  // use Hook 直接读取 Promise
  const userData = use(fetchUserData(userId))

  return (
    <div>
      <h1>{userData.name}</h1>
      <p>{userData.email}</p>
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<div>Loading user...</div>}>
      <UserProfile userId="123" />
    </Suspense>
  )
}
```

### 2. Suspense

Suspense 允许组件在等待异步操作时“暂停”渲染，并显示降级 UI。

#### API 说明

- **fallback**：在子组件加载期间显示的 UI
- **children**：需要异步加载的组件
- **用途**：数据获取、代码分割、图片加载等异步场景

#### 示例代码

```jsx
import { Suspense, useState } from 'react'

// 模拟异步组件
const AsyncComponent = () => {
  const data = use(fetchData()) // 假设 fetchData 返回 Promise
  return <div>Loaded: {data}</div>
}

// 图片预加载组件
const LazyImage = ({ src, alt }) => {
  const imagePromise = use(
    new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(src)
      img.src = src
    }),
  )

  return <img src={imagePromise} alt={alt} />
}

function Gallery() {
  const [currentImage, setCurrentImage] = useState(null)

  return (
    <div>
      <button onClick={() => setCurrentImage('image1.jpg')}>
        Load Image 1
      </button>

      {currentImage && (
        <Suspense fallback={<div>Loading image...</div>}>
          <LazyImage src={currentImage} alt="Gallery item" />
        </Suspense>
      )}

      <Suspense fallback={<div>Loading component...</div>}>
        <AsyncComponent />
      </Suspense>
    </div>
  )
}
```

### 3. useDeferredValue

`useDeferredValue` 返回一个延迟更新的值，用于延迟更新不太紧急的部分。

#### API 说明

- **参数**：需要延迟的值
- **返回值**：延迟版本的值
- **使用场景**：搜索输入、复杂图表更新等需要性能优化的场景

#### 示例代码

```jsx
import { useState, useDeferredValue, useMemo } from 'react'

function SearchComponent() {
  const [query, setQuery] = useState('')
  // 延迟搜索查询，让输入更流畅
  const deferredQuery = useDeferredValue(query)

  // 模拟昂贵的搜索计算
  const searchResults = useMemo(() => {
    return expensiveSearch(deferredQuery)
  }, [deferredQuery])

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />

      {/* 搜索结果会延迟更新，不阻塞输入 */}
      <SearchResults results={searchResults} />
    </div>
  )
}

function expensiveSearch(query) {
  // 模拟昂贵的搜索操作
  return items.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase()),
  )
}
```

### 4. startTransition

`startTransition` 用于将状态更新标记为非紧急过渡更新。

#### API 说明

- **参数**：包含状态更新函数的回调
- **特性**：标记的更新可以被更紧急的更新中断
- **使用场景**：页面导航、标签切换等不需要立即响应的更新

#### 示例代码

```jsx
import { useState, startTransition } from 'react'

function Navigation() {
  const [tab, setTab] = useState('home')
  const [isPending, startTransition] = useTransition()

  const handleTabChange = (newTab) => {
    // 使用 startTransition 标记非紧急更新
    startTransition(() => {
      setTab(newTab)
    })
  }

  return (
    <div>
      <nav>
        <button
          onClick={() => handleTabChange('home')}
          disabled={isPending}
        >
          Home {isPending && '(loading...)'}
        </button>
        <button
          onClick={() => handleTabChange('profile')}
          disabled={isPending}
        >
          Profile {isPending && '(loading...)'}
        </button>
      </nav>

      <main>
        {tab === 'home' && <HomeTab />}
        {tab === 'profile' && <ProfileTab />}
      </main>
    </div>
  )
}

// 或者使用独立的 startTransition
function handleUrgentAction() {
  // 紧急更新立即执行
  setUrgentValue('new value')

  // 非紧急更新使用 startTransition
  startTransition(() => {
    setNonUrgentValue('new value')
  })
}
```

### 5. useTransition

`useTransition` 返回一个过渡状态和启动函数，用于跟踪过渡的进行状态。

#### API 说明

- **返回值**：`[isPending, startTransition]`
  - `isPending`：布尔值，表示过渡是否在进行中
  - `startTransition`：启动过渡的函数
- **优势**：提供过渡状态，可以据此显示加载指示器

#### 示例代码

```jsx
import { useState, useTransition } from 'react'

function ProductList() {
  const [filter, setFilter] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleFilterChange = (newFilter) => {
    // 使用过渡更新，保持界面响应
    startTransition(() => {
      setFilter(newFilter)
    })
  }

  return (
    <div>
      {/* 搜索输入 - 立即响应 */}
      <SearchInput
        onFilterChange={handleFilterChange}
        disabled={isPending}
      />

      {/* 显示加载状态 */}
      {isPending && <div>Updating results...</div>}

      {/* 产品列表 - 延迟更新 */}
      <ProductItems filter={filter} />
    </div>
  )
}

function SearchInput({ onFilterChange, disabled }) {
  const [inputValue, setInputValue] = useState('')

  const handleChange = (e) => {
    const value = e.target.value
    setInputValue(value) // 立即更新输入框

    // 过滤操作使用过渡
    onFilterChange(value)
  }

  return (
    <input
      type="text"
      value={inputValue}
      onChange={handleChange}
      disabled={disabled}
      placeholder="Search products..."
    />
  )
}
```
