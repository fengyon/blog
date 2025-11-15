# MongoDB

## 核心概念与架构设计

MongoDB 是一个基于分布式文件存储的 **NoSQL 数据库**，采用文档型数据模型，为现代应用开发提供了灵活的数据处理方案。其数据组织层次结构为：

```
数据库 → 集合 → 文档
  ↓        ↓       ↓
Database Collection Document
```

与传统的关系型数据库相比，MongoDB 的核心区别在于：

- **无固定模式**：同一集合内的文档可以拥有不同的字段结构
- **文档格式**：使用 BSON (二进制 JSON) 格式存储数据，支持更丰富的数据类型
- **数据关系**：通过嵌入式文档和数组处理一对多关系，减少联表查询

## 主要特性

### 灵活的文档模型

MongoDB 的文档模型允许动态添加字段，无需预定义表结构。例如：

```javascript
// 同一集合中可以插入结构不同的文档
db.users.insertOne({ name: 'Alice', age: 28 })
db.users.insertOne({
  name: 'Bob',
  hobbies: ['coding', 'gaming'],
  address: { city: 'NY', zip: '10001' },
})
```

这种灵活性特别适合需求频繁变更的敏捷开发场景，相比传统关系型数据库的 ALTER TABLE 操作，修改成本显著降低。

### 高性能与水平扩展

MongoDB 通过**分片集群**实现线性扩展，架构包含：

```
客户端 → Mongos路由 → 配置服务器 → 分片节点
            ↓               ↓           ↓
       查询路由        元数据存储    实际数据存储
```

实测数据显示，在 3 节点分片集群下，写入吞吐量可达单节点的 2.8 倍。某电商平台在促销期间，通过增加分片节点将订单处理延迟从 120ms 降至 35ms。

### 高可用性与冗余备份

MongoDB 支持**副本集**机制，提供自动故障转移：

```
主节点(Primary) ← 复制 → 从节点(Secondary)
      ↓
   仲裁节点(Arbiter)
```

当主节点不可用时，系统会自动选举新的主节点，确保服务连续性。

### 丰富的查询与索引功能

MongoDB 提供完整的 CRUD 操作和强大的查询能力，支持多种索引类型：

- **单键索引**、**复合索引**、**多键索引**
- **文本索引**、**地理空间索引**
- **哈希索引**、**TTL 索引**

## Node.js 环境集成

### 安装与连接配置

首先安装 MongoDB Node.js 驱动程序：

```bash
npm install mongodb
```

建立数据库连接：

```javascript
const { MongoClient } = require('mongodb')

// 连接字符串
const uri = 'mongodb://localhost:27017' // 本地连接
// 或 MongoDB Atlas 连接
// const uri = "mongodb+srv://<username>:<password>@cluster0.xzy.mongodb.net/?retryWrites=true&w=majority";

async function connectToDatabase() {
  const client = new MongoClient(uri)

  try {
    await client.connect()
    console.log('成功连接到 MongoDB')
    return client
  } catch (error) {
    console.error('连接失败:', error)
    throw error
  }
}
```

### 连接池管理

对于生产环境，建议使用连接池优化性能：

```javascript
const { MongoClient } = require('mongodb')

const client = new MongoClient(uri, {
  poolSize: 10, // 连接池大小
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

// 获取数据库和集合实例
const database = client.db('myDatabase')
const collection = database.collection('myCollection')
```

## 常用 API 与操作示例

### 数据库与集合管理

```javascript
// 访问数据库
const database = client.db('test_database')

// 访问集合
const collection = database.collection('test_collection')

// 显式创建集合
const createColl = await database.createCollection('example_collection', {
  validator: {
    $jsonSchema: {
      /* 模式验证规则 */
    },
  },
})

// 获取集合列表
const colls = database.listCollections()
for await (const doc of colls) {
  console.log(doc.name)
}

// 删除集合
await collection.drop()
```

### 文档创建操作

```javascript
// 插入单个文档
const insertResult = await collection.insertOne({
  name: '张三',
  age: 25,
  email: 'zhang@example.com',
  created_at: new Date(),
})
console.log('插入文档 ID:', insertResult.insertedId)

// 插入多个文档
const users = [
  { name: '李四', age: 30, city: '北京' },
  { name: '王五', age: 28, city: '上海', hobbies: ['阅读', '游泳'] },
  {
    name: '赵六',
    age: 35,
    city: '广州',
    address: { street: '天河路', number: 123 },
  },
]
const insertManyResult = await collection.insertMany(users)
console.log('插入文档数量:', insertManyResult.insertedCount)
```

### 文档查询操作

```javascript
// 查询所有文档
const allUsers = await collection.find({}).toArray()

// 条件查询
const user = await collection.findOne({ name: '张三' })
const adults = await collection.find({ age: { $gte: 18 } }).toArray()

// 复杂条件查询
const complexQuery = await collection
  .find({
    $and: [
      { age: { $gt: 25, $lt: 40 } },
      { $or: [{ city: '北京' }, { city: '上海' }] },
    ],
  })
  .toArray()

// 投影查询（指定返回字段）
const namesOnly = await collection
  .find({ age: { $gt: 25 } }, { projection: { name: 1, city: 1, _id: 0 } })
  .toArray()

// 排序、限制和跳过
const sortedUsers = await collection
  .find({})
  .sort({ age: -1 }) // 按年龄降序
  .limit(10) // 限制返回10条
  .skip(5) // 跳过前5条
  .toArray()
```

### 文档更新操作

```javascript
// 更新单个文档
const updateResult = await collection.updateOne(
  { name: '张三' },
  { $set: { age: 26, updated_at: new Date() } }
)
console.log('匹配文档数:', updateResult.matchedCount)
console.log('修改文档数:', updateResult.modifiedCount)

// 更新多个文档
const updateManyResult = await collection.updateMany(
  { city: '北京' },
  { $set: { region: '华北' } }
)

// 使用更新操作符
await collection.updateOne(
  { name: '李四' },
  {
    $inc: { age: 1 }, // 年龄加1
    $push: { hobbies: '跑步' }, // 向数组添加元素
    $set: { last_modified: new Date() },
  }
)

// 替换文档
const replaceResult = await collection.replaceOne(
  { name: '王五' },
  {
    full_name: '王五',
    location: '上海',
    metadata: { source: 'migration', version: 2 },
  }
)
```

### 文档删除操作

```javascript
// 删除单个文档
const deleteResult = await collection.deleteOne({ name: '赵六' })
console.log('删除文档数量:', deleteResult.deletedCount)

// 删除多个文档
const deleteManyResult = await collection.deleteMany({
  age: { $lt: 18 },
})

// 清空集合（谨慎使用）
// await collection.deleteMany({});
```

### 聚合框架

MongoDB 的聚合管道提供强大的数据分析能力：

```javascript
// 计算每个城市的用户平均年龄
const aggregationResult = await collection
  .aggregate([
    { $match: { status: 'active' } }, // 筛选条件
    {
      $group: {
        _id: '$city',
        avgAge: { $avg: '$age' },
        count: { $sum: 1 },
        names: { $push: '$name' },
      },
    },
    { $sort: { count: -1 } }, // 按计数降序
    { $limit: 10 }, // 只返回前10个结果
  ])
  .toArray()

// 多阶段聚合示例：用户统计报告
const userStats = await collection
  .aggregate([
    {
      $project: {
        name: 1,
        age: 1,
        city: 1,
        isAdult: { $gte: ['$age', 18] },
        yearGroup: {
          $switch: {
            branches: [
              { case: { $lt: ['$age', 20] }, then: '10-19' },
              { case: { $lt: ['$age', 30] }, then: '20-29' },
              { case: { $lt: ['$age', 40] }, then: '30-39' },
            ],
            default: '40+',
          },
        },
      },
    },
    {
      $group: {
        _id: '$city',
        totalUsers: { $sum: 1 },
        adults: { $sum: { $cond: ['$isAdult', 1, 0] } },
        ageGroups: { $push: '$yearGroup' },
      },
    },
  ])
  .toArray()
```

## 高级功能与最佳实践

### 索引优化

```javascript
// 创建索引
await collection.createIndex({ name: 1 }) // 单键索引
await collection.createIndex({ city: 1, age: -1 }) // 复合索引
await collection.createIndex({ email: 1 }, { unique: true }) // 唯一索引

// 文本搜索索引
await collection.createIndex({ description: 'text' })
const textResults = await collection
  .find({ $text: { $search: '咖啡 书店' } })
  .toArray()

// 地理空间查询
await collection.createIndex({ location: '2dsphere' })
const nearbyPlaces = await collection
  .find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [-73.9667, 40.78],
        },
        $maxDistance: 5000,
      },
    },
  })
  .toArray()
```

### 错误处理与事务支持

```javascript
async function transferFunds(fromId, toId, amount) {
  const session = client.startSession()

  try {
    session.startTransaction()

    // 执行转账操作
    await collection.updateOne(
      { _id: fromId, balance: { $gte: amount } },
      { $inc: { balance: -amount } },
      { session }
    )

    await collection.updateOne(
      { _id: toId },
      { $inc: { balance: amount } },
      { session }
    )

    await session.commitTransaction()
    console.log('转账成功')
  } catch (error) {
    await session.abortTransaction()
    console.error('转账失败:', error)
    throw error
  } finally {
    session.endSession()
  }
}
```

### 性能监控与调试

```javascript
// 查询性能分析
const cursor = collection.find({ city: '北京' }).explain('executionStats')
console.log('查询计划:', cursor)

// 监控集合统计信息
const stats = await collection.stats()
console.log('文档数量:', stats.count)
console.log('集合大小:', stats.size)
console.log('平均文档大小:', stats.avgObjSize)

// 使用投影优化查询性能
const efficientQuery = await collection
  .find(
    { age: { $gt: 25 } },
    {
      projection: { name: 1, city: 1, _id: 0 },
      hint: { age: 1 }, // 强制使用索引
    }
  )
  .toArray()
```

## 实际应用模式

### Web 应用集成

```javascript
const express = require('express')
const { MongoClient } = require('mongodb')
const app = express()

// 中间件：数据库连接
app.use(async (req, res, next) => {
  try {
    req.db = await getDatabaseConnection()
    next()
  } catch (error) {
    res.status(500).json({ error: '数据库连接失败' })
  }
})

// RESTful API 示例
app.get('/api/users', async (req, res) => {
  const { city, minAge, page = 1, limit = 10 } = req.query

  const query = {}
  if (city) query.city = city
  if (minAge) query.age = { $gte: parseInt(minAge) }

  try {
    const users = await req.db
      .collection('users')
      .find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .project({ password: 0 }) // 排除敏感字段
      .toArray()

    const total = await req.db.collection('users').countDocuments(query)

    res.json({
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.listen(3000, () => {
  console.log('服务器运行在端口 3000')
})
```

### 数据访问层封装

```javascript
class MongoDBRepository {
  constructor(collectionName) {
    this.collectionName = collectionName
    this.collection = null
  }

  async init(db) {
    this.collection = db.collection(this.collectionName)
  }

  async create(document) {
    document.created_at = new Date()
    document.updated_at = new Date()

    const result = await this.collection.insertOne(document)
    return { ...document, _id: result.insertedId }
  }

  async findById(id) {
    return await this.collection.findOne({ _id: id })
  }

  async update(id, updates) {
    updates.updated_at = new Date()

    const result = await this.collection.updateOne(
      { _id: id },
      { $set: updates }
    )

    return result.modifiedCount > 0
  }

  async delete(id) {
    const result = await this.collection.deleteOne({ _id: id })
    return result.deletedCount > 0
  }
}

// 使用示例
const userRepo = new MongoDBRepository('users')
await userRepo.init(database)
```
