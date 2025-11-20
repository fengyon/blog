# Electron 发布与更新

## 发布与更新概述

Electron 应用的发布与更新是应用生命周期中的关键环节，它涵盖了从**应用打包**、**代码签名**到**分发给用户**并**持续提供更新**的完整流程。与传统的 Web 应用不同，Electron 应用需要处理跨平台分发、自动更新机制和版本管理等一系列复杂问题。

完整的发布与更新流程构成了一个循环的周期：

```
开发 → 打包 → 签名 → 发布 → 更新检查 → 下载 → 安装 → 重启
         ↑                                      ↓
         └──────────────────────────────────────┘
```

## 应用打包与分发

### 打包工具选择

Electron 应用打包的主要工具包括 **electron-builder** 和 **Electron Forge**。electron-builder 因其丰富的功能和配置灵活性成为最流行的选择。

**打包工具对比示意图：**

```
源代码 + 资源文件
    ├── electron-builder (功能全面，配置灵活)
    ├── Electron Forge (一体化解决方案)  
    └── 手动打包 (完全控制，复杂度高)
```

### electron-builder 配置

```javascript
// electron-builder.config.js
import { defineConfig } from 'electron-builder';

export default defineConfig({
  appId: 'com.yourcompany.yourapp',
  productName: 'Your Awesome App',
  copyright: `Copyright © ${new Date().getFullYear()} Your Company`,
  
  directories: {
    output: 'dist',
    buildResources: 'build'
  },
  
  files: [
    'package.json',
    'build/**/*',
    'dist/**/*',
    'node_modules/**/*',
    '!node_modules/.cache'
  ],
  
  // 压缩配置
  compression: 'maximum',
  asar: true,
  
  // 自动更新配置
  publish: {
    provider: 'github',
    owner: 'your-username',
    repo: 'your-repo-name',
    releaseType: 'release'
  },
  
  // 平台特定配置
  mac: {
    category: 'public.app-category.productivity',
    target: ['dmg', 'zip'],
    icon: 'build/icons/icon.icns',
    darkModeSupport: true,
    hardenedRuntime: true
  },
  
  win: {
    target: ['nsis', 'portable'],
    icon: 'build/icons/icon.ico',
    publisherName: 'Your Company'
  },
  
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true
  },
  
  linux: {
    target: ['AppImage', 'deb'],
    category: 'Office',
    icon: 'build/icons'
  }
});
```

### 自动化构建脚本

```javascript
// scripts/build.js
import { build } from 'electron-builder';
import { readFile, writeFile } from 'fs/promises';
import { createHash } from 'crypto';

class BuildManager {
  constructor() {
    this.platforms = [
      { platform: 'win32', arch: ['x64'] },
      { platform: 'darwin', arch: ['x64', 'arm64'] },
      { platform: 'linux', arch: ['x64'] }
    ];
  }

  async updateVersion() {
    // 读取 package.json
    const packageJson = JSON.parse(
      await readFile('./package.json', 'utf-8')
    );
    
    // 在生产环境中自动增加构建版本号
    if (process.env.NODE_ENV === 'production') {
      const version = packageJson.version.split('.');
      version[2] = String(Number(version[2]) + 1);
      packageJson.version = version.join('.');
      
      await writeFile(
        './package.json', 
        JSON.stringify(packageJson, null, 2)
      );
    }
    
    return packageJson.version;
  }

  async generateChecksums() {
    // 为构建文件生成校验和
    const files = await glob('dist/**/*.{exe,dmg,AppImage,deb}');
    const checksums = {};
    
    for (const file of files) {
      const content = await readFile(file);
      checksums[path.basename(file)] = 
        createHash('sha256').update(content).digest('hex');
    }
    
    await writeFile(
      'dist/checksums.json',
      JSON.stringify(checksums, null, 2)
    );
  }

  async buildAllPlatforms() {
    const version = await this.updateVersion();
    console.log(`🚀 开始构建版本 ${version}...`);
    
    for (const { platform, arch } of this.platforms) {
      for (const a of arch) {
        console.log(`🔨 构建 ${platform}-${a}...`);
        
        await build({
          targets: this.getPlatformTarget(platform),
          [platform]: {},
          config: {
            ...this.config,
            [platform]: this.config[platform] || {}
          }
        });
      }
    }
    
    await this.generateChecksums();
    console.log('✅ 所有平台构建完成！');
  }

  getPlatformTarget(platform) {
    const targetMap = {
      win32: 'nsis',
      darwin: 'dmg',
      linux: 'AppImage'
    };
    return targetMap[platform] || 'dir';
  }
}

const buildManager = new BuildManager();
export default buildManager;
```

## 自动更新机制

### 自动更新架构

Electron 应用的自动更新主要依赖 **electron-updater** 模块，它提供了完整的更新检查、下载和安装功能。

**更新流程示意图：**

```
客户端应用
    ↓ 检查更新
更新服务器 (GitHub/GitLab/自定义)
    ↓ 返回更新信息
客户端下载更新包
    ↓ 验证签名
安装更新并重启
```

### 基本更新配置

```javascript
// update/update-manager.js
import { autoUpdater } from 'electron-updater';
import { dialog, app, BrowserWindow } from 'electron';
import { writeFile } from 'fs/promises';

class UpdateManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.autoDownload = false;
    this.setupAutoUpdater();
  }

  setupAutoUpdater() {
    // 配置自动更新
    autoUpdater.autoDownload = this.autoDownload;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowDowngrade = false;
    autoUpdater.fullChangelog = true;

    // 设置事件监听
    this.setupEventListeners();
    
    // 记录更新状态
    this.logUpdateEvent('更新管理器初始化完成');
  }

  setupEventListeners() {
    // 检查更新中
    autoUpdater.on('checking-for-update', () => {
      this.logUpdateEvent('正在检查更新...');
      this.sendStatusToWindow('checking-for-update');
    });

    // 有可用更新
    autoUpdater.on('update-available', (info) => {
      this.logUpdateEvent(`发现新版本: ${info.version}`);
      this.sendStatusToWindow('update-available', info);
      this.handleUpdateAvailable(info);
    });

    // 没有可用更新
    autoUpdater.on('update-not-available', (info) => {
      this.logUpdateEvent(`当前已是最新版本: ${info.version}`);
      this.sendStatusToWindow('update-not-available', info);
    });

    // 下载进度
    autoUpdater.on('download-progress', (progress) => {
      this.sendStatusToWindow('download-progress', progress);
      this.logUpdateEvent(
        `下载进度: ${Math.floor(progress.percent)}% ` +
        `(${progress.bytesPerSecond} B/s)`
      );
    });

    // 更新下载完成
    autoUpdater.on('update-downloaded', (info) => {
      this.logUpdateEvent(`更新下载完成: ${info.version}`);
      this.sendStatusToWindow('update-downloaded', info);
      this.handleUpdateDownloaded(info);
    });

    // 错误处理
    autoUpdater.on('error', (error) => {
      this.logUpdateEvent(`更新错误: ${error.message}`);
      this.sendStatusToWindow('update-error', { error: error.message });
      this.handleUpdateError(error);
    });
  }

  async handleUpdateAvailable(info) {
    const { response } = await dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: '发现新版本',
      message: `发现新版本 ${info.version}，是否立即下载？`,
      detail: info.releaseNotes || '新版本包含功能改进和错误修复。',
      buttons: ['立即下载', '稍后提醒', '忽略此版本'],
      defaultId: 0,
      cancelId: 1
    });

    switch (response) {
      case 0: // 立即下载
        this.logUpdateEvent('用户选择下载更新');
        await autoUpdater.downloadUpdate();
        break;
      case 1: // 稍后提醒
        this.logUpdateEvent('用户选择稍后更新');
        break;
      case 2: // 忽略此版本
        this.logUpdateEvent(`用户忽略版本: ${info.version}`);
        await this.ignoreVersion(info.version);
        break;
    }
  }

  handleUpdateDownloaded(info) {
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: '更新下载完成',
      message: '新版本已下载完成，是否立即重启应用？',
      detail: '应用将在重启后完成更新。',
      buttons: ['立即重启', '稍后重启'],
      defaultId: 0,
      cancelId: 1
    }).then(({ response }) => {
      if (response === 0) {
        this.logUpdateEvent('用户确认安装更新，准备重启...');
        autoUpdater.quitAndInstall();
      }
    });
  }

  handleUpdateError(error) {
    dialog.showMessageBox(this.mainWindow, {
      type: 'error',
      title: '更新错误',
      message: '检查更新或下载更新时发生错误',
      detail: error.message,
      buttons: ['重试', '取消'],
      defaultId: 0
    }).then(({ response }) => {
      if (response === 0) {
        this.checkForUpdates();
      }
    });
  }

  async checkForUpdates() {
    try {
      this.logUpdateEvent('开始检查更新...');
      const result = await autoUpdater.checkForUpdates();
      return result;
    } catch (error) {
      this.logUpdateEvent(`检查更新失败: ${error.message}`);
      throw error;
    }
  }

  sendStatusToWindow(event, data) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('update-status', { event, data });
    }
  }

  async logUpdateEvent(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    
    try {
      await writeFile('update.log', logEntry, { flag: 'a' });
    } catch (error) {
      console.error('写入更新日志失败:', error);
    }
    
    console.log(`📝 ${logEntry}`);
  }

  async ignoreVersion(version) {
    // 将忽略的版本保存到配置中
    const ignoredVersions = this.getIgnoredVersions();
    ignoredVersions.push(version);
    
    await writeFile(
      'update-config.json',
      JSON.stringify({ ignoredVersions }, null, 2)
    );
  }

  getIgnoredVersions() {
    try {
      const config = JSON.parse(readFileSync('update-config.json', 'utf-8'));
      return config.ignoredVersions || [];
    } catch {
      return [];
    }
  }
}

export default UpdateManager;
```

### 渲染进程集成

```javascript
// renderer/update-ui.js
class UpdateUI {
  constructor() {
    this.updateRenderer = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.renderUpdateStatus();
  }

  setupEventListeners() {
    // 监听主进程发送的更新状态
    window.electronAPI.onUpdateStatus((event, { event: status, data }) => {
      this.handleUpdateStatus(status, data);
    });

    // 手动检查更新按钮
    document.getElementById('check-updates').addEventListener('click', () => {
      this.checkForUpdates();
    });

    // 下载更新按钮
    document.getElementById('download-update').addEventListener('click', () => {
      this.downloadUpdate();
    });

    // 安装更新按钮
    document.getElementById('install-update').addEventListener('click', () => {
      this.installUpdate();
    });
  }

  handleUpdateStatus(status, data) {
    const statusElement = document.getElementById('update-status');
    const progressElement = document.getElementById('download-progress');
    
    switch (status) {
      case 'checking-for-update':
        statusElement.textContent = '正在检查更新...';
        this.showNotification('正在检查更新', 'info');
        break;
        
      case 'update-available':
        statusElement.textContent = `发现新版本: ${data.version}`;
        this.showUpdateAvailableDialog(data);
        break;
        
      case 'update-not-available':
        statusElement.textContent = '当前已是最新版本';
        this.showNotification('当前已是最新版本', 'success');
        break;
        
      case 'download-progress':
        const percent = Math.floor(data.percent);
        progressElement.style.width = `${percent}%`;
        progressElement.textContent = `${percent}%`;
        statusElement.textContent = 
          `下载进度: ${percent}% (${this.formatBytes(data.bytesPerSecond)}/s)`;
        break;
        
      case 'update-downloaded':
        statusElement.textContent = '更新下载完成，准备安装';
        this.showUpdateReadyDialog(data);
        break;
        
      case 'update-error':
        statusElement.textContent = `更新失败: ${data.error}`;
        this.showNotification(`更新失败: ${data.error}`, 'error');
        break;
    }
  }

  showUpdateAvailableDialog(info) {
    const dialog = document.getElementById('update-dialog');
    const message = document.getElementById('update-message');
    
    message.innerHTML = `
      <h3>发现新版本 ${info.version}</h3>
      <p>${info.releaseNotes || '新版本包含功能改进和错误修复。'}</p>
      <div class="update-actions">
        <button id="confirm-download" class="btn-primary">立即下载</button>
        <button id="cancel-download" class="btn-secondary">稍后</button>
      </div>
    `;
    
    dialog.style.display = 'block';
    
    document.getElementById('confirm-download').addEventListener('click', () => {
      window.electronAPI.downloadUpdate();
      dialog.style.display = 'none';
    });
    
    document.getElementById('cancel-download').addEventListener('click', () => {
      dialog.style.display = 'none';
    });
  }

  showUpdateReadyDialog(info) {
    const dialog = document.getElementById('update-dialog');
    const message = document.getElementById('update-message');
    
    message.innerHTML = `
      <h3>更新下载完成</h3>
      <p>版本 ${info.version} 已下载完成，可以安装。</p>
      <div class="update-actions">
        <button id="confirm-install" class="btn-primary">立即重启并安装</button>
        <button id="delay-install" class="btn-secondary">稍后重启</button>
      </div>
    `;
    
    dialog.style.display = 'block';
    
    document.getElementById('confirm-install').addEventListener('click', () => {
      window.electronAPI.installUpdate();
    });
    
    document.getElementById('delay-install').addEventListener('click', () => {
      dialog.style.display = 'none';
    });
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  async checkForUpdates() {
    try {
      await window.electronAPI.checkForUpdates();
    } catch (error) {
      this.showNotification(`检查更新失败: ${error.message}`, 'error');
    }
  }
}

export default UpdateUI;
```

## 版本管理与发布策略

### 版本控制策略

Electron 遵循语义化版本控制，并与 Chromium 发布周期保持同步。

**版本支持时间线示意图：**

```
Electron 版本 → Chromium 版本 → Node.js 版本
    ↓               ↓               ↓
支持周期 →   ~6个月支持  →  安全更新  →  终止支持
```

### 发布渠道管理

```javascript
// config/release-channels.js
export class ReleaseChannelManager {
  constructor() {
    this.channels = {
      stable: {
        name: 'stable',
        updateUrl: 'https://github.com/your-username/your-repo/releases/latest',
        prerelease: false,
        autoUpdate: true
      },
      beta: {
        name: 'beta',
        updateUrl: 'https://github.com/your-username/your-repo/releases/beta',
        prerelease: true,
        autoUpdate: true
      },
      development: {
        name: 'dev',
        updateUrl: 'https://github.com/your-username/your-repo/releases/dev',
        prerelease: true,
        autoUpdate: false
      }
    };
  }

  getCurrentChannel() {
    // 从配置文件中获取当前渠道
    const config = this.getAppConfig();
    return config.updateChannel || 'stable';
  }

  async switchChannel(channelName) {
    if (!this.channels[channelName]) {
      throw new Error(`未知的发布渠道: ${channelName}`);
    }

    const channel = this.channels[channelName];
    
    // 更新自动更新配置
    await this.updateUpdaterConfig(channel);
    
    // 记录渠道切换
    await this.logChannelSwitch(channelName);
    
    console.log(`🔄 已切换到 ${channelName} 渠道`);
    return channel;
  }

  async checkChannelUpdates() {
    const currentChannel = this.getCurrentChannel();
    const channel = this.channels[currentChannel];
    
    if (!channel.autoUpdate) {
      console.log(`🔕 ${currentChannel} 渠道已禁用自动更新`);
      return null;
    }

    try {
      const updateInfo = await this.fetchUpdateInfo(channel);
      return this.validateUpdateCompatibility(updateInfo);
    } catch (error) {
      console.error(`检查 ${currentChannel} 渠道更新失败:`, error);
      return null;
    }
  }

  async fetchUpdateInfo(channel) {
    const response = await fetch(channel.updateUrl);
    if (!response.ok) {
      throw new Error(`获取更新信息失败: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      version: data.tag_name,
      releaseNotes: data.body,
      publishDate: data.published_at,
      downloadUrl: data.assets[0]?.browser_download_url,
      channel: channel.name
    };
  }

  validateUpdateCompatibility(updateInfo) {
    const currentVersion = app.getVersion();
    const currentPlatform = process.platform;
    const currentArch = process.arch;

    // 检查版本兼容性
    if (!this.isVersionCompatible(updateInfo.version, currentVersion)) {
      throw new Error(`版本不兼容: ${updateInfo.version}`);
    }

    // 检查平台兼容性
    if (!this.isPlatformSupported(updateInfo, currentPlatform, currentArch)) {
      throw new Error('平台架构不支持');
    }

    return updateInfo;
  }

  isVersionCompatible(newVersion, currentVersion) {
    // 实现版本兼容性检查逻辑
    const newParts = newVersion.split('.').map(Number);
    const currentParts = currentVersion.split('.').map(Number);
    
    // 主要版本号不同时不兼容
    return newParts[0] === currentParts[0];
  }

  isPlatformSupported(updateInfo, platform, arch) {
    // 检查更新是否支持当前平台和架构
    const supportedPatterns = [
      `${platform}-${arch}`,
      `${platform}-universal`,
      'multi-platform'
    ];
    
    return supportedPatterns.some(pattern => 
      updateInfo.downloadUrl.includes(pattern)
    );
  }

  getAppConfig() {
    try {
      return JSON.parse(readFileSync('app-config.json', 'utf-8'));
    } catch {
      return { updateChannel: 'stable' };
    }
  }

  async updateUpdaterConfig(channel) {
    const config = {
      provider: 'generic',
      url: channel.updateUrl,
      channel: channel.name
    };
    
    await writeFile('updater-config.json', JSON.stringify(config, null, 2));
  }

  async logChannelSwitch(channelName) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      previousChannel: this.getCurrentChannel(),
      newChannel: channelName,
      version: app.getVersion()
    };
    
    await writeFile('channel-switch.log', JSON.stringify(logEntry) + '\n', { 
      flag: 'a' 
    });
  }
}

export const channelManager = new ReleaseChannelManager();
```

## 第三方更新服务

### 集成 electron-update-sdk

对于需要更高级更新功能的场景，可以使用第三方封装库。

```javascript
// services/update-service.js
import updateServiceMain from '@bugonly/electron-update-sdk/libs/main';
import updateServicePreload from '@bugonly/electron-update-sdk/libs/preload';
import { contextBridge } from 'electron';

class EnhancedUpdateService {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.setupUpdateService();
  }

  setupUpdateService() {
    // 设置更新服务
    updateServiceMain.setup(this.mainWindow, {
      feedUrl: 'https://your-update-server.com/updates',
      autoDownload: false,
      enableProgress: true,
      logger: this.getLogger()
    });

    // 设置自定义事件处理
    this.setupCustomEventHandlers();
  }

  setupCustomEventHandlers() {
    // 检查更新中
    updateServiceMain.onCheckingUpdate(() => {
      this.logUpdateEvent('SDK: 开始检查更新');
      this.mainWindow.webContents.send('sdk-update-status', 'checking');
    });

    // 更新可用
    updateServiceMain.onNeedUpdate((updateInfo) => {
      this.logUpdateEvent(`SDK: 发现新版本 ${updateInfo.version}`);
      this.mainWindow.webContents.send('sdk-update-status', 'available', updateInfo);
      this.showSDKUpdateDialog(updateInfo);
    });

    // 下载进度
    updateServiceMain.onDownloading((progress) => {
      this.mainWindow.webContents.send('sdk-download-progress', progress);
    });

    // 下载完成
    updateServiceMain.onDownloadSuccess((updateInfo) => {
      this.logUpdateEvent('SDK: 更新下载完成');
      this.mainWindow.webContents.send('sdk-update-status', 'downloaded', updateInfo);
      this.showSDKInstallDialog(updateInfo);
    });

    // 更新失败
    updateServiceMain.onUpdateFail((error) => {
      this.logUpdateEvent(`SDK: 更新失败 ${error.message}`);
      this.mainWindow.webContents.send('sdk-update-status', 'error', error);
    });
  }

  showSDKUpdateDialog(updateInfo) {
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: '发现新版本',
      message: `发现新版本 ${updateInfo.version}`,
      detail: '是否立即下载并安装更新？',
      buttons: ['立即更新', '稍后提醒'],
      defaultId: 0,
      cancelId: 1
    }).then(({ response }) => {
      if (response === 0) {
        updateServiceMain.confirmDownload();
      }
    });
  }

  showSDKInstallDialog(updateInfo) {
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: '更新准备就绪',
      message: `版本 ${updateInfo.version} 已下载完成`,
      detail: '应用将在重启后完成更新。',
      buttons: ['立即重启', '稍后重启'],
      defaultId: 0,
      cancelId: 1
    }).then(({ response }) => {
      if (response === 0) {
        updateServiceMain.confirmUpdate();
      }
    });
  }

  getLogger() {
    return {
      info: (message) => console.log(`ℹ️ ${message}`),
      error: (message) => console.error(`❌ ${message}`),
      warn: (message) => console.warn(`⚠️ ${message}`),
      debug: (message) => console.debug(`🐛 ${message}`)
    };
  }

  logUpdateEvent(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }
}

// 预加载脚本中暴露 API
export function exposeUpdateAPI() {
  contextBridge.exposeInMainWorld('electronUpdateSDK', updateServicePreload.content);
}

export default EnhancedUpdateService;
```

## 安全与验证

### 代码签名与验证

代码签名是发布过程中的关键安全步骤。

```javascript
// security/signing-manager.js
import { createVerify } from 'crypto';
import { readFileSync, existsSync } from 'fs';

export class SigningManager {
  constructor() {
    this.publicKey = this.loadPublicKey();
  }

  async verifyUpdateSignature(updateFilePath, signatureFilePath) {
    try {
      const updateData = await readFile(updateFilePath);
      const signature = await readFile(signatureFilePath, 'utf-8');
      
      const verifier = createVerify('SHA256');
      verifier.update(updateData);
      verifier.end();
      
      const isValid = verifier.verify(this.publicKey, signature, 'base64');
      
      if (!isValid) {
        throw new Error('更新文件签名验证失败');
      }
      
      console.log('✅ 更新文件签名验证成功');
      return true;
    } catch (error) {
      console.error('❌ 更新文件签名验证失败:', error);
      throw error;
    }
  }

  loadPublicKey() {
    const keyPath = 'security/public-key.pem';
    if (!existsSync(keyPath)) {
      throw new Error('公钥文件不存在');
    }
    
    return readFileSync(keyPath, 'utf-8');
  }

  async validateUpdateIntegrity(updateInfo) {
    // 验证版本号格式
    if (!this.isValidVersion(updateInfo.version)) {
      throw new Error(`无效的版本号: ${updateInfo.version}`);
    }
    
    // 验证发布时间
    if (!this.isValidReleaseDate(updateInfo.publishDate)) {
      throw new Error(`无效的发布时间: ${updateInfo.publishDate}`);
    }
    
    // 验证文件大小
    if (!this.isValidFileSize(updateInfo.fileSize)) {
      throw new Error(`无效的文件大小: ${updateInfo.fileSize}`);
    }
    
    return true;
  }

  isValidVersion(version) {
    const versionRegex = /^\d+\.\d+\.\d+(-[a-z0-9]+)?$/;
    return versionRegex.test(version);
  }

  isValidReleaseDate(dateString) {
    const releaseDate = new Date(dateString);
    const now = new Date();
    
    // 发布时间不能是未来时间
    if (releaseDate > now) {
      return false;
    }
    
    // 发布时间不能早于一年前
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    return releaseDate >= oneYearAgo;
  }

  isValidFileSize(fileSize) {
    // 文件大小应在 1MB 到 500MB 之间
    const minSize = 1 * 1024 * 1024; // 1MB
    const maxSize = 500 * 1024 * 1024; // 500MB
    
    return fileSize >= minSize && fileSize <= maxSize;
  }

  async createIntegrityCheck(updateFilePath) {
    const data = await readFile(updateFilePath);
    
    const hashes = {
      sha256: createHash('sha256').update(data).digest('hex'),
      sha512: createHash('sha512').update(data).digest('hex'),
      size: data.length
    };
    
    return hashes;
  }
}

export const signingManager = new SigningManager();
```

### 安全更新策略

```javascript
// security/update-policy.js
export class UpdatePolicyManager {
  constructor() {
    this.policies = {
      security: {
        priority: 'high',
        autoDownload: true,
        autoInstall: true,
        maxRetries: 3
      },
      feature: {
        priority: 'medium',
        autoDownload: false,
        autoInstall: false,
        maxRetries: 1
      },
      maintenance: {
        priority: 'low',
        autoDownload: false,
        autoInstall: false,
        maxRetries: 1
      }
    };
  }

  determineUpdateType(updateInfo) {
    const { version, releaseNotes } = updateInfo;
    
    if (this.isSecurityUpdate(releaseNotes)) {
      return 'security';
    } else if (this.isFeatureUpdate(releaseNotes)) {
      return 'feature';
    } else {
      return 'maintenance';
    }
  }

  isSecurityUpdate(releaseNotes) {
    const securityKeywords = [
      'security', 'vulnerability', 'cve', 'patch',
      'fix', 'protection', 'safe', 'critical'
    ];
    
    const notes = releaseNotes.toLowerCase();
    return securityKeywords.some(keyword => notes.includes(keyword));
  }

  isFeatureUpdate(releaseNotes) {
    const featureKeywords = [
      'feature', 'new', 'enhancement', 'improvement',
      'added', 'introduced', 'functionality'
    ];
    
    const notes = releaseNotes.toLowerCase();
    return featureKeywords.some(keyword => notes.includes(keyword));
  }

  getUpdatePolicy(updateType) {
    return this.policies[updateType] || this.policies.maintenance;
  }

  async shouldAutoInstall(updateInfo) {
    const updateType = this.determineUpdateType(updateInfo);
    const policy = this.getUpdatePolicy(updateType);
    
    if (!policy.autoInstall) {
      return false;
    }
    
    // 检查当前网络状态
    const networkState = await this.checkNetworkState();
    if (!networkState.isStable) {
      return false;
    }
    
    // 检查系统负载
    const systemLoad = await this.checkSystemLoad();
    if (systemLoad.isHigh) {
      return false;
    }
    
    // 检查用户活动状态
    const userActivity = this.checkUserActivity();
    if (userActivity.isActive) {
      return false;
    }
    
    return true;
  }

  async checkNetworkState() {
    try {
      const response = await fetch('https://www.google.com', { 
        method: 'HEAD',
        timeout: 5000 
      });
      
      return {
        isStable: true,
        type: navigator.connection?.effectiveType || 'unknown'
      };
    } catch {
      return {
        isStable: false,
        type: 'offline'
      };
    }
  }

  async checkSystemLoad() {
    // 简化的系统负载检查
    const memoryUsage = process.memoryUsage();
    const memoryPercent = memoryUsage.heapUsed / memoryUsage.heapTotal;
    
    return {
      isHigh: memoryPercent > 0.8,
      memoryUsage: memoryPercent
    };
  }

  checkUserActivity() {
    // 检查用户最近是否有活动
    const lastActivity = this.getLastUserActivity();
    const inactiveThreshold = 5 * 60 * 1000; // 5分钟
    
    return {
      isActive: Date.now() - lastActivity < inactiveThreshold,
      lastActivity
    };
  }

  getLastUserActivity() {
    // 从应用状态获取最后活动时间
    try {
      const state = JSON.parse(readFileSync('app-state.json', 'utf-8'));
      return state.lastUserActivity || Date.now();
    } catch {
      return Date.now();
    }
  }
}

export const policyManager = new UpdatePolicyManager();
```