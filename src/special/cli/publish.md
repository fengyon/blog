# 发布

## Node.js 命令行发布概述

在 Node.js 命令行工具开发中，发布是将构建完成的工具交付给最终用户的关键环节。一个完整的发布流程涉及版本管理、包分发、安装优化和更新维护等多个方面，直接影响工具的可达性和用户体验。

```
发布流程全景图：
代码完成 → 版本管理 → 构建验证 → 包发布 → 安装测试 → 更新维护
    ↓          ↓          ↓          ↓          ↓          ↓
功能实现   语义版本   质量检查   npm注册表   用户环境   持续支持
```

## 版本管理与策略

### 语义化版本控制

语义化版本 (SemVer) 是行业标准，通过版本号传达变更的性质和影响范围。

```javascript
// version-strategy.mjs
import { readFileSync, writeFileSync } from 'node:fs';

class VersionManager {
  constructor() {
    this.packagePath = 'package.json';
    this.packageData = JSON.parse(readFileSync(this.packagePath, 'utf8'));
  }
  
  // 语义版本解析
  parseVersion(version) {
    const [major, minor, patch, ...preRelease] = version.replace(/[^\d.-]/g, '').split('.');
    return {
      major: parseInt(major),
      minor: parseInt(minor),
      patch: parseInt(patch),
      preRelease: preRelease.join('.')
    };
  }
  
  // 版本升级策略
  bumpVersion(type = 'patch', preReleaseId = null) {
    const current = this.parseVersion(this.packageData.version);
    let newVersion;
    
    switch (type) {
      case 'major':
        newVersion = `${current.major + 1}.0.0`;
        break;
      case 'minor':
        newVersion = `${current.major}.${current.minor + 1}.0`;
        break;
      case 'patch':
        newVersion = `${current.major}.${current.minor}.${current.patch + 1}`;
        break;
      default:
        throw new Error(`无效的版本类型: ${type}`);
    }
    
    // 预发布版本处理
    if (preReleaseId) {
      newVersion += `-${preReleaseId}.0`;
    }
    
    return newVersion;
  }
  
  // 版本依赖分析
  analyzeDependencies() {
    const { dependencies = {}, peerDependencies = {}, devDependencies = {} } = this.packageData;
    
    const analysis = {
      production: Object.entries(dependencies).map(([name, range]) => ({
        name,
        range,
        type: this.getVersionConstraintType(range)
      })),
      peer: Object.entries(peerDependencies).map(([name, range]) => ({
        name,
        range,
        type: this.getVersionConstraintType(range)
      })),
      development: Object.entries(devDependencies).map(([name, range]) => ({
        name,
        range,
        type: this.getVersionConstraintType(range)
      }))
    };
    
    return analysis;
  }
  
  getVersionConstraintType(range) {
    if (range === '*' || range === '') return 'any';
    if (range.startsWith('^')) return 'compatible';
    if (range.startsWith('~')) return 'patch';
    if (range.includes('||')) return 'multiple';
    if (range.includes('-')) return 'range';
    return 'exact';
  }
  
  // 执行版本更新
  async updateVersion(type, preReleaseId = null) {
    const newVersion = this.bumpVersion(type, preReleaseId);
    const oldVersion = this.packageData.version;
    
    console.log(`🆙 版本更新: ${oldVersion} → ${newVersion}`);
    
    // 更新 package.json
    this.packageData.version = newVersion;
    writeFileSync(this.packagePath, JSON.stringify(this.packageData, null, 2));
    
    // 更新 changelog
    await this.updateChangelog(newVersion);
    
    return { oldVersion, newVersion };
  }
  
  async updateChangelog(version) {
    // 这里可以集成 conventional-changelog
    const changelogEntry = `## ${version} (${
      new Date().toISOString().split('T')[0]
    })\n\n* 功能更新和修复\n`;
    
    // 在实际项目中，这里会读取现有 CHANGELOG.md 并插入新条目
    console.log('📝 更新日志条目已准备:', changelogEntry);
  }
}

// 使用示例
const versionManager = new VersionManager();
const versionInfo = await versionManager.updateVersion('minor');
console.log('版本信息:', versionInfo);

const depsAnalysis = versionManager.analyzeDependencies();
console.log('依赖分析:', depsAnalysis);
```

### 预发布版本管理

预发布版本用于测试和早期用户反馈，不破坏稳定版本流。

```javascript
// pre-release.mjs
import { execSync } from 'node:child_process';

class PreReleaseManager {
  constructor() {
    this.packageData = JSON.parse(readFileSync('package.json', 'utf8'));
  }
  
  // 创建预发布版本
  createPreRelease(type = 'beta') {
    const current = this.packageData.version;
    const preReleaseVersion = `${current}-${type}.${Date.now()}`;
    
    // 使用 npm version 但不提交
    execSync(`npm version ${preReleaseVersion} --no-git-tag-version`, {
      stdio: 'inherit'
    });
    
    console.log(`🧪 创建预发布版本: ${preReleaseVersion}`);
    return preReleaseVersion;
  }
  
  // 发布预发布版本
  async publishPreRelease(tag = 'beta') {
    const version = this.createPreRelease(tag);
    
    try {
      console.log(`🚀 发布预发布版本到 npm (tag: ${tag})...`);
      execSync(`npm publish --tag ${tag}`, { stdio: 'inherit' });
      console.log(`✅ 预发布版本 ${version} 已发布`);
      return version;
    } catch (error) {
      console.error('❌ 预发布版本发布失败:', error.message);
      throw error;
    }
  }
  
  // 从预发布升级到稳定版
  promoteToStable(preReleaseVersion) {
    const stableVersion = preReleaseVersion.split('-')[0];
    
    console.log(`🎯 将预发布版本 ${preReleaseVersion} 升级为稳定版 ${stableVersion}`);
    
    // 更新版本号
    execSync(`npm version ${stableVersion} --no-git-tag-version`, {
      stdio: 'inherit'
    });
    
    // 重新发布为 latest
    execSync('npm publish --tag latest', { stdio: 'inherit' });
    
    return stableVersion;
  }
}

// 使用示例
const preReleaseManager = new PreReleaseManager();

// 创建并发布 beta 版本
// const betaVersion = await preReleaseManager.publishPreRelease('beta');

// 当测试通过后，升级到稳定版
// const stableVersion = preReleaseManager.promoteToStable(betaVersion);
```

## npm 包发布配置

### package.json 发布优化

精心配置的 package.json 是成功发布的关键。

```javascript
// package-optimization.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

class PackageOptimizer {
  constructor() {
    this.packagePath = 'package.json';
    this.packageData = JSON.parse(readFileSync(this.packagePath, 'utf8'));
  }
  
  // 优化发布配置
  optimizeForPublish() {
    const optimized = {
      ...this.packageData,
      
      // 关键发布字段
      files: this.ensureFilesField(),
      main: this.ensureMainField(),
      bin: this.ensureBinField(),
      exports: this.ensureExportsField(),
      
      // 发布元数据
      keywords: this.ensureKeywords(),
      homepage: this.packageData.homepage || `https://npmjs.com/package/${this.packageData.name}`,
      repository: this.ensureRepository(),
      bugs: this.ensureBugs(),
      
      // 发布配置
      publishConfig: this.ensurePublishConfig(),
      
      // 引擎要求
      engines: this.ensureEngines(),
      os: this.ensureOS(),
      cpu: this.ensureCPU()
    };
    
    writeFileSync(this.packagePath, JSON.stringify(optimized, null, 2));
    console.log('✅ package.json 已优化用于发布');
    return optimized;
  }
  
  ensureFilesField() {
    const defaultFiles = ['dist/', 'bin/', 'README.md', 'LICENSE'];
    const currentFiles = this.packageData.files || [];
    
    // 合并并去重
    const merged = [...new Set([...currentFiles, ...defaultFiles])];
    
    // 验证文件是否存在
    const missing = merged.filter(file => !existsSync(file.replace(/\/$/, '')));
    if (missing.length > 0) {
      console.warn('⚠️  以下文件在发布列表中但不存在:', missing);
    }
    
    return merged;
  }
  
  ensureMainField() {
    if (!this.packageData.main && existsSync('dist/cli.cjs')) {
      return './dist/cli.cjs';
    }
    return this.packageData.main;
  }
  
  ensureBinField() {
    if (!this.packageData.bin && existsSync('bin/cli.mjs')) {
      return { [this.packageData.name]: './bin/cli.mjs' };
    }
    return this.packageData.bin;
  }
  
  ensureExportsField() {
    const exports = {
      '.': {
        import: './dist/cli.mjs',
        require: './dist/cli.cjs',
        default: './dist/cli.mjs'
      },
      './package.json': './package.json'
    };
    
    // 如果存在样式文件，添加样式导出
    if (existsSync('dist/style.css')) {
      exports['./style.css'] = './dist/style.css';
    }
    
    return exports;
  }
  
  ensureKeywords() {
    const baseKeywords = ['cli', 'command-line', 'tool'];
    const currentKeywords = this.packageData.keywords || [];
    
    return [...new Set([...currentKeywords, ...baseKeywords])];
  }
  
  ensureRepository() {
    if (this.packageData.repository) return this.packageData.repository;
    
    // 尝试从 git 配置推断
    try {
      const remoteUrl = execSync('git config --get remote.origin.url', { 
        encoding: 'utf8' 
      }).trim();
      
      if (remoteUrl) {
        return {
          type: 'git',
          url: remoteUrl.replace('git@github.com:', 'https://github.com/')
        };
      }
    } catch (error) {
      // 忽略错误
    }
    
    return undefined;
  }
  
  ensurePublishConfig() {
    const defaultConfig = {
      access: 'public',
      registry: 'https://registry.npmjs.org/'
    };
    
    return { ...defaultConfig, ...this.packageData.publishConfig };
  }
  
  ensureEngines() {
    return this.packageData.engines || { 
      node: '>=18.0.0',
      npm: '>=8.0.0'
    };
  }
  
  // 操作系统兼容性声明
  ensureOS() {
    return this.packageData.os || [
      'darwin',  // macOS
      'linux',   // Linux
      'win32'    // Windows
    ];
  }
  
  // CPU 架构兼容性声明
  ensureCPU() {
    return this.packageData.cpu || [
      'x64',     // 64位 Intel/AMD
      'arm64'    // Apple Silicon, ARM
    ];
  }
}

// 使用示例
const optimizer = new PackageOptimizer();
const optimizedPackage = optimizer.optimizeForPublish();
console.log('优化后的包配置:', optimizedPackage);
```

### 发布前验证

确保发布包的质量和完整性。

```javascript
// pre-publish-validation.mjs
import { existsSync, readFileSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';

class PrePublishValidator {
  constructor() {
    this.packageData = JSON.parse(readFileSync('package.json', 'utf8'));
    this.checks = [];
  }
  
  async runAllChecks() {
    console.log('🔍 运行发布前验证...');
    
    const results = {
      passed: [],
      failed: [],
      warnings: []
    };
    
    // 运行所有检查
    await this.checkPackageSize();
    await this.checkRequiredFiles();
    await this.checkBuildArtifacts();
    await this.checkDependencies();
    await this.checkLicense();
    await this.checkReadme();
    await this.checkExecutablePermissions();
    
    // 汇总结果
    for (const check of this.checks) {
      if (check.status === 'passed') {
        results.passed.push(check);
      } else if (check.status === 'failed') {
        results.failed.push(check);
      } else {
        results.warnings.push(check);
      }
    }
    
    this.printResults(results);
    return results;
  }
  
  async checkPackageSize() {
    const check = { name: '包大小检查', status: 'pending' };
    
    try {
      // 估算包大小
      let totalSize = 0;
      const files = this.packageData.files || [];
      
      for (const filePattern of files) {
        if (existsSync(filePattern)) {
          const stats = statSync(filePattern);
          totalSize += stats.size;
        }
      }
      
      const sizeMB = totalSize / 1024 / 1024;
      check.details = `估算大小: ${sizeMB.toFixed(2)} MB`;
      
      if (sizeMB > 50) {
        check.status = 'warning';
        check.message = '包大小超过 50MB，可能影响安装体验';
      } else {
        check.status = 'passed';
      }
    } catch (error) {
      check.status = 'failed';
      check.message = `大小检查失败: ${error.message}`;
    }
    
    this.checks.push(check);
  }
  
  async checkRequiredFiles() {
    const check = { name: '必要文件检查', status: 'pending' };
    const requiredFiles = [
      'package.json',
      'README.md',
      'LICENSE',
      ...(this.packageData.files || [])
    ];
    
    const missing = [];
    for (const file of requiredFiles) {
      if (!existsSync(file)) {
        missing.push(file);
      }
    }
    
    if (missing.length > 0) {
      check.status = 'failed';
      check.message = `缺少必要文件: ${missing.join(', ')}`;
    } else {
      check.status = 'passed';
      check.message = '所有必要文件都存在';
    }
    
    this.checks.push(check);
  }
  
  async checkBuildArtifacts() {
    const check = { name: '构建产物检查', status: 'pending' };
    
    try {
      // 检查构建产物是否存在且可执行
      const binPath = typeof this.packageData.bin === 'string' 
        ? this.packageData.bin 
        : Object.values(this.packageData.bin || {})[0];
      
      if (binPath && existsSync(binPath)) {
        // 验证可执行文件
        execSync(`node ${binPath} --version`, { stdio: 'pipe' });
        check.status = 'passed';
        check.message = '构建产物验证通过';
      } else {
        check.status = 'failed';
        check.message = '可执行文件不存在或配置错误';
      }
    } catch (error) {
      check.status = 'failed';
      check.message = `构建产物验证失败: ${error.message}`;
    }
    
    this.checks.push(check);
  }
  
  async checkDependencies() {
    const check = { name: '依赖检查', status: 'pending' };
    
    try {
      // 检查是否有未声明的依赖
      execSync('npx depcheck', { stdio: 'pipe' });
      check.status = 'passed';
      check.message = '依赖关系正常';
    } catch (error) {
      check.status = 'warning';
      check.message = '依赖检查发现警告，请检查 depcheck 输出';
    }
    
    this.checks.push(check);
  }
  
  async checkLicense() {
    const check = { name: '许可证检查', status: 'pending' };
    
    if (!this.packageData.license) {
      check.status = 'failed';
      check.message = 'package.json 中未声明许可证';
    } else if (!existsSync('LICENSE')) {
      check.status = 'warning';
      check.message = '已声明许可证但缺少 LICENSE 文件';
    } else {
      check.status = 'passed';
      check.message = `许可证配置正常: ${this.packageData.license}`;
    }
    
    this.checks.push(check);
  }
  
  async checkExecutablePermissions() {
    const check = { name: '可执行权限检查', status: 'pending' };
    
    try {
      const binPath = typeof this.packageData.bin === 'string' 
        ? this.packageData.bin 
        : Object.values(this.packageData.bin || {})[0];
      
      if (binPath && existsSync(binPath)) {
        // 在 Unix 系统上检查执行权限
        const stats = statSync(binPath);
        const hasExecutePermission = (stats.mode & 0o111) !== 0;
        
        if (hasExecutePermission) {
          check.status = 'passed';
          check.message = '可执行文件权限正确';
        } else {
          check.status = 'warning';
          check.message = '可执行文件缺少执行权限';
        }
      } else {
        check.status = 'passed';
        check.message = '无可执行文件需要检查';
      }
    } catch (error) {
      check.status = 'warning';
      check.message = `权限检查失败: ${error.message}`;
    }
    
    this.checks.push(check);
  }
  
  printResults(results) {
    console.log('\n📊 发布前验证结果:');
    
    console.log('\n✅ 通过的检查:');
    results.passed.forEach(check => {
      console.log(`  ✓ ${check.name}: ${check.message}`);
    });
    
    if (results.warnings.length > 0) {
      console.log('\n⚠️  警告:');
      results.warnings.forEach(check => {
        console.log(`  ! ${check.name}: ${check.message}`);
      });
    }
    
    if (results.failed.length > 0) {
      console.log('\n❌ 失败的检查:');
      results.failed.forEach(check => {
        console.log(`  ✗ ${check.name}: ${check.message}`);
      });
      console.log('\n🚫 发布被阻止，请修复上述问题后重试');
      process.exit(1);
    } else {
      console.log('\n🎉 所有检查通过，可以发布！');
    }
  }
}

// 使用示例
const validator = new PrePublishValidator();
await validator.runAllChecks();
```

## 发布执行与自动化

### npm 发布流程

```javascript
// publish-executor.mjs
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

class PublishExecutor {
  constructor(options = {}) {
    this.options = {
      dryRun: false,
      tag: 'latest',
      otp: process.env.NPM_OTP,
      ...options
    };
    
    this.packageData = require('./package.json');
  }
  
  async publish() {
    console.log(`🚀 开始发布 ${this.packageData.name}@${this.packageData.version}`);
    
    try {
      // 构建发布命令
      let publishCommand = 'npm publish';
      
      if (this.options.tag && this.options.tag !== 'latest') {
        publishCommand += ` --tag ${this.options.tag}`;
      }
      
      if (this.options.otp) {
        publishCommand += ` --otp ${this.options.otp}`;
      }
      
      if (this.options.dryRun) {
        publishCommand += ' --dry-run';
        console.log('🧪 干运行模式，不会实际发布');
      }
      
      // 执行发布
      console.log(`执行: ${publishCommand}`);
      const output = execSync(publishCommand, { encoding: 'utf8' });
      console.log('发布输出:', output);
      
      if (!this.options.dryRun) {
        console.log(`✅ 成功发布 ${this.packageData.name}@${this.packageData.version}`);
        await this.postPublishTasks();
      }
      
      return true;
    } catch (error) {
      console.error(`❌ 发布失败: ${error.message}`);
      return false;
    }
  }
  
  async postPublishTasks() {
    console.log('\n🔧 执行发布后任务...');
    
    const tasks = [
      this.verifyPackageOnNPM(),
      this.createGitTag(),
      this.updateDistributionTags(),
      this.notifyTeam()
    ];
    
    for (const task of tasks) {
      try {
        await task;
      } catch (error) {
        console.warn(`发布后任务警告: ${error.message}`);
      }
    }
  }
  
  async verifyPackageOnNPM() {
    console.log('🔍 验证包在 npm 上的可用性...');
    
    try {
      // 使用 npm view 检查包信息
      execSync(`npm view ${this.packageData.name} version`, { stdio: 'pipe' });
      console.log('✅ 包在 npm 上可访问');
    } catch (error) {
      throw new Error('包在 npm 上不可访问，可能需要等待同步');
    }
  }
  
  async createGitTag() {
    console.log('🏷️  创建 Git 标签...');
    
    try {
      const tagName = `v${this.packageData.version}`;
      execSync(`git tag -a ${tagName} -m "Release ${tagName}"`, { stdio: 'inherit' });
      execSync('git push --tags', { stdio: 'inherit' });
      console.log(`✅ Git 标签 ${tagName} 已创建并推送`);
    } catch (error) {
      throw new Error(`Git 标签创建失败: ${error.message}`);
    }
  }
  
  async updateDistributionTags() {
    if (this.options.tag === 'latest') {
      console.log('📢 更新最新版本标签...');
      
      try {
        // 确保最新版本被标记为 latest
        execSync(`npm dist-tag add ${this.packageData.name}@${this.packageData.version} latest`, {
          stdio: 'inherit'
        });
        console.log('✅ 最新版本标签已更新');
      } catch (error) {
        throw new Error(`分布标签更新失败: ${error.message}`);
      }
    }
  }
  
  async notifyTeam() {
    console.log('📢 发送发布通知...');
    
    // 这里可以集成 Slack、Discord 或邮件通知
    const message = `🎉 ${this.packageData.name} v${this.packageData.version} 已发布！`;
    console.log(message);
    
    // 实际项目中这里会有具体的通知逻辑
  }
}

// 使用示例
const publisher = new PublishExecutor({
  dryRun: process.argv.includes('--dry-run'),
  tag: process.env.NPM_TAG || 'latest'
});

const success = await publisher.publish();
process.exit(success ? 0 : 1);
```

### 多注册表发布

支持发布到多个包注册表 (npm、GitHub Packages 等)。

```javascript
// multi-registry-publish.mjs
import { execSync } from 'node:child_process';

class MultiRegistryPublisher {
  constructor() {
    this.registries = {
      npm: {
        command: 'npm publish',
        registry: 'https://registry.npmjs.org/',
        requiredAuth: true
      },
      github: {
        command: 'npm publish',
        registry: 'https://npm.pkg.github.com/',
        requiredAuth: true,
        scope: true
      },
      verdaccio: {
        command: 'npm publish',
        registry: 'http://localhost:4873/',
        requiredAuth: false
      }
    };
  }
  
  async publishToAll(registries = ['npm']) {
    const results = {};
    
    for (const registryName of registries) {
      console.log(`\n🚀 发布到 ${registryName}...`);
      
      try {
        const success = await this.publishToRegistry(registryName);
        results[registryName] = { success, error: null };
        
        if (success) {
          console.log(`✅ 成功发布到 ${registryName}`);
        }
      } catch (error) {
        results[registryName] = { success: false, error: error.message };
        console.error(`❌ 发布到 ${registryName} 失败:`, error.message);
      }
    }
    
    this.printPublishSummary(results);
    return results;
  }
  
  async publishToRegistry(registryName) {
    const registry = this.registries[registryName];
    if (!registry) {
      throw new Error(`未知的注册表: ${registryName}`);
    }
    
    // 检查认证
    if (registry.requiredAuth) {
      await this.checkAuth(registryName, registry.registry);
    }
    
    // 构建发布命令
    let command = registry.command;
    
    if (registry.registry) {
      command += ` --registry ${registry.registry}`;
    }
    
    if (registry.scope) {
      // GitHub Packages 需要 scope
      const packageName = JSON.parse(execSync('npm pkg get name', { encoding: 'utf8' }));
      if (!packageName.includes('/')) {
        throw new Error(`${registryName} 需要作用域包名称 (如 @username/package)`);
      }
    }
    
    // 执行发布
    execSync(command, { stdio: 'inherit' });
    return true;
  }
  
  async checkAuth(registryName, registryUrl) {
    try {
      // 检查是否已登录
      execSync(`npm whoami --registry ${registryUrl}`, { stdio: 'pipe' });
      console.log(`✅ 已认证到 ${registryName}`);
      return true;
    } catch (error) {
      throw new Error(`未认证到 ${registryName}，请先运行: npm login --registry=${registryUrl}`);
    }
  }
  
  printPublishSummary(results) {
    console.log('\n📊 多注册表发布摘要:');
    
    const successful = Object.entries(results).filter(([_, result]) => result.success);
    const failed = Object.entries(results).filter(([_, result]) => !result.success);
    
    if (successful.length > 0) {
      console.log('\n✅ 成功发布的注册表:');
      successful.forEach(([name]) => console.log(`  ✓ ${name}`));
    }
    
    if (failed.length > 0) {
      console.log('\n❌ 发布失败的注册表:');
      failed.forEach(([name, result]) => console.log(`  ✗ ${name}: ${result.error}`));
    }
    
    console.log(`\n🎯 总体结果: ${successful.length}/${Object.keys(results).length} 成功`);
  }
  
  // 配置多个注册表
  setupRegistryConfigs() {
    const configs = {
      'registry': 'https://registry.npmjs.org/',
      '@mycompany:registry': 'https://npm.pkg.github.com/',
      '//registry.npmjs.org/:_authToken': process.env.NPM_TOKEN,
      '//npm.pkg.github.com/:_authToken': process.env.GITHUB_TOKEN
    };
    
    for (const [key, value] of Object.entries(configs)) {
      if (value) {
        try {
          execSync(`npm config set ${key} ${value}`, { stdio: 'pipe' });
          console.log(`✅ 配置: ${key} = ${value}`);
        } catch (error) {
          console.warn(`⚠️  配置失败: ${key}`);
        }
      }
    }
  }
}

// 使用示例
const multiPublisher = new MultiRegistryPublisher();

// 配置注册表
multiPublisher.setupRegistryConfigs();

// 发布到多个注册表
const results = await multiPublisher.publishToAll(['npm', 'github']);
```

## 发布后维护

### 版本分发管理

```javascript
// distribution-management.mjs
import { execSync } from 'node:child_process';

class DistributionManager {
  constructor(packageName) {
    this.packageName = packageName;
  }
  
  // 查看分布标签
  listDistributionTags() {
    try {
      const output = execSync(`npm dist-tag ls ${this.packageName}`, { 
        encoding: 'utf8' 
      });
      
      console.log('🏷️  分布标签:');
      console.log(output);
      
      return output.split('\n')
        .filter(line => line.includes(':'))
        .map(line => {
          const [tag, version] = line.split(':').map(s => s.trim());
          return { tag, version };
        });
    } catch (error) {
      console.error('无法获取分布标签:', error.message);
      return [];
    }
  }
  
  // 添加分布标签
  addDistributionTag(version, tag) {
    try {
      execSync(`npm dist-tag add ${this.packageName}@${version} ${tag}`, {
        stdio: 'inherit'
      });
      console.log(`✅ 添加标签: ${version} → ${tag}`);
      return true;
    } catch (error) {
      console.error(`❌ 添加标签失败: ${error.message}`);
      return false;
    }
  }
  
  // 删除分布标签
  removeDistributionTag(tag) {
    try {
      execSync(`npm dist-tag rm ${this.packageName} ${tag}`, {
        stdio: 'inherit'
      });
      console.log(`✅ 删除标签: ${tag}`);
      return true;
    } catch (error) {
      console.error(`❌ 删除标签失败: ${error.message}`);
      return false;
    }
  }
  
  // 推广版本（如从 beta 到 latest）
  promoteVersion(fromTag, toTag = 'latest') {
    const tags = this.listDistributionTags();
    const fromVersion = tags.find(t => t.tag === fromTag)?.version;
    
    if (!fromVersion) {
      console.error(`❌ 未找到标签: ${fromTag}`);
      return false;
    }
    
    console.log(`🎯 推广版本: ${fromVersion} (${fromTag} → ${toTag})`);
    
    return this.addDistributionTag(fromVersion, toTag);
  }
  
  // 检查版本采用情况
  async checkVersionAdoption(version) {
    try {
      // 使用 npm stats 或其他分析工具
      const info = execSync(`npm view ${this.packageName}@${version}`, {
        encoding: 'utf8'
      });
      
      const downloads = await this.getDownloadStats(version);
      
      return {
        version,
        info: info.split('\n').slice(0, 10), // 前10行信息
        downloads,
        published: this.getPublishTime(version)
      };
    } catch (error) {
      return { version, error: error.message };
    }
  }
  
  async getDownloadStats(version) {
    try {
      const output = execSync(`npm stats ${this.packageName}`, { 
        encoding: 'utf8' 
      });
      // 解析下载统计信息
      return { lastDay: 'N/A', lastWeek: 'N/A', lastMonth: 'N/A' };
    } catch (error) {
      return { error: '无法获取下载统计' };
    }
  }
  
  getPublishTime(version) {
    try {
      const output = execSync(`npm view ${this.packageName}@${version} time`, {
        encoding: 'utf8'
      });
      
      const lines = output.split('\n');
      const publishLine = lines.find(line => line.includes(version));
      return publishLine ? publishLine.split("'")[1] : '未知';
    } catch (error) {
      return '未知';
    }
  }
}

// 使用示例
const distManager = new DistributionManager('my-cli-tool');

// 管理分布标签
distManager.listDistributionTags();
// distManager.promoteVersion('beta', 'latest');
// distManager.addDistributionTag('1.2.3', 'stable');
```

### 弃用管理

```javascript
// deprecation-manager.mjs
import { execSync } from 'node:child_process';

class DeprecationManager {
  constructor(packageName) {
    this.packageName = packageName;
  }
  
  // 弃用特定版本
  deprecateVersion(version, message) {
    try {
      const deprecateMessage = message || `版本 ${version} 已弃用，请升级到最新版本`;
      
      execSync(`npm deprecate ${this.packageName}@${version} "${deprecateMessage}"`, {
        stdio: 'inherit'
      });
      
      console.log(`⚠️  已弃用版本 ${version}: ${deprecateMessage}`);
      return true;
    } catch (error) {
      console.error(`❌ 弃用操作失败: ${error.message}`);
      return false;
    }
  }
  
  // 弃用版本范围
  deprecateVersionRange(range, message) {
    try {
      execSync(`npm deprecate ${this.packageName}@"${range}" "${message}"`, {
        stdio: 'inherit'
      });
      
      console.log(`⚠️  已弃用版本范围 ${range}`);
      return true;
    } catch (error) {
      console.error(`❌ 范围弃用失败: ${error.message}`);
      return false;
    }
  }
  
  // 批量弃用旧版本
  deprecateOldVersions(keepLast = 5) {
    const versions = this.getVersionList();
    const oldVersions = versions.slice(0, -keepLast);
    
    console.log(`🗑️  准备弃用 ${oldVersions.length} 个旧版本，保留最新的 ${keepLast} 个版本`);
    
    let deprecatedCount = 0;
    for (const version of oldVersions) {
      const success = this.deprecateVersion(
        version, 
        `版本 ${version} 已过时，请升级到最新版本`
      );
      
      if (success) {
        deprecatedCount++;
      }
    }
    
    console.log(`✅ 已弃用 ${deprecatedCount}/${oldVersions.length} 个旧版本`);
    return deprecatedCount;
  }
  
  // 获取版本列表
  getVersionList() {
    try {
      const output = execSync(`npm view ${this.packageName} versions --json`, {
        encoding: 'utf8'
      });
      
      return JSON.parse(output);
    } catch (error) {
      console.error('无法获取版本列表:', error.message);
      return [];
    }
  }
  
  // 生成弃用报告
  generateDeprecationReport() {
    const versions = this.getVersionList();
    const currentVersion = versions[versions.length - 1];
    
    const report = {
      package: this.packageName,
      currentVersion,
      totalVersions: versions.length,
      deprecated: this.getDeprecatedVersions(),
      recommendations: []
    };
    
    // 生成建议
    if (versions.length > 10) {
      report.recommendations.push('考虑弃用一些旧版本以减少维护负担');
    }
    
    const majorVersions = this.groupByMajorVersion(versions);
    if (Object.keys(majorVersions).length >= 3) {
      report.recommendations.push('多个主要版本并存，考虑弃用旧的主要版本');
    }
    
    return report;
  }
  
  getDeprecatedVersions() {
    try {
      const output = execSync(`npm view ${this.packageName} --json`, {
        encoding: 'utf8'
      });
      
      const info = JSON.parse(output);
      return info.deprecated || [];
    } catch (error) {
      return [];
    }
  }
  
  groupByMajorVersion(versions) {
    const groups = {};
    
    for (const version of versions) {
      const major = version.split('.')[0];
      if (!groups[major]) {
        groups[major] = [];
      }
      groups[major].push(version);
    }
    
    return groups;
  }
}

// 使用示例
const deprecationManager = new DeprecationManager('my-cli-tool');

// 生成弃用报告
const report = deprecationManager.generateDeprecationReport();
console.log('弃用报告:', report);

// 弃用旧版本
// deprecationManager.deprecateOldVersions(3);
```

通过实施这些发布策略和工具，Node.js 命令行工具可以实现专业化的发布流程，确保版本管理的规范性、发布过程的可控性以及用户获取的便利性。