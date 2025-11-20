# 脚本与命令

## Node.js 命令行基础

Node.js 命令行脚本是基于 Node.js 运行时开发的终端工具，通过命令行界面与用户交互。它们以可执行脚本形式存在，能够跨平台运行，是现代化开发工作流的重要组成部分。

基本执行流程：
```
用户输入命令 -> Node.js 解析执行 -> 终端输出结果
```

## 脚本的编写与执行

### 基础脚本执行

最简单的 Node.js 脚本执行方式是通过 `node` 命令直接运行 JavaScript 文件：

```javascript
// app.js
console.log('Hello, Node.js CLI!');
```

执行命令：
```bash
node app.js
```

### Shebang 声明

为了使脚本可直接执行，需要在文件首行添加 Shebang 声明：

```javascript
#!/usr/bin/env node

// 您的 JavaScript 代码
console.log('直接可执行的脚本');
```

设置文件可执行权限：
```bash
chmod u+x app.js
```

之后便可直接运行：
```bash
./app.js
```

### ESM 模块支持

Node.js 支持 ECMAScript 模块 (ESM)，可通过两种方式启用：

1. **使用 `.mjs` 扩展名**：
```javascript
// math.mjs
export function add(a, b) {
    return a + b;
}

// main.mjs
import { add } from './math.mjs';
console.log(add(1, 2)); // 输出 3
```

2. **在 package.json 中设置 type 字段**：
```json
{
  "name": "my-project",
  "version": "1.0.0",
  "type": "module"
}
```

## 命令创建与发布

### 包配置与命令映射

在 package.json 中配置 bin 字段，将命令映射到执行文件：

```json
{
  "name": "my-cli-tool",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "my-command": "./bin/cli.js"
  }
}
```

### 全局安装与调试

开发过程中可使用 npm link 创建全局软连接进行测试：

```bash
npm link
```

调试流程：
```
编写脚本 -> 添加bin配置 -> npm link -> 全局测试 -> 发布
```

## Node.js 命令行选项

### 脚本执行选项

Node.js 提供了丰富的命令行选项来控制脚本执行行为：

```bash
# 直接执行字符串脚本
node -e "console.log('Hello from eval')"

# 检查语法而不执行
node -c script.js

# 启用文件监视模式（Node.js v16+）
node --watch app.js

# 启动 REPL 交互环境
node -i
```

### 调试与诊断选项

```bash
# 启用调试器
node --inspect app.js

# 在脚本开始处中断
node --inspect-brk app.js

# 跟踪弃用警告
node --trace-deprecation app.js

# 启用源映射支持
node --enable-source-maps app.js
```

## 核心 API 详解

### Process 模块

process 是 Node.js 的全局对象，提供当前进程相关信息。

#### 命令行参数获取

```javascript
// process-args.mjs
const args = process.argv.slice(2);
console.log('命令行参数:', args);

// 参数解析示例
const options = {};
const positionalArgs = [];

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg.startsWith('--')) {
    const key = arg.slice(2);
    const nextArg = args[i + 1];
    if (nextArg && !nextArg.startsWith('--')) {
      options[key] = nextArg;
      i++;
    } else {
      options[key] = true;
    }
  } else {
    positionalArgs.push(arg);
  }
}

console.log('选项:', options);
console.log('位置参数:', positionalArgs);
```

使用示例：
```bash
node process-args.mjs --output dist --verbose file1.js file2.js
```

#### 工作目录管理

```javascript
// process-dir.mjs
import process from 'process';

console.log('当前工作目录:', process.cwd());
console.log('平台信息:', process.platform);
console.log('环境变量:', process.env.NODE_ENV);

// 改变工作目录
process.chdir('/tmp');
console.log('新工作目录:', process.cwd());
```

#### 环境变量管理

```javascript
// env-config.mjs
import process from 'process';

// 读取环境变量
const nodeEnv = process.env.NODE_ENV || 'development';
const apiKey = process.env.API_KEY;

console.log(`运行环境: ${nodeEnv}`);
console.log(`API Key: ${apiKey ? '已设置' : '未设置'}`);

// 设置环境变量（仅当前进程有效）
process.env.CUSTOM_VAR = 'custom value';

// 环境特定的配置
const config = {
  development: {
    apiUrl: 'http://localhost:3000',
    debug: true
  },
  production: {
    apiUrl: 'https://api.example.com',
    debug: false
  }
};

const currentConfig = config[nodeEnv] || config.development;
console.log('当前配置:', currentConfig);
```

### Path 模块

path 模块处理文件路径相关操作。

```javascript
// path-demo.mjs
import path from 'path';
import { fileURLToPath } from 'url';

// ES模块中获取 __dirname 等价物
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('文件路径:', __filename);
console.log('目录路径:', __dirname);

// 路径拼接
const fullPath = path.join(__dirname, 'dist', 'bundle.js');
console.log('完整路径:', fullPath);

// 路径解析
const parsedPath = path.parse(fullPath);
console.log('解析后的路径:', parsedPath);

// 相对路径计算
const relativePath = path.relative(__dirname, '/usr/local/bin');
console.log('相对路径:', relativePath);

// 路径规范化
const normalizedPath = path.normalize('/foo/bar//baz/asdf/quux/..');
console.log('规范化路径:', normalizedPath);
```

### File System 模块

fs 模块提供文件系统操作功能。

```javascript
// fs-demo.mjs
import fs from 'fs/promises';
import path from 'path';

class FileManager {
  constructor(baseDir = process.cwd()) {
    this.baseDir = baseDir;
  }
  
  async createProjectStructure(projectName) {
    const projectPath = path.join(this.baseDir, projectName);
    
    try {
      // 创建项目目录
      await fs.mkdir(projectPath, { recursive: true });
      console.log(`创建项目目录: ${projectPath}`);
      
      // 创建子目录
      const dirs = ['src', 'dist', 'test', 'config'];
      for (const dir of dirs) {
        const dirPath = path.join(projectPath, dir);
        await fs.mkdir(dirPath, { recursive: true });
        console.log(`创建目录: ${dir}`);
      }
      
      // 创建 package.json
      const packageJson = {
        name: projectName,
        version: '1.0.0',
        type: 'module',
        main: 'src/index.js',
        scripts: {
          start: 'node src/index.js',
          test: 'node test/index.js'
        }
      };
      
      const packagePath = path.join(projectPath, 'package.json');
      await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2));
      console.log('创建 package.json');
      
      return projectPath;
    } catch (error) {
      console.error('创建项目结构失败:', error.message);
      throw error;
    }
  }
  
  async watchFileChanges(filePath, callback) {
    try {
      const watcher = fs.watch(filePath);
      for await (const event of watcher) {
        console.log(`文件 ${filePath} 发生变化:`, event);
        if (callback) {
          await callback(event, filePath);
        }
      }
    } catch (error) {
      console.error('监听文件变化失败:', error.message);
    }
  }
}

// 使用示例
const fileManager = new FileManager();
// fileManager.createProjectStructure('my-new-project');
```

## 高级命令行功能

### 参数解析与验证

```javascript
// advanced-args.mjs
import { Command } from 'commander';

const program = new Command();

program
  .name('my-cli')
  .description('一个高级命令行工具示例')
  .version('1.0.0');

program
  .argument('<input>', '输入文件路径')
  .option('-o, --output <file>', '输出文件路径')
  .option('-v, --verbose', '详细输出模式')
  .option('-c, --config <file>', '配置文件路径')
  .requiredOption('-u, --user <name>', '必须的用户名')
  .action(async (input, options) => {
    console.log(`处理输入文件: ${input}`);
    
    if (options.verbose) {
      console.log('详细模式已启用');
      console.log('选项:', options);
    }
    
    // 模拟异步操作
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('处理完成');
  });

// 自定义命令
program
  .command('init <project-name>')
  .description('初始化新项目')
  .option('-t, --template <name>', '项目模板名称')
  .action((projectName, options) => {
    console.log(`初始化项目: ${projectName}`);
    if (options.template) {
      console.log(`使用模板: ${options.template}`);
    }
  });

program.parse(process.argv);
```

### 用户交互界面

```javascript
// interactive-cli.mjs
import readline from 'readline/promises';

class InteractiveCLI {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }
  
  async promptUser() {
    console.log('=== Node.js 命令行交互示例 ===\n');
    
    const name = await this.rl.question('请输入您的姓名: ');
    const age = await this.rl.question('请输入您的年龄: ');
    const framework = await this.rl.question('您最喜欢的框架: ');
    
    const confirm = await this.rl.question(
      `确认信息?\n姓名: ${name}\n年龄: ${age}\n框架: ${framework}\n(y/N): `
    );
    
    if (confirm.toLowerCase() === 'y') {
      console.log('\n✅ 信息已保存!');
      this.generateSummary({ name, age, framework });
    } else {
      console.log('\n❌ 操作已取消');
    }
    
    this.rl.close();
  }
  
  generateSummary(data) {
    const summary = `
用户信息摘要:
──────────────
姓名: ${data.name}
年龄: ${data.age}
偏好框架: ${data.framework}
──────────────
    `.trim();
    
    console.log(summary);
  }
}

// 使用示例
const cli = new InteractiveCLI();
// cli.promptUser();
```

### 子进程管理

```javascript
// child-process.mjs
import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class ProcessManager {
  static async runCommand(command, options = {}) {
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: options.cwd || process.cwd(),
        env: { ...process.env, ...options.env }
      });
      
      if (stdout) console.log('输出:', stdout);
      if (stderr) console.error('错误:', stderr);
      
      return { stdout, stderr };
    } catch (error) {
      console.error(`执行命令失败: ${command}`, error.message);
      throw error;
    }
  }
  
  static spawnProcess(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: 'inherit',
        ...options
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`进程退出码: ${code}`));
        }
      });
      
      child.on('error', reject);
    });
  }
  
  static async gitOperations() {
    const commands = [
      'git status',
      'git add .',
      'git commit -m "自动化提交"',
      'git push'
    ];
    
    for (const command of commands) {
      console.log(`执行: ${command}`);
      await this.runCommand(command);
    }
  }
}

// 使用示例
// ProcessManager.runCommand('ls -la');
// ProcessManager.spawnProcess('npm', ['install']);
```

## 性能优化与调试

### 内存管理与性能分析

```javascript
// performance.mjs
import process from 'process';

class PerformanceMonitor {
  static startMonitoring() {
    console.log('开始性能监控...\n');
    
    // 内存使用监控
    setInterval(() => {
      const usage = process.memoryUsage();
      console.log(`内存使用: 
        RSS: ${Math.round(usage.rss / 1024 / 1024)}MB
        Heap: ${Math.round(usage.heapUsed / 1024 / 1024)}/${Math.round(usage.heapTotal / 1024 / 1024)}MB
      `.replace(/^\s+/gm, ''));
    }, 5000);
  }
  
  static enableProfiling() {
    // 启动 CPU 分析
    console.log('CPU 分析已启用');
    
    process.on('SIGUSR1', () => {
      console.log('收到性能分析信号');
    });
  }
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n🛑 接收到中断信号，正在退出...');
  process.exit(0);
});

// PerformanceMonitor.startMonitoring();
```

以上示例展示了 Node.js 命令行脚本与命令的核心概念和高级功能，涵盖了从基础脚本执行到复杂交互式工具的完整开发流程。