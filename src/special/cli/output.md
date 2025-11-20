# 输出与美化

## Node.js 命令行输出基础

在 Node.js 应用开发中，命令行输出是与用户交互的主要途径。原生 `console` 模块提供基础的输出功能，但默认的输出单调乏味，无法满足现代命令行工具对用户体验的要求。

基础输出方法：

```javascript
// console-basic.mjs
console.log('基础信息') // 标准输出
console.error('错误信息') // 错误输出
console.warn('警告信息') // 警告输出
console.info('提示信息') // 信息输出
```

输出流关系：

```
应用程序 → stdout (标准输出) → 终端显示
        → stderr (错误输出) → 终端显示
        → stdin (标准输入)  ← 用户输入
```

## 终端颜色与样式基础

### ANSI 转义序列原理

终端通过 ANSI 转义序列控制文本样式，基本格式为 `\x1b[编码m`。例如，`\x1b[31m` 设置红色文本，`\x1b[1m` 设置粗体。

样式组合原理：

```
\x1b[前景色;背景色;特效m文本内容\x1b[0m
```

### 原生 ANSI 输出示例

```javascript
// ansi-native.mjs
// 基础颜色输出
console.log('\x1b[31m红色文本\x1b[0m')
console.log('\x1b[32m绿色文本\x1b[0m')
console.log('\x1b[33m黄色文本\x1b[0m')

// 组合样式
console.log('\x1b[1;31;42m粗体红字绿背景\x1b[0m')

// 256色支持
console.log('\x1b[38;5;208m橙色文本\x1b[0m')
```

## 常用美化库及其应用

### Chalk - 现代化的终端样式库

Chalk 是 Node.js 生态中最流行的终端样式库，每周下载量超过千万次，被超过 115,000 个 npm 包使用。其设计精良、性能高效，提供简洁的链式 API。

#### 基础使用方法

```javascript
// chalk-basic.mjs
import chalk from 'chalk'

// 基础颜色
console.log(chalk.blue('蓝色文本'))
console.log(chalk.red('红色文本'))
console.log(chalk.green('绿色文本'))

// 样式组合
console.log(chalk.blue.bgRed.bold('蓝色粗体文字，红色背景'))

// 嵌套样式
console.log(
  chalk.red('红色' + chalk.underline.bgBlue('蓝底下划线') + '又回到红色')
)
```

#### 高级特性

```javascript
// chalk-advanced.mjs
import chalk from 'chalk'

// RGB 颜色
console.log(chalk.rgb(255, 136, 0)('橙色文字'))
console.log(chalk.hex('#FF8800')('十六进制橙色'))

// 背景色
console.log(chalk.bgRgb(15, 100, 204)('自定义背景色'))

// 模板字符串
const user = '张三'
const score = 95
console.log(
  chalk`{red 错误：}用户 {green ${user}} 的得分是 {blue.bold ${score}} 分`
)

// 颜色梯度 (结合 gradient-string)
import gradient from 'gradient-string'

const rainbow = gradient('red', 'orange', 'yellow', 'green', 'blue', 'purple')
console.log(rainbow('彩虹渐变文字效果'))
```

### Boxen - 精美的边框输出

Boxen 专门用于在终端中创建各种样式的边框，能够有效突出重要信息，提升视觉层次感。

#### 基础边框创建

```javascript
// boxen-basic.mjs
import boxen from 'boxen'

// 基础边框
console.log(boxen('基础边框效果'))

// 带内边距的边框
console.log(boxen('带内边距的边框', { padding: 1 }))

// 圆角边框
console.log(
  boxen('圆角边框', {
    borderStyle: 'round',
    padding: 1,
  })
)

// 双线边框
console.log(
  boxen('双线边框', {
    borderStyle: 'double',
    margin: 1,
  })
)
```

#### 高级边框配置

```javascript
// boxen-advanced.mjs
import boxen from 'boxen'
import chalk from 'chalk'

// 复杂边框配置
const message = chalk.yellow('✨ 操作成功完成! ✨')

const boxenOptions = {
  padding: 1,
  margin: 1,
  borderStyle: 'round',
  borderColor: 'green',
  backgroundColor: 'black',
  title: '成功',
  titleAlignment: 'center',
  float: 'center',
}

console.log(boxen(message, boxenOptions))

// 多种边框样式演示
const styles = ['single', 'double', 'round', 'bold', 'classic']

styles.forEach((style) => {
  console.log(
    boxen(`${style} 样式边框`, {
      borderStyle: style,
      margin: { top: 1, bottom: 0 },
      borderColor: 'cyan',
    })
  )
})
```

### Logsets - 功能丰富的输出组件

Logsets 为命令行程序提供丰富的表现输出样式，支持表格、进度条、任务列表等多种组件。

#### 结构化输出

```javascript
// logsets-demo.mjs
import logsets from 'logsets'

// 数据类型敏感着色
logsets.debug('调试信息')
logsets.info('普通信息')
logsets.warn('警告信息')
logsets.error('错误信息')
logsets.fatal('致命错误')

// 对象格式化输出
const data = {
  name: '张三',
  age: 30,
  hobbies: ['阅读', '编程', '音乐'],
  address: {
    city: '北京',
    street: '朝阳区',
  },
}

logsets.log('用户数据:', data)
```

#### 表格和进度条

```javascript
// logsets-components.mjs
import logsets from 'logsets'

// 表格输出
const users = [
  { name: '张三', age: 30, role: '管理员' },
  { name: '李四', age: 25, role: '用户' },
  { name: '王五', age: 28, role: '编辑' },
]

logsets.table(users, {
  columns: ['name', 'age', 'role'],
  header: ['姓名', '年龄', '角色'],
})

// 进度条
const progressBar = logsets.progress('处理进度', 100)
let progress = 0

const interval = setInterval(() => {
  progress += 10
  progressBar.update(progress)

  if (progress >= 100) {
    clearInterval(interval)
    progressBar.complete('处理完成!')
  }
}, 500)
```

## 高级输出组件与技术

### 进度指示器

进度反馈对于长时间操作至关重要，能够有效提升用户体验。

```javascript
// progress-indicators.mjs
import cliProgress from 'cli-progress'

// 多进度条实例
const multiBar = new cliProgress.MultiBar(
  {
    format: '{bar} | {percentage}% | {value}/{total} | {action}',
    barCompleteChar: '█',
    barIncompleteChar: '░',
    hideCursor: true,
  },
  cliProgress.Presets.shades_grey
)

// 创建多个进度条
const bar1 = multiBar.create(100, 0, { action: '下载文件...' })
const bar2 = multiBar.create(50, 0, { action: '处理数据...' })

// 模拟进度更新
let progress1 = 0
let progress2 = 0

const interval = setInterval(() => {
  progress1 += 2
  progress2 += 1

  bar1.update(progress1)
  bar2.update(progress2)

  if (progress1 >= 100 || progress2 >= 50) {
    clearInterval(interval)
    multiBar.stop()
  }
}, 100)
```

### 交互式列表和树状结构

```javascript
// interactive-lists.mjs
import inquirer from 'inquirer'
import logsets from 'logsets'

// 树状结构显示
const projectStructure = {
  name: 'my-project',
  children: [
    {
      name: 'src',
      children: [{ name: 'index.js' }, { name: 'utils.js' }],
    },
    {
      name: 'public',
      children: [{ name: 'index.html' }, { name: 'style.css' }],
    },
    { name: 'package.json' },
    { name: 'README.md' },
  ],
}

logsets.tree(projectStructure, {
  prefix: '📁 ',
  suffix: ' [文件]',
})

// 任务列表
const tasks = logsets.tasklist('项目初始化')
tasks.add('创建目录结构')
tasks.add('安装依赖')
tasks.add('配置文件')
tasks.add('启动服务')

// 模拟任务执行
setTimeout(() => tasks.done('创建目录结构'), 1000)
setTimeout(() => tasks.done('安装依赖'), 2000)
setTimeout(() => tasks.fail('配置文件'), 3000)
setTimeout(() => tasks.done('启动服务'), 4000)
```

## 输出美化最佳实践

### 统一的输出风格指南

建立一致的输出规范能够显著提升工具的专业性和易用性。

```javascript
// output-styleguide.mjs
import chalk from 'chalk'
import boxen from 'boxen'

class OutputFormatter {
  static success(message, title = '成功') {
    const content = chalk.green(`✅ ${message}`)
    return boxen(content, {
      padding: 1,
      borderStyle: 'round',
      borderColor: 'green',
      margin: 1,
    })
  }

  static error(message, title = '错误') {
    const content = chalk.red(`❌ ${message}`)
    return boxen(content, {
      padding: 1,
      borderStyle: 'round',
      borderColor: 'red',
      backgroundColor: 'black',
      margin: 1,
      title: title,
      titleAlignment: 'center',
    })
  }

  static warning(message, title = '警告') {
    const content = chalk.yellow(`⚠️ ${message}`)
    return boxen(content, {
      padding: 1,
      borderStyle: 'round',
      borderColor: 'yellow',
      margin: 1,
    })
  }

  static info(message, title = '信息') {
    const content = chalk.blue(`ℹ️ ${message}`)
    return boxen(content, {
      padding: 1,
      borderStyle: 'round',
      borderColor: 'blue',
      margin: 1,
    })
  }

  static createSection(title, content) {
    const sectionTitle = chalk.cyan.bold(`\n${title}`)
    const sectionContent = chalk.white(content)
    return `${sectionTitle}\n${'-'.repeat(50)}\n${sectionContent}\n`
  }
}

// 使用示例
console.log(OutputFormatter.success('操作已完成成功！'))
console.log(OutputFormatter.error('文件未找到！'))
console.log(OutputFormatter.warning('此操作不可逆！'))
console.log(OutputFormatter.info('请确认您的选择！'))
console.log(
  OutputFormatter.createSection('配置详情', '这里是详细的配置信息...')
)
```

### 响应式输出设计

```javascript
// responsive-output.mjs
import chalk from 'chalk'

class ResponsiveOutput {
  static isUnicodeSupported() {
    return process.platform !== 'win32' || process.env.TERM === 'xterm-256color'
  }

  static getSymbols() {
    if (this.isUnicodeSupported()) {
      return {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
        progress: '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏',
      }
    } else {
      return {
        success: '√',
        error: '×',
        warning: '!',
        info: 'i',
        progress: '-\\|/',
      }
    }
  }

  static createSpinner(text) {
    const symbols = this.getSymbols()
    let frame = 0

    return setInterval(() => {
      const spinnerChar = symbols.progress[frame % symbols.progress.length]
      process.stdout.write(`\r${chalk.cyan(spinnerChar)} ${text}`)
      frame++
    }, 100)
  }
}

// 使用响应式输出
const symbols = ResponsiveOutput.getSymbols()
console.log(chalk.green(`${symbols.success} 操作成功`))
console.log(chalk.red(`${symbols.error} 操作失败`))

const spinner = ResponsiveOutput.createSpinner('处理中，请稍候...')
setTimeout(() => {
  clearInterval(spinner)
  console.log(chalk.green('\r✅ 处理完成!     '))
}, 3000)
```

## 实际应用场景

### 命令行工具启动界面

```javascript
// cli-welcome.mjs
import chalk from 'chalk'
import boxen from 'boxen'
import gradient from 'gradient-string'

function showWelcomeScreen() {
  // 创建渐变标题
  const title = gradient('cyan', 'blue')('我的命令行工具')
  const version = chalk.gray('v1.0.0')

  // 创建边框内容
  const content = chalk.cyan(`
${chalk.bold('快速开始:')}
  ${chalk.green('→')} 创建新项目: ${chalk.yellow(
    'my-cli create <project-name>'
  )}
  ${chalk.green('→')} 查看帮助: ${chalk.yellow('my-cli --help')}

${chalk.bold('功能特性:')}
  ${chalk.green('✓')} 项目脚手架
  ${chalk.green('✓')} 自动化部署
  ${chalk.green('✓')} 代码生成
  ${chalk.green('✓')} 质量检查
`)

  const welcomeBox = boxen(`${title} ${version}\n\n${content}`, {
    padding: 1,
    borderStyle: 'round',
    borderColor: 'cyan',
    float: 'center',
    margin: 1,
  })

  console.log(welcomeBox)
}

showWelcomeScreen()
```

### 配置信息展示

```javascript
// config-display.mjs
import chalk from 'chalk'
import logsets from 'logsets'

function displayConfigSummary(config) {
  const summary = {
    '项目名称': config.name,
    '版本': config.version,
    '环境': chalk.green(config.env),
    '端口': chalk.yellow(config.port),
    '数据库': config.database ? chalk.green('已配置') : chalk.red('未配置'),
    '缓存': config.cache ? chalk.green('启用') : chalk.yellow('禁用'),
  }

  logsets.info('配置信息概览:')

  Object.entries(summary).forEach(([key, value]) => {
    console.log(`  ${chalk.blue(key.padEnd(10))}: ${value}`)
  })

  // 显示特性开关
  if (config.features && Object.keys(config.features).length > 0) {
    logsets.info('特性开关:')
    Object.entries(config.features).forEach(([feature, enabled]) => {
      const status = enabled ? chalk.green('✓ 启用') : chalk.gray('✗ 禁用')
      console.log(`  ${chalk.cyan(feature.padEnd(15))}: ${status}`)
    })
  }
}

// 使用示例
const sampleConfig = {
  name: 'my-app',
  version: '1.0.0',
  env: 'production',
  port: 3000,
  database: true,
  cache: false,
  features: {
    '新界面': true,
    '实验功能': false,
    '性能监控': true,
  },
}

displayConfigSummary(sampleConfig)
```
