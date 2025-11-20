# React CSS

当你开始一个 React 项目时，如何组织和编写 CSS 是一个重要的技术决策。与 Vue 不同，React 官方并没有指定统一的样式方案，这使得开发者需要从众多方案中选择最适合自己项目的方案。

## 行内样式 (Inline Styles)

行内样式是最直接的 CSS 编写方式，通过在 JSX 元素中直接定义样式对象来实现。

### 基本用法

```jsx
class App extends React.Component {
  render() {
    return (
      <div style={{ background: '#eee', width: '200px', height: '200px' }}>
        <p style={{ color: 'red', fontSize: '40px' }}>行内样式</p>
      </div>
    )
  }
}
```

### 外部声明样式

```jsx
class App extends React.Component {
  const style1 = {
    background: '#eee',
    width: '200px',
    height: '200px'
  }

  const style2 = {
    color: 'red',
    fontSize: '40px'
  }

  render() {
    return (
      <div style={style1}>
        <p style={style2}>行内样式</p>
      </div>
    )
  }
}
```

### 动态样式

```jsx
export class App extends PureComponent {
  constructor() {
    super()
    this.state = {
      mySize: 30,
    }
  }

  render() {
    const { mySize } = this.state
    return (
      <div>
        <div style={{ color: 'red', fontSize: `${mySize}px` }}>
          我是标题
        </div>
      </div>
    )
  }
}
```

### 优点与缺点

**优点**：样式之间不会有冲突、可以动态获取当前 state 中的状态、无类名冲突、组件化。
**缺点**：大量的样式会使代码混乱、某些样式无法编写 (比如伪类/伪元素)、不支持伪类、伪元素、媒体查询、无法复用 CSS 特性。

## 普通 CSS 文件

这是传统的 CSS 编写方式，将 CSS 代码放在独立文件中，然后在组件中引入。

### 基本用法

```css
/* Person.css */
.person {
  width: 60%;
  margin: 16px auto;
  border: 1px solid #eee;
  box-shadow: 0 2px 3px #ccc;
  padding: 16px;
  text-align: center;
}
```

```jsx
import React from 'react'
import './Person.css'

class App extends React.Component {
  render() {
    return (
      <div className="person">
        <p>person: Hello world</p>
      </div>
    )
  }
}
```

### 动态类名

使用 `classnames` 库来简化动态类名的处理：

```jsx
import classNames from 'classnames'
;<button
  className={classNames('btn', {
    'btn-primary': isPrimary,
    'btn-disabled': isDisabled,
  })}
>
  Click me
</button>
```

### 优点与缺点

**优点**：零学习成本，简单直观。
**缺点**：样式全局污染、易冲突、维护困难，这种编写方式最大的问题是样式之间会相互层叠掉。

## CSS Modules

CSS Modules 通过构建工具将 CSS 文件转换为局部作用域的类名，实现了真正的样式隔离。

### 基本用法

```css
/* Button.module.css */
.mybutton {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.primary {
  composes: mybutton;
  background-color: #007bff;
  color: white;
}
```

```jsx
import styles from './Button.module.css'

function App() {
  return (
    <div>
      <button className={styles.primary}>Primary Button</button>
    </div>
  )
}
```

### 多类名组合

```jsx
import styles from './Button.module.css'

function App() {
  return (
    <div>
      <button className={`${styles.mybutton} ${styles.primary}`}>
        My Primary Button
      </button>
    </div>
  )
}
```

### 全局样式

在 CSS Modules 中定义全局样式：

```css
/* 使用 :global 语法定义全局样式 */
:global(.myheader) {
  padding: 10px 20px;
  font-size: 50px;
  color: white;
  background-color: dodgerblue;
}
```

### 优点与缺点

**优点**：自动作用域隔离，避免样式冲突、支持 TypeScript 自动补全和类型提示、真正的 CSS：支持所有 CSS 特性。
**缺点**：动态样式支持较弱、需要配置构建工具、最终 HTML 标签上的样式名可读性差。

## CSS-in-JS

CSS-in-JS 是一种将 CSS 编写内置到 JavaScript 中的模式，提供完美的样式隔离和强大的动态样式能力。

### Styled Components

#### 基本用法

```jsx
import styled from 'styled-components'

// 创建一个 Title 组件,它将渲染一个附加了样式的 <h1> 标签
const Title = styled.h1`
  font-size: 1.5em;
  text-align: center;
  color: palevioletred;
`

// 创建一个 Wrapper 组件,它将渲染一个附加了样式的 <section> 标签
const Wrapper = styled.section`
  padding: 4em;
  background: papayawhip;
`

// 使用组件
render(
  <Wrapper>
    <Title>Hello World!</Title>
  </Wrapper>,
)
```

#### Props 动态样式

```jsx
const Button = styled.button`
  background: ${(props) => (props.primary ? 'blue' : 'white')};
  padding: 10px 20px;
  &:hover {
    opacity: 0.9;
  }
`

const App = () => (
  <div>
    <Button primary>Primary Button</Button>
    <Button>Normal Button</Button>
  </div>
)
```

#### 继承样式

```jsx
const BaseButton = styled.button`
  border: 1px solid red;
  border-radius: 4px;
`

const SuccessButton = styled(BaseButton)`
  background-color: #0f0;
  color: #fff;
`
```

### Emotion

Emotion 是另一个流行的 CSS-in-JS 库，支持模板字符串和对象样式两种写法。

#### 基本用法

```jsx
import { css } from '@emotion/css'

const className = css`
  color: red;
  font-size: 20px;
`

function App() {
  return <div className={className}>Hello Emotion</div>
}
```

#### 使用 React 组件

```jsx
import styled from '@emotion/styled'

const StyledButton = styled.button`
  background: ${(props) => (props.primary ? 'blue' : 'white')};
  padding: 10px 20px;
`

function App() {
  return <StyledButton primary>Emotion Button</StyledButton>
}
```

### 优点与缺点

**优点**：完美的样式隔离、强大的动态样式能力、自动处理样式依赖和浏览器前缀。
**缺点**：运行时开销、学习曲线较陡、调试类名可读性差。

## 实用优先的 CSS 方案

### Tailwind CSS

Tailwind CSS 是一个实用优先的 CSS 框架，通过预定义的实用类快速构建界面。

#### 基本用法

```jsx
function App() {
  return (
    <div className="p-4 bg-white text-black rounded">
      <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Button
      </button>
    </div>
  )
}
```

#### 配置和自定义

```jsx
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'custom-blue': '#1fb6ff',
      },
    },
  },
}
```

### 优点与缺点

**优点**：开发速度极快、极小打包体积，运行性能优异、一致性：遵循设计系统的约束。
**缺点**：HTML 类名冗长、需要记忆类名约定、自定义配置需要学习。

## 样式方案对比

为了帮助你更好地选择适合的方案，下面是各方案的全面对比：

| **样式方案**     | **样式隔离** | **动态样式** | **性能表现** | **学习成本** | **适用场景**           |
| ---------------- | ------------ | ------------ | ------------ | ------------ | ---------------------- |
| **行内样式**     | ✅ 有        | ✅ 强        | ✅ 快        | 低           | 简单动态样式、快速原型 |
| **普通 CSS**     | ❌ 无        | ❌ 不支持    | ✅ 快        | 低           | 原型/教学项目          |
| **CSS Modules**  | ✅ 有        | ⚠️ 有限      | ✅ 快        | 中           | 中大型项目、企业级项目 |
| **CSS-in-JS**    | ✅ 有        | ✅ 强        | ❌ 较慢      | 高           | 组件库、主题系统       |
| **Tailwind CSS** | ✅ 有        | ⚠️ 受限      | ✅ 极优      | 中           | 统一设计系统、快速开发 |

## 选型建议

根据不同的项目需求，以下是具体的选型建议：

### 中大型企业项目

**推荐：CSS Modules + Tailwind CSS**

- CSS Modules 提供可靠的样式隔离，适合团队协作
- Tailwind CSS 提高开发效率，保证设计一致性

### 组件库和高度动态样式

**推荐：CSS-in-JS (Emotion 或 Styled Components)**

- 完美的样式隔离适合可复用的组件
- 强大的动态样式能力支持复杂的交互需求

### Next.js 项目

**推荐：styled-jsx 或 Tailwind CSS**

- styled-jsx 与 Next.js 原生集成
- Tailwind CSS 提供快速的开发体验

### 快速原型和小项目

**推荐：普通 CSS 或行内样式**

- 快速上手，简单直接
- 无需复杂配置
