# Electron 集成前端框架

## 前端框架集成概述

Electron 与前端框架的集成是现代桌面应用开发的核心模式。通过将 **React**、**Vue**、**Angular** 等前端框架与 Electron 结合，开发者可以构建具有原生体验的跨平台桌面应用程序。这种集成模式充分利用了 Web 技术的灵活性和前端框架的组件化优势，同时通过 Electron 获得系统级访问能力。

集成架构的核心在于将前端框架作为**渲染进程的视图层**，而 Electron 主进程负责**系统级功能**和**应用生命周期管理**。这种分离关注点的设计使得前端开发者能够使用熟悉的工具链和开发模式，同时享受桌面应用的完整功能。

```
主进程 (Node.js 环境)
    ↑↓ IPC 通信
渲染进程 (Chromium + 前端框架)
    ↑
前端框架 (React/Vue/Angular)
    ↑
组件树 & 状态管理
    ↑
用户界面 (HTML/CSS/JS)
```

## React 集成

### 创建 React + Electron 项目

使用 Create React App 与 Electron 集成是最常见的开发模式。

```javascript
// package.json - React Electron 配置
{
  "name": "react-electron-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "electron": "electron .",
    "electron-dev": "ELECTRON_IS_DEV=true electron .",
    "react-dev": "react-scripts start",
    "build": "react-scripts build",
    "build-electron": "npm run build && electron-builder"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  },
  "devDependencies": {
    "electron": "^22.0.0",
    "electron-builder": "^23.6.0",
    "concurrently": "^7.6.0",
    "wait-on": "^7.0.1"
  }
}
```

### Electron 主进程配置

```javascript
// main.js - React 集成主进程
import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ReactElectronApp {
  constructor() {
    this.mainWindow = null;
    this.isDev = process.env.ELECTRON_IS_DEV === 'true';
  }

  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: join(__dirname, 'preload.js')
      }
    });

    // 开发模式下加载 React 开发服务器
    if (this.isDev) {
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(join(__dirname, '../build/index.html'));
    }

    this.setupIPC();
  }

  setupIPC() {
    // 系统信息获取
    ipcMain.handle('get-system-info', () => {
      return {
        platform: process.platform,
        arch: process.arch,
        versions: process.versions,
        isDev: this.isDev
      };
    });

    // 窗口控制
    ipcMain.handle('window-control', (event, action) => {
      switch (action) {
        case 'minimize':
          this.mainWindow.minimize();
          break;
        case 'maximize':
          if (this.mainWindow.isMaximized()) {
            this.mainWindow.unmaximize();
          } else {
            this.mainWindow.maximize();
          }
          break;
        case 'close':
          this.mainWindow.close();
          break;
      }
    });
  }
}

const reactApp = new ReactElectronApp();

app.whenReady().then(() => {
  reactApp.createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

### React 组件与 Electron API 集成

```javascript
// src/hooks/useElectron.js - React Electron Hook
import { useState, useEffect, useCallback } from 'react';

export const useElectron = () => {
  const [systemInfo, setSystemInfo] = useState(null);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    // 检测是否运行在 Electron 环境中
    setIsElectron(!!window.electronAPI);
    
    if (window.electronAPI) {
      window.electronAPI.getSystemInfo().then(info => {
        setSystemInfo(info);
      });
    }
  }, []);

  const sendWindowControl = useCallback((action) => {
    if (window.electronAPI) {
      window.electronAPI.windowControl(action);
    }
  }, []);

  const openFileDialog = useCallback(async () => {
    if (window.electronAPI) {
      return await window.electronAPI.openFileDialog();
    }
    return null;
  }, []);

  return {
    isElectron,
    systemInfo,
    sendWindowControl,
    openFileDialog
  };
};
```

```javascript
// src/components/TitleBar.js - 自定义标题栏组件
import React from 'react';
import { useElectron } from '../hooks/useElectron';
import './TitleBar.css';

const TitleBar = () => {
  const { sendWindowControl, systemInfo } = useElectron();

  return (
    <div className="title-bar">
      <div className="title-bar-drag-region">
        <div className="title-bar-content">
          <span className="app-title">React Electron App</span>
          <div className="window-controls">
            <button 
              className="control-button minimize"
              onClick={() => sendWindowControl('minimize')}
            >
              −
            </button>
            <button 
              className="control-button maximize"
              onClick={() => sendWindowControl('maximize')}
            >
              □
            </button>
            <button 
              className="control-button close"
              onClick={() => sendWindowControl('close')}
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TitleBar;
```

```javascript
// src/components/FileExplorer.js - 文件浏览器组件
import React, { useState, useEffect } from 'react';
import { useElectron } from '../hooks/useElectron';
import './FileExplorer.css';

const FileExplorer = () => {
  const { isElectron, openFileDialog } = useElectron();
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('');

  const handleFileOpen = async () => {
    if (!isElectron) return;
    
    const result = await openFileDialog();
    if (result) {
      setFiles(prev => [...prev, {
        name: result.filePaths[0].split('/').pop(),
        path: result.filePaths[0],
        type: 'file'
      }]);
    }
  };

  if (!isElectron) {
    return (
      <div className="file-explorer">
        <p>请在 Electron 环境中运行以获得完整功能</p>
      </div>
    );
  }

  return (
    <div className="file-explorer">
      <div className="file-explorer-toolbar">
        <button className="toolbar-button" onClick={handleFileOpen}>
          打开文件
        </button>
      </div>
      <div className="file-list">
        {files.map((file, index) => (
          <div key={index} className="file-item">
            <div className="file-icon">📄</div>
            <div className="file-info">
              <div className="file-name">{file.name}</div>
              <div className="file-path">{file.path}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileExplorer;
```

### React 状态管理与 Electron 集成

```javascript
// src/store/electronStore.js - 基于 electron-store 的状态持久化
import { useState, useEffect } from 'react';

export const useElectronStore = (key, defaultValue) => {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (window.electronAPI) {
      // 从 Electron store 加载初始值
      window.electronAPI.storeGet(key, defaultValue).then(savedValue => {
        setValue(savedValue);
      });
    }
  }, [key, defaultValue]);

  const setStoredValue = async (newValue) => {
    setValue(newValue);
    if (window.electronAPI) {
      await window.electronAPI.storeSet(key, newValue);
    }
  };

  return [value, setStoredValue];
};
```

```javascript
// src/App.js - 主应用组件
import React from 'react';
import TitleBar from './components/TitleBar';
import FileExplorer from './components/FileExplorer';
import SystemInfo from './components/SystemInfo';
import { useElectronStore } from './store/electronStore';
import './App.css';

const App = () => {
  const [theme, setTheme] = useElectronStore('theme', 'light');
  const [sidebarVisible, setSidebarVisible] = useElectronStore('sidebarVisible', true);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <div className={`app ${theme}`}>
      <TitleBar />
      <div className="app-content">
        {sidebarVisible && (
          <div className="sidebar">
            <div className="sidebar-section">
              <h3>导航</h3>
              <button className="sidebar-button">文件管理器</button>
              <button className="sidebar-button">系统信息</button>
              <button className="sidebar-button">设置</button>
            </div>
          </div>
        )}
        <div className="main-content">
          <div className="toolbar">
            <button onClick={toggleSidebar} className="toolbar-button">
              {sidebarVisible ? '隐藏侧边栏' : '显示侧边栏'}
            </button>
            <button onClick={toggleTheme} className="toolbar-button">
              切换主题
            </button>
          </div>
          <div className="content-area">
            <FileExplorer />
            <SystemInfo />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
```

## Vue 集成

### Vue 3 + Electron 配置

```javascript
// package.json - Vue Electron 配置
{
  "name": "vue-electron-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "electron": "electron .",
    "electron-dev": "ELECTRON_IS_DEV=true electron .",
    "vue-dev": "vite",
    "build": "vite build",
    "build-electron": "npm run build && electron-builder"
  },
  "dependencies": {
    "vue": "^3.3.0",
    "vue-router": "^4.2.0",
    "pinia": "^2.1.0"
  },
  "devDependencies": {
    "electron": "^22.0.0",
    "electron-builder": "^23.6.0",
    "vite": "^4.3.0",
    "@vitejs/plugin-vue": "^4.2.0"
  }
}
```

```javascript
// vite.config.js - Vue 构建配置
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'url';

export default defineConfig({
  plugins: [vue()],
  base: './',
  build: {
    outDir: 'dist-vue',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3001
  }
});
```

### Vue 组合式 API 与 Electron 集成

```javascript
// src/composables/useElectron.js - Vue Electron 组合式函数
import { ref, onMounted } from 'vue';

export const useElectron = () => {
  const systemInfo = ref(null);
  const isElectron = ref(false);

  const getSystemInfo = async () => {
    if (window.electronAPI) {
      systemInfo.value = await window.electronAPI.getSystemInfo();
    }
  };

  const windowControl = (action) => {
    if (window.electronAPI) {
      window.electronAPI.windowControl(action);
    }
  };

  const openFileDialog = async () => {
    if (window.electronAPI) {
      return await window.electronAPI.openFileDialog();
    }
    return null;
  };

  onMounted(() => {
    isElectron.value = !!window.electronAPI;
    if (isElectron.value) {
      getSystemInfo();
    }
  });

  return {
    systemInfo,
    isElectron,
    windowControl,
    openFileDialog,
    getSystemInfo
  };
};
```

```javascript
// src/stores/electronStore.js - Pinia 状态管理
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useElectronStore = defineStore('electron', () => {
  const theme = ref('light');
  const sidebarVisible = ref(true);
  const recentFiles = ref([]);

  const toggleTheme = async () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
    if (window.electronAPI) {
      await window.electronAPI.storeSet('theme', theme.value);
    }
  };

  const toggleSidebar = async () => {
    sidebarVisible.value = !sidebarVisible.value;
    if (window.electronAPI) {
      await window.electronAPI.storeSet('sidebarVisible', sidebarVisible.value);
    }
  };

  const addRecentFile = async (file) => {
    recentFiles.value.unshift(file);
    if (recentFiles.value.length > 10) {
      recentFiles.value = recentFiles.value.slice(0, 10);
    }
    if (window.electronAPI) {
      await window.electronAPI.storeSet('recentFiles', recentFiles.value);
    }
  };

  // 从 Electron store 加载初始状态
  const loadFromStore = async () => {
    if (window.electronAPI) {
      const savedTheme = await window.electronAPI.storeGet('theme', 'light');
      const savedSidebar = await window.electronAPI.storeGet('sidebarVisible', true);
      const savedFiles = await window.electronAPI.storeGet('recentFiles', []);
      
      theme.value = savedTheme;
      sidebarVisible.value = savedSidebar;
      recentFiles.value = savedFiles;
    }
  };

  return {
    theme,
    sidebarVisible,
    recentFiles,
    toggleTheme,
    toggleSidebar,
    addRecentFile,
    loadFromStore
  };
});
```

```vue
<!-- src/components/TitleBar.vue - Vue 标题栏组件 -->
<template>
  <div class="title-bar">
    <div class="title-bar-drag-region">
      <div class="title-bar-content">
        <span class="app-title">Vue Electron App</span>
        <div class="window-controls">
          <button 
            class="control-button minimize"
            @click="windowControl('minimize')"
          >
            −
          </button>
          <button 
            class="control-button maximize"
            @click="windowControl('maximize')"
          >
            □
          </button>
          <button 
            class="control-button close"
            @click="windowControl('close')"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useElectron } from '@/composables/useElectron';

const { windowControl } = useElectron();
</script>

<style scoped>
.title-bar {
  height: 32px;
  background: var(--titlebar-bg);
  color: var(--titlebar-color);
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title-bar-drag-region {
  flex: 1;
  -webkit-app-region: drag;
}

.title-bar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
}

.window-controls {
  display: flex;
  -webkit-app-region: no-drag;
}

.control-button {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: inherit;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.control-button.close:hover {
  background: #e81123;
}
</style>
```

```vue
<!-- src/App.vue - Vue 主应用组件 -->
<template>
  <div :class="['app', store.theme]">
    <TitleBar />
    <div class="app-content">
      <Sidebar v-if="store.sidebarVisible" />
      <div class="main-content">
        <div class="toolbar">
          <button @click="store.toggleSidebar" class="toolbar-button">
            {{ store.sidebarVisible ? '隐藏侧边栏' : '显示侧边栏' }}
          </button>
          <button @click="store.toggleTheme" class="toolbar-button">
            切换主题
          </button>
        </div>
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import TitleBar from './components/TitleBar.vue';
import Sidebar from './components/Sidebar.vue';
import { useElectronStore } from './stores/electronStore';

const store = useElectronStore();

onMounted(() => {
  store.loadFromStore();
});
</script>

<style>
:root {
  --titlebar-bg: #2d2d2d;
  --titlebar-color: #ffffff;
  --sidebar-bg: #f5f5f5;
  --main-bg: #ffffff;
}

.app.dark {
  --sidebar-bg: #2d2d2d;
  --main-bg: #1e1e1e;
  color: #ffffff;
}

.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--main-bg);
}

.app-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.toolbar {
  padding: 8px 12px;
  background: var(--sidebar-bg);
  border-bottom: 1px solid #ddd;
}

.toolbar-button {
  padding: 6px 12px;
  margin-right: 8px;
  border: 1px solid #ccc;
  background: white;
  cursor: pointer;
  border-radius: 4px;
}

.toolbar-button:hover {
  background: #f0f0f0;
}
</style>
```

## Angular 集成

### Angular + Electron 配置

```javascript
// package.json - Angular Electron 配置
{
  "name": "angular-electron-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "electron": "electron .",
    "electron-dev": "ELECTRON_IS_DEV=true electron .",
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "build-electron": "ng build --base-href ./ && electron-builder"
  },
  "dependencies": {
    "@angular/animations": "^16.0.0",
    "@angular/common": "^16.0.0",
    "@angular/compiler": "^16.0.0",
    "@angular/core": "^16.0.0",
    "@angular/forms": "^16.0.0",
    "@angular/platform-browser": "^16.0.0",
    "@angular/platform-browser-dynamic": "^16.0.0",
    "@angular/router": "^16.0.0",
    "rxjs": "^7.8.0",
    "tslib": "^2.5.0",
    "zone.js": "^0.13.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^16.0.0",
    "@angular/cli": "^16.0.0",
    "@angular/compiler-cli": "^16.0.0",
    "@types/node": "^18.15.0",
    "electron": "^22.0.0",
    "electron-builder": "^23.6.0",
    "typescript": "^5.0.0"
  }
}
```

```javascript
// angular.json - Angular 构建配置
{
  "projects": {
    "angular-electron-app": {
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:browser",
          "options": {
            "outputPath": "dist-angular",
            "index": "src/index.html",
            "main": "src/main.ts",
            "tsConfig": "tsconfig.app.json",
            "baseHref": "./"
          }
        },
        "serve": {
          "builder": "@angular-devkit/build-angular:dev-server",
          "options": {
            "port": 4200
          }
        }
      }
    }
  }
}
```

### Angular 服务与 Electron 集成

```typescript
// src/app/services/electron.service.ts - Angular Electron 服务
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

declare global {
  interface Window {
    electronAPI: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  private systemInfoSubject = new BehaviorSubject<any>(null);
  private isElectronSubject = new BehaviorSubject<boolean>(false);

  public systemInfo$: Observable<any> = this.systemInfoSubject.asObservable();
  public isElectron$: Observable<boolean> = this.isElectronSubject.asObservable();

  constructor() {
    this.initialize();
  }

  private async initialize() {
    const isElectron = !!window.electronAPI;
    this.isElectronSubject.next(isElectron);

    if (isElectron) {
      const systemInfo = await window.electronAPI.getSystemInfo();
      this.systemInfoSubject.next(systemInfo);
    }
  }

  windowControl(action: string): void {
    if (window.electronAPI) {
      window.electronAPI.windowControl(action);
    }
  }

  async openFileDialog(): Promise<any> {
    if (window.electronAPI) {
      return await window.electronAPI.openFileDialog();
    }
    return null;
  }

  async storeGet(key: string, defaultValue: any): Promise<any> {
    if (window.electronAPI) {
      return await window.electronAPI.storeGet(key, defaultValue);
    }
    return defaultValue;
  }

  async storeSet(key: string, value: any): Promise<void> {
    if (window.electronAPI) {
      await window.electronAPI.storeSet(key, value);
    }
  }
}
```

```typescript
// src/app/services/theme.service.ts - Angular 主题服务
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ElectronService } from './electron.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeSubject = new BehaviorSubject<string>('light');
  public theme$ = this.themeSubject.asObservable();

  constructor(private electronService: ElectronService) {
    this.loadTheme();
  }

  private async loadTheme() {
    const savedTheme = await this.electronService.storeGet('theme', 'light');
    this.themeSubject.next(savedTheme);
  }

  async toggleTheme(): Promise<void> {
    const newTheme = this.themeSubject.value === 'light' ? 'dark' : 'light';
    this.themeSubject.next(newTheme);
    await this.electronService.storeSet('theme', newTheme);
  }

  get currentTheme(): string {
    return this.themeSubject.value;
  }
}
```

```typescript
// src/app/components/title-bar/title-bar.component.ts - Angular 标题栏组件
import { Component } from '@angular/core';
import { ElectronService } from '../../services/electron.service';

@Component({
  selector: 'app-title-bar',
  templateUrl: './title-bar.component.html',
  styleUrls: ['./title-bar.component.scss']
})
export class TitleBarComponent {
  constructor(private electronService: ElectronService) {}

  minimize(): void {
    this.electronService.windowControl('minimize');
  }

  maximize(): void {
    this.electronService.windowControl('maximize');
  }

  close(): void {
    this.electronService.windowControl('close');
  }
}
```

```html
<!-- src/app/components/title-bar/title-bar.component.html -->
<div class="title-bar">
  <div class="title-bar-drag-region">
    <div class="title-bar-content">
      <span class="app-title">Angular Electron App</span>
      <div class="window-controls">
        <button 
          class="control-button minimize"
          (click)="minimize()"
        >
          −
        </button>
        <button 
          class="control-button maximize"
          (click)="maximize()"
        >
          □
        </button>
        <button 
          class="control-button close"
          (click)="close()"
        >
          ×
        </button>
      </div>
    </div>
  </div>
</div>
```

```typescript
// src/app/app.component.ts - Angular 主组件
import { Component, OnInit } from '@angular/core';
import { ThemeService } from './services/theme.service';
import { ElectronService } from './services/electron.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  theme$: Observable<string>;
  isElectron$: Observable<boolean>;
  sidebarVisible = true;

  constructor(
    private themeService: ThemeService,
    private electronService: ElectronService
  ) {
    this.theme$ = this.themeService.theme$;
    this.isElectron$ = this.electronService.isElectron$;
  }

  async ngOnInit() {
    this.sidebarVisible = await this.electronService.storeGet('sidebarVisible', true);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  async toggleSidebar(): Promise<void> {
    this.sidebarVisible = !this.sidebarVisible;
    await this.electronService.storeSet('sidebarVisible', this.sidebarVisible);
  }
}
```

```html
<!-- src/app/app.component.html -->
<div class="app" [class.dark]="(theme$ | async) === 'dark'">
  <app-title-bar></app-title-bar>
  <div class="app-content">
    <app-sidebar *ngIf="sidebarVisible"></app-sidebar>
    <div class="main-content">
      <div class="toolbar">
        <button (click)="toggleSidebar()" class="toolbar-button">
          {{ sidebarVisible ? '隐藏侧边栏' : '显示侧边栏' }}
        </button>
        <button (click)="toggleTheme()" class="toolbar-button">
          切换主题
        </button>
      </div>
      <router-outlet></router-outlet>
    </div>
  </div>
</div>
```

## 构建工具与开发工作流

### Vite + Electron 热重载开发

```javascript
// vite-electron-plugin.js - Vite Electron 插件
import { spawn } from 'child_process';
import electron from 'electron';

export const viteElectronPlugin = () => {
  return {
    name: 'vite-electron-plugin',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        const address = server.httpServer?.address();
        if (typeof address === 'object' && address?.port) {
          // 设置环境变量
          process.env.VITE_DEV_SERVER_URL = `http://localhost:${address.port}`;
          
          // 启动 Electron
          spawn(electron, ['.'], {
            stdio: 'inherit',
            env: process.env
          });
        }
      });
    }
  };
};
```

```javascript
// vite.config.js - 集成 Vite Electron 插件
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { viteElectronPlugin } from './vite-electron-plugin.js';

export default defineConfig({
  plugins: [
    vue(),
    viteElectronPlugin()
  ],
  base: './',
  build: {
    outDir: 'dist-vue'
  }
});
```

### Webpack + Electron 开发配置

```javascript
// webpack.config.js - Electron 开发配置
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
  mode: 'development',
  entry: './src/renderer/index.js',
  target: 'electron-renderer',
  output: {
    path: resolve(__dirname, 'dist'),
    filename: 'renderer.js'
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: { electron: '22.0.0' } }],
              ['@babel/preset-react', { runtime: 'automatic' }]
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx', '.vue', '.json']
  },
  devServer: {
    port: 3000,
    hot: true
  }
};
```

## 前端框架特定的 Electron 工具

### React: electron-react-boilerplate

```javascript
// 使用 electron-react-boilerplate 的配置示例
import { app, BrowserWindow } from 'electron';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';

class AppWindow {
  constructor() {
    this.mainWindow = null;
  }

  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false
      }
    });

    if (process.env.WEBPACK_DEV_SERVER_URL) {
      this.mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
      if (!process.env.IS_TEST) this.mainWindow.webContents.openDevTools();
    } else {
      createProtocol('app');
      this.mainWindow.loadURL('app://./index.html');
    }
  }
}
```

### Vue: vue-cli-plugin-electron-builder

```javascript
// vue.config.js - Vue CLI Electron 配置
module.exports = {
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: 'src/preload.js',
      mainProcessFile: 'src/background.js',
      rendererProcessFile: 'src/main.js'
    }
  },
  configureWebpack: {
    target: 'electron-renderer'
  }
};
```

### Angular: ngx-electron

```typescript
// 使用 ngx-electron 的示例
import { Component } from '@angular/core';
import { ElectronService } from 'ngx-electron';

@Component({
  selector: 'app-root',
  template: `
    <div *ngIf="electronService.isElectronApp">
      <p>运行在 Electron 中</p>
      <button (click)="showDialog()">显示对话框</button>
    </div>
  `
})
export class AppComponent {
  constructor(public electronService: ElectronService) {}

  showDialog() {
    this.electronService.remote.dialog.showOpenDialog({
      properties: ['openFile']
    });
  }
}
```

## 性能优化与最佳实践

### 代码分割与懒加载

```javascript
// React 懒加载示例
import { lazy, Suspense } from 'react';

const FileExplorer = lazy(() => import('./components/FileExplorer'));
const SystemInfo = lazy(() => import('./components/SystemInfo'));

const App = () => (
  <div className="app">
    <Suspense fallback={<div>加载中...</div>}>
      <FileExplorer />
      <SystemInfo />
    </Suspense>
  </div>
);
```

```javascript
// Vue 路由懒加载
import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    component: () => import('./views/Home.vue')
  },
  {
    path: '/files',
    component: () => import('./views/FileExplorer.vue')
  },
  {
    path: '/settings',
    component: () => import('./views/Settings.vue')
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});
```

```typescript
// Angular 模块懒加载
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./home/home.module').then(m => m.HomeModule)
  },
  {
    path: 'files',
    loadChildren: () => import('./files/files.module').then(m => m.FilesModule)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
```

### 内存管理与性能监控

```javascript
// 性能监控服务
import { performance } from 'perf_hooks';

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }

  startMeasure(name) {
    this.metrics.set(name, {
      startTime: performance.now(),
      memory: process.memoryUsage()
    });
  }

  endMeasure(name) {
    const metric = this.metrics.get(name);
    if (metric) {
      const endTime = performance.now();
      const duration = endTime - metric.startTime;
      const memoryDiff = process.memoryUsage();
      
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
      console.log(`[Memory] RSS: ${(memoryDiff.rss - metric.memory.rss) / 1024 / 1024} MB`);
      
      this.metrics.delete(name);
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();
```

通过深度集成前端框架与 Electron，开发者可以构建出功能丰富、性能优越的跨平台桌面应用程序。每种框架都有其特定的集成模式和最佳实践，选择适合项目需求的框架组合能够显著提升开发效率和用户体验。