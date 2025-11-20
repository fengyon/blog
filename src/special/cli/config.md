# 配置管理

## Node.js 配置管理概述

在 Node.js 应用开发中，配置管理是确保应用在不同环境中正确运行的关键环节。配置管理涉及对应用设置、参数和外部依赖地址等信息的统一管理，使应用能够灵活适应开发、测试、生产等不同环境。

配置管理的核心价值在于实现**代码与配置的分离**，避免将环境特定的信息硬编码在代码中。现代 Node.js 应用通常采用多层配置策略，按照优先级从高到低排列：

```
命令行参数 → 环境变量 → 环境配置文件 → 默认配置文件
```

## 配置管理的重要性

### 环境适配与安全

配置管理使得应用能够无缝运行在不同环境中，而无需修改代码。通过将敏感信息 (如数据库密码、API 密钥) 移出代码库，配置管理显著提高了应用的安全性。当需要调整应用行为时，只需修改配置而无需重新部署代码。

### 现代应用架构需求

在微服务、容器化和云原生架构中，配置管理变得更加重要。动态配置更新、配置中心化和配置版本控制成为必备特性，这些功能帮助团队更高效地协作和运维。

## 常用配置管理库

### Node-Config

Node-Config 是一个功能全面的配置管理库，特别适合大型 Node.js 应用。它支持多种文件格式和复杂的分层配置结构。

#### 基础使用方法

```javascript
// config/default.mjs
export default {
  app: {
    name: 'My Application',
    port: 3000
  },
  database: {
    host: 'localhost',
    port: 5432,
    name: 'myapp_dev'
  },
  logging: {
    level: 'info',
    file: './logs/app.log'
  }
};

// config/production.mjs  
export default {
  app: {
    port: 80
  },
  database: {
    host: 'prod-db.company.com',
    name: 'myapp_prod'
  },
  logging: {
    level: 'error'
  }
};

// app.mjs
import config from 'config';

console.log(`应用名称: ${config.get('app.name')}`);
console.log(`数据库主机: ${config.get('database.host')}`);
console.log(`日志级别: ${config.get('logging.level')}`);

// 环境检查
if (config.get('app.env') === 'production') {
  console.log('运行在生产环境');
}
```

#### 高级特性

Node-Config 支持配置文件继承和深度合并，允许在不同环境间共享通用配置：

```javascript
// config/test.mjs
import defaultConfig from './default.mjs';

export default {
  ...defaultConfig,
  database: {
    ...defaultConfig.database,
    name: 'myapp_test'
  },
  testing: {
    timeout: 5000,
    reporters: ['spec', 'coverage']
  }
};

// 动态配置访问
import config from 'config';

// 检查配置是否存在
if (config.has('featureFlags.newDashboard')) {
  console.log('新仪表板功能已启用');
}

// 获取所有可用配置
const allConfig = config.util.toObject();
console.log('完整配置对象:', allConfig);
```

### Konphyg

Konphyg 是一个轻量级的配置管理库，支持基于环境的配置继承，采用简洁的 API 设计。

#### 基础配置结构

```javascript
// config/default.mjs
export default {
  server: {
    port: 3000,
    host: '0.0.0.0'
  },
  features: {
    caching: true,
    compression: false
  }
};

// config/production.mjs
export default {
  server: {
    port: 80
  },
  features: {
    compression: true
  }
};

// app.mjs
import konphyg from 'konphyg';

const config = konphyg('./config');
const appConfig = config('default');

console.log(`服务器端口: ${appConfig.server.port}`);
console.log(`缓存功能: ${appConfig.features.caching ? '启用' : '禁用'}`);
```

#### 环境特定配置

Konphyg 支持环境特定的配置文件，自动根据 NODE_ENV 环境变量加载对应配置：

```javascript
// config/database.json
{
  "development": {
    "host": "localhost",
    "database": "app_dev"
  },
  "test": {
    "host": "test-db",
    "database": "app_test" 
  },
  "production": {
    "host": "prod-db",
    "database": "app_prod"
  }
}

// 使用环境配置
const dbConfig = config('database');
console.log(`数据库: ${dbConfig.database}`);
```

### Config-Able

Config-Able 基于 nconf 构建，提供灵活的配置源管理和优先级控制。

#### 多层配置源

```javascript
// config-manager.mjs
import configAble from 'config-able';

// 定义默认配置
const defaults = {
  app: {
    name: 'MyApp',
    version: '1.0.0'
  },
  cache: {
    enabled: true,
    ttl: 3600
  }
};

// 定义覆盖配置
const overrides = {
  app: {
    port: process.env.PORT || 3000
  }
};

const config = configAble({
  path: './config',
  defaults: defaults,
  overrides: overrides
});

// 使用配置
console.log(`应用: ${config.get('app:name')}`);
console.log(`端口: ${config.get('app:port')}`);
console.log(`缓存TTL: ${config.get('cache:ttl')}`);

// 设置新配置
config.set('cache:maxSize', '500MB');

// 保存配置到文件
// config.save('local.json');
```

## 原生配置管理方案

### 环境变量管理

环境变量是配置管理中最基础也是最常用的方式，Node.js 原生支持环境变量访问：

```javascript
// env-config.mjs
class EnvConfig {
  static get(key, defaultValue = null) {
    return process.env[key] || defaultValue;
  }
  
  static getInt(key, defaultValue = 0) {
    const value = this.get(key);
    return value ? parseInt(value, 10) : defaultValue;
  }
  
  static getBool(key, defaultValue = false) {
    const value = this.get(key);
    return value ? value.toLowerCase() === 'true' : defaultValue;
  }
  
  static getArray(key, defaultValue = []) {
    const value = this.get(key);
    return value ? value.split(',') : defaultValue;
  }
}

// 使用示例
const dbConfig = {
  host: EnvConfig.get('DB_HOST', 'localhost'),
  port: EnvConfig.getInt('DB_PORT', 5432),
  ssl: EnvConfig.getBool('DB_SSL', false),
  poolSize: EnvConfig.getInt('DB_POOL_SIZE', 10)
};

console.log('数据库配置:', dbConfig);

// 命令行启动示例:
// DB_HOST=prod-server DB_PORT=5433 DB_SSL=true node env-config.mjs
```

### 命令行参数解析

结合命令行参数进行动态配置：

```javascript
// cli-config.mjs
import { parseArgs } from 'node:util';

const options = {
  'config': {
    type: 'string',
    short: 'c',
    default: './config/default.json'
  },
  'env': {
    type: 'string',
    short: 'e',
    default: 'development'
  },
  'port': {
    type: 'string',
    short: 'p'
  },
  'verbose': {
    type: 'boolean',
    short: 'v'
  }
};

class CLIConfig {
  constructor() {
    const { values } = parseArgs({ options });
    this.values = values;
  }
  
  get(key) {
    return this.values[key];
  }
  
  getAll() {
    return { ...this.values };
  }
}

const cliConfig = new CLIConfig();
console.log('命令行配置:', cliConfig.getAll());

// 使用示例:
// node cli-config.mjs --env production --port 8080 --verbose
// node cli-config.mjs -e staging -p 3000 -v
```

## 高级配置管理技术

### 配置验证与默认值

确保配置的完整性和正确性：

```javascript
// config-validator.mjs
class ConfigValidator {
  static validate(config, schema) {
    const errors = [];
    
    for (const [key, rules] of Object.entries(schema)) {
      const value = config[key];
      
      // 必需字段检查
      if (rules.required && (value === undefined || value === null)) {
        errors.push(`配置项 '${key}' 是必需的`);
        continue;
      }
      
      // 类型检查
      if (value !== undefined && rules.type && typeof value !== rules.type) {
        errors.push(`配置项 '${key}' 应该是 ${rules.type} 类型`);
      }
      
      // 枚举值检查
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`配置项 '${key}' 的值不在允许的范围内: ${rules.enum.join(', ')}`);
      }
      
      // 自定义验证函数
      if (rules.validate && !rules.validate(value)) {
        errors.push(`配置项 '${key}' 的值验证失败`);
      }
    }
    
    if (errors.length > 0) {
      throw new Error(`配置验证失败:\n${errors.join('\n')}`);
    }
    
    return true;
  }
}

// 配置模式定义
const databaseSchema = {
  host: { required: true, type: 'string' },
  port: { required: true, type: 'number' },
  database: { required: true, type: 'string' },
  ssl: { required: false, type: 'boolean', default: false },
  poolSize: { 
    required: false, 
    type: 'number', 
    validate: (value) => value > 0 && value <= 100 
  }
};

// 使用验证
const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'myapp'
};

try {
  ConfigValidator.validate(dbConfig, databaseSchema);
  console.log('✅ 配置验证通过');
} catch (error) {
  console.error('❌ 配置错误:', error.message);
}
```

### 动态配置更新

实现运行时配置热更新：

```javascript
// dynamic-config.mjs
import { watchFile } from 'node:fs';
import EventEmitter from 'node:events';

class DynamicConfig extends EventEmitter {
  constructor(configPath) {
    super();
    this.configPath = configPath;
    this.config = {};
    this.loadConfig();
    this.watchChanges();
  }
  
  loadConfig() {
    try {
      // 实际应用中这里会从文件系统读取配置
      const newConfig = {
        ...this.config,
        lastUpdated: new Date().toISOString()
      };
      
      const changed = JSON.stringify(newConfig) !== JSON.stringify(this.config);
      this.config = newConfig;
      
      if (changed) {
        this.emit('configChanged', this.config);
      }
    } catch (error) {
      this.emit('configError', error);
    }
  }
  
  watchChanges() {
    // 监听文件变化
    watchFile(this.configPath, (curr, prev) => {
      if (curr.mtime !== prev.mtime) {
        console.log('检测到配置文件变化，重新加载...');
        this.loadConfig();
      }
    });
  }
  
  get(key) {
    return key ? this.config[key] : { ...this.config };
  }
  
  set(key, value) {
    this.config[key] = value;
    this.emit('configUpdated', { key, value });
  }
}

// 使用动态配置
const dynamicConfig = new DynamicConfig('./config/app.json');

// 监听配置变化
dynamicConfig.on('configChanged', (newConfig) => {
  console.log('配置已更新:', newConfig);
});

dynamicConfig.on('configError', (error) => {
  console.error('配置加载错误:', error);
});

// 设置配置项
setTimeout(() => {
  dynamicConfig.set('featureToggles', {
    newUI: true,
    experimental: false
  });
}, 2000);
```

## 实际应用场景

### 多环境配置策略

在实际项目中管理不同环境的配置：

```javascript
// config-builder.mjs
class ConfigBuilder {
  constructor(environment = 'development') {
    this.environment = environment;
    this.config = {};
  }
  
  // 加载基础配置
  loadDefaults() {
    this.config = {
      app: {
        name: process.env.APP_NAME || 'MyApp',
        env: this.environment
      },
      server: {
        port: parseInt(process.env.PORT) || 3000,
        host: process.env.HOST || 'localhost'
      }
    };
    return this;
  }
  
  // 加载环境特定配置
  loadEnvironmentConfig() {
    const envConfigs = {
      development: {
        logging: { level: 'debug' },
        database: { debug: true }
      },
      test: {
        logging: { level: 'warn' },
        database: { pool: { min: 1, max: 2 } }
      },
      production: {
        logging: { level: 'error' },
        database: { pool: { min: 5, max: 20 } }
      }
    };
    
    Object.assign(this.config, envConfigs[this.environment] || {});
    return this;
  }
  
  // 应用环境变量覆盖
  applyEnvironmentOverrides() {
    // 数据库配置
    if (process.env.DATABASE_URL) {
      this.config.database = {
        ...this.config.database,
        url: process.env.DATABASE_URL
      };
    }
    
    // Redis配置
    if (process.env.REDIS_URL) {
      this.config.redis = { url: process.env.REDIS_URL };
    }
    
    return this;
  }
  
  // 构建最终配置
  build() {
    return this.config;
  }
}

// 使用配置构建器
const environment = process.env.NODE_ENV || 'development';
const config = new ConfigBuilder(environment)
  .loadDefaults()
  .loadEnvironmentConfig()
  .applyEnvironmentOverrides()
  .build();

console.log('最终配置:', JSON.stringify(config, null, 2));
```

### 配置加密与安全

处理敏感配置信息：

```javascript
// secure-config.mjs
import crypto from 'node:crypto';

class SecureConfig {
  constructor(encryptionKey) {
    this.encryptionKey = encryptionKey;
    this.encryptedFields = new Set(['password', 'secret', 'apiKey', 'token']);
  }
  
  // 加密数据
  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', this.encryptionKey);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    
    return {
      iv: iv.toString('hex'),
      data: encrypted,
      authTag: authTag.toString('hex')
    };
  }
  
  // 解密数据
  decrypt(encryptedData) {
    const decipher = crypto.createDecipher(
      'aes-256-gcm', 
      this.encryptionKey
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(
      encryptedData.data, 
      'hex', 
      'utf8'
    );
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  // 保护敏感配置
  protect(config) {
    const protectedConfig = { ...config };
    
    for (const [key, value] of Object.entries(protectedConfig)) {
      if (this.encryptedFields.has(key) && typeof value === 'string') {
        protectedConfig[key] = this.encrypt(value);
      } else if (typeof value === 'object' && value !== null) {
        protectedConfig[key] = this.protect(value);
      }
    }
    
    return protectedConfig;
  }
  
  // 解保护配置
  unprotect(protectedConfig) {
    const config = { ...protectedConfig };
    
    for (const [key, value] of Object.entries(config)) {
      if (this.encryptedFields.has(key) && 
          typeof value === 'object' && 
          value.iv && value.data) {
        config[key] = this.decrypt(value);
      } else if (typeof value === 'object' && value !== null) {
        config[key] = this.unprotect(value);
      }
    }
    
    return config;
  }
}

// 使用安全配置
const secureConfig = new SecureConfig('your-32-byte-encryption-key-here');

const sensitiveConfig = {
  database: {
    host: 'localhost',
    password: 'super-secret-password',
    apiKey: '12345-67890-abcde'
  }
};

console.log('原始配置:', sensitiveConfig);

const protected = secureConfig.protect(sensitiveConfig);
console.log('加密配置:', protected);

const unprotected = secureConfig.unprotect(protected);
console.log('解密配置:', unprotected);
```

## 现代化配置管理特性

### JSONC 和 MJS 支持

最新的配置管理库如 Node-Config v4.0.0 开始支持 JSONC (带注释的 JSON) 和 MJS (ES 模块) 配置文件。

```javascript
// config.jsonc - 支持注释的 JSON 文件
{
  // 应用基础配置
  "app": {
    "name": "My Application",
    "port": 3000,
    // 环境类型：development, test, production
    "env": "development"
  },
  
  // 数据库配置
  "database": {
    "host": "localhost",    // 数据库主机
    "port": 5432,          // 数据库端口
    "name": "myapp_dev"    // 数据库名称
  }
}

// config.mjs - ES 模块格式配置
export default {
  app: {
    name: 'My Application',
    
    // 动态端口分配
    port: process.env.PORT || 3000,
    
    // 特性开关
    features: {
      newDashboard: true,
      experimental: false
    }
  },
  
  // 计算属性
  get apiUrl() {
    return this.app.env === 'production' 
      ? 'https://api.myapp.com'
      : 'http://localhost:8080';
  }
};
```

通过以上方法和工具，Node.js 开发者可以构建出强大、灵活且安全的配置管理系统，满足从简单应用到复杂企业级系统的各种需求。