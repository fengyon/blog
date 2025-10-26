# React 组件

## React 组件是什么

React 组件是构建用户界面的独立、可复用的代码片段。每个组件都封装了自己的结构、样式和行为，可以像搭积木一样组合起来构建复杂的 UI。

## 创建 React 组件

### 函数组件

通过定义函数，返回一个`jsx`元素，这是现代 React 开发中最常用的组件形式。
函数名的首字母通常要大写，用来跟一般函数区分开。

```jsx
const Welcome = (props) => {
  return <h1>Hello, {props.name}!</h1>
}
```

### class 组件 (已废弃)

[类式组件](https://zh-hans.react.dev/reference/react/Component)仍然被 React 支持，**但不建议在新代码中使用它们**。
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

children 是一个特殊的 prop，它包含在组件开始和结束标签之间，表示组件的子内容

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

#### className

className 是 DOM 属性`class`的别称，用来定义样式，支持字符串、数组、对象三种方式定义

```jsx
const element1 = <div className="class1 class2 class3"></div>
const element2 = (
  <div
    className={[
      'class1',
      // false 表示此样式不被使用
      false && 'class2',
      'class3',
    ]}
  ></div>
)
const element3 = (
  <div
    className={{
      class1: true,
      // false 表示此样式不被使用
      class2: false,
      class3: true,
    }}
  ></div>
)
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

## Ref 详解

`Ref`对应的英文单词是 `reference`，意思是“引用”。

### 定义组件 Ref

- 原生组件，如`div`, `p`, `span`等的`ref`指向 DOM 元素
- 使用 `useImperativeHandle` 自定义组件 Ref：

```jsx
import { useImperativeHandle, useRef } from 'react'

// 子组件
const CustomInput = (props) => {
  const inputRef = useRef(null)

  // 组件 ref 将有 focus, clear 方法
  useImperativeHandle(props.ref, () => ({
    focus: () => {
      inputRef.current.focus()
    },
    clear: () => {
      inputRef.current.value = ''
    },
  }))

  return <input {...props} ref={inputRef} />
}

// react18及更旧版本需要使用 forwardRef
// import { forwardRef } from 'react'
// const CustomInput = forwardRef((props, ref) => { ... })
```

- 将 ref 指向子组件的 Ref

```jsx
// 子组件
const CustomInput = (props) => {
  return <input {...props} ref={props.ref} />
}

// react18及更旧版本需要使用 forwardRef
// import { forwardRef } from 'react'
// const CustomInput = forwardRef((props, ref) => { ... })
```

### 获取组件 Ref

- useRef 获取，常用于需要缓存 ref，多次使用的场景

```jsx
import { useRef } from 'react'

const TextInput = () => {
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

- 回调函数获取，常用于只获取一次 Ref 的场景

```jsx
const TextInput = (props) => {
  const focus = (inputElement) => {
    inputElement.focus()
  }
  return (
    <div>
      <input ref={focus} type="text" placeholder="自动聚焦" />
    </div>
  )
}
```
