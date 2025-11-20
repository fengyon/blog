# 输入

## Node.js 命令行输入概述

在 Node.js 应用开发中，命令行输入是实现与用户交互的核心环节。通过接收和处理用户输入，命令行工具能够动态响应指令、收集参数和执行个性化操作，从而完成从简单脚本到复杂交互式应用的各种任务。

Node.js 提供了多种处理命令行输入的方案，从基础的原生模块到功能丰富的高级库，形成了完整的输入处理生态：

```
基础输入 → 单行问答 (readline.question)
中级处理 → 事件驱动 (readline.on)  
高级交互 → 丰富组件 (Inquirer.js)
专业方案 → 可测试架构 (Clack)
```

## 原生输入处理方案

### Readline 模块基础

Node.js 自 7.0 版本起提供了 `readline` 模块，用于从可读流 (如 `process.stdin`) 逐行获取输入。这是处理命令行输入最基础且强大的原生方案。

#### 单行输入问答

```javascript
// readline-basic.mjs
import readline from 'node:readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('请输入您的姓名：', (answer) => {
  console.log(`您好，${answer}！`);
  rl.close();
});
```

#### 事件驱动输入处理

对于需要连续输入或复杂交互的场景，事件驱动模式更加灵活：

```javascript
// readline-events.mjs
import readline from 'node:readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'CLI> '
});

console.log('请输入命令 (输入 "exit" 退出)：');
rl.prompt();

rl.on('line', (input) => {
  const command = input.trim();
  
  switch(command) {
    case 'exit':
      rl.close();
      break;
    case 'help':
      console.log('可用命令: help, version, exit');
      break;
    case 'version':
      console.log('CLI工具 v1.0.0');
      break;
    case '':
      // 忽略空行
      break;
    default:
      console.log(`未知命令: ${command}`);
  }
  
  rl.prompt();
});

rl.on('close', () => {
  console.log('再见！');
  process.exit(0);
});
```

### Process.stdin 低级 API

对于需要更精细控制的场景，可以直接使用 `process.stdin`：

```javascript
// stdin-raw.mjs
process.stdin.setRawMode(true);
process.stdin.setEncoding('utf8');

console.log('按任意键查看键值，按 Ctrl+C 退出');

process.stdin.on('data', (key) => {
  // Ctrl+C 退出
  if (key === '\u0003') {
    console.log('再见！');
    process.exit();
  }
  
  console.log(`按键: ${key} (十六进制: ${Buffer.from(key).toString('hex')})`);
});
```

## 第三方输入处理库

### Inquirer.js - 功能全面的交互库

Inquirer.js 是目前 Node.js 生态中最主流的命令行交互库，每周下载量超 1000 万次，被众多知名工具采用。它提供了丰富的交互类型和灵活的配置选项。

#### 基础问答流程

```javascript
// inquirer-basic.mjs
import inquirer from 'inquirer';

const questions = [
  {
    type: 'input',
    name: 'projectName',
    message: '请输入项目名称：',
    default: 'my-project',
    validate: (value) => {
      if (/^[a-z-]+$/.test(value)) {
        return true;
      }
      return '项目名称只能包含小写字母和短横线！';
    }
  },
  {
    type: 'confirm',
    name: 'initGit',
    message: '是否初始化 Git 仓库？',
    default: true
  }
];

const answers = await inquirer.prompt(questions);
console.log('项目配置:', answers);
```

#### 丰富的交互类型

Inquirer.js 支持 10+ 种交互类型，覆盖绝大多数命令行交互场景：

**输入框与密码框**
```javascript
// inquirer-advanced.mjs
import inquirer from 'inquirer';

const questions = [
  {
    type: 'input',
    name: 'username',
    message: '请输入用户名：',
    validate: async (value) => {
      // 模拟异步验证
      await new Promise(resolve => setTimeout(resolve, 500));
      return value.length >= 3 ? true : '用户名至少3个字符';
    }
  },
  {
    type: 'password',
    name: 'password',
    message: '请输入密码：',
    mask: '*', // 用 * 显示输入长度
    validate: (value) => value.length >= 6 ? true : '密码至少6位'
  }
];
```

**列表选择**
```javascript
const selectionQuestions = [
  {
    type: 'list',
    name: 'framework',
    message: '请选择项目框架：',
    choices: [
      { name: 'Vue 3', value: 'vue3' },
      { name: 'React 18', value: 'react' },
      { name: 'Angular', value: 'angular' },
      new inquirer.Separator(),
      { name: '自定义配置', value: 'custom' }
    ],
    pageSize: 3 // 控制显示选项数量
  },
  {
    type: 'checkbox',
    name: 'features',
    message: '选择需要集成的功能：',
    choices: [
      { name: 'TypeScript', value: 'ts', checked: true },
      { name: 'ESLint', value: 'eslint' },
      { name: 'Prettier', value: 'prettier' },
      { name: '单元测试', value: 'test' }
    ],
    validate: (selected) => 
      selected.length > 0 ? true : '至少选择一个功能'
  }
];
```

**高级交互组件**
```javascript
const advancedQuestions = [
  {
    type: 'rawlist',
    name: 'priority',
    message: '选择优先级（输入编号）：',
    choices: ['高', '中', '低', '紧急']
  },
  {
    type: 'expand',
    name: 'confirmation',
    message: '确认执行此操作？',
    default: 'y',
    choices: [
      { key: 'y', name: '是', value: 'yes' },
      { key: 'n', name: '否', value: 'no' },
      { key: 'a', name: '全部', value: 'all' }
    ]
  }
];
```

### Prompt-Sync - 同步输入方案

对于需要同步编程模式的场景，`prompt-sync` 提供了简洁的同步 API：

```javascript
// prompt-sync.mjs
import promptSync from 'prompt-sync';

const prompt = promptSync();

// 基本输入
const name = prompt('请输入您的姓名: ');
console.log(`您好，${name}！`);

// 隐藏输入（密码）
const password = prompt('请输入密码: ', { echo: '*' });

// 必填验证
const requiredInput = prompt('必填项: ', { value: '' });
if (!requiredInput) {
  console.log('此项为必填！');
  process.exit(1);
}
```

## 输入验证与转换

### 数据验证策略

有效的输入验证是构建健壮命令行工具的关键：

```javascript
// validation.mjs
import inquirer from 'inquirer';

const validators = {
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? true : '请输入有效的邮箱地址';
  },
  
  numberRange: (min, max) => (value) => {
    const num = parseInt(value);
    if (isNaN(num)) return '请输入数字';
    return num >= min && num <= max ? true : `请输入${min}-${max}之间的数字`;
  },
  
  filePath: async (value) => {
    const fs = await import('fs/promises');
    try {
      await fs.access(value);
      return true;
    } catch {
      return '文件路径不存在';
    }
  }
};

const questions = [
  {
    type: 'input',
    name: 'userEmail',
    message: '请输入邮箱：',
    validate: validators.email
  },
  {
    type: 'input',
    name: 'age',
    message: '请输入年龄（18-99）：',
    validate: validators.numberRange(18, 99)
  }
];
```

### 输入数据转换

在接收输入的同时对数据进行格式化处理：

```javascript
// transformation.mjs
import inquirer from 'inquirer';

const questions = [
  {
    type: 'input',
    name: 'tags',
    message: '输入标签（逗号分隔）：',
    filter: (input) => {
      return input.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
    },
    transformer: (input) => {
      // 实时显示转换效果
      const tags = input.split(',').map(t => t.trim()).filter(t => t);
      return `[${tags.join(', ')}]`;
    }
  },
  {
    type: 'input',
    name: 'price',
    message: '输入价格：',
    filter: (input) => {
      // 转换为数字，处理小数位
      const num = parseFloat(input);
      return isNaN(num) ? input : Math.round(num * 100) / 100;
    }
  }
];
```

## 高级输入处理模式

### 条件性问题流

根据用户之前的回答动态调整后续问题：

```javascript
// conditional.mjs
import inquirer from 'inquirer';

const baseQuestions = [
  {
    type: 'list',
    name: 'projectType',
    message: '选择项目类型：',
    choices: ['前端', '后端', '全栈']
  }
];

// 动态问题生成
const getFollowupQuestions = (answers) => {
  const questions = [];
  
  if (answers.projectType === '前端') {
    questions.push({
      type: 'checkbox',
      name: 'frontendFeatures',
      message: '选择前端特性：',
      choices: ['响应式设计', 'PWA', 'TypeScript', '状态管理']
    });
  } else if (answers.projectType === '后端') {
    questions.push({
      type: 'list',
      name: 'database',
      message: '选择数据库：',
      choices: ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis']
    });
  }
  
  // 全栈项目添加额外配置
  if (answers.projectType === '全栈') {
    questions.push(
      {
        type: 'confirm',
        name: 'useAPI',
        message: '是否需要 REST API？',
        default: true
      },
      {
        type: 'confirm',
        name: 'useAuth',
        message: '是否需要用户认证？',
        default: false,
        when: (currentAnswers) => currentAnswers.useAPI
      }
    );
  }
  
  return questions;
};

const baseAnswers = await inquirer.prompt(baseQuestions);
const followupQuestions = getFollowupQuestions(baseAnswers);
const allAnswers = await inquirer.prompt(followupQuestions);

console.log('完整配置:', { ...baseAnswers, ...allAnswers });
```

### 可测试的输入架构

借鉴 Clack 项目的设计理念，通过依赖注入实现可测试的输入处理：

```javascript
// testable-input.mjs
import { Readable } from 'node:stream';

class TestableCLI {
  constructor(inputStream = process.stdin) {
    this.inputStream = inputStream;
  }
  
  async promptUser() {
    const readline = await import('node:readline');
    
    const rl = readline.createInterface({
      input: this.inputStream,
      output: process.stdout
    });
    
    return new Promise((resolve) => {
      rl.question('请输入命令：', (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }
}

// 生产环境使用真实输入
const productionCLI = new TestableCLI();

// 测试环境使用模拟输入
const mockInput = new Readable({
  read() {
    this.push('test command\n');
    this.push(null);
  }
});
const testCLI = new TestableCLI(mockInput);

// 使用示例
if (process.env.NODE_ENV === 'test') {
  const result = await testCLI.promptUser();
  console.log('测试输入:', result);
} else {
  const result = await productionCLI.promptUser();
  console.log('用户输入:', result);
}
```

## 实际应用场景

### 项目初始化工具

结合多种输入类型构建完整的项目初始化流程：

```javascript
// project-init.mjs
import inquirer from 'inquirer';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import fs from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ProjectInitializer {
  constructor() {
    this.config = {};
  }
  
  async gatherRequirements() {
    const questions = [
      {
        type: 'input',
        name: 'name',
        message: '项目名称：',
        default: 'my-project',
        validate: (value) => 
          /^[a-z0-9-]+$/.test(value) ? true : '名称只能包含小写字母、数字和横线'
      },
      {
        type: 'input',
        name: 'version',
        message: '版本号：',
        default: '1.0.0'
      },
      {
        type: 'input',
        name: 'description',
        message: '项目描述：'
      },
      {
        type: 'list',
        name: 'template',
        message: '选择模板：',
        choices: [
          { name: 'Node.js 后端应用', value: 'node' },
          { name: 'React 前端应用', value: 'react' },
          { name: 'Vue 前端应用', value: 'vue' },
          { name: '全栈应用', value: 'fullstack' }
        ]
      },
      {
        type: 'checkbox',
        name: 'features',
        message: '选择功能特性：',
        choices: [
          { name: 'TypeScript', value: 'typescript' },
          { name: 'ESLint', value: 'eslint' },
          { name: 'Prettier', value: 'prettier' },
          { name: '测试框架', value: 'testing' },
          { name: 'Docker 配置', value: 'docker' }
        ]
      },
      {
        type: 'confirm',
        name: 'initGit',
        message: '初始化 Git 仓库？',
        default: true
      }
    ];
    
    this.config = await inquirer.prompt(questions);
    return this.config;
  }
  
  async confirmAndCreate() {
    console.log('\n=== 项目配置总结 ===');
    console.log(JSON.stringify(this.config, null, 2));
    
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: '确认创建项目？',
        default: true
      }
    ]);
    
    if (confirm) {
      await this.createProject();
      console.log('✅ 项目创建成功！');
    } else {
      console.log('❌ 操作已取消');
    }
  }
  
  async createProject() {
    // 实际的项目创建逻辑
    const projectPath = join(process.cwd(), this.config.name);
    await fs.mkdir(projectPath, { recursive: true });
    
    // 创建 package.json
    const packageJson = {
      name: this.config.name,
      version: this.config.version,
      description: this.config.description,
      type: 'module'
    };
    
    await fs.writeFile(
      join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
  }
}

// 使用示例
const initializer = new ProjectInitializer();
await initializer.gatherRequirements();
await initializer.confirmAndCreate();
```

### 配置管理工具

实现交互式的配置管理和编辑功能：

```javascript
// config-manager.mjs
import inquirer from 'inquirer';
import fs from 'fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

class ConfigManager {
  constructor() {
    this.configPath = join(homedir(), '.myclirc');
    this.config = {};
  }
  
  async loadConfig() {
    try {
      const data = await fs.readFile(this.configPath, 'utf8');
      this.config = JSON.parse(data);
    } catch {
      this.config = {};
    }
    return this.config;
  }
  
  async interactiveSetup() {
    const currentConfig = await this.loadConfig();
    
    const questions = [
      {
        type: 'input',
        name: 'apiEndpoint',
        message: 'API 端点：',
        default: currentConfig.apiEndpoint || 'https://api.example.com'
      },
      {
        type: 'input',
        name: 'apiKey',
        message: 'API 密钥：',
        default: currentConfig.apiKey || ''
      },
      {
        type: 'list',
        name: 'logLevel',
        message: '日志级别：',
        choices: [
          { name: '错误', value: 'error' },
          { name: '警告', value: 'warn' },
          { name: '信息', value: 'info' },
          { name: '调试', value: 'debug' }
        ],
        default: currentConfig.logLevel || 'info'
      },
      {
        type: 'confirm',
        name: 'autoUpdate',
        message: '启用自动更新？',
        default: currentConfig.autoUpdate !== false
      }
    ];
    
    const newConfig = await inquirer.prompt(questions);
    this.config = { ...currentConfig, ...newConfig };
    
    await this.saveConfig();
    return this.config;
  }
  
  async saveConfig() {
    await fs.writeFile(
      this.configPath,
      JSON.stringify(this.config, null, 2)
    );
  }
}

// 使用配置管理器
const configManager = new ConfigManager();
await configManager.interactiveSetup();
console.log('配置已保存！');
```

通过以上方法和工具，Node.js 开发者可以构建出从简单到复杂的各种命令行输入处理方案，创建出用户体验良好的交互式命令行应用程序。