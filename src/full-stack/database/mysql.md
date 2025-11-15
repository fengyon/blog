# MySQL

## 基础概念

MySQL 是一个广泛使用的关系型数据库管理系统，在 Node.js 环境中通过与 MySQL 数据库交互，可以构建高效、可扩展的 Web 应用程序。Node.js 是单线程事件驱动的非阻塞 I/O 模型，适合处理高并发请求，与 MySQL 结合使用时，其异步特性使得数据库操作不会阻塞其他操作，提高了应用程序的响应速度。

**Node.js 与 MySQL 交互基本原理：**

```
Node.js应用 → MySQL驱动 → 数据库连接 → MySQL服务器
     ↓              ↓           ↓          ↓
 业务逻辑处理    mysql/mysql2  连接池管理  数据存储
               模块封装      连接建立   查询执行
```

## 安装与配置

### 驱动选择与安装

Node.js 主要支持两种 MySQL 驱动：

- **mysql**：纯 JavaScript 实现的 MySQL 客户端
- **mysql2**：基于 mysql 库的改进版本，提供了更好的性能和一些额外的功能

使用 npm 进行安装：

```bash
# 安装 mysql 模块
npm install mysql

# 或安装 mysql2 模块
npm install mysql2
```

### 数据库连接配置

建立与 MySQL 数据库的连接需要配置连接参数：

```javascript
const mysql = require('mysql')

// 创建连接配置
const connection = mysql.createConnection({
  host: 'localhost', // 数据库主机名
  user: 'your_username', // 数据库用户名
  password: 'your_password', // 数据库密码
  database: 'your_database', // 数据库名称
  port: 3306, // 端口号，默认3306
  charset: 'utf8mb4', // 字符编码
})
```

## 连接管理

### 基本连接操作

```javascript
// 连接到数据库
connection.connect((err) => {
  if (err) {
    console.error('连接失败:', err.stack)
    return
  }
  console.log('Connected to MySQL database as id ' + connection.threadId)
})

// 关闭连接
connection.end((err) => {
  if (err) {
    console.error('关闭连接时出错:', err)
    return
  }
  console.log('数据库连接已关闭')
})
```

### 连接池管理

在高并发场景中，使用连接池可以显著提高性能：

```javascript
const mysql = require('mysql')

// 创建连接池
const pool = mysql.createPool({
  connectionLimit: 10, // 连接池最大连接数
  host: 'localhost',
  user: 'your_username',
  password: 'your_password',
  database: 'your_database',
  acquireTimeout: 10000, // 获取连接的超时时间(毫秒)
  timeout: 60000, // 连接超时时间
  reconnect: true, // 自动重新连接
})

// 从连接池获取连接
pool.getConnection((err, connection) => {
  if (err) {
    console.error('获取连接失败:', err)
    return
  }

  // 使用连接执行查询
  connection.query('SELECT * FROM users', (queryErr, results) => {
    // 释放连接回连接池
    connection.release()

    if (queryErr) {
      console.error('查询失败:', queryErr)
      return
    }
    console.log('查询结果:', results)
  })
})
```

**连接池工作流程：**

```
应用程序 → 请求连接 → 连接池 → 分配空闲连接
   ↓                              ↓
使用完毕 → 释放连接 → 回收到连接池 → 供其他请求使用
```

## 核心 API 与操作

### 查询操作

#### 基本查询

```javascript
// 简单查询
connection.query('SELECT * FROM users', (err, results, fields) => {
  if (err) throw err
  console.log('查询结果:', results)
  console.log('字段信息:', fields)
})

// 条件查询
const userId = 1
connection.query(
  'SELECT * FROM users WHERE id = ?',
  [userId],
  (err, results) => {
    if (err) throw err
    console.log('用户信息:', results[0])
  }
)

// 多条件查询
const userData = ['John', 25]
connection.query(
  'SELECT * FROM users WHERE name = ? AND age > ?',
  userData,
  (err, results) => {
    if (err) throw err
    console.log('查询结果:', results)
  }
)
```

#### 插入操作

```javascript
// 单条插入
const newUser = { name: 'John Doe', email: 'john@example.com', age: 30 }
connection.query('INSERT INTO users SET ?', newUser, (err, result) => {
  if (err) throw err
  console.log('插入成功，ID:', result.insertId)
})

// 批量插入
const users = [
  ['Alice', 'alice@example.com', 25],
  ['Bob', 'bob@example.com', 28],
  ['Charlie', 'charlie@example.com', 32],
]
connection.query(
  'INSERT INTO users (name, email, age) VALUES ?',
  [users],
  (err, result) => {
    if (err) throw err
    console.log('批量插入成功，影响行数:', result.affectedRows)
  }
)
```

#### 更新与删除操作

```javascript
// 更新操作
const updateData = ['john.doe@example.com', 1]
connection.query(
  'UPDATE users SET email = ? WHERE id = ?',
  updateData,
  (err, result) => {
    if (err) throw err
    console.log('更新成功，影响行数:', result.affectedRows)
  }
)

// 删除操作
connection.query('DELETE FROM users WHERE id = ?', [1], (err, result) => {
  if (err) throw err
  console.log('删除成功，影响行数:', result.affectedRows)
})
```

### 事务处理

```javascript
// 手动事务处理
connection.beginTransaction((err) => {
  if (err) throw err

  // 执行第一个操作
  connection.query(
    'UPDATE accounts SET balance = balance - 100 WHERE id = 1',
    (err1) => {
      if (err1) {
        return connection.rollback(() => {
          throw err1
        })
      }

      // 执行第二个操作
      connection.query(
        'UPDATE accounts SET balance = balance + 100 WHERE id = 2',
        (err2) => {
          if (err2) {
            return connection.rollback(() => {
              throw err2
            })
          }

          // 提交事务
          connection.commit((err3) => {
            if (err3) {
              return connection.rollback(() => {
                throw err3
              })
            }
            console.log('事务执行成功')
          })
        }
      )
    }
  )
})
```

## 高级特性

### Promise 包装与 async/await

使用 mysql2 模块支持 Promise：

```javascript
const mysql = require('mysql2/promise')

async function databaseOperations() {
  let connection
  try {
    // 建立连接
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'your_username',
      password: 'your_password',
      database: 'your_database',
    })

    // 执行查询
    const [rows, fields] = await connection.execute(
      'SELECT * FROM users WHERE age > ?',
      [18]
    )
    console.log('成年用户:', rows)

    // 插入数据
    const [result] = await connection.execute(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      ['David', 'david@example.com']
    )
    console.log('插入ID:', result.insertId)
  } catch (err) {
    console.error('数据库操作失败:', err)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

databaseOperations()
```

### 流式查询

处理大量数据时使用流式查询：

```javascript
const query = connection.query('SELECT * FROM large_table')

query
  .on('error', (err) => {
    console.error('查询错误:', err)
  })
  .on('fields', (fields) => {
    console.log('字段信息:', fields)
  })
  .on('result', (row) => {
    // 逐行处理数据
    console.log('行数据:', row)

    // 可以暂停和恢复流
    connection.pause()

    // 模拟异步处理
    processRow(row, () => {
      connection.resume()
    })
  })
  .on('end', () => {
    console.log('查询完成')
  })

function processRow(row, callback) {
  // 处理行数据
  setTimeout(callback, 100)
}
```

## 性能优化

### 连接池优化配置

```javascript
const pool = mysql.createPool({
  connectionLimit: 20, // 最大连接数
  acquireTimeout: 30000, // 获取连接超时时间
  timeout: 60000, // 连接超时时间
  reconnect: true, // 自动重连
  queueLimit: 100, // 排队等待连接的最大请求数
  waitForConnections: true, // 无可用连接时等待
  host: 'localhost',
  user: 'your_username',
  password: 'your_password',
  database: 'your_database',
})

// 监控连接池状态
pool.on('acquire', (connection) => {
  console.log('连接 %d 被获取', connection.threadId)
})

pool.on('release', (connection) => {
  console.log('连接 %d 被释放', connection.threadId)
})

pool.on('enqueue', () => {
  console.log('等待可用连接...')
})
```

### 查询优化技巧

1. **使用参数化查询防止 SQL 注入**

```javascript
// 正确的做法 - 参数化查询
connection.query('SELECT * FROM users WHERE id = ?', [userId])

// 错误的做法 - 字符串拼接（存在SQL注入风险）
connection.query(`SELECT * FROM users WHERE id = ${userId}`)
```

2. **合理使用连接超时和重连机制**

```javascript
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'your_username',
  password: 'your_password',
  database: 'your_database',
  connectTimeout: 10000, // 连接超时
  timeout: 60000, // 查询超时
  reconnect: true, // 自动重连
  retry: {
    // 重试配置
    times: 5, // 重试次数
    interval: (retryCount) => Math.min(retryCount * 1000, 5000), // 重试间隔
  },
})
```

## 错误处理与调试

### 系统化错误处理

```javascript
// 连接错误处理
connection.on('error', (err) => {
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('数据库连接被关闭')
  } else if (err.code === 'ER_CON_COUNT_ERROR') {
    console.error('数据库连接过多')
  } else if (err.code === 'ECONNREFUSED') {
    console.error('数据库连接被拒绝')
  } else {
    console.error('未预期的数据库错误:', err)
  }
})

// 查询错误处理
function executeQuery(sql, params) {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, results) => {
      if (err) {
        console.error('SQL错误:', err.sqlMessage)
        console.error('SQL语句:', err.sql)
        reject(err)
      } else {
        resolve(results)
      }
    })
  })
}

// 使用示例
async function safeQuery() {
  try {
    const results = await executeQuery('SELECT * FROM users WHERE id = ?', [1])
    return results
  } catch (err) {
    // 根据错误类型进行相应处理
    if (err.code === 'ER_NO_SUCH_TABLE') {
      console.error('表不存在')
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('访问被拒绝')
    }
    throw err
  }
}
```

### 调试与日志记录

```javascript
// 启用详细日志
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'your_username',
  password: 'your_password',
  database: 'your_database',
  debug: true, // 启用详细调试信息
})

// 自定义查询日志
function loggedQuery(sql, params) {
  const startTime = Date.now()
  console.log(`执行SQL: ${sql}`, params)

  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, results) => {
      const duration = Date.now() - startTime
      if (err) {
        console.error(`SQL执行失败 (${duration}ms):`, err)
        reject(err)
      } else {
        console.log(
          `SQL执行成功 (${duration}ms)，影响行数:`,
          results.affectedRows
        )
        resolve(results)
      }
    })
  })
}
```

## 实际应用模式

### Web 应用集成示例

```javascript
const express = require('express')
const mysql = require('mysql2/promise')
const app = express()

// 创建连接池
const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'your_username',
  password: 'your_password',
  database: 'your_database',
})

// 用户API路由
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email FROM users LIMIT 100'
    )
    res.json(rows)
  } catch (err) {
    console.error('获取用户列表失败:', err)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

app.get('/api/users/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email FROM users WHERE id = ?',
      [req.params.id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' })
    }

    res.json(rows[0])
  } catch (err) {
    console.error('获取用户详情失败:', err)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

// 启动服务器
app.listen(3000, () => {
  console.log('服务器运行在端口 3000')
})
```

### 数据访问层封装

```javascript
class UserRepository {
  constructor(pool) {
    this.pool = pool
  }

  async findAll() {
    const [rows] = await this.pool.execute(
      'SELECT id, name, email, created_at FROM users'
    )
    return rows
  }

  async findById(id) {
    const [rows] = await this.pool.execute(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [id]
    )
    return rows[0] || null
  }

  async create(user) {
    const { name, email } = user
    const [result] = await this.pool.execute(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      [name, email]
    )
    return { id: result.insertId, name, email }
  }

  async update(id, user) {
    const { name, email } = user
    const [result] = await this.pool.execute(
      'UPDATE users SET name = ?, email = ? WHERE id = ?',
      [name, email, id]
    )
    return result.affectedRows > 0
  }

  async delete(id) {
    const [result] = await this.pool.execute('DELETE FROM users WHERE id = ?', [
      id,
    ])
    return result.affectedRows > 0
  }
}

// 使用示例
const userRepo = new UserRepository(pool)

async function userOperations() {
  // 创建用户
  const newUser = await userRepo.create({
    name: 'John Smith',
    email: 'john.smith@example.com',
  })

  // 查询用户
  const users = await userRepo.findAll()
  console.log('所有用户:', users)
}
```
