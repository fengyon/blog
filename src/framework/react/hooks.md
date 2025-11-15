# React Hooks

## 什么是 React Hooks？

React Hooks 是 React 16.8 版本引入的新特性，它允许你在函数组件中使用状态和其他 React 特性，而无需编写 class 组件。

## 为什么需要 Hooks？

### Class 组件存在的问题

- **复杂的组件逻辑**：生命周期方法经常包含不相关的逻辑
- **难以复用的状态逻辑**：高阶组件和 render props 模式使组件树变得复杂
- **难以理解的 class**：需要理解 JavaScript 的 `this` 绑定

### Hooks 的优势

- **逻辑复用**：可以轻松地在组件之间复用状态逻辑
- **代码组织**：将相关逻辑组织在一起，而不是分散在不同的生命周期中
- **更简单的组件**：函数组件更简洁，易于理解和测试

## Hooks 使用规则

### 1。只在最顶层使用 Hook

**不要在循环、条件或嵌套函数中调用 Hook**

```jsx
// ✅ 正确
function MyComponent() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    document.title = `Count: ${count}`
  })
}

// ❌ 错误
function MyComponent() {
  if (condition) {
    const [count, setCount] = useState(0) // 违反规则
  }
}
```

### 2。只在 React 函数中调用 Hook

**在 React 函数组件或自定义 Hook 中调用 Hook**

## 常用内置 Hooks

### useState

用于在函数组件中添加状态。

```jsx
import React, { useState } from 'react'

function Counter() {
  const [count, setCount] = useState(0)
  const [name, setName] = useState('')

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your name"
      />
      <p>Hello, {name}!</p>
    </div>
  )
}
```

**函数式更新**

```jsx
const [count, setCount] = useState(0)

// 如果新的 state 依赖于之前的 state
const increment = () => {
  setCount((prevCount) => prevCount + 1)
}
```

### useEffect

用于处理副作用操作，相当于 class 组件中的生命周期方法。

```jsx
import React, { useState, useEffect } from 'react'

function UserProfile({ userId }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // 类似于 componentDidMount 和 componentDidUpdate
  useEffect(() => {
    // 获取用户数据
    fetch(`/api/users/${userId}`)
      .then((response) => response.json())
      .then((userData) => {
        setUser(userData)
        setLoading(false)
      })
  }, [userId]) // 依赖数组：只有当 userId 变化时才重新执行

  // 清理副作用
  useEffect(() => {
    const timer = setInterval(() => {
      console.log('Timer running...')
    }, 1000)

    // 返回清理函数，类似于 componentWillUnmount
    return () => {
      clearInterval(timer)
    }
  }, []) // 空依赖数组：只在组件挂载和卸载时执行

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  )
}
```

**useEffect 依赖数组的几种情况：**

```jsx
// 1. 无依赖数组：每次渲染后都执行
useEffect(() => {
  console.log('This runs after every render')
})

// 2. 空依赖数组：只在挂载和卸载时执行
useEffect(() => {
  console.log('This runs only on mount')
  return () => console.log('This runs on unmount')
}, [])

// 3. 有依赖项：依赖项变化时执行
useEffect(() => {
  console.log('This runs when dependency changes')
}, [dependency])
```

### useContext

用于在函数组件中访问 React 的 Context。

```jsx
import React, { useContext, createContext, useState } from 'react'

// 创建 Context
const ThemeContext = createContext()

function App() {
  const [theme, setTheme] = useState('light')

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Toolbar />
    </ThemeContext.Provider>
  )
}

function Toolbar() {
  return (
    <div>
      <ThemedButton />
    </div>
  )
}

function ThemedButton() {
  // 使用 Context
  const { theme, setTheme } = useContext(ThemeContext)

  return (
    <button
      style={{
        background: theme === 'light' ? '#fff' : '#333',
        color: theme === 'light' ? '#000' : '#fff',
      }}
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      Toggle Theme
    </button>
  )
}
```

### useReducer

useState 的替代方案，适用于复杂的状态逻辑。

```jsx
import React, { useReducer } from 'react'

// 初始状态
const initialState = { count: 0 }

// Reducer 函数
function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 }
    case 'decrement':
      return { count: state.count - 1 }
    case 'reset':
      return initialState
    default:
      throw new Error()
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, initialState)

  return (
    <div>
      Count: {state.count}
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'reset' })}>Reset</button>
    </div>
  )
}
```

### useMemo

用于性能优化，缓存昂贵的计算结果。

```jsx
import React, { useState, useMemo } from 'react'

function ExpensiveComponent({ list }) {
  // 只有在 list 变化时才重新计算
  const expensiveValue = useMemo(() => {
    console.log('Calculating expensive value...')
    return list.reduce((sum, item) => sum + item.value, 0)
  }, [list])

  return <div>Total: {expensiveValue}</div>
}

function App() {
  const [list, setList] = useState([{ value: 1 }, { value: 2 }])
  const [count, setCount] = useState(0)

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>
        Re-render: {count}
      </button>
      <ExpensiveComponent list={list} />
    </div>
  )
}
```

### useCallback

缓存函数，避免不必要的重新渲染。

```jsx
import React, { useState, useCallback, memo } from 'react'

const ChildComponent = memo(({ onClick, value }) => {
  console.log('ChildComponent rendered')
  return <button onClick={onClick}>{value}</button>
})

function ParentComponent() {
  const [count, setCount] = useState(0)
  const [value, setValue] = useState('')

  // 使用 useCallback 缓存函数
  const handleClick = useCallback(() => {
    setCount((prevCount) => prevCount + 1)
  }, []) // 依赖数组为空，函数不会重新创建

  return (
    <div>
      <input value={value} onChange={(e) => setValue(e.target.value)} />
      <ChildComponent onClick={handleClick} value={`Count: ${count}`} />
    </div>
  )
}
```

### useRef

用于访问 DOM 元素或存储可变值。

```jsx
import React, { useRef, useEffect } from 'react'

function TextInputWithFocusButton() {
  const inputRef = useRef(null)
  const renderCount = useRef(0)

  useEffect(() => {
    renderCount.current += 1
  })

  const focusInput = () => {
    inputRef.current.focus()
  }

  return (
    <div>
      <input ref={inputRef} type="text" />
      <button onClick={focusInput}>Focus the input</button>
      <p>This component rendered {renderCount.current} times</p>
    </div>
  )
}
```

## 自定义 Hooks

自定义 Hook 是一个 JavaScript 函数，其名称以“use”开头，可以调用其他 Hook。

### 示例：自定义 useLocalStorage Hook

```jsx
import { useState, useEffect } from 'react'

// 自定义 Hook
function useLocalStorage(key, initialValue) {
  // 从 localStorage 读取初始值
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.log(error)
      return initialValue
    }
  })

  // 返回包装的 setter 函数，同时更新 localStorage
  const setValue = (value) => {
    try {
      // 允许值是一个函数，类似于 useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.log(error)
    }
  }

  return [storedValue, setValue]
}

// 使用自定义 Hook
function MyComponent() {
  const [name, setName] = useLocalStorage('name', 'John')
  const [age, setAge] = useLocalStorage('age', 30)

  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <input
        type="number"
        value={age}
        onChange={(e) => setAge(Number(e.target.value))}
      />
      <p>
        Hello {name}, you are {age} years old!
      </p>
    </div>
  )
}
```

### 示例：自定义 useApi Hook

```jsx
import { useState, useEffect } from 'react'

function useApi(url) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [url])

  return { data, loading, error }
}

// 使用自定义 Hook
function UserList() {
  const { data: users, loading, error } = useApi('/api/users')

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```
