# 代码提交检查

## 为什么需要代码提交检查

在团队协作开发中，代码质量的一致性至关重要。未经检查的代码提交可能导致以下问题：

```
有问题的代码提交 → 主分支污染 → 团队开发阻塞 → 生产环境故障
```

## 核心检查工具

### Git Hooks

Git Hooks 是 Git 在特定事件发生时自动运行的脚本，位于每个 Git 仓库的 `.git/hooks` 目录。

```
pre-commit    # 提交前运行
pre-push      # 推送前运行
commit-msg    # 提交信息验证时运行
```

### 配置示例

```bash
#!/bin/bash
# .git/hooks/pre-commit

# 运行代码检查
npm run lint
if [ $? -ne 0 ]; then
    echo "代码检查失败，请修复问题后重新提交"
    exit 1
fi

# 运行测试
npm test
if [ $? -ne 0 ]; then
    echo "测试失败，请修复问题后重新提交"
    exit 1
fi
```

## 现代化检查方案

### Husky + lint-staged 组合

Husky 简化了 Git Hooks 的管理，lint-staged 只对暂存区的文件进行检查。

```
工作流程：
修改文件 → git add → Husky触发pre-commit → lint-staged运行检查 → 通过/拒绝提交
```

#### 安装配置

```bash
npm install husky lint-staged --save-dev
```

```json
// package.json
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css,scss}": ["prettier --write"]
  }
}
```

#### Husky 钩子配置

```bash
# 创建 pre-commit 钩子
npx husky add .husky/pre-commit "npx lint-staged"

# 创建 commit-msg 钩子
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
```

## 代码质量检查

### ESLint 配置

```javascript
// .eslintrc.js
module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'error',
    'prefer-const': 'error',
  },
  overrides: [
    {
      files: ['**/*.test.js'],
      env: { jest: true },
    },
  ],
}
```

### TypeScript 类型检查

```json
// package.json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "type-check:staged": "tsc --noEmit --project ."
  }
}
```

```javascript
// 扩展 lint-staged 配置
module.exports = {
  '**/*.{ts,tsx}': [() => 'npm run type-check:staged', 'eslint --fix'],
}
```

## 提交信息规范

### Commitlint 配置

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'],
    ],
    'subject-case': [2, 'always', 'sentence-case'],
  },
}
```

### 提交信息格式

```
<类型>(<范围>): <描述>

<正文>

<页脚>
```

示例：

```
feat(auth): 添加用户登录功能

- 实现 JWT 令牌认证
- 添加登录页面组件
- 配置路由保护

Closes #123
```

## 测试覆盖率检查

### Jest 配置

```javascript
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ['text', 'lcov'],
}
```

### 预提交测试检查

```bash
#!/bin/bash
# .husky/pre-commit

# 运行相关测试
npm test -- --findRelatedTests $(git diff --cached --name-only | grep -E '\.(js|jsx|ts|tsx)$' | tr '\n' ' ')

# 检查覆盖率
npm run test:coverage
```

## 安全漏洞扫描

### npm 审计集成

```json
{
  "scripts": {
    "security:audit": "npm audit",
    "security:fix": "npm audit fix"
  }
}
```

```javascript
// 安全检查钩子
const { execSync } = require('child_process')

try {
  console.log('正在检查安全漏洞...')
  execSync('npm audit', { stdio: 'inherit' })
  console.log('安全检查通过')
} catch (error) {
  console.error('发现安全漏洞，请运行 npm audit fix 修复')
  process.exit(1)
}
```

## 自定义检查规则

### 文件大小检查

```javascript
// scripts/check-file-size.js
const fs = require('fs')
const path = require('path')

const MAX_FILE_SIZE = 1024 * 1024 // 1MB

function checkFileSizes() {
  const stagedFiles = process.argv.slice(2)

  stagedFiles.forEach((file) => {
    const stats = fs.statSync(file)
    if (stats.size > MAX_FILE_SIZE) {
      console.error(`文件 ${file} 过大: ${stats.size} bytes`)
      process.exit(1)
    }
  })
}

checkFileSizes()
```

### 依赖许可证检查

```javascript
// scripts/check-licenses.js
const { execSync } = require('child_process')
const allowedLicenses = ['MIT', 'ISC', 'Apache-2.0']

function checkLicenses() {
  try {
    const output = execSync('npx license-checker --json', {
      encoding: 'utf8',
    })
    const licenses = JSON.parse(output)

    Object.entries(licenses).forEach(([pkg, info]) => {
      if (!allowedLicenses.includes(info.licenses)) {
        throw new Error(`包 ${pkg} 使用不允许的许可证: ${info.licenses}`)
      }
    })

    console.log('所有依赖许可证检查通过')
  } catch (error) {
    console.error('许可证检查失败:', error.message)
    process.exit(1)
  }
}
```

## 性能优化检查

### Bundle 大小分析

```javascript
// webpack.config.js
const BundleAnalyzerPlugin =
  require('webpack-bundle-analyzer').BundleAnalyzerPlugin

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
    }),
  ],
}
```

```json
{
  "scripts": {
    "analyze": "webpack-bundle-analyzer dist/stats.json",
    "check-bundle": "npm run build && npm run analyze"
  }
}
```

## 多环境配置

### 环境特定检查

```javascript
// .husky/pre-commit
#!/bin/bash

# 获取当前分支
BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [[ "$BRANCH" == "main" ]]; then
  echo "主分支提交，运行完整检查..."
  npm run lint
  npm test
  npm run type-check
  npm run security:audit
elif [[ "$BRANCH" == "develop" ]]; then
  echo "开发分支提交，运行标准检查..."
  npm run lint
  npm test
else
  echo "功能分支提交，运行基础检查..."
  npm run lint
fi
```

## 错误处理和调试

### 调试配置

```javascript
// scripts/debug-hooks.js
const fs = require('fs')
const path = require('path')

// 启用调试日志
process.env.DEBUG = 'husky,lint-staged'

// 保存钩子执行日志
const logFile = path.join(__dirname, '../husky-debug.log')
const originalWrite = process.stdout.write

process.stdout.write = function (string) {
  fs.appendFileSync(logFile, string)
  originalWrite.apply(process.stdout, arguments)
}
```

### 跳过检查 (紧急情况)

```bash
# 跳过所有检查提交
git commit -m "紧急修复" --no-verify

# 跳过特定检查
git commit -m "功能更新" -n  # --no-verify 的简写
```
