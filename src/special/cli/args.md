# 参数处理

## 命令行参数基础

在 Node.js 中，命令行参数是构建交互式命令行工具的基础。当用户在终端中输入命令时，参数通过特定语法传递给程序，用于配置工具的行为或提供必要数据。

基本的参数传递流程：
```
node script.js arg1 --option value -f
      │        │    │     │      │
     脚本文件    │   长选项  值    短选项
             位置参数
```

## 原生参数处理

### process.argv 基础

Node.js 通过全局对象 `process` 提供命令行参数访问能力。`process.argv` 是一个数组，包含命令行输入的所有参数。

```javascript
// argv-demo.mjs
console.log('完整参数数组:', process.argv);
console.log('用户输入参数:', process.argv.slice(2));

// 执行: node argv-demo.mjs serve --port 3000 --host localhost
// 输出:
// 完整参数数组: ['/usr/local/bin/node', '/path/to/argv-demo.mjs', 'serve', '--port', '3000', '--host', 'localhost']
// 用户输入参数: ['serve', '--port', '3000', '--host', 'localhost']
```

### 手动参数解析

虽然可以直接处理 `process.argv`，但对于复杂场景需要手动解析：

```javascript
// manual-parse.mjs
function parseArguments(args) {
  const result = {
    _: [],    // 位置参数
    flags: {}, // 选项参数
    raw: args  // 原始参数
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      // 长选项 --option value 或 --flag
      const key = arg.slice(2);
      const nextArg = args[i + 1];
      
      if (nextArg && !nextArg.startsWith('-')) {
        result.flags[key] = nextArg;
        i++; // 跳过下一个参数
      } else {
        result.flags[key] = true;
      }
    } else if (arg.startsWith('-')) {
      // 短选项 -f value 或 -abc
      const key = arg.slice(1);
      const nextArg = args[i + 1];
      
      if (nextArg && !nextArg.startsWith('-')) {
        result.flags[key] = nextArg;
        i++;
      } else {
        result.flags[key] = true;
      }
    } else {
      // 位置参数
      result._.push(arg);
    }
  }
  
  return result;
}

const args = parseArguments(process.argv.slice(2));
console.log('解析结果:', args);

// 执行: node manual-parse.mjs build --target production --minify src
// 输出: { _: ['build', 'src'], flags: { target: 'production', minify: true } }
```

手动解析的局限性很明显：需要处理类型转换、布尔标志、组合短选项等多种复杂情况，代码会迅速变得复杂且容易出错。

## 常用开源库

### Minimist - 轻量级解析

Minimist 是一个小巧高效的参数解析库，将参数转换为结构化对象。

```javascript
// minimist-demo.mjs
import minimist from 'minimist';

const args = minimist(process.argv.slice(2));
console.log('Minimist 解析结果:', args);

// 执行示例及输出:
// node minimist-demo.mjs -x 3 -y hello --name=Alice --no-verbose --port 8080 file1 file2
// {
//   _: [ 'file1', 'file2' ],
//   x: 3,
//   y: 'hello',
//   name: 'Alice',
//   verbose: false,
//   port: 8080
// }
```

Minimist 支持的高级配置：

```javascript
// minimist-advanced.mjs
import minimist from 'minimist';

const options = {
  string: ['api-key', 'config'], // 字符串类型选项
  boolean: ['verbose', 'help'],  // 布尔类型选项
  alias: {
    v: 'verbose',
    h: 'help',
    c: 'config'
  },
  default: {
    verbose: false,
    config: './config.json'
  }
};

const args = minimist(process.argv.slice(2), options);
console.log('高级配置解析:', args);

// 执行: node minimist-advanced.mjs --api-key secret123 -v --config ./app.json
// 输出: { _: [], 'api-key': 'secret123', verbose: true, config: './app.json', v: true, h: false }
```

### Yargs - 功能全面的 CLI 框架

Yargs 提供了丰富的功能来构建专业的命令行工具，其新版本已转向 ESM 优先架构。

```javascript
// yargs-demo.mjs
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .option('port', {
    alias: 'p',
    type: 'number',
    description: '服务器端口号',
    default: 3000
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: '详细输出模式'
  })
  .option('config', {
    alias: 'c',
    type: 'string',
    description: '配置文件路径'
  })
  .demandOption(['port'], '必须指定端口号')
  .check((argv, options) => {
    if (argv.port < 1 || argv.port > 65535) {
      throw new Error('端口号必须在 1-65535 范围内');
    }
    return true;
  })
  .help()
  .alias('help', 'h')
  .argv;

console.log('Yargs 解析结果:', argv);

// 自动生成的帮助信息:
// 执行: node yargs-demo.mjs --help
// 输出使用方法信息
```

Yargs 的命令功能：

```javascript
// yargs-commands.mjs
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .command(
    'serve [port]',
    '启动开发服务器',
    (yargs) => {
      return yargs
        .positional('port', {
          describe: '服务监听端口',
          type: 'number',
          default: 3000
        })
        .option('host', {
          alias: 'H',
          type: 'string',
          description: '服务器主机',
          default: 'localhost'
        });
    },
    (argv) => {
      console.log(`启动服务器: ${argv.host}:${argv.port}`);
      // 实际服务器启动逻辑
    }
  )
  .command(
    'build <target>',
    '构建项目',
    (yargs) => {
      return yargs
        .positional('target', {
          describe: '构建目标',
          type: 'string',
          choices: ['development', 'production']
        })
        .option('minify', {
          type: 'boolean',
          description: '是否压缩输出',
          default: false
        });
    },
    (argv) => {
      console.log(`构建目标: ${argv.target}, 压缩: ${argv.minify}`);
      // 实际构建逻辑
    }
  )
  .demandCommand(1, '需要指定一个命令')
  .help()
  .argv;
```

### Commander - 流行的 CLI 框架

Commander 是另一个广泛使用的 CLI 框架，以其清晰的 API 结构著称。

```javascript
// commander-demo.mjs
import { Command } from 'commander';

const program = new Command();

program
  .name('my-cli')
  .description('一个现代化的 CLI 工具')
  .version('1.0.0');

program
  .option('-d, --debug', '启用调试模式', false)
  .option('-c, --config <file>', '配置文件路径', 'config.json')
  .option('-p, --port <number>', '端口号', parseInt, 3000);

program
  .command('start <service>')
  .description('启动指定服务')
  .option('--daemon', '以守护进程运行', false)
  .action((service, options) => {
    console.log(`启动服务: ${service}`);
    console.log('选项:', options);
    if (options.daemon) {
      console.log('以守护进程模式运行');
    }
  });

program.parse(process.argv);

// 执行示例:
// node commander-demo.mjs start api --daemon --port 8080
// 输出: 启动服务: api, 选项: { daemon: true, port: 8080 }
```

## Node.js 原生方案

### util.parseArgs

Node.js 20+ 提供了稳定的 `util.parseArgs` API，作为内置的参数解析解决方案。

```javascript
// util-parseargs.mjs
import { parseArgs } from 'node:util';

const options = {
  port: {
    type: 'string',
    short: 'p',
    default: '3000'
  },
  verbose: {
    type: 'boolean',
    short: 'v'
  },
  config: {
    type: 'string',
    short: 'c'
  }
};

try {
  const { values, positionals } = parseArgs({ options, args: process.argv.slice(2) });
  
  console.log('解析的值:', values);
  console.log('位置参数:', positionals);
  
  // 类型转换示例
  const port = parseInt(values.port || '3000');
  console.log('端口号:', port);
  
} catch (error) {
  console.error('参数解析错误:', error.message);
  process.exit(1);
}

// 执行: node util-parseargs.mjs -p 8080 -v --config=app.json file1 file2
// 输出: 
// 解析的值: { port: '8080', verbose: true, config: 'app.json' }
// 位置参数: ['file1', 'file2']
// 端口号: 8080
```

### 高级原生配置

```javascript
// util-parseargs-advanced.mjs
import { parseArgs } from 'node:util';

const options = {
  // 字符串类型选项
  'api-key': { type: 'string' },
  'environment': { type: 'string', short: 'e', default: 'development' },
  
  // 布尔类型选项  
  'verbose': { type: 'boolean', short: 'v' },
  'silent': { type: 'boolean' },
  'help': { type: 'boolean', short: 'h' },
  
  // 多个值选项
  'include': { type: 'string', multiple: true },
  'exclude': { type: 'string', multiple: true, short: 'x' }
};

const { values, positionals, tokens } = parseArgs({
  options,
  args: process.argv.slice(2),
  tokens: true, // 获取解析的token信息
  strict: true  // 严格模式，未知选项会报错
});

console.log('解析结果:');
console.log('- 选项值:', values);
console.log('- 位置参数:', positionals);
console.log('- 解析token:', tokens);

// 帮助信息生成
if (values.help) {
  console.log(`
用法: node util-parseargs-advanced.mjs [选项] [文件...]

选项:
  -e, --environment <值>  运行环境 (默认: "development")
  -v, --verbose           详细输出
  --api-key <值>          API密钥
  --silent                静默模式
  -x, --exclude <值>      排除文件 (可多次使用)
  --include <值>          包含文件 (可多次使用)
  -h, --help              显示此帮助信息
  `);
  process.exit(0);
}
```

## 实际应用场景

### 配置管理工具

```javascript
// config-manager.mjs
import { parseArgs } from 'node:util';
import fs from 'fs/promises';

class ConfigManager {
  static options = {
    config: { type: 'string', short: 'c', default: './config.json' },
    set: { type: 'string' },
    get: { type: 'string' },
    delete: { type: 'string' },
    list: { type: 'boolean', short: 'l' }
  };

  static async handleCommand() {
    const { values } = parseArgs({ 
      options: this.options, 
      args: process.argv.slice(2) 
    });

    try {
      if (values.set) {
        await this.setConfig(values.set, values.config);
      } else if (values.get) {
        await this.getConfig(values.get, values.config);
      } else if (values.delete) {
        await this.deleteConfig(values.delete, values.config);
      } else if (values.list) {
        await this.listConfig(values.config);
      } else {
        this.showHelp();
      }
    } catch (error) {
      console.error('错误:', error.message);
      process.exit(1);
    }
  }

  static async setConfig(key, configPath) {
    const config = await this.loadConfig(configPath);
    config[key] = process.argv[4]; // 简单示例
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    console.log(`设置 ${key} = ${process.argv[4]}`);
  }

  static async loadConfig(configPath) {
    try {
      const data = await fs.readFile(configPath, 'utf8');
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  static showHelp() {
    console.log(`
配置管理工具用法:

设置配置: node config-manager.mjs --set <key> <value> [--config <path>]
获取配置: node config-manager.mjs --get <key> [--config <path>]
删除配置: node config-manager.mjs --delete <key> [--config <path>]
列出配置: node config-manager.mjs --list [--config <path>]
    `);
  }
}

ConfigManager.handleCommand();
```

### 开发服务器启动器

```javascript
// dev-server.mjs
import { parseArgs } from 'node:util';

const options = {
  port: { type: 'string', short: 'p', default: '3000' },
  host: { type: 'string', short: 'H', default: 'localhost' },
  open: { type: 'boolean', short: 'o' },
  https: { type: 'boolean' },
  'log-level': { 
    type: 'string', 
    default: 'info',
    choices: ['error', 'warn', 'info', 'debug']
  }
};

function startServer(config) {
  console.log('启动开发服务器:');
  console.log('地址:', `${config.https ? 'https' : 'http'}://${config.host}:${config.port}`);
  console.log('日志级别:', config.logLevel);
  if (config.open) {
    console.log('自动在浏览器中打开');
  }
  
  // 实际服务器启动逻辑
  // const server = createServer({ ...config });
  // server.listen(config.port, config.host);
}

try {
  const { values } = parseArgs({ options, args: process.argv.slice(2) });
  
  const config = {
    port: parseInt(values.port),
    host: values.host,
    open: values.open || false,
    https: values.https || false,
    logLevel: values['log-level']
  };
  
  startServer(config);
  
} catch (error) {
  console.error('配置错误:', error.message);
  process.exit(1);
}
```

## 选择适合的方案

不同场景下的参数解析方案选择：

```
项目复杂度         推荐方案               特点
───────          ───────────          ────────────────
简单脚本        process.argv 手动解析   无依赖，完全控制
           或 util.parseArgs          Node.js 内置

轻量工具        minimist              轻量级，基础解析
                                   将参数转为对象

复杂CLI        yargs 或 commander    功能全面，支持命令、
                                   验证、帮助生成等
```

选择考量因素：
- **依赖偏好**：希望减少依赖时优先考虑原生方案
- **功能需求**：需要命令、子命令、验证等高级功能时选择 yargs 或 commander
- **性能要求**：对启动性能敏感的场景选择轻量级方案
- **维护性**：长期维护的项目建议使用生态良好的成熟库