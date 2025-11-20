# 构建

## Node.js 命令行构建概述

在 Node.js 命令行工具开发中，构建过程是将源代码转换为可分发、可执行程序的关键环节。现代命令行工具的构建涉及代码转译、打包、优化、依赖管理和分发策略等多个方面，直接影响工具的性能、兼容性和用户体验。

```
构建流程示意图：
源代码 → 转译处理 → 打包优化 → 可执行文件 → 分发包
   ↓          ↓          ↓          ↓          ↓
 .mjs/.js   Babel/TS    Webpack   二进制文件   npm包
  文件       转译        打包       生成       发布
```

## 项目结构与初始化

### 标准化项目布局

现代 Node.js 命令行工具遵循特定的目录结构，确保代码组织清晰且易于维护。

```javascript
// 典型项目结构
my-cli-tool/
├── src/                    // 源代码目录
│   ├── commands/          // 命令实现
│   ├── utils/             // 工具函数
│   ├── cli.mjs           // 主入口文件
│   └── config.mjs        // 配置管理
├── bin/                   // 可执行文件目录
├── dist/                  // 构建输出目录
├── test/                  // 测试文件
├── docs/                  // 文档
├── package.json          // 项目配置
├── rollup.config.mjs     // 打包配置
└── tsconfig.json         // TypeScript配置
```

### package.json 配置

package.json 是 Node.js 项目的核心配置文件，定义了项目的元数据、依赖和脚本。

```javascript
// package.json 关键配置示例
{
  "name": "my-cli-tool",
  "version": "1.0.0",
  "description": "一个现代化的命令行工具",
  "type": "module",
  "bin": {
    "my-cli": "./bin/cli.mjs"
  },
  "main": "./dist/cli.mjs",
  "exports": {
    ".": "./dist/cli.mjs",
    "./package.json": "./package.json"
  },
  "files": [
    "bin",
    "dist",
    "README.md"
  ],
  "scripts": {
    "build": "rollup -c",
    "dev": "rollup -c -w",
    "test": "node --test test/",
    "lint": "eslint src/",
    "prepublishOnly": "npm run build && npm test"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

## 模块系统与转译

### ESM 模块配置

ESM (ECMAScript Modules) 是现代 JavaScript 的模块标准，提供了更好的静态分析和 tree-shaking 能力。

```javascript
// src/cli.mjs - 主入口文件
#!/usr/bin/env node

import { Command } from 'commander';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// 兼容性处理
const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

// 导入本地模块
import { version } from '../package.json' assert { type: 'json' };
import { setupCommands } from './commands/index.mjs';
import { config } from './config.mjs';

class CLITool {
  constructor() {
    this.program = new Command();
    this.setupProgram();
  }
  
  setupProgram() {
    this.program
      .name('my-cli')
      .description('一个现代化的命令行工具')
      .version(version);
    
    setupCommands(this.program);
  }
  
  async run() {
    await this.program.parseAsync(process.argv);
  }
}

// 启动应用
const cli = new CLITool();
cli.run().catch(console.error);
```

### TypeScript 集成

TypeScript 提供类型安全和更好的开发体验，需要通过构建过程转换为 JavaScript。

```javascript
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}

// src/types.mjs - 类型定义
/**
 * @typedef {Object} BuildConfig
 * @property {string} entry
 * @property {string} output
 * @property {boolean} minify
 * @property {string} platform
 */

/**
 * @typedef {Object} CommandOptions
 * @property {boolean} verbose
 * @property {string} config
 */

// TypeScript 编译脚本
// build-ts.mjs
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

function compileTypeScript() {
  try {
    console.log('🔨 编译 TypeScript...');
    execSync('tsc', { stdio: 'inherit' });
    console.log('✅ TypeScript 编译完成');
  } catch (error) {
    console.error('❌ TypeScript 编译失败:', error.message);
    process.exit(1);
  }
}

// 生成类型声明文件
function generateDeclarations() {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  pkg.types = './dist/cli.d.ts';
  writeFileSync('package.json', JSON.stringify(pkg, null, 2));
}

compileTypeScript();
generateDeclarations();
```

## 打包与优化

### Rollup 打包配置

Rollup 是专为库和命令行工具设计的打包器，提供优秀的 tree-shaking 功能。

```javascript
// rollup.config.mjs
import { defineConfig } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { babel } from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';

export default defineConfig({
  input: 'src/cli.mjs',
  output: [
    {
      file: 'dist/cli.mjs',
      format: 'esm',
      banner: '#!/usr/bin/env node',
      sourcemap: true
    },
    {
      file: 'dist/cli.cjs',
      format: 'cjs',
      banner: '#!/usr/bin/env node',
      sourcemap: true
    }
  ],
  plugins: [
    nodeResolve({
      preferBuiltins: true,
      exportConditions: ['node']
    }),
    commonjs(),
    json(),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      presets: [
        ['@babel/preset-env', {
          targets: { node: '18.0.0' },
          modules: false
        }]
      ]
    }),
    terser({
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    })
  ],
  external: [
    'commander',
    'chalk',
    'fs',
    'path',
    'child_process'
  ]
});
```

### 代码分割与懒加载

对于大型命令行工具，代码分割可以显著改善启动性能。

```javascript
// src/utils/lazy-loader.mjs
class LazyLoader {
  constructor() {
    this.modules = new Map();
    this.loading = new Map();
  }
  
  async load(modulePath, moduleName) {
    if (this.modules.has(moduleName)) {
      return this.modules.get(moduleName);
    }
    
    if (this.loading.has(moduleName)) {
      return this.loading.get(moduleName);
    }
    
    const loadPromise = import(modulePath)
      .then(module => {
        this.modules.set(moduleName, module);
        this.loading.delete(moduleName);
        return module;
      })
      .catch(error => {
        this.loading.delete(moduleName);
        throw error;
      });
    
    this.loading.set(moduleName, loadPromise);
    return loadPromise;
  }
  
  preload(modulePath, moduleName) {
    if (!this.modules.has(moduleName) && !this.loading.has(moduleName)) {
      this.load(modulePath, moduleName);
    }
  }
}

// 全局懒加载器实例
export const lazyLoader = new LazyLoader();

// 使用懒加载的命令
export async function executeHeavyCommand() {
  // 按需加载重型依赖
  const { HeavyProcessor } = await lazyLoader.load(
    '../processors/heavy.mjs',
    'heavy-processor'
  );
  
  const processor = new HeavyProcessor();
  return processor.process();
}
```

## 依赖管理与优化

### 依赖分析工具

分析和管理依赖关系，避免不必要的包体积膨胀。

```javascript
// dep-analyzer.mjs
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

class DepAnalyzer {
  constructor() {
    this.packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  }
  
  analyzeDependencies() {
    const { dependencies = {}, devDependencies = {} } = this.packageJson;
    
    console.log('📦 依赖分析报告:');
    console.log('生产依赖:', Object.keys(dependencies).length);
    console.log('开发依赖:', Object.keys(devDependencies).length);
    
    this.checkBundleSize();
    this.findUnusedDeps();
  }
  
  checkBundleSize() {
    try {
      const result = execSync('npx bundle-phobia-cli', { encoding: 'utf8' });
      console.log('📊 包大小分析:');
      console.log(result);
    } catch (error) {
      console.log('⚠️  Bundle Phobia 分析失败');
    }
  }
  
  findUnusedDeps() {
    try {
      const result = execSync('npx depcheck', { encoding: 'utf8' });
      const lines = result.split('\n').filter(line => 
        line.includes('Unused dependencies') || 
        line.includes('Unused devDependencies')
      );
      
      if (lines.length > 0) {
        console.log('🔍 未使用的依赖:');
        lines.forEach(line => console.log('  ', line));
      }
    } catch (error) {
      console.log('⚠️  Depcheck 分析失败');
    }
  }
  
  async optimizeDependencies() {
    // 移除未使用的依赖
    const unused = await this.findUnusedDeps();
    if (unused.length > 0) {
      console.log('优化依赖关系...');
      // 实际项目中应该提示用户手动移除
    }
  }
}

// 使用示例
const analyzer = new DepAnalyzer();
analyzer.analyzeDependencies();
```

### 版本管理与兼容性

确保构建产物在不同 Node.js 版本间的兼容性。

```javascript
// version-compat.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

class VersionManager {
  constructor() {
    this.packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  }
  
  updateVersion(type = 'patch') {
    const currentVersion = this.packageJson.version;
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    
    let newVersion;
    switch (type) {
      case 'major':
        newVersion = `${major + 1}.0.0`;
        break;
      case 'minor':
        newVersion = `${major}.${minor + 1}.0`;
        break;
      case 'patch':
        newVersion = `${major}.${minor}.${patch + 1}`;
        break;
      default:
        throw new Error(`无效的版本类型: ${type}`);
    }
    
    this.packageJson.version = newVersion;
    writeFileSync('package.json', JSON.stringify(this.packageJson, null, 2));
    
    console.log(`🆙 版本更新: ${currentVersion} → ${newVersion}`);
    return newVersion;
  }
  
  checkNodeVersion() {
    const required = this.packageJson.engines?.node;
    const current = process.version;
    
    if (required) {
      const [requiredMajor] = required.replace('>=', '').split('.').map(Number);
      const [currentMajor] = current.replace('v', '').split('.').map(Number);
      
      if (currentMajor < requiredMajor) {
        throw new Error(`需要 Node.js ${required}, 当前版本 ${current}`);
      }
    }
    
    console.log(`✅ Node.js 版本检查通过: ${current}`);
  }
  
  generateChangelog() {
    try {
      execSync('npx conventional-changelog -p angular -i CHANGELOG.md -s', {
        stdio: 'inherit'
      });
      console.log('📝 更新日志已生成');
    } catch (error) {
      console.log('⚠️  更新日志生成失败');
    }
  }
}

// 使用示例
const versionManager = new VersionManager();
versionManager.checkNodeVersion();
// versionManager.updateVersion('patch');
// versionManager.generateChangelog();
```

## 构建流水线与自动化

### 多环境构建配置

针对不同环境 (开发、测试、生产) 进行优化构建。

```javascript
// build-pipeline.mjs
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';

class BuildPipeline {
  constructor(environment = 'production') {
    this.environment = environment;
    this.buildDir = 'dist';
  }
  
  async run() {
    console.log(`🚀 开始构建 (环境: ${this.environment})`);
    
    try {
      await this.clean();
      await this.lint();
      await this.test();
      await this.build();
      await this.optimize();
      await this.verify();
      
      console.log('✅ 构建完成');
    } catch (error) {
      console.error('❌ 构建失败:', error.message);
      process.exit(1);
    }
  }
  
  async clean() {
    console.log('🧹 清理构建目录...');
    if (existsSync(this.buildDir)) {
      execSync(`rm -rf ${this.buildDir}`, { stdio: 'inherit' });
    }
    mkdirSync(this.buildDir, { recursive: true });
  }
  
  async lint() {
    console.log('🔍 代码检查...');
    execSync('npm run lint', { stdio: 'inherit' });
  }
  
  async test() {
    console.log('🧪 运行测试...');
    execSync('npm test', { stdio: 'inherit' });
  }
  
  async build() {
    console.log('🔨 构建项目...');
    
    const commands = {
      production: 'npm run build:prod',
      development: 'npm run build:dev',
      staging: 'npm run build:staging'
    };
    
    const command = commands[this.environment] || commands.production;
    execSync(command, { stdio: 'inherit' });
  }
  
  async optimize() {
    if (this.environment === 'production') {
      console.log '⚡ 优化构建产物...');
      execSync('npm run optimize', { stdio: 'inherit' });
    }
  }
  
  async verify() {
    console.log('🔎 验证构建结果...');
    
    // 检查必要的文件
    const requiredFiles = [
      'dist/cli.mjs',
      'dist/cli.cjs',
      'bin/cli.mjs'
    ];
    
    for (const file of requiredFiles) {
      if (!existsSync(file)) {
        throw new Error(`构建产物缺失: ${file}`);
      }
    }
    
    // 验证可执行文件
    try {
      execSync('node dist/cli.mjs --version', { stdio: 'pipe' });
    } catch {
      throw new Error('构建产物无法正常执行');
    }
    
    console.log('✅ 构建验证通过');
  }
}

// 使用示例
const pipeline = new BuildPipeline(process.env.NODE_ENV || 'production');
await pipeline.run();
```

### 持续集成配置

在 CI/CD 环境中自动化构建和测试流程。

```javascript
// github-actions.mjs
import { writeFileSync } from 'node:fs';

class CIConfigGenerator {
  generateGitHubActions() {
    const workflow = `
name: Node.js CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: \${{ matrix.os }}
    
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
      
    - name: Lint code
      run: npm run lint
      
    - name: Run tests
      run: npm test
      
    - name: Build project
      run: npm run build
      
    - name: Verify build
      run: npm run verify
      
    - name: Upload artifacts
      uses: actions/upload-artifact@v3
      with:
        name: build-\${{ matrix.os }}-node-\${{ matrix.node-version }}
        path: |
          dist/
          bin/
        retention-days: 7
`;

    writeFileSync('.github/workflows/ci.yml', workflow.trim());
    console.log('✅ GitHub Actions 配置已生成');
  }
  
  generateDockerfile() {
    const dockerfile = `
FROM node:18-alpine

WORKDIR /app

# 复制包文件
COPY package*.json ./
RUN npm ci --only=production

# 复制构建产物
COPY dist/ ./dist/
COPY bin/ ./bin/

# 设置可执行权限
RUN chmod +x ./bin/cli.mjs

# 创建符号链接
RUN ln -s /app/bin/cli.mjs /usr/local/bin/my-cli

ENTRYPOINT ["node", "/app/bin/cli.mjs"]
`;

    writeFileSync('Dockerfile', dockerfile.trim());
    console.log('✅ Dockerfile 已生成');
  }
}

// 生成 CI 配置文件
const ciGenerator = new CIConfigGenerator();
ciGenerator.generateGitHubActions();
ciGenerator.generateDockerfile();
```

## 高级构建特性

### 条件编译与特性开关

根据构建目标启用或禁用特定功能。

```javascript
// feature-flags.mjs
import { readFileSync, writeFileSync } from 'node:fs';

class FeatureManager {
  constructor() {
    this.flags = this.loadFlags();
  }
  
  loadFlags() {
    try {
      const config = readFileSync('feature-flags.json', 'utf8');
      return JSON.parse(config);
    } catch {
      return {
        experimental: false,
        analytics: true,
        updateChecker: true,
        plugins: false
      };
    }
  }
  
  generateBuildConfig(environment) {
    const config = {
      environment,
      features: { ...this.flags },
      buildTime: new Date().toISOString()
    };
    
    // 环境特定的特性开关
    if (environment === 'development') {
      config.features.experimental = true;
      config.features.plugins = true;
    }
    
    if (environment === 'production') {
      config.features.experimental = false;
      config.features.analytics = true;
    }
    
    const configContent = `export const buildConfig = ${JSON.stringify(config, null, 2)};`;
    writeFileSync('src/generated/build-config.mjs', configContent);
    
    console.log('✅ 构建配置已生成:', config);
    return config;
  }
  
  validateFlags() {
    const issues = [];
    
    if (this.flags.experimental && this.flags.analytics) {
      issues.push('实验性功能与分析功能可能存在冲突');
    }
    
    if (issues.length > 0) {
      console.warn('⚠️  特性配置警告:');
      issues.forEach(issue => console.warn('  -', issue));
    }
    
    return issues.length === 0;
  }
}

// 使用特性配置
import { buildConfig } from '../generated/build-config.mjs';

export function initializeApp() {
  if (buildConfig.features.analytics) {
    initializeAnalytics();
  }
  
  if (buildConfig.features.experimental) {
    console.warn('⚠️  实验性功能已启用');
  }
}

// 构建时生成配置
const featureManager = new FeatureManager();
featureManager.generateBuildConfig(process.env.NODE_ENV || 'production');
```

### 性能分析与优化

在构建过程中分析和优化性能瓶颈。

```javascript
// performance-build.mjs
import { performance, PerformanceObserver } from 'node:perf_hooks';
import { execSync } from 'node:child_process';

class PerformanceTracker {
  constructor() {
    this.metrics = new Map();
    this.setupObserver();
  }
  
  setupObserver() {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        this.metrics.set(entry.name, entry);
      });
    });
    
    observer.observe({ entryTypes: ['measure'] });
  }
  
  startPhase(phase) {
    performance.mark(`start-${phase}`);
  }
  
  endPhase(phase) {
    performance.mark(`end-${phase}`);
    performance.measure(phase, `start-${phase}`, `end-${phase}`);
  }
  
  async trackBuild() {
    console.log('📊 开始性能跟踪...');
    
    this.startPhase('total-build');
    
    // 跟踪各个构建阶段
    const phases = [
      'dependency-install',
      'compilation',
      'bundling',
      'optimization',
      'testing'
    ];
    
    for (const phase of phases) {
      this.startPhase(phase);
      
      // 模拟构建阶段
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
      
      this.endPhase(phase);
      console.log(`  ${phase}: ${this.metrics.get(phase)?.duration.toFixed(2)}ms`);
    }
    
    this.endPhase('total-build');
    
    this.generateReport();
  }
  
  generateReport() {
    const totalTime = this.metrics.get('total-build')?.duration || 0;
    
    console.log('\n📈 构建性能报告:');
    console.log(`总构建时间: ${totalTime.toFixed(2)}ms`);
    
    // 计算各阶段占比
    for (const [name, metric] of this.metrics) {
      if (name !== 'total-build') {
        const percentage = ((metric.duration / totalTime) * 100).toFixed(1);
        console.log(`  ${name}: ${metric.duration.toFixed(2)}ms (${percentage}%)`);
      }
    }
    
    // 性能建议
    if (totalTime > 10000) {
      console.log('\n💡 性能优化建议:');
      console.log('  - 考虑使用增量构建');
      console.log('  - 优化依赖安装时间');
      console.log('  - 并行化构建任务');
    }
  }
  
  analyzeBundle() {
    try {
      console.log('\n📦 包大小分析...');
      const result = execSync('npx webpack-bundle-analyzer dist/stats.json', {
        encoding: 'utf8'
      });
      console.log(result);
    } catch (error) {
      console.log('⚠️  包分析工具未安装或配置');
    }
  }
}

// 使用示例
const tracker = new PerformanceTracker();
await tracker.trackBuild();
tracker.analyzeBundle();
```

通过实施这些构建技术和最佳实践，Node.js 命令行工具可以获得优化的性能、更好的兼容性和更流畅的开发体验。构建过程不再是简单的代码转换，而是确保工具质量和用户体验的关键环节。