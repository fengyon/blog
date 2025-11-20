# 日志系统

## Node.js 日志系统概述

在 Node.js 应用开发中，日志系统是确保应用可观测性的核心组件。它记录了应用程序运行时的各种事件、状态和错误信息，为开发者和运维人员提供了排查问题、监控性能和理解系统行为的关键数据。

一个完整的日志系统处理流程：
```
应用程序 → 日志记录 → 格式处理 → 输出传输 → 存储分析
    ↓           ↓           ↓          ↓         ↓
业务逻辑  →  级别过滤  →  结构化  →  控制台   →  日志文件
              ↓           ↓          ↓         ↓
           debug/info   JSON格式    终端     轮转归档
           /warn/error             显示     集中存储
```

## 日志基础概念

### 日志级别体系

日志级别定义了日志信息的重要性层级，帮助开发者过滤和分类日志信息：

```javascript
// 日志级别从详细到严重：
TRACE → DEBUG → INFO → WARN → ERROR → FATAL
    ↓       ↓       ↓      ↓       ↓       ↓
  跟踪    调试     信息    警告    错误    致命
```

### 结构化日志优势

与传统字符串日志相比，结构化日志 (通常是 JSON 格式) 具有显著优势：

```javascript
// 非结构化日志（难以解析）
"User john logged in from 192.168.1.1 at 2023-11-18T10:30:00Z"

// 结构化日志（易于机器解析）
{
  "timestamp": "2023-11-18T10:30:00Z",
  "level": "INFO", 
  "message": "User login successful",
  "userId": "john",
  "ip": "192.168.1.1",
  "context": "authentication"
}
```

## 常用日志库及其应用

### Winston - 功能全面的通用日志库

Winston 是 Node.js 生态中最流行的日志库之一，以其灵活性和强大的传输配置著称。它支持多种输出目标和控制方式，适合大多数生产环境场景。

#### 基础配置与使用

```javascript
// winston-basic.mjs
import winston from 'winston';

// 创建 Logger 实例
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'combined.log' 
    })
  ]
});

// 记录不同级别日志
logger.info('Server started successfully', { port: 3000, pid: process.pid });
logger.warn('Database connection slow', { queryTime: '2.5s' });
logger.error('Failed to connect to Redis', { error: 'Connection timeout' });

// 带元数据的结构化日志
logger.debug('User action performed', {
  userId: 'user123',
  action: 'profile_update',
  userAgent: 'Mozilla/5.0...'
});
```

#### 高级格式定制

```javascript
// winston-advanced.mjs
import winston from 'winston';

const { combine, timestamp, label, printf, colorize, errors } = winston.format;

// 自定义日志格式
const customFormat = printf(({ level, message, label, timestamp, stack, ...metadata }) => {
  let log = `${timestamp} [${label}] ${level}: ${message}`;
  
  if (stack) {
    log += `\n${stack}`; // 错误堆栈
  }
  
  // 添加元数据
  const metaKeys = Object.keys(metadata);
  if (metaKeys.length > 0) {
    log += `\n${JSON.stringify(metadata, null, 2)}`;
  }
  
  return log;
});

const logger = winston.createLogger({
  level: 'debug',
  format: combine(
    errors({ stack: true }), // 捕获错误堆栈
    label({ label: 'AUTH-SERVICE' }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    colorize(),
    customFormat
  ),
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true,
    })
  ]
});

// 使用示例
try {
  logger.info('Authentication request', {
    username: 'alice',
    endpoint: '/api/login',
    sourceIp: '192.168.1.100'
  });
  
  // 模拟错误
  throw new Error('Invalid credentials');
} catch (error) {
  logger.error('Authentication failed', {
    error: error.message,
    stack: error.stack,
    userId: 'alice'
  });
}
```

### Pino - 高性能日志方案

Pino 专为高性能场景设计，比传统日志库快 3 倍以上，特别适合高吞吐量的 CLI 工具和微服务架构。

#### 基础使用方法

```javascript
// pino-basic.mjs
import pino from 'pino';

// 基础配置
const logger = pino({
  level: 'info',
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
  formatters: {
    level: (label) => ({ level: label })
  }
});

// 结构化日志记录
logger.info({ userId: 123 }, 'User logged in');
logger.error({ err: new Error('DB connection failed'), statusCode: 500 }, 'Request failed');

// 子日志器（上下文继承）
const childLogger = logger.child({ module: 'user-service' });
childLogger.info({ userId: 456 }, 'Processing user data');
```

#### ESM 打包与生产配置

```javascript
// pino-production.mjs
import pino from 'pino';
import pinoPretty from 'pino-pretty';

// 开发环境美化输出
const developmentConfig = {
  level: 'debug',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  }
};

// 生产环境JSON输出
const productionConfig = {
  level: 'info',
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res
  }
};

const config = process.env.NODE_ENV === 'production' 
  ? productionConfig 
  : developmentConfig;

const logger = pino(config);

// 性能关键路径的日志记录
export function processUserData(userData) {
  const startTime = Date.now();
  
  logger.debug({ userData }, 'Starting user data processing');
  
  // 业务逻辑...
  
  const processingTime = Date.now() - startTime;
  logger.info({ processingTime, userId: userData.id }, 'User data processed');
  
  return userData;
}
```

### Log4js - 企业级配置管理

Log4js 提供强大的配置能力和企业级特性，支持复杂的日志路由和管理策略。

#### 基础配置示例

```javascript
// log4js-basic.mjs
import log4js from 'log4js';

// 配置文件驱动方式
log4js.configure({
  appenders: {
    stdout: { 
      type: 'stdout',
      layout: { 
        type: 'pattern', 
        pattern: '%d [%p] %c - %m' 
      }
    },
    file: { 
      type: 'file', 
      filename: 'app.log',
      maxLogSize: 10485760,
      backups: 3
    },
    errors: { 
      type: 'logLevelFilter', 
      appender: 'file', 
      level: 'error' 
    }
  },
  categories: {
    default: { 
      appenders: ['stdout', 'errors'], 
      level: 'info' 
    }
  }
});

const logger = log4js.getLogger('my-app');
logger.info('Application started');
logger.error('Critical system error', new Error('Disk full'));
```

#### 高级文件管理

```javascript
// log4js-advanced.mjs
import log4js from 'log4js';

// 生产环境日志轮转配置
log4js.configure({
  appenders: {
    fileAppender: {
      type: 'dateFile',
      filename: 'leixuewei.log',
      pattern: '.yyyyMMdd',
      daysToKeep: 30,
      layout: {
        type: 'pattern',
        pattern: '%d [%p] [%c] - %m%n'
      }
    },
    emergency: {
      type: 'file',
      filename: 'emergency.log',
      maxLogSize: 10485760,
      compress: true
    }
  },
  categories: {
    default: { 
      appenders: ['fileAppender'], 
      level: 'info' 
    },
    critical: { 
      appenders: ['emergency'], 
      level: 'error' 
    }
  }
});

// 分类日志记录器
const systemLogger = log4js.getLogger('system');
const securityLogger = log4js.getLogger('security');
const criticalLogger = log4js.getLogger('critical');

systemLogger.info('System components initialized');
securityLogger.warn('Failed login attempt', { ip: '192.168.1.200' });
criticalLogger.fatal('Database cluster failure', { 
  cluster: 'primary',
  error: 'Connection lost to all nodes'
});
```

### Bunyan - 结构化日志标杆

Bunyan 专注于生成机器可读的 JSON 日志，便于与日志分析系统集成。

```javascript
// bunyan-demo.mjs
import bunyan from 'bunyan';

// 创建 Bunyan 日志实例
const logger = bunyan.createLogger({
  name: 'my-api-service',
  level: 'info',
  streams: [
    {
      level: 'info',
      stream: process.stdout
    },
    {
      level: 'error',
      path: '/var/log/my-api-error.log'
    }
  ],
  serializers: bunyan.stdSerializers
});

// 请求上下文日志记录
export function handleRequest(req, res) {
  const startTime = Date.now();
  
  logger.info({ 
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    requestId: generateRequestId()
  }, 'Incoming request');
  
  // 处理逻辑...
  
  const responseTime = Date.now() - startTime;
  logger.info({ 
    statusCode: res.statusCode,
    responseTime,
    requestId: req.requestId
  }, 'Request completed');
}

// 错误处理中的详细日志
export function handleError(error, context) {
  logger.error({
    err: error,
    stack: error.stack,
    context: context,
    timestamp: new Date().toISOString()
  }, 'Unhandled exception occurred');
}
```

## 命令行工具专用日志方案

### 控制台输出优化

命令行工具对控制台输出有特殊要求，需要平衡可读性和性能：

```javascript
// cli-logger.mjs
import winston from 'winston';

class CLILogger {
  constructor(options = {}) {
    const {
      level = 'info',
      enableColors = true,
      verbose = false
    } = options;
    
    this.logger = winston.createLogger({
      level: verbose ? 'debug' : level,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        enableColors ? 
          winston.format.colorize() : 
          winston.format.uncolorize(),
        winston.format.printf(({ level, message, timestamp, stack }) => {
          if (stack) {
            return `${timestamp} ${level}: ${message}\n${stack}`;
          }
          return `${timestamp} ${level}: ${message}`;
        })
      ),
      transports: [
        new winston.transports.Console({
          silent: process.env.NODE_ENV === 'test'
        })
      ]
    });
  }
  
  // 进度指示器
  progress(task, current, total) {
    const percentage = Math.round((current / total) * 100);
    this.logger.info(`${task}... ${percentage}% (${current}/${total})`);
  }
  
  // 成功状态
  success(message) {
    this.logger.info(`✅ ${message}`);
  }
  
  // 警告信息
  warning(message) {
    this.logger.warn(`⚠️ ${message}`);
  }
  
  // 错误信息
  error(message, error = null) {
    if (error) {
      this.logger.error(`❌ ${message}`, { error });
    } else {
      this.logger.error(`❌ ${message}`);
    }
  }
  
  // 调试信息（仅在详细模式输出）
  debug(message, metadata = {}) {
    this.logger.debug(message, metadata);
  }
}

// 使用示例
const logger = new CLILogger({ verbose: true });

export function buildProject(config) {
  logger.progress('Compiling source', 1, 5);
  // 编译逻辑...
  logger.progress('Compiling source', 2, 5);
  
  logger.debug('Compiler configuration', { config });
  
  try {
    // 构建逻辑...
    logger.success('Build completed successfully');
  } catch (error) {
    logger.error('Build failed', error);
  }
}
```

### 异步日志记录与性能

避免日志 I/O 阻塞事件循环对于 CLI 工具性能至关重要：

```javascript
// async-logger.mjs
import { createWriteStream } from 'node:fs';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';

// 主进程日志管理器
class AsyncLogger {
  constructor(logPath) {
    if (isMainThread) {
      this.worker = new Worker(new URL(import.meta.url), {
        workerData: { logPath }
      });
    }
  }
  
  log(level, message, metadata = {}) {
    if (isMainThread && this.worker) {
      this.worker.postMessage({
        level,
        message,
        metadata,
        timestamp: new Date().toISOString()
      });
    } else {
      // 同步回退
      console.log(`[${level}] ${message}`, metadata);
    }
  }
  
  info(message, metadata) {
    this.log('info', message, metadata);
  }
  
  error(message, metadata) {
    this.log('error', message, metadata);
  }
}

// Worker 线程处理实际的日志写入
if (!isMainThread) {
  const { logPath } = workerData;
  const stream = createWriteStream(logPath, { flags: 'a' });
  
  parentPort.on('message', (logEntry) => {
    const logLine = JSON.stringify(logEntry) + '\n';
    
    // 异步写入，不阻塞主线程
    if (stream.write(logLine) === false) {
      // 处理背压
      stream.once('drain', () => {
        console.error('Log stream drained, continuing...');
      });
    }
  });
  
  // 优雅关闭
  process.on('beforeExit', () => {
    stream.end();
  });
}

export default AsyncLogger;
```

## 日志管理与分析

### 日志轮转策略

防止日志文件无限增长，确保磁盘空间合理利用：

```javascript
// log-rotation.mjs
import winston from 'winston';
import 'winston-daily-rotate-file';

// 自动轮转配置
export const createRotatingLogger = (options = {}) => {
  const {
    name = 'application',
    level = 'info',
    maxSize = '20m',
    maxFiles = '14d'
  } = options;
  
  return winston.createLogger({
    level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.DailyRotateFile({
        filename: `logs/${name}-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize,
        maxFiles
      })
    ]
  });
};

// PM2 集成配置 (ecosystem.config.js)
export const pm2Config = {
  apps: [{
    name: 'my-app',
    script: 'app.mjs',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    out_file: '/var/log/nodejs/my-app.log',
    error_file: '/var/log/nodejs/my-app-error.log',
    merge_logs: true,
    log_rotate: true,
    log_size: '10M',
    log_retain: 7
  }]
};
```

### 集中式日志管理

对于分布式系统，集中式日志收集和分析至关重要：

```javascript
// centralized-logging.mjs
import winston from 'winston';

// ELK Stack 集成配置
export const createELKLogger = (options = {}) => {
  const {
    logstashHost = 'localhost',
    logstashPort = 5000,
    applicationName = 'nodejs-app'
  } = options;
  
  return winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      // 控制台输出（开发环境）
      new winston.transports.Console(),
      
      // Logstash 传输（生产环境）
      new winston.transports.Logstash({
        port: logstashPort,
        node_name: applicationName,
        host: logstashHost,
        max_connect_retries: -1 // 无限重试
      })
    ]
  });
};

// 使用示例
const elkLogger = createELKLogger({
  applicationName: 'user-service',
  logstashHost: process.env.LOGSTASH_HOST
});

// 结构化日志便于 Kibana 分析
elkLogger.info('User profile updated', {
  userId: '12345',
  updatedFields: ['email', 'preferences'],
  timestamp: new Date().toISOString(),
  service: 'user-service',
  environment: process.env.NODE_ENV
});
```

## 最佳实践与性能优化

### 日志级别管理策略

```javascript
// log-levels.mjs
import pino from 'pino';

// 环境特定的级别配置
const getLevelConfig = () => {
  switch (process.env.NODE_ENV) {
    case 'production':
      return 'info';
    case 'staging':
      return 'debug';
    case 'development':
      return 'trace';
    default:
      return 'info';
  }
};

// 动态级别调整
const logger = pino({
  level: getLevelConfig(),
  hooks: {
    logMethod(inputArgs, method) {
      // 生产环境过滤敏感数据
      if (process.env.NODE_ENV === 'production') {
        const [obj, msg] = inputArgs;
        if (obj && typeof obj === 'object') {
          // 移除敏感字段
          const { password, apiKey, ...safeObj } = obj;
          return method.apply(this, [safeObj, msg]);
        }
      }
      return method.apply(this, inputArgs);
    }
  }
});

// 性能敏感区域的日志控制
export function performanceCriticalFunction(data) {
  // 使用条件日志记录避免不必要的计算
  if (logger.isLevelEnabled('debug')) {
    logger.debug({ data: expensiveSerialization(data) }, 'Processing data');
  }
  
  // 主逻辑...
}

function expensiveSerialization(data) {
  // 模拟昂贵的序列化操作
  return JSON.parse(JSON.stringify(data));
}
```

### 上下文跟踪与关联

```javascript
// context-logging.mjs
import pino from 'pino';

// 请求上下文传播
class RequestContext {
  constructor(requestId, userId) {
    this.requestId = requestId;
    this.userId = userId;
    this.logger = null;
  }
  
  createLogger() {
    this.logger = pino().child({
      requestId: this.requestId,
      userId: this.userId
    });
    return this.logger;
  }
}

// 使用异步本地存储进行上下文传播
import { AsyncLocalStorage } from 'node:async_hooks';

const asyncLocalStorage = new AsyncLocalStorage();

export function withRequestContext(context, callback) {
  return asyncLocalStorage.run(context, callback);
}

export function getCurrentLogger() {
  const context = asyncLocalStorage.getStore();
  if (context && context.logger) {
    return context.logger;
  }
  
  // 回退到默认日志器
  return pino();
}

// 中间件示例
export function requestLoggingMiddleware(req, res, next) {
  const requestId = generateRequestId();
  const context = new RequestContext(requestId, req.user?.id);
  
  withRequestContext(context, () => {
    const logger = context.createLogger();
    
    logger.info({
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent']
    }, 'Request started');
    
    // 响应完成日志记录
    res.on('finish', () => {
      logger.info({
        statusCode: res.statusCode,
        contentLength: res.get('Content-Length')
      }, 'Request completed');
    });
    
    next();
  });
}
```

通过合理选择和配置这些日志工具，Node.js 命令行应用可以获得既满足功能需求又保证性能的优秀日志系统。关键是根据应用的具体需求在功能丰富性和性能开销之间找到平衡点。