# 简介

## 什么是 Node.js 命令行应用

Node.js 命令行应用是基于 Node.js 运行时开发的终端工具，通过命令行界面与用户交互。这类应用通常以可执行脚本形式存在，能够跨平台运行。

```
用户输入命令 -> Node.js解析执行 -> 终端输出结果
```

## 核心优势

### 跨平台兼容性
Node.js 内置的 `os` 模块和第三方库如 `cross-spawn` 确保代码在 Windows、Linux、macOS 上一致运行。

### 丰富的生态系统
npm 仓库提供数千个专门用于命令行开发的包，覆盖从参数解析到界面交互的各个方面。

### JavaScript 全栈统一
前后端开发使用相同语言，减少上下文切换成本。

## 关键技术组成

### 脚本声明

创建可执行文件时，首行需要添加 Shebang 声明：

```javascript
#!/usr/bin/env node

import { program } from 'commander';

program
  .version('1.0.0')
  .parse(process.argv);
```

文件需设置执行权限：
```bash
chmod +x cli.js
```

### 参数解析

#### 基础参数处理

```javascript
// 获取原始参数
console.log(process.argv); // ['node', 'script.js', 'arg1', 'arg2']

// 使用 commander 进行高级解析
import { Command } from 'commander';

const program = new Command();

program
  .name('my-cli')
  .description('一个示例命令行工具')
  .version('0.1.0');

program
  .argument('<input>', '输入文件')
  .option('-o, --output <file>', '输出文件')
  .action((input, options) => {
    console.log(`处理文件: ${input}`);
    if (options.output) {
      console.log(`输出到: ${options.output}`);
    }
  });

program.parse();
```

#### 复杂选项配置

```javascript
program
  .option('-v, --verbose', '详细输出模式', false)
  .option('-c, --count <number>', '重复次数', parseInt)
  .requiredOption('-u, --user <name>', '必须的用户名')
  .option('--no-color', '禁用颜色输出');
```

### 用户交互

#### 输入提示

```javascript
import readline from 'readline/promises';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const name = await rl.question('请输入您的姓名: ');
const age = await rl.question('请输入您的年龄: ');

console.log(`您好 ${name}, 您 ${age} 岁`);
rl.close();
```

#### 使用 Inquirer.js 增强交互

```javascript
import inquirer from 'inquirer';

const answers = await inquirer.prompt([
  {
    type: 'list',
    name: 'framework',
    message: '选择您喜欢的框架:',
    choices: ['React', 'Vue', 'Angular', 'Svelte']
  },
  {
    type: 'checkbox',
    name: 'tools',
    message: '选择开发工具:',
    choices: [
      { name: 'ESLint', value: 'eslint' },
      { name: 'Prettier', value: 'prettier' },
      { name: 'TypeScript', value: 'typescript' }
    ]
  },
  {
    type: 'confirm',
    name: 'confirm',
    message: '确认创建项目?',
    default: true
  }
]);

console.log('用户选择:', answers);
```

### 终端样式

#### 基础文本样式

```javascript
import chalk from 'chalk';

console.log(chalk.blue('蓝色信息文本'));
console.log(chalk.red.bold('红色加粗错误信息'));
console.log(chalk.green(`
  成功消息:
  ✅ 操作完成
  📁 文件已创建
`));

// 使用模板字符串
const fileName = 'config.json';
console.log(chalk`{green 成功} 创建文件 {yellow ${fileName}}`);
```

#### 进度显示

```javascript
import cliProgress from 'cli-progress';

// 创建进度条
const progressBar = new cliProgress.SingleBar({
  format: '进度 |{bar}| {percentage}% | {value}/{total}',
  barCompleteChar: '█',
  barIncompleteChar: '░',
  hideCursor: true
});

progressBar.start(100, 0);

// 模拟进度更新
for (let i = 0; i <= 100; i++) {
  progressBar.update(i);
  await new Promise(resolve => setTimeout(resolve, 50));
}

progressBar.stop();
```

### 文件系统操作

```javascript
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 递归目录遍历
async function scanDirectory(dirPath) {
  const items = await fs.readdir(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = await fs.stat(fullPath);
    
    if (stat.isDirectory()) {
      console.log(`📁 ${fullPath}`);
      await scanDirectory(fullPath);
    } else {
      console.log(`📄 ${fullPath}`);
    }
  }
}

// 文件模板生成
async function createFromTemplate(templatePath, outputPath, variables) {
  let content = await fs.readFile(templatePath, 'utf8');
  
  // 替换变量
  Object.entries(variables).forEach(([key, value]) => {
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  
  await fs.writeFile(outputPath, content);
  console.log(`创建文件: ${outputPath}`);
}
```

### 子进程管理

```javascript
import { spawn } from 'child_process';
import { promisify } from 'util';

// 执行系统命令
async function executeCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      ...options
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`命令执行失败，退出码: ${code}`));
      }
    });
    
    child.on('error', reject);
  });
}

// 使用示例
try {
  await executeCommand('git', ['clone', 'https://github.com/user/repo.git']);
  console.log('仓库克隆成功');
} catch (error) {
  console.error('克隆失败:', error.message);
}
```

## 开发最佳实践

### 错误处理

```javascript
import process from 'process';

// 统一错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n接收到中断信号，正在退出...');
  process.exit(0);
});
```

### 配置管理

```javascript
import { homedir } from 'os';
import { join } from 'path';
import fs from 'fs';

class ConfigManager {
  constructor(appName) {
    this.configDir = join(homedir(), `.${appName}`);
    this.configFile = join(this.configDir, 'config.json');
  }
  
  async ensureConfigDir() {
    try {
      await fs.promises.access(this.configDir);
    } catch {
      await fs.promises.mkdir(this.configDir, { recursive: true });
    }
  }
  
  async loadConfig() {
    try {
      const data = await fs.promises.readFile(this.configFile, 'utf8');
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  
  async saveConfig(config) {
    await this.ensureConfigDir();
    await fs.promises.writeFile(
      this.configFile, 
      JSON.stringify(config, null, 2)
    );
  }
}
```

### 性能优化

```javascript
// 使用流处理大文件
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createGzip } from 'zlib';

async function compressFile(inputPath, outputPath) {
  await pipeline(
    createReadStream(inputPath),
    createGzip(),
    createWriteStream(outputPath)
  );
}

// 并行处理
import { promises as fs } from 'fs';
import { cpus } from 'os';

async function processFilesParallel(files, processor) {
  const concurrency = Math.min(cpus().length, files.length);
  const results = [];
  
  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(file => processor(file))
    );
    results.push(...batchResults);
  }
  
  return results;
}
```

## 发布与分发

### package.json 配置

```json
{
  "name": "my-cli-tool",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "my-cli": "./bin/cli.js"
  },
  "files": [
    "bin",
    "lib"
  ],
  "engines": {
    "node": ">=14.0.0"
  }
}
```

### 安装测试

```bash
# 全局安装测试
npm install -g .

# 使用npx测试
npx my-cli-tool --help
```