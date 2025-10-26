# React TSX

## 什么是 TSX？

TSX 是 TypeScript 与 JSX 的结合，它允许我们在 TypeScript 文件中编写类似 HTML 的语法来创建 React 组件。

### TSX 的优势

- **类型安全**：编译时类型检查，减少运行时错误
- **更好的开发体验**：智能提示、自动补全和重构支持
- **代码可维护性**：明确的接口定义，便于团队协作

## 定义组件 Props 类型

### 1. 使用接口定义 Props

```tsx
interface ButtonProps {
  text: string
  onClick: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'small' | 'medium' | 'large'
}

const Button: React.FC<ButtonProps> = ({
  text,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'medium',
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      onClick={onClick}
      disabled={disabled}
    >
      {text}
    </button>
  )
}
```

### 2. 使用类型别名定义 Props

```tsx
type CardProps = {
  title: string
  children: React.ReactNode
  imageUrl?: string
  footer?: React.ReactElement
  className?: string
}

const Card: React.FC<CardProps> = ({
  title,
  children,
  imageUrl,
  footer,
  className = '',
}) => {
  return (
    <div className={`card ${className}`}>
      {imageUrl && <img src={imageUrl} alt={title} />}
      <div className="card-content">
        <h3>{title}</h3>
        {children}
      </div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  )
}
```

### 3. 扩展 HTML 属性

```tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  ...inputProps
}) => {
  return (
    <div className="input-wrapper">
      {label && <label htmlFor={inputProps.id}>{label}</label>}
      <input
        {...inputProps}
        className={`input ${error ? 'input-error' : ''} ${
          inputProps.className || ''
        }`}
      />
      {error && <span className="error-text">{error}</span>}
      {helperText && !error && (
        <span className="helper-text">{helperText}</span>
      )}
    </div>
  )
}
```

## 定义 Ref 类型

### 1. 使用 useRef Hook

```tsx
import React, { useRef, useEffect } from 'react'

// 对于 DOM 元素
const FocusableInput: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // 自动聚焦
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.select()
    }
  }

  return (
    <div>
      <input ref={inputRef} type="text" placeholder="点击按钮选中我" />
      <button onClick={handleClick}>选中输入框文本</button>
    </div>
  )
}

// 对于自定义值（不会触发重新渲染）
const TimerComponent: React.FC = () => {
  const timerRef = useRef<number | null>(null)
  const countRef = useRef<number>(0)

  const startTimer = () => {
    timerRef.current = window.setInterval(() => {
      countRef.current += 1
      console.log(`计数: ${countRef.current}`)
    }, 1000)
  }

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  return (
    <div>
      <button onClick={startTimer}>开始计时</button>
      <button onClick={stopTimer}>停止计时</button>
    </div>
  )
}
```

### 2. 使用 forwardRef

```tsx
import React, { forwardRef, useImperativeHandle } from 'react'

// 自定义 ref 接口
interface CustomInputRef {
  focus: () => void
  clear: () => void
  getValue: () => string
}

interface CustomInputProps {
  placeholder?: string
  defaultValue?: string
}

const CustomInput = forwardRef<CustomInputRef, CustomInputProps>(
  ({ placeholder = '请输入...', defaultValue = '' }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null)

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus()
      },
      clear: () => {
        if (inputRef.current) {
          inputRef.current.value = ''
        }
      },
      getValue: () => {
        return inputRef.current?.value || ''
      },
    }))

    return (
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        defaultValue={defaultValue}
      />
    )
  },
)

// 使用组件
const ParentComponent: React.FC = () => {
  const inputRef = useRef<CustomInputRef>(null)

  const handleFocus = () => {
    inputRef.current?.focus()
  }

  const handleClear = () => {
    inputRef.current?.clear()
  }

  const handleGetValue = () => {
    const value = inputRef.current?.getValue()
    console.log('输入框值:', value)
  }

  return (
    <div>
      <CustomInput ref={inputRef} placeholder="自定义输入框" />
      <button onClick={handleFocus}>聚焦</button>
      <button onClick={handleClear}>清空</button>
      <button onClick={handleGetValue}>获取值</button>
    </div>
  )
}
```

## 定义 Hook 类型

### 1. 自定义 Hook 类型定义

```tsx
import { useState, useEffect, useCallback } from 'react'

// 计数器 Hook
interface UseCounterReturn {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
  setCount: (value: number) => void
}

const useCounter = (initialValue: number = 0): UseCounterReturn => {
  const [count, setCount] = useState<number>(initialValue)

  const increment = useCallback(() => {
    setCount((prev) => prev + 1)
  }, [])

  const decrement = useCallback(() => {
    setCount((prev) => prev - 1)
  }, [])

  const reset = useCallback(() => {
    setCount(initialValue)
  }, [initialValue])

  return {
    count,
    increment,
    decrement,
    reset,
    setCount,
  }
}

// 使用示例
const CounterComponent: React.FC = () => {
  const { count, increment, decrement, reset } = useCounter(0)

  return (
    <div>
      <p>当前计数: {count}</p>
      <button onClick={increment}>+1</button>
      <button onClick={decrement}>-1</button>
      <button onClick={reset}>重置</button>
    </div>
  )
}
```

### 2. API 请求 Hook

```tsx
import { useState, useEffect } from 'react'

// 通用 API 响应类型
interface ApiResponse<T> {
  data: T | null
  loading: boolean
  error: string | null
}

const useApi = <T,>(url: string): ApiResponse<T> => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = (await response.json()) as T
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [url])

  return { data, loading, error }
}

// 使用示例
interface User {
  id: number
  name: string
  email: string
}

const UserList: React.FC = () => {
  const { data: users, loading, error } = useApi<User[]>('/api/users')

  if (loading) return <div>加载中...</div>
  if (error) return <div>错误: {error}</div>

  return (
    <div>
      <h2>用户列表</h2>
      {users?.map((user) => (
        <div key={user.id}>
          <h3>{user.name}</h3>
          <p>{user.email}</p>
        </div>
      ))}
    </div>
  )
}
```

### 3. 表单处理 Hook

```tsx
import { useState, useCallback } from 'react'

// 表单字段验证规则
interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  validator?: (value: string) => boolean
}

interface FormField<T> {
  value: T
  error: string | null
  touched: boolean
}

interface UseFormReturn<T> {
  fields: { [K in keyof T]: FormField<T[K]> }
  setFieldValue: <K extends keyof T>(name: K, value: T[K]) => void
  setFieldTouched: <K extends keyof T>(name: K, touched: boolean) => void
  validateField: <K extends keyof T>(name: K) => boolean
  validateForm: () => boolean
  resetForm: () => void
  isFormValid: boolean
}

const useForm = <T extends Record<string, any>>(
  initialValues: T,
  validations?: { [K in keyof T]?: ValidationRule },
): UseFormReturn<T> => {
  const [fields, setFields] = useState<{
    [K in keyof T]: FormField<T[K]>
  }>(() => {
    const initialFields = {} as { [K in keyof T]: FormField<T[K]> }
    Object.keys(initialValues).forEach((key) => {
      initialFields[key as keyof T] = {
        value: initialValues[key as keyof T],
        error: null,
        touched: false,
      }
    })
    return initialFields
  })

  const validateField = useCallback(
    <K extends keyof T>(name: K): boolean => {
      if (!validations?.[name]) return true

      const field = fields[name]
      const rules = validations[name]!
      let isValid = true
      let errorMessage: string | null = null

      if (rules.required && !field.value) {
        isValid = false
        errorMessage = '此字段为必填项'
      } else if (
        rules.minLength &&
        String(field.value).length < rules.minLength
      ) {
        isValid = false
        errorMessage = `最小长度为 ${rules.minLength} 个字符`
      } else if (
        rules.maxLength &&
        String(field.value).length > rules.maxLength
      ) {
        isValid = false
        errorMessage = `最大长度为 ${rules.maxLength} 个字符`
      } else if (
        rules.pattern &&
        !rules.pattern.test(String(field.value))
      ) {
        isValid = false
        errorMessage = '格式不正确'
      } else if (
        rules.validator &&
        !rules.validator(String(field.value))
      ) {
        isValid = false
        errorMessage = '验证失败'
      }

      setFields((prev) => ({
        ...prev,
        [name]: {
          ...prev[name],
          error: errorMessage,
        },
      }))

      return isValid
    },
    [fields, validations],
  )

  const setFieldValue = useCallback(
    <K extends keyof T>(name: K, value: T[K]) => {
      setFields((prev) => ({
        ...prev,
        [name]: {
          ...prev[name],
          value,
        },
      }))
    },
    [],
  )

  const setFieldTouched = useCallback(
    <K extends keyof T>(name: K, touched: boolean) => {
      setFields((prev) => ({
        ...prev,
        [name]: {
          ...prev[name],
          touched,
        },
      }))
    },
    [],
  )

  const validateForm = useCallback((): boolean => {
    if (!validations) return true

    let isValid = true
    Object.keys(validations).forEach((key) => {
      const fieldIsValid = validateField(key as keyof T)
      if (!fieldIsValid) {
        isValid = false
      }
    })

    return isValid
  }, [validations, validateField])

  const resetForm = useCallback(() => {
    setFields(() => {
      const resetFields = {} as { [K in keyof T]: FormField<T[K]> }
      Object.keys(initialValues).forEach((key) => {
        resetFields[key as keyof T] = {
          value: initialValues[key as keyof T],
          error: null,
          touched: false,
        }
      })
      return resetFields
    })
  }, [initialValues])

  const isFormValid = Object.values(fields).every((field) => !field.error)

  return {
    fields,
    setFieldValue,
    setFieldTouched,
    validateField,
    validateForm,
    resetForm,
    isFormValid,
  }
}

// 使用示例
interface LoginForm {
  email: string
  password: string
}

const LoginFormComponent: React.FC = () => {
  const {
    fields,
    setFieldValue,
    setFieldTouched,
    validateField,
    isFormValid,
  } = useForm<LoginForm>(
    {
      email: '',
      password: '',
    },
    {
      email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      },
      password: {
        required: true,
        minLength: 6,
      },
    },
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      console.log('表单提交:', {
        email: fields.email.value,
        password: fields.password.value,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>邮箱:</label>
        <input
          type="email"
          value={fields.email.value}
          onChange={(e) => setFieldValue('email', e.target.value)}
          onBlur={() => {
            setFieldTouched('email', true)
            validateField('email')
          }}
        />
        {fields.email.touched && fields.email.error && (
          <span style={{ color: 'red' }}>{fields.email.error}</span>
        )}
      </div>

      <div>
        <label>密码:</label>
        <input
          type="password"
          value={fields.password.value}
          onChange={(e) => setFieldValue('password', e.target.value)}
          onBlur={() => {
            setFieldTouched('password', true)
            validateField('password')
          }}
        />
        {fields.password.touched && fields.password.error && (
          <span style={{ color: 'red' }}>{fields.password.error}</span>
        )}
      </div>

      <button type="submit" disabled={!isFormValid}>
        登录
      </button>
    </form>
  )
}
```
