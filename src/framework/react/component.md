# React 组件

## React 组件是什么

React 组件是构建用户界面的独立、可复用的代码片段。每个组件都封装了自己的结构、样式和行为，可以像搭积木一样组合起来构建复杂的 UI。

## 创建 React 组件

### 函数组件

这是现代 React 开发中最常用的组件形式：

```jsx
const Welcome = (props) => {
  return <h1>Hello, {props.name}!</h1>
}
```

### class 组件 (已废弃)

[类式组件](https://zh-hans.react.dev/reference/react/Component)仍然被 React 支持，但不建议在新代码中使用它们。
本文只介绍函数组件的使用，class 组件可以[查阅官方文档](https://zh-hans.react.dev/reference/react/Component)。

```jsx
import { Component } from 'react'
class Welcome extends Component {
  render() {
    return <h1>Hello, {this.props.name}!</h1>
  }
}
```

## 组件 Props

### 组件 Props 是什么

Props（属性）是组件的输入，类似于函数的参数。它们是从父组件传递给子组件的只读数据。

```jsx
// 父组件向 Welcom 传递 props
function App() {
  return (
    <div>
      <Welcome name="Alice" age={25} isActive={true} />
    </div>
  )
}

// 子组件接收 props
function Welcome(props) {
  // 使用解构让代码更清晰
  const { name, age, isActive } = props
  return (
    <div>
      <h1>Hello, {name}!</h1>
      <p>Age: {age}</p>
      <p>Status: {isActive ? 'Active' : 'Inactive'}</p>
    </div>
  )
}
```

### Props 特殊属性

#### ref

ref 属性用于获取对 DOM 元素或组件实例的引用。

#### children

children 是一个特殊的 prop，它包含在组件开始和结束标签之间的内容：

```jsx
// 使用 children
function Card({ children, title }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="card-content">{children}</div>
    </div>
  )
}

// 调用 Card 组件
function App() {
  return (
    <Card title="用户信息">
      <p>这是卡片的内容</p>
      <button>点击我</button>
    </Card>
  )
}
```

### 数据单向流动

React 遵循单向数据流原则：

- Props 从父组件传递到子组件
- 子组件不能直接修改接收到的 props
- 数据变化通过回调函数向上传递

```jsx
// 父组件
function Parent() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>父组件计数: {count}</p>
      <Child count={count} onIncrement={() => setCount(count + 1)} />
    </div>
  )
}

// 子组件
function Child({ count, onIncrement }) {
  return (
    <div>
      <p>子组件接收的计数: {count}</p>
      <button onClick={onIncrement}>增加</button>
    </div>
  )
}
```

## 组件如何复用

### 通过 Props 定制化

```jsx
// 可复用的 Button 组件
function Button({
  children,
  variant = 'primary',
  size = 'medium',
  onClick,
  disabled = false,
}) {
  const className = `btn btn-${variant} btn-${size}`

  return (
    <button className={className} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

// 使用不同配置的 Button
function App() {
  return (
    <div>
      <Button variant="primary" onClick={() => alert('Clicked!')}>
        主要按钮
      </Button>
      <Button variant="secondary" size="large">
        次要按钮
      </Button>
      <Button disabled={true}>禁用按钮</Button>
    </div>
  )
}
```

### 组合模式

```jsx
// 布局组件
function Layout({ header, sidebar, content }) {
  return (
    <div className="layout">
      <header className="header">{header}</header>
      <div className="main">
        <aside className="sidebar">{sidebar}</aside>
        <main className="content">{content}</main>
      </div>
    </div>
  )
}

// 使用组合
function App() {
  return (
    <Layout
      header={<Header />}
      sidebar={<Navigation />}
      content={<ArticleList />}
    />
  )
}
```

## 组件 Ref 详解

### 获取 DOM 元素

```jsx
import { useRef } from 'react'

function TextInput() {
  const inputRef = useRef(null)

  const focusInput = () => {
    inputRef.current.focus()
  }

  return (
    <div>
      <input ref={inputRef} type="text" placeholder="点击按钮聚焦" />
      <button onClick={focusInput}>聚焦输入框</button>
    </div>
  )
}
```

### 获取组件实例

使用 `forwardRef` 和 `useImperativeHandle` 暴露组件方法：

```jsx
import { forwardRef, useImperativeHandle, useRef } from 'react'

// 子组件
const CustomInput = forwardRef((props, ref) => {
  const inputRef = useRef(null)

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current.focus()
    },
    clear: () => {
      inputRef.current.value = ''
    },
    getValue: () => {
      return inputRef.current.value
    },
  }))

  return <input {...props} ref={inputRef} />
})

// 父组件
function Parent() {
  const inputRef = useRef(null)

  const handleFocus = () => {
    inputRef.current.focus()
  }

  const handleClear = () => {
    inputRef.current.clear()
  }

  return (
    <div>
      <CustomInput ref={inputRef} placeholder="自定义输入框" />
      <button onClick={handleFocus}>聚焦</button>
      <button onClick={handleClear}>清空</button>
    </div>
  )
}
```

### 组件限制 Ref 的值

默认情况下，函数组件不能接收 ref，需要使用 `forwardRef`：

```jsx
// 错误：函数组件默认不能接收 ref
function MyComponent(props) {
  return <div>Hello</div>
}

// 正确：使用 forwardRef
const MyComponent = forwardRef((props, ref) => {
  return <div ref={ref}>Hello</div>
})

// 限制 ref 类型
const RestrictedComponent = forwardRef((props, ref) => {
  // 只允许特定的 ref 类型
  const internalRef = useRef(null)

  // 将 ref 转发到内部 div
  return <div ref={ref}>内容</div>
})
```

### 回调 Ref

另一种使用 ref 的方式：

```jsx
function MeasureExample() {
  const [height, setHeight] = useState(0)

  const measuredRef = useCallback((node) => {
    if (node !== null) {
      setHeight(node.getBoundingClientRect().height)
    }
  }, [])

  return (
    <div>
      <h1 ref={measuredRef}>Hello, world</h1>
      <h2>The above header is {Math.round(height)}px tall</h2>
    </div>
  )
}
```

通过掌握这些 React 组件的基本概念和高级特性，你可以构建出更加健壮、可维护的 React 应用程序。记住，组件的核心思想是"单一职责"和"可组合性"，良好的组件设计是 React 应用成功的关键。
