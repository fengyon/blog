# Redis

## 引言

Redis (Remote Dictionary Server) 是一个开源的内存数据结构存储系统，常用作数据库、缓存和消息中间件。在 Node.js 应用中，Redis 凭借其卓越的性能和丰富的数据结构支持，成为提升应用性能的关键组件。

## 核心特性

### 内存存储与持久化

Redis 将所有数据存储在内存中，读写性能极高，同时提供两种持久化机制确保数据安全：

```
内存存储 -> RDB快照 -> 磁盘
         -> AOF日志 -> 磁盘
```

### 丰富的数据结构

Redis 支持多种数据结构，而不仅仅是简单的键值对：

- **String**：字符串、整数、浮点数
- **List**：字符串列表，按插入顺序排序
- **Set**：无序的字符串集合，不重复
- **Hash**：字段-值对的映射表
- **Sorted Set**：有序的字符串集合，按分数排序
- **Stream**：日志数据结构，支持消费者组

### 单线程架构

Redis 采用单线程事件循环模型，避免了多线程的竞争条件，简化了数据一致性处理：

```
客户端请求 -> 事件循环 -> 命令执行 -> 返回结果
```

## 安装与配置

### 安装 Redis 客户端库

```bash
# 使用 npm 安装 ioredis（推荐）
npm install ioredis

# 或安装 node_redis（传统选择）
npm install redis
```

### 基础连接配置

**使用 ioredis 连接示例：**

```javascript
const Redis = require('ioredis');

// 基础连接
const redis = new Redis({
  host: '127.0.0.1',
  port: 6379,
  password: 'your_password', // 可选
  db: 0, // 数据库编号，0-15
});

// 连接事件监听
redis.on('connect', () => {
  console.log('Redis 连接成功');
});

redis.on('error', (err) => {
  console.error('Redis 连接错误:', err);
});
```

**连接池配置：**

```javascript
const redis = new Redis({
  host: '127.0.0.1',
  port: 6379,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true, // 延迟连接
});
```

## 数据结构与操作

### String 操作

String 是 Redis 最基本的数据类型，可以存储字符串、整数或浮点数。

```javascript
// 设置和获取字符串
await redis.set('user:1000:name', '张三');
const userName = await redis.get('user:1000:name');
console.log(userName); // "张三"

// 设置带过期时间的键
await redis.set('session:token123', 'user_data', 'EX', 3600); // 1小时后过期

// 递增递减操作
await redis.set('counter', 10);
await redis.incr('counter'); // 11
await redis.decrby('counter', 5); // 6

// 批量操作
await redis.mset('key1', 'value1', 'key2', 'value2', 'key3', 'value3');
const values = await redis.mget('key1', 'key2', 'key3');
```

### Hash 操作

Hash 适合存储对象，可以单独操作字段而不需要序列化整个对象。

```javascript
// 存储用户对象
await redis.hset('user:1000', {
  name: '李四',
  email: 'lisi@example.com',
  age: '30'
});

// 获取单个字段
const userName = await redis.hget('user:1000', 'name');

// 获取所有字段
const userData = await redis.hgetall('user:1000');

// 更新特定字段
await redis.hincrby('user:1000', 'age', 1);

// 检查字段是否存在
const hasEmail = await redis.hexists('user:1000', 'email');
```

### List 操作

List 是基于链表实现的字符串列表，支持从两端添加或移除元素。

```javascript
// 消息队列实现
await redis.lpush('message:queue', 'message1', 'message2', 'message3');
await redis.rpush('message:queue', 'message4');

// 消费消息
const message = await redis.rpop('message:queue');

// 获取列表范围
const messages = await redis.lrange('message:queue', 0, -1);

// 阻塞式弹出（适合任务队列）
const task = await redis.brpop('task:queue', 30); // 阻塞30秒
```

### Set 操作

Set 是无序的字符串集合，支持交集、并集、差集等集合运算。

```javascript
// 添加元素
await redis.sadd('tags', 'javascript', 'nodejs', 'redis', 'database');

// 检查成员是否存在
const hasRedis = await redis.sismember('tags', 'redis');

// 获取所有成员
const allTags = await redis.smembers('tags');

// 集合运算
await redis.sadd('frontend', 'javascript', 'html', 'css');
await redis.sadd('backend', 'javascript', 'nodejs', 'python');

const common = await redis.sinter('frontend', 'backend'); // 交集
const all = await redis.sunion('frontend', 'backend'); // 并集
```

### Sorted Set 操作

Sorted Set 是有序集合，每个成员都关联一个分数，用于排序。

```javascript
// 排行榜实现
await redis.zadd('leaderboard', 
  2840, 'player1',
  3500, 'player2', 
  1920, 'player3'
);

// 获取前3名
const topPlayers = await redis.zrevrange('leaderboard', 0, 2, 'WITHSCORES');

// 更新分数
await redis.zincrby('leaderboard', 100, 'player1');

// 获取排名
const rank = await redis.zrevrank('leaderboard', 'player1');
const score = await redis.zscore('leaderboard', 'player1');
```

## 高级特性

### 事务支持

Redis 事务可以批量执行命令，确保原子性。

```javascript
// MULTI/EXEC 事务
const multi = redis.multi();
multi.set('key1', 'value1');
multi.incr('counter');
multi.expire('key1', 60);
const results = await multi.exec();

// 使用 pipeline 提升性能
const pipeline = redis.pipeline();
for (let i = 0; i < 100; i++) {
  pipeline.set(`key:${i}`, `value:${i}`);
}
const pipelineResults = await pipeline.exec();
```

### 发布订阅模式

Redis 支持消息的发布订阅，适用于实时通信场景。

```javascript
// 订阅者
const subscriber = new Redis();
await subscriber.subscribe('news', 'sports');

subscriber.on('message', (channel, message) => {
  console.log(`收到频道 ${channel} 的消息: ${message}`);
});

// 发布者
const publisher = new Redis();
await publisher.publish('news', '最新消息！');
await publisher.publish('sports', '比赛结果公布');
```

### 键空间通知

监控键的变更事件，适用于缓存失效、数据同步等场景。

```javascript
// 配置键空间通知
await redis.config('SET', 'notify-keyspace-events', 'KEA');

// 订阅过期事件
const subscriber = new Redis();
await subscriber.psubscribe('__keyevent@0__:expired');

subscriber.on('pmessage', (pattern, channel, message) => {
  console.log(`键过期: ${message}`);
  // 处理缓存失效逻辑
});
```

## 实战应用场景

### 会话存储

```javascript
class SessionStore {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  async get(sessionId) {
    const sessionData = await this.redis.get(`session:${sessionId}`);
    return sessionData ? JSON.parse(sessionData) : null;
  }

  async set(sessionId, data, ttl = 3600) {
    await this.redis.setex(
      `session:${sessionId}`,
      ttl,
      JSON.stringify(data)
    );
  }

  async destroy(sessionId) {
    await this.redis.del(`session:${sessionId}`);
  }
}
```

### 缓存策略

```javascript
class CacheService {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  async cacheWithFallback(key, ttl, fallbackFunc) {
    // 尝试从缓存获取
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    // 缓存未命中，执行回退函数
    const data = await fallbackFunc();
    
    // 设置缓存
    await this.redis.setex(key, ttl, JSON.stringify(data));
    
    return data;
  }

  async invalidatePattern(pattern) {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

### 频率限制

```javascript
class RateLimiter {
  constructor(redisClient, maxRequests, windowMs) {
    this.redis = redisClient;
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async checkLimit(identifier) {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    
    const pipeline = this.redis.pipeline();
    pipeline.zremrangebyscore(key, 0, now - this.windowMs);
    pipeline.zadd(key, now, now.toString());
    pipeline.zcard(key);
    pipeline.expire(key, Math.ceil(this.windowMs / 1000));
    
    const results = await pipeline.exec();
    const requestCount = results[2][1];
    
    return requestCount <= this.maxRequests;
  }
}
```

## 性能优化

### 连接管理

```javascript
// 连接池配置
const redisCluster = new Redis.Cluster([
  { host: '127.0.0.1', port: 6379 },
  { host: '127.0.0.1', port: 6380 }
], {
  scaleReads: 'slave', // 将读请求分发到从节点
  redisOptions: {
    password: 'your_password'
  }
});

// 健康检查
setInterval(() => {
  redis.ping().catch(err => {
    console.error('Redis 连接异常:', err);
  });
}, 30000);
```

### 批量操作优化

```javascript
// 使用 pipeline 批量操作
async function batchInsertUsers(users) {
  const pipeline = redis.pipeline();
  
  users.forEach(user => {
    pipeline.hset(`user:${user.id}`, user);
    pipeline.expire(`user:${user.id}`, 3600);
  });
  
  await pipeline.exec();
}

// 使用 Lua 脚本保证原子性
const incrementScript = `
  local current = redis.call('get', KEYS[1])
  if current then
    redis.call('set', KEYS[1], tonumber(current) + tonumber(ARGV[1]))
  else
    redis.call('set', KEYS[1], ARGV[1])
  end
`;

await redis.eval(incrementScript, 1, 'counter', 5);
```

## 监控与调试

### 性能监控

```javascript
class RedisMonitor {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  async getStats() {
    const info = await this.redis.info();
    const slowLog = await this.redis.slowlog('get', 10);
    
    return {
      connected_clients: info.connected_clients,
      used_memory: info.used_memory_human,
      hits: info.keyspace_hits,
      misses: info.keyspace_misses,
      slow_commands: slowLog
    };
  }

  async trackCommand(cmd, ...args) {
    const start = Date.now();
    try {
      const result = await this.redis[cmd](...args);
      const duration = Date.now() - start;
      
      if (duration > 100) { // 记录慢查询
        console.warn(`Slow Redis command: ${cmd}, duration: ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      console.error(`Redis command failed: ${cmd}`, error);
      throw error;
    }
  }
}
```