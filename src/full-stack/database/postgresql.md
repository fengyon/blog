# PostgreSQL

## 引言

PostgreSQL 是一款功能强大的开源关系型数据库，以其稳定性、扩展性和对 SQL 标准的严格遵循而闻名。Node.js 凭借其事件驱动和非阻塞 I/O 模型，成为构建高性能网络应用的理想选择。两者结合能够为开发者提供强大的工具集，用于构建各种数据驱动的应用程序。在 Node.js 生态中，`pg` 库是连接和操作 PostgreSQL 数据库的主流选择。

## 安装与基础连接

### 安装 pg 模块

使用 npm 命令安装 `pg` 模块：

```bash
npm install pg
```

### 建立数据库连接

`pg` 提供了两种连接数据库的方式：直接客户端连接和连接池。

**单客户端连接示例：**

```javascript
const { Client } = require('pg')

const client = new Client({
  user: 'your_user',
  host: 'localhost',
  database: 'your_database',
  password: 'your_password',
  port: 5432,
})

client
  .connect()
  .then(() => console.log('成功连接到数据库'))
  .catch((err) => console.error('连接失败', err))
```

**连接池配置示例：**

```javascript
const { Pool } = require('pg')

const pool = new Pool({
  user: 'your_user',
  host: 'localhost',
  database: 'your_database',
  password: 'your_password',
  port: 5432,
  max: 20, // 连接池最大连接数
  idleTimeoutMillis: 30000, // 连接空闲超时时间(30秒)
  connectionTimeoutMillis: 2000, // 连接超时时间(2秒)
})
```

连接池通过复用数据库连接显著提升性能，特别是在高并发环境下。它预先建立一定数量的数据库连接，当应用需要时快速分配，使用完毕后回收而非销毁，减少了频繁建立连接的开销。

## 连接池的深入解析

### 连接池的核心价值

数据库连接是昂贵的资源，每次建立新连接都需要经历 TCP 三次握手、SSL/TLS 协商、PostgreSQL 认证等过程。连接池通过以下机制解决性能问题：

- **连接复用**：避免频繁创建和销毁连接，提升响应速度
- **资源控制**：防止连接数过度增长导致数据库资源耗尽
- **健康检查**：自动检测并移除不健康的连接

### 连接池配置参数详解

| 参数名                  | 默认值   | 说明                   | 推荐值           |
| ----------------------- | -------- | ---------------------- | ---------------- |
| max                     | 10       | 连接池最大连接数       | 根据并发需求调整 |
| min                     | 0        | 连接池最小保持连接数   | 生产环境设置 1-2 |
| idleTimeoutMillis       | 10000    | 空闲连接超时时间(毫秒) | 30000-60000      |
| connectionTimeoutMillis | 0        | 连接建立超时时间(毫秒) | 2000-5000        |
| maxUses                 | Infinity | 单个连接最大使用次数   | 1000-10000       |
| maxLifetimeSeconds      | 0        | 连接最大生命周期(秒)   | 1800-3600        |

**配置示例：**

```javascript
const pool = new Pool({
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  maxUses: 1000, // 预防连接老化
  maxLifetimeSeconds: 1800, // 30分钟连接生命周期
})
```

## 执行 SQL 查询

### 基础查询操作

`pg` 模块使用 `query` 方法执行 SQL 语句，支持回调和 Promise 两种风格。

**查询示例：**

```javascript
// 使用 Promise
const getUsers = async () => {
  try {
    const res = await pool.query('SELECT * FROM users WHERE status = $1', [
      'active',
    ])
    return res.rows
  } catch (err) {
    console.error('查询失败', err)
    throw err
  }
}

// 使用回调
pool.query('SELECT * FROM users', (err, res) => {
  if (err) throw err
  console.log(res.rows)
})
```

### 参数化查询

参数化查询不仅能防止 SQL 注入攻击，还能提升查询性能：

```javascript
const insertUser = async (username, email) => {
  const query =
    'INSERT INTO users (username, email) VALUES ($1, $2) RETURNING *'
  const values = [username, email]

  const res = await pool.query(query, values)
  return res.rows[0]
}
```

## CRUD 操作实践

### 数据查询

```javascript
// 条件查询
const getUserById = async (id) => {
  const res = await pool.query('SELECT * FROM users WHERE id = $1', [id])
  return res.rows[0]
}

// 分页查询
const getUsersPaginated = async (limit, offset) => {
  const res = await pool.query(
    'SELECT * FROM users ORDER BY id LIMIT $1 OFFSET $2',
    [limit, offset]
  )
  return res.rows
}
```

### 数据插入

```javascript
const createProduct = async (name, price, category) => {
  const query = `
    INSERT INTO products (name, price, category) 
    VALUES ($1, $2, $3) 
    RETURNING *
  `
  const values = [name, price, category]

  const res = await pool.query(query, values)
  return res.rows[0]
}
```

### 数据更新与删除

```javascript
// 更新数据
const updateUserEmail = async (id, newEmail) => {
  const query = 'UPDATE users SET email = $1 WHERE id = $2 RETURNING *'
  const res = await pool.query(query, [newEmail, id])
  return res.rows[0]
}

// 删除数据
const deleteUser = async (id) => {
  await pool.query('DELETE FROM users WHERE id = $1', [id])
}
```

## 事务管理

### 手动事务控制

```javascript
const transferMoney = async (fromId, toId, amount) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // 扣除发送方余额
    await client.query(
      'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
      [amount, fromId]
    )

    // 增加接收方余额
    await client.query(
      'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
      [amount, toId]
    )

    await client.query('COMMIT')
    return { success: true }
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('转账失败', err)
    throw err
  } finally {
    client.release()
  }
}
```

### 使用事务管道

对于复杂的多语句事务，可以使用更简洁的事务管道写法：

```javascript
const result = await sql.begin(async (sql) => {
  const results = []
  results.push(await sql`INSERT INTO table1 ...`)
  results.push(await sql`INSERT INTO table2 ...`)
  return results
})
```

**重要注意事项：**

- 在事务回调函数中必须使用事务上下文对象 (t) 执行 SQL，而非全局 db 对象
- 始终处理可能出现的异常情况，确保事务正确提交或回滚

## 高级特性

### 流式处理

对于大型数据集，可以使用流式处理来避免内存溢出：

```javascript
const { Query } = require('pg')

const processLargeDataset = async () => {
  const client = await pool.connect()
  const query = new Query('SELECT * FROM large_table')

  query.on('row', (row) => {
    // 处理每一行数据
    console.log('Row:', row)
  })

  query.on('end', () => {
    console.log('查询处理完毕')
    client.release()
  })

  query.on('error', (err) => {
    console.error('查询出错:', err)
    client.release()
  })

  client.query(query)
}
```

### 连接池事件监听

通过事件监听可以实时监控连接池状态：

```javascript
pool.on('connect', (client) => {
  console.log('新客户端连接')
})

pool.on('acquire', (client) => {
  console.log('客户端从池中获取')
})

pool.on('remove', (client) => {
  console.log('客户端从池中移除')
})

pool.on('error', (err, client) => {
  console.error('空闲客户端错误', err)
})
```

## 性能优化与最佳实践

### 连接池优化策略

根据应用负载动态调整连接池参数：

```javascript
const poolConfig = {
  max: process.env.NODE_ENV === 'production' ? 50 : 10,
  min: process.env.NODE_ENV === 'production' ? 5 : 0,
  idleTimeoutMillis: process.env.NODE_ENV === 'production' ? 60000 : 10000,
  connectionTimeoutMillis: 2000,
  maxUses: 1000, // 预防连接泄漏
}
```

### 错误处理机制

实现完善的错误处理和重试逻辑：

```javascript
const queryWithRetry = async (queryText, params, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await pool.query(queryText, params)
      return result
    } catch (err) {
      if (i === retries - 1) throw err

      // 判断错误是否可重试
      if (isRetryableError(err)) {
        await sleep(100 * Math.pow(2, i)) // 指数退避
        continue
      }
      throw err
    }
  }
}
```

### 安全注意事项

- **使用参数化查询**：始终使用参数化查询来防止 SQL 注入攻击
- **凭据管理**：不要将数据库凭据硬编码在代码中，使用环境变量或配置管理系统
- **连接加密**：生产环境中使用 SSL/TLS 加密数据库连接

## 故障排除

### 常见问题与解决方案

**连接泄漏**：确保在使用后始终释放连接回连接池
**连接超时**：适当调整 `idleTimeoutMillis` 和 `connectionTimeoutMillis` 参数
**连接池耗尽**：检查是否有未释放的连接，或考虑增加 `max` 参数值

### 网络中断处理

在网络不稳定的环境中，需要特别处理连接池的网络中断问题：

```javascript
const options = {
  error(e, ctx) {
    if ('client' in ctx && e.message == 'Query read timeout') {
      ctx.client.end() // 强制终止失效连接
    }
  },
}
```
