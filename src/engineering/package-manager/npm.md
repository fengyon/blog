# npm

npm（Node Package Manager）是Node.js的默认软件包管理系统，诞生于2009年，随Node.js一起发布。它最初旨在帮助JavaScript开发人员轻松共享打包的代码模块，如今已成长为全球最大的软件注册表之一，托管了超过160万个软件包，每月下载量超过230亿次，服务于超过1100万开发者。

npm的核心由一个官方网站、一个命令行界面（CLI）和一个庞大的公共注册表（Registry）组成。它让开发者能够高效地发现、安装、管理和发布可重用的代码模块，这些模块小至实用函数，大至完整框架。

## 核心概念

### 包（Package）与模块（Module）

一个包通常是一个包含JavaScript代码的目录，其根目录下有一个`package.json`文件来描述这个包。
```
[项目根目录]
    |
    +--- [node_modules]        # 依赖包存放处
    |       |
    |       +--- [package-A]   # 包A
    |       |
    |       +--- [package-B]   # 包B
    |
    +--- package.json          # 项目依赖清单
```

### package.json 文件

这是npm项目的核心配置文件，它记录了项目的元数据和依赖信息。
```
package.json 结构示意图:
{
    "name": "我的项目",          # 包名
    "version": "1.0.0",         # 版本号
    "scripts": {                # 自定义脚本
        "start": "node app.js"
    },
    "dependencies": {           # 生产环境依赖
        "express": "^4.17.1"
    },
    "devDependencies": {        # 开发环境依赖
        "eslint": "^7.0.0"
    }
}
```

### 依赖管理

npm能够智能地管理项目依赖关系。当项目中的多个包需要同一依赖项的不同版本时，npm会管理依赖项树，以确保每个包接收正确的版本。

## 基本使用

### 初始化项目

使用`npm init`命令可以创建一个新的`package.json`文件。
```
命令行操作:
$ npm init          # 交互式创建package.json
$ npm init -y       # 使用默认配置快速创建
```

### 安装包

npm提供了灵活的包安装方式。
```
安装方式示意图:
# 安装项目依赖
npm install <包名>

# 全局安装
npm install -g <包名>

# 安装开发依赖
npm install --save-dev <包名>

# 根据package.json安装所有依赖
npm install
```

### 常用命令一览

以下是开发中常用的npm命令：
```
命令流程图:
[npm init] -> [npm install] -> [npm run] -> [npm publish]
     |               |              |             |
  创建项目        安装依赖       运行脚本       发布包
```

其他实用命令：
- `npm update <包名>`：更新指定的包
- `npm uninstall <包名>`：卸载包
- `npm list`：查看已安装的包
- `npm search <关键词>`：搜索包

## 高级功能

### npm Scripts

通过在`package.json`的`scripts`字段定义脚本，可以自动化常见任务。
```
scripts使用示例:
"scripts": {
    "start": "node index.js",           # 启动应用
    "test": "jest",                     # 运行测试
    "build": "webpack --mode production" # 构建项目
}

执行方式: npm run <脚本名>
```

### npx 工具

从npm 5.2.0版本开始，自带了npx命令，它允许你不全局安装包就能直接运行命令。
```
npx使用示例:
npx create-react-app my-app    # 临时下载并执行create-react-app
```

### 版本管理与锁定

npm使用语义化版本控制，并通过`package-lock.json`文件锁定依赖的确切版本，确保环境一致性。
```
版本管理示意图:
package.json        package-lock.json
    |                       |
记录版本范围          锁定确切版本
    |                       |
   ~1.0.0    ->       1.0.3
   ^1.0.0    ->       1.2.1
```

## 常见问题与解决

### 网络问题与镜像源

由于网络原因，安装包时可能会遇到速度慢或超时的问题。
```
解决方案:
# 查看当前镜像源
npm config get registry

# 切换淘宝镜像
npm config set registry https://registry.npm.taobao.org/

# 使用nrm工具管理源
npx nrm use taobao
```

### 权限问题

在全局安装包时，可能会遇到权限错误。
```
解决方案示意图:
# Linux/Mac系统使用sudo
sudo npm install -g <包名>

# 或者更改npm全局目录权限
npm config set prefix ~/npm
```

### 依赖冲突与缓存

不同包可能需要同一依赖的不同版本，可能导致冲突。
```
解决依赖冲突:
npm ls                  # 查看依赖树
npm cache clean --force # 清理缓存
rm -rf node_modules     # 删除node_modules重新安装
npm install             # 重新安装依赖
```

## 在现代前端工程化的角色

在前端工程化体系中，npm已成为不可或缺的基础设施。
```
前端工程化流程:
[代码编写] -> [依赖管理(npm)] -> [构建打包] -> [部署发布]
        |               |               |           |
     开发者           npm管理        webpack等     生产环境
```