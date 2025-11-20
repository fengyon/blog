# 跨平台兼容

## Node.js 命令行跨平台挑战

在 Node.js 命令行工具开发中，跨平台兼容性是确保工具能够在 Windows、Linux 和 macOS 系统上一致运行的关键挑战。不同操作系统在文件路径、命令语法、环境变量等方面存在显著差异，直接影响命令行工具的行为和用户体验。

```
操作系统差异示意图：
Windows          Linux/macOS
──────────       ────────────
\ 路径分隔符     / 路径分隔符
cmd.exe  shell   bash/zsh shell
dir 命令        ls 命令
node.exe        node 二进制文件
```

## 基础跨平台适配

### Shebang 行处理

Shebang (#!) 是 Unix 系统识别脚本解释器的机制，但在 Windows 上需要特殊处理。

```javascript
// 跨平台 Shebang 配置
#!/usr/bin/env node

// Windows 不支持 Shebang，但 Node.js 会忽略这行注释
// 确保脚本在两类系统都能直接运行
import { createRequire } from 'node:module';
import process from 'node:process';

console.log('跨平台 Node.js 脚本');
```

### 行结束符统一

Windows 使用 `\r\n`，Unix 使用 `\n`，这会影响脚本的执行。

```javascript
// line-endings.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { EOL } from 'node:os';

function normalizeLineEndings(content) {
  // 统一为当前系统的行结束符
  return content.replace(/\r\n|\n|\r/g, EOL);
}

// 读取文件并统一行结束符
const content = readFileSync('script.mjs', 'utf8');
const normalized = normalizeLineEndings(content);
writeFileSync('script-normalized.mjs', normalized);
```

## 路径处理兼容性

### 路径分隔符统一

不同操作系统使用不同的路径分隔符，需要统一处理。

```javascript
// path-handling.mjs
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize, sep, delimiter } from 'node:path';
import { platform } from 'node:process';

class CrossPlatformPaths {
  static normalizePath(path) {
    // 将路径统一为当前系统的格式
    return normalize(path.replace(/[\\/]/g, sep));
  }
  
  static ensurePosixPath(path) {
    // 确保使用 POSIX 路径格式（适用于 URL 和跨平台配置）
    return path.replace(/\\/g, '/');
  }
  
  static getHomeDir() {
    // 跨平台获取用户主目录
    return process.env[platform === 'win32' ? 'USERPROFILE' : 'HOME'];
  }
  
  static createAbsolutePath(relativePath) {
    // 创建跨平台的绝对路径
    const baseDir = dirname(fileURLToPath(import.meta.url));
    return join(baseDir, this.normalizePath(relativePath));
  }
}

// 使用示例
const configPath = CrossPlatformPaths.createAbsolutePath('../config/app.json');
console.log('配置路径:', CrossPlatformPaths.ensurePosixPath(configPath));
console.log('主目录:', CrossPlatformPaths.getHomeDir());
```

### 可执行文件路径处理

在 Windows 和 Unix 系统上，可执行文件的扩展名和查找方式不同。

```javascript
// executable-paths.mjs
import { platform, arch } from 'node:process';

class BinaryResolver {
  static getPlatformBinary(binaryName) {
    const binaries = {
      win32: `${binaryName}.exe`,
      linux: binaryName,
      darwin: binaryName
    };
    
    return binaries[platform] || binaryName;
  }
  
  static resolveCommandPath(command) {
    // 解析命令的完整路径
    const path = await import('node:path');
    const { execSync } = await import('node:child_process');
    
    try {
      if (platform === 'win32') {
        // Windows 使用 where 命令
        return execSync(`where ${command}`).toString().trim();
      } else {
        // Unix 使用 which 命令
        return execSync(`which ${command}`).toString().trim();
      }
    } catch (error) {
      return null;
    }
  }
}

// 检查必要命令是否存在
async function checkDependencies() {
  const requiredCommands = ['git', 'node', 'npm'];
  const results = {};
  
  for (const cmd of requiredCommands) {
    results[cmd] = await BinaryResolver.resolveCommandPath(cmd);
  }
  
  return results;
}
```

## 跨平台 Shell 命令执行

### 原生 Child Process 适配

使用 Node.js 原生的 child_process 模块执行跨平台命令。

```javascript
// cross-platform-exec.mjs
import { exec, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

class CrossPlatformExecutor {
  static async executeCommand(command, options = {}) {
    // 根据平台调整命令
    const platformCommand = this.adaptCommandForPlatform(command);
    
    try {
      const { stdout, stderr } = await execAsync(platformCommand, {
        cwd: options.cwd || process.cwd(),
        env: { ...process.env, ...options.env },
        encoding: 'utf8',
        ...options
      });
      
      return { stdout: stdout.trim(), stderr: stderr.trim(), success: true };
    } catch (error) {
      return { 
        stdout: error.stdout?.trim(), 
        stderr: error.stderr?.trim(), 
        success: false,
        error: error.message
      };
    }
  }
  
  static adaptCommandForPlatform(command) {
    if (platform === 'win32') {
      // Windows 命令适配
      return command
        .replace(/rm -rf/g, 'rd /s /q')
        .replace(/mkdir -p/g, 'mkdir')
        .replace(/cp -R/g, 'xcopy /s /e /i')
        .replace(/ls/g, 'dir')
        .replace(/\$HOME/g, '%USERPROFILE%')
        .replace(/\$PATH/g, '%PATH%');
    }
    
    return command;
  }
  
  static async spawnCrossPlatform(command, args = [], options = {}) {
    // 跨平台的 spawn
    let adaptedCommand = command;
    let adaptedArgs = args;
    
    if (platform === 'win32') {
      // Windows 需要使用 cmd.exe 执行一些命令
      if (['rm', 'cp', 'mkdir', 'ls'].includes(command)) {
        adaptedCommand = 'cmd.exe';
        adaptedArgs = ['/c', command, ...args];
      }
    }
    
    return new Promise((resolve, reject) => {
      const child = spawn(adaptedCommand, adaptedArgs, {
        stdio: 'inherit',
        ...options
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, code });
        } else {
          reject(new Error(`Process exited with code ${code}`));
        }
      });
      
      child.on('error', reject);
    });
  }
}

// 使用示例
async function demonstrateCommands() {
  // 文件列表（跨平台）
  const listResult = await CrossPlatformExecutor.executeCommand('ls -la');
  console.log('文件列表:', listResult);
  
  // 创建目录（跨平台）
  const mkdirResult = await CrossPlatformExecutor.executeCommand('mkdir -p temp/test');
  console.log('创建目录:', mkdirResult);
}
```

## 常用跨平台兼容库

### ShellJS - Unix 命令的跨平台实现

ShellJS 提供了跨平台的 Unix shell 命令，是解决命令兼容性问题的首选方案。

```javascript
// shelljs-demo.mjs
import shell from 'shelljs';

class ShellJSWrapper {
  constructor() {
    // 配置 ShellJS 行为
    shell.config.silent = true; // 禁止命令输出
    shell.config.fatal = false; // 错误不退出进程
  }
  
  // 文件操作
  copyFiles(source, destination) {
    return shell.cp('-R', source, destination);
  }
  
  removePath(path) {
    return shell.rm('-rf', path);
  }
  
  createDirectory(path) {
    return shell.mkdir('-p', path);
  }
  
  // 目录操作
  changeDirectory(path) {
    const result = shell.cd(path);
    if (result.code !== 0) {
      throw new Error(`无法切换目录: ${path}`);
    }
    return shell.pwd();
  }
  
  // 文件查找和操作
  findAndReplace(directory, pattern, search, replacement) {
    shell.cd(directory);
    shell.ls('*.js').forEach(file => {
      shell.sed('-i', search, replacement, file);
    });
  }
  
  // 命令执行
  executeCommand(command, options = {}) {
    return shell.exec(command, { 
      silent: true, 
      async: false, 
      ...options 
    });
  }
  
  // 检查命令是否存在
  checkDependency(command) {
    return shell.which(command);
  }
}

// 使用示例
const shellWrapper = new ShellJSWrapper();

// 跨平台文件操作
shellWrapper.createDirectory('dist/assets');
shellWrapper.copyFiles('src/*.js', 'dist/');
shellWrapper.findAndReplace('src', 'OLD_TEXT', 'NEW_TEXT');

// 检查必要依赖
if (!shellWrapper.checkDependency('git')) {
  console.error('错误: 需要安装 Git');
  process.exit(1);
}

// 执行系统命令
const result = shellWrapper.executeCommand('node --version');
if (result.code === 0) {
  console.log('Node.js 版本:', result.stdout);
}
```

### Shx - 轻量级 Shell 命令

Shx 是专门为 package.json 脚本设计的轻量级跨平台 Shell 命令工具。

```javascript
// shx-integration.mjs
import { execSync } from 'node:child_process';

class ShxCommander {
  static executeSHX(command, args = []) {
    const fullCommand = ['shx', command, ...args].join(' ');
    
    try {
      const output = execSync(fullCommand, { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      return { success: true, output: output.trim() };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        stderr: error.stderr?.toString().trim()
      };
    }
  }
  
  // 常用文件操作封装
  static async cleanDirectory(path) {
    return this.executeSHX('rm', ['-rf', path]);
  }
  
  static async copyFiles(source, dest) {
    return this.executeSHX('cp', ['-R', source, dest]);
  }
  
  static async makeDirectory(path) {
    return this.executeSHX('mkdir', ['-p', path]);
  }
  
  static async listFiles(pattern = '*') {
    return this.executeSHX('ls', [pattern]);
  }
}

// 在 package.json 脚本中使用
// "scripts": {
//   "clean": "shx rm -rf dist",
//   "build": "shx mkdir -p dist && shx cp -R src/* dist/",
//   "test": "shx echo \"Running tests...\""
// }
```

### Commander.js - 跨平台 CLI 框架

Commander.js 提供统一的命令行界面开发体验，自动处理平台差异。

```javascript
// commander-cross-platform.mjs
import { Command } from 'commander';
import { platform, arch } from 'node:process';

const program = new Command();

program
  .name('cross-platform-cli')
  .description('跨平台命令行工具示例')
  .version('1.0.0')
  .option('--config <path>', '配置文件路径', '~/.app/config.json')
  .option('--force', '强制模式', false);

// 平台特定的命令
if (platform === 'win32') {
  program
    .command('clean')
    .description('清理 Windows 系统缓存')
    .action(() => {
      console.log('执行 Windows 清理操作...');
      // Windows 特定的清理逻辑
    });
} else {
  program
    .command('clean')
    .description('清理 Unix 系统缓存')
    .action(() => {
      console.log('执行 Unix 清理操作...');
      // Unix 特定的清理逻辑
    });
}

// 跨平台文件处理命令
program
  .command('deploy <source> <destination>')
  .description('跨平台部署文件')
  .option('-b, --backup', '创建备份')
  .action((source, destination, options) => {
    const path = await import('node:path');
    
    // 标准化路径
    const normalizedSource = path.normalize(source);
    const normalizedDest = path.normalize(destination);
    
    console.log(`从 ${normalizedSource} 部署到 ${normalizedDest}`);
    
    if (options.backup) {
      await createBackup(normalizedDest);
    }
    
    await deployFiles(normalizedSource, normalizedDest);
  });

// 环境检测命令
program
  .command('info')
  .description('显示系统信息')
  .action(() => {
    console.log('系统信息:');
    console.log(`平台: ${platform}`);
    console.log(`架构: ${arch}`);
    console.log(`Node.js 版本: ${process.version}`);
    console.log(`当前目录: ${process.cwd()}`);
  });

program.parse(process.argv);

async function createBackup(path) {
  const { execSync } = await import('node:child_process');
  const backupDir = `backup-${Date.now()}`;
  
  if (platform === 'win32') {
    execSync(`xcopy "${path}" "${backupDir}" /E /I /H`);
  } else {
    execSync(`cp -R "${path}" "${backupDir}"`);
  }
  
  console.log(`备份创建到: ${backupDir}`);
}

async function deployFiles(source, destination) {
  const shell = await import('shelljs');
  
  // 使用 ShellJS 确保跨平台兼容性
  shell.mkdir('-p', destination);
  shell.cp('-R', `${source}/*`, destination);
  
  console.log('文件部署完成');
}
```

## 环境变量与配置管理

### 跨平台环境变量处理

不同操作系统的环境变量语法和访问方式不同。

```javascript
// env-cross-platform.mjs
import { platform, env } from 'node:process';
import { homedir } from 'node:os';

class CrossPlatformEnv {
  static getEnvVariable(name) {
    // 跨平台环境变量获取
    const value = env[name];
    
    if (value && platform === 'win32') {
      // Windows 环境变量值可能需要特殊处理
      return value.replace(/%([^%]+)%/g, (match, group) => {
        return env[group] || match;
      });
    }
    
    return value;
  }
  
  static setEnvVariable(name, value) {
    // 跨平台环境变量设置
    env[name] = value;
    
    if (platform === 'win32') {
      // Windows 可能需要额外的设置
      try {
        const { execSync } = require('child_process');
        execSync(`setx ${name} "${value}"`, { stdio: 'ignore' });
      } catch (error) {
        // 忽略 setx 错误，至少进程内变量已设置
      }
    }
  }
  
  static getAppDataPath() {
    // 跨平台获取应用数据目录
    switch (platform) {
      case 'win32':
        return env.APPDATA || join(homedir(), 'AppData', 'Roaming');
      case 'darwin':
        return join(homedir(), 'Library', 'Application Support');
      default:
        return env.XDG_DATA_HOME || join(homedir(), '.local', 'share');
    }
  }
  
  static getConfigPath(appName) {
    // 跨平台获取配置目录
    switch (platform) {
      case 'win32':
        return join(env.APPDATA, appName);
      case 'darwin':
        return join(homedir(), 'Library', 'Preferences', appName);
      default:
        return env.XDG_CONFIG_HOME ? 
          join(env.XDG_CONFIG_HOME, appName) : 
          join(homedir(), '.config', appName);
    }
  }
}

// 使用示例
const appData = CrossPlatformEnv.getAppDataPath();
const configPath = CrossPlatformEnv.getConfigPath('my-app');
console.log('应用数据目录:', appData);
console.log('配置目录:', configPath);
```

## 高级跨平台模式

### 条件编译与平台检测

根据目标平台动态加载不同的实现。

```javascript
// platform-specific.mjs
import { platform, arch } from 'node:process';

class PlatformAdapter {
  static getPlatformImplementation(moduleMap) {
    const platformKey = `${platform}-${arch}`;
    
    // 查找最匹配的实现
    if (moduleMap[platformKey]) {
      return moduleMap[platformKey];
    }
    
    if (moduleMap[platform]) {
      return moduleMap[platform];
    }
    
    return moduleMap.default;
  }
  
  static async loadPlatformModule(basePath) {
    const extensions = {
      'win32': 'win32',
      'darwin': 'darwin', 
      'linux': 'linux'
    };
    
    const extension = extensions[platform] || 'posix';
    const modulePath = `${basePath}.${extension}.mjs`;
    
    try {
      return await import(modulePath);
    } catch (error) {
      // 回退到默认实现
      return await import(`${basePath}.posix.mjs`);
    }
  }
}

// 平台特定命令执行器
class CommandExecutor {
  constructor() {
    this.impl = this.loadImplementation();
  }
  
  async loadImplementation() {
    return PlatformAdapter.loadPlatformModule('./impl/command-executor');
  }
  
  async execute(command) {
    return this.impl.execute(command);
  }
  
  async getFileList(path) {
    return this.impl.getFileList(path);
  }
}

// Windows 特定实现 (impl/command-executor.win32.mjs)
export class WindowsCommandExecutor {
  async execute(command) {
    const { execSync } = await import('node:child_process');
    return execSync(`cmd /c "${command}"`, { encoding: 'utf8' });
  }
  
  async getFileList(path) {
    const { execSync } = await import('node:child_process');
    const output = execSync(`dir "${path}" /B`, { encoding: 'utf8' });
    return output.split('\r\n').filter(line => line.trim());
  }
}

// Unix 特定实现 (impl/command-executor.posix.mjs)
export class UnixCommandExecutor {
  async execute(command) {
    const { execSync } = await import('node:child_process');
    return execSync(command, { encoding: 'utf8' });
  }
  
  async getFileList(path) {
    const { execSync } = await import('node:child_process');
    const output = execSync(`ls -1 "${path}"`, { encoding: 'utf8' });
    return output.split('\n').filter(line => line.trim());
  }
}
```

### 文件系统监视器跨平台适配

不同系统的文件系统监视机制不同。

```javascript
// file-watcher.mjs
import { watch } from 'node:fs';
import { platform } from 'node:process';

class CrossPlatformWatcher {
  constructor(options = {}) {
    this.options = {
      persistent: true,
      ...options
    };
    
    this.adaptOptionsForPlatform();
  }
  
  adaptOptionsForPlatform() {
    switch (platform) {
      case 'win32':
        // Windows 可能需要不同的轮询间隔
        this.options.interval = this.options.interval || 1000;
        break;
      case 'darwin':
        // macOS 配置
        this.options.recursive = this.options.recursive ?? true;
        break;
      default:
        // Linux 配置
        this.options.recursive = this.options.recursive ?? false;
    }
  }
  
  watch(path, callback) {
    try {
      return watch(path, this.options, callback);
    } catch (error) {
      if (error.code === 'ERR_FEATURE_UNAVAILABLE_ON_PLATFORM') {
        // 平台不支持某些特性，回退到基本模式
        console.warn('平台不支持某些监视特性，使用基本模式');
        return watch(path, { ...this.options, recursive: false }, callback);
      }
      throw error;
    }
  }
  
  // 跨平台的文件变化处理
  normalizeEvent(eventType, filename) {
    if (platform === 'win32') {
      // Windows 事件类型标准化
      return {
        type: eventType === 'rename' ? 'change' : eventType,
        file: filename
      };
    }
    
    return { type: eventType, file: filename };
  }
}
```

## 测试与验证策略

### 跨平台测试套件

确保代码在所有目标平台上正常工作。

```javascript
// cross-platform-test.mjs
import { platform, arch } from 'node:process';

class PlatformTestSuite {
  static runBasicTests() {
    const tests = {
      '路径处理': this.testPathHandling(),
      '环境变量': this.testEnvironmentVariables(),
      '命令执行': this.testCommandExecution(),
      '文件系统': this.testFileSystem()
    };
    
    const results = {};
    for (const [name, test] of Object.entries(tests)) {
      try {
        results[name] = test();
      } catch (error) {
        results[name] = { success: false, error: error.message };
      }
    }
    
    return results;
  }
  
  static testPathHandling() {
    const path = await import('node:path');
    const testPath = 'some/mixed\\path';
    const normalized = path.normalize(testPath);
    
    return {
      success: !normalized.includes('\\') && !normalized.includes('//'),
      normalizedPath: normalized
    };
  }
  
  static testEnvironmentVariables() {
    const home = platform === 'win32' ? 
      process.env.USERPROFILE : 
      process.env.HOME;
    
    return {
      success: !!home,
      homeDirectory: home
    };
  }
  
  static async testCommandExecution() {
    const { execSync } = await import('node:child_process');
    
    try {
      let output;
      if (platform === 'win32') {
        output = execSync('echo %OS%', { encoding: 'utf8' });
      } else {
        output = execSync('echo $SHELL', { encoding: 'utf8' });
      }
      
      return {
        success: !!output.trim(),
        output: output.trim()
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  static testFileSystem() {
    const fs = await import('node:fs');
    const testFile = `test-${platform}-${Date.now()}.tmp`;
    
    try {
      fs.writeFileSync(testFile, 'test content');
      const content = fs.readFileSync(testFile, 'utf8');
      fs.unlinkSync(testFile);
      
      return {
        success: content === 'test content',
        operation: 'write-read-delete'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// 运行测试
const testResults = PlatformTestSuite.runBasicTests();
console.log('跨平台测试结果:');
console.table(testResults);
```