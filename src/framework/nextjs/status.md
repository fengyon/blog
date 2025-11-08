# nextjs 状态管理

Next.js 应用中的状态管理需要考虑服务端渲染、客户端交互和组件层次结构的特殊性，提供多种方案来满足不同场景的需求。

## 状态管理概览

Next.js 应用中的状态可以分为不同层次，每种状态都有适合的管理方案：

示意图：
```
状态层次：
组件内状态 (useState) → 组件间状态 (Props/Context) → 应用级状态 (Zustand/Redux) → 服务端状态 (SWR/TanStack Query)
```

## 客户端状态管理

### 本地组件状态

使用 React 的 `useState` 和 `useReducer` 管理组件内部状态。

```jsx
'use client';

import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        增加
      </button>
    </div>
  );
}
```

示意图：
```
组件状态流：
[初始状态] → [用户交互] → [状态更新] → [UI重新渲染]
```

### Context API

使用 React Context 在组件树中共享状态，避免 prop drilling。

示意图：
```
Prop Drilling问题：
ComponentA → ComponentB → ComponentC → ComponentD
    ↓                      ↓
[状态]                 [需要状态]

Context解决方案：
Context.Provider
    ├── ComponentA
    ├── ComponentB  
    └── ComponentC → ComponentD (直接消费Context)
```

```jsx
'use client';

import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
```

## 服务端状态管理

### URL 状态

使用 URL 参数和查询字符串管理页面状态，支持分享和刷新保持状态。

示意图：
```
URL作为状态容器：
/search?query=nextjs&category=docs&page=1
    ↓
query: nextjs
category: docs  
page: 1
```

```jsx
'use client';

import { useSearchParams, useRouter } from 'next/navigation';

function SearchFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    params.set(key, value);
    router.push(`?${params.toString()}`);
  };
  
  return (
    <div>
      <input 
        defaultValue={searchParams.get('query') || ''}
        onChange={(e) => updateFilter('query', e.target.value)}
      />
    </div>
  );
}
```

### Server Actions

在服务端处理状态变更，确保数据一致性。

```jsx
// app/actions.js
'use server';

export async function createTodo(formData) {
  const title = formData.get('title');
  // 服务端状态更新
  await db.todos.create({ title });
  revalidatePath('/todos');
}
```

## 数据获取与缓存

### SWR

SWR 提供数据获取、缓存和重新验证功能。

示意图：
```
SWR工作流：
[组件请求数据] → [检查缓存] → [缓存命中?] → 是: 返回缓存
        ↓否
[发起请求] → [更新缓存] → [返回数据] → [后台重新验证]
```

```jsx
'use client';

import useSWR from 'swr';

function Profile() {
  const { data, error, isLoading } = useSWR(
    '/api/user',
    (url) => fetch(url).then(res => res.json())
  );
  
  if (error) return <div>加载失败</div>;
  if (isLoading) return <div>加载中...</div>;
  
  return <div>你好, {data.name}!</div>;
}
```

### TanStack Query

功能强大的服务端状态管理库，适用于复杂的数据获取场景。

```jsx
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function Todos() {
  const queryClient = useQueryClient();
  
  const { data: todos } = useQuery({
    queryKey: ['todos'],
    queryFn: () => fetch('/api/todos').then(res => res.json()),
  });
  
  const mutation = useMutation({
    mutationFn: (newTodo) => 
      fetch('/api/todos', {
        method: 'POST',
        body: JSON.stringify(newTodo),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
  
  return (
    <div>
      {todos?.map(todo => (
        <div key={todo.id}>{todo.title}</div>
      ))}
    </div>
  );
}
```

## 状态管理库

### Zustand

轻量级状态管理库，API 简单直观。

```jsx
'use client';

import { create } from 'zustand';

const useStore = create((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
}));

function BearCounter() {
  const bears = useStore((state) => state.bears);
  const increase = useStore((state) => state.increasePopulation);
  
  return (
    <div>
      <h1>{bears} 只熊</h1>
      <button onClick={increase}>增加一只熊</button>
    </div>
  );
}
```

### Redux Toolkit

适用于大型复杂应用的状态管理方案。

示意图：
```
Redux数据流：
[组件] → [Action] → [Reducer] → [Store] → [更新状态] → [组件重新渲染]
```

```jsx
'use client';

import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider, useDispatch, useSelector } from 'react-redux';

const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
  },
});

const store = configureStore({
  reducer: {
    counter: counterSlice.reducer,
  },
});

function Counter() {
  const count = useSelector((state) => state.counter.value);
  const dispatch = useDispatch();
  
  return (
    <div>
      <span>{count}</span>
      <button onClick={() => dispatch(counterSlice.actions.increment())}>
        +
      </button>
    </div>
  );
}
```

## 表单状态管理

### React Hook Form

高性能表单状态管理库。

```jsx
'use client';

import { useForm } from 'react-hook-form';

function ContactForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  const onSubmit = (data) => {
    console.log(data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input 
        {...register('name', { required: true })}
        placeholder="姓名"
      />
      {errors.name && <span>姓名是必填项</span>}
      
      <input 
        {...register('email', { 
          required: true,
          pattern: /^\S+@\S+$/i 
        })}
        placeholder="邮箱"
      />
      {errors.email && <span>请输入有效的邮箱地址</span>}
      
      <button type="submit">提交</button>
    </form>
  );
}
```

## 状态持久化

### localStorage 集成

在客户端持久化状态。

```jsx
'use client';

import { useState, useEffect } from 'react';

function usePersistedState(key, defaultValue) {
  const [state, setState] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    }
    return defaultValue;
  });
  
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);
  
  return [state, setState];
}

function Settings() {
  const [theme, setTheme] = usePersistedState('theme', 'light');
  
  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
      <option value="light">浅色</option>
      <option value="dark">深色</option>
    </select>
  );
}
```

## 状态管理选择指南

根据应用需求选择合适的状态管理方案：

```
场景                     推荐方案
──────────────────────────────────────────────
简单组件交互               useState/useReducer
主题、用户偏好等全局状态     Context API
复杂业务逻辑               Zustand
大型企业级应用             Redux Toolkit
服务端数据缓存和同步       SWR/TanStack Query
表单处理                  React Hook Form
URL相关状态               useSearchParams
```

### 性能考虑

```
方案             包大小   学习曲线   性能   适用场景
──────────────────────────────────────────────────
useState         最小     最简单    最佳    组件内状态
Context         小       简单      中等    主题、用户偏好
Zustand         小       简单      良好    中等复杂度应用
Redux Toolkit   中等     中等      良好    大型复杂应用
SWR             小       简单      良好    数据获取
TanStack Query  中等     中等      良好    复杂数据场景
```

Next.js 的状态管理生态提供了丰富的选择，开发者可以根据应用规模、团队熟悉度和性能要求来选择最合适的方案，确保应用的可维护性和用户体验。