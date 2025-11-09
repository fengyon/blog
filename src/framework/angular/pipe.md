# Angular 管道

## 管道概念

管道是一种用于在模板中转换数据的简单函数。它们接受输入值并返回转换后的值，常用于格式化显示数据而不改变原始数据。

示意图：
```
数据流经管道：
原始数据 → 管道处理 → 格式化显示

模板语法：
{{ value | pipeName }}

带参数：
{{ value | pipeName:arg1:arg2 }}
```

## 内置管道

### 常用内置管道
Angular 提供了一系列内置管道用于常见的数据格式化任务。

示意图：
```
内置管道分类：
┌─────────────────┐
│   文本转换       │
│  uppercase     │
│  lowercase     │
│  titlecase     │
├─────────────────┤
│   数字格式化     │
│  number        │
│  percent       │
│  currency      │
├─────────────────┤
│   日期处理       │
│  date          │
├─────────────────┤
│   数据结构       │
│  json          │
│  slice         │
│  keyvalue      │
└─────────────────┘
```

### 文本转换管道
改变文本的显示格式。

示意图：
```
文本转换示例：
输入: 'hello world'
↓ uppercase管道
输出: 'HELLO WORLD'

输入: 'HELLO WORLD'  
↓ lowercase管道
输出: 'hello world'

输入: 'hello world'
↓ titlecase管道
输出: 'Hello World'
```

### 数字格式化管道
格式化数字、货币和百分比。

示意图：
```
数字格式化：
输入: 1234.567
↓ number:'1.2-2'
输出: 1,234.57

输入: 0.75
↓ percent
输出: 75%

输入: 19.99
↓ currency:'USD'
输出: $19.99
```

### 日期管道
格式化日期和时间显示。

示意图：
```
日期格式化：
输入: new Date('2024-12-25')
↓ date:'yyyy-MM-dd'
输出: 2024-12-25

输入: new Date()
↓ date:'short'
输出: 12/25/24, 10:30 AM

输入: new Date()
↓ date:'fullDate'
输出: Wednesday, December 25, 2024
```

## 管道参数

### 参数传递
管道可以接受参数来定制转换行为。

示意图：
```
参数语法：
{{ value | pipe:param1:param2 }}

示例：
日期格式化: {{ today | date:'yyyy-MM-dd' }}
数字精度: {{ pi | number:'1.2-2' }}
货币代码: {{ price | currency:'EUR' }}
```

### 链式管道
多个管道可以串联使用，数据从左到右依次通过。

示意图：
```
管道链：
数据 → 管道A → 管道B → 管道C → 最终结果

示例：
{{ message | uppercase | slice:0:10 }}

步骤：
1. 'hello angular' → uppercase → 'HELLO ANGULAR'
2. 'HELLO ANGULAR' → slice:0:10 → 'HELLO ANGU'
```

## 自定义管道

### 创建自定义管道
通过 Angular CLI 或手动创建自定义管道来满足特定需求。

示意图：
```
创建步骤：
1. 定义管道类
2. 实现 PipeTransform 接口
3. 添加 @Pipe 装饰器
4. 注册到模块
```

示例代码：
```typescript
@Pipe({
  name: 'reverse'
})
export class ReversePipe implements PipeTransform {
  transform(value: string): string {
    return value.split('').reverse().join('');
  }
}
```

使用：
```html
<p>{{ 'hello' | reverse }}</p>
<!-- 显示: olleh -->
```

### 带参数的自定义管道
管道可以接受参数来控制转换逻辑。

示意图：
```
参数化管道：
数据 + 参数 → 转换逻辑 → 结果

示例：
{{ text | truncate:20 }}
```

实现：
```typescript
@Pipe({
  name: 'truncate'
})
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit: number = 50): string {
    if (value.length <= limit) return value;
    return value.substring(0, limit) + '...';
  }
}
```

## 纯管道与非纯管道

### 纯管道
默认管道类型，仅在输入值发生改变时执行。

示意图：
```
纯管道特性：
输入引用改变 → 重新执行管道
输入引用不变 → 使用缓存结果

适用场景：纯函数式转换
```

### 非纯管道
每次变更检测都会执行，适用于处理可变对象。

示意图：
```
非纯管道特性：
每次变更检测 → 重新执行管道

配置方式：
@Pipe({
  name: 'impurePipe',
  pure: false
})
```

使用场景对比：
```typescript
// 纯管道 - 数组引用改变时更新
@Pipe({ name: 'pureArray' })
// 非纯管道 - 数组内容改变时更新  
@Pipe({ name: 'impureArray', pure: false })
```

## 异步管道

### 处理异步数据
AsyncPipe 用于自动订阅和取消订阅 Observable 或 Promise。

示意图：
```
异步数据流：
Observable/Promise → AsyncPipe → 最新值

模板: {{ data$ | async }}
```

示例：
```typescript
// 组件中
data$ = this.http.get('/api/data');

// 模板中
<div>{{ data$ | async | json }}</div>
```

### 自动订阅管理
AsyncPipe 自动处理订阅生命周期，避免内存泄漏。

示意图：
```
组件初始化 → AsyncPipe订阅 → 获取数据
组件销毁 → AsyncPipe取消订阅 → 清理资源
```

## 管道性能

### 性能考虑
管道的执行频率影响应用性能，需要合理设计。

示意图：
```
性能影响因素：
├── 管道复杂度
├── 执行频率
├── 输入数据大小
└── 纯/非纯特性
```

### 优化策略
提高管道性能的最佳实践。

示意图：
```
优化方法：
使用纯管道 → 减少不必要执行
避免复杂计算 → 简化转换逻辑
数据预处理 → 组件中准备数据
管道组合 → 合理使用管道链
```

## 管道与变更检测

### 变更检测机制
管道如何与 Angular 的变更检测系统交互。

示意图：
```
变更检测流程：
数据变化 → 触发检测 → 管道执行 → 更新视图

纯管道: 输入引用变化时执行
非纯管道: 每次检测周期执行
```

### 最佳实践
在变更检测环境中合理使用管道。

示意图：
```
推荐做法：
┌─────────────────┐
│  使用纯管道      │ ← 性能更好
│  避免副作用      │ ← 保持纯净
│  合理使用async   │ ← 自动管理订阅
│  预处理复杂数据  │ ← 减少模板负担
└─────────────────┘
```

## 实用管道示例

### 文件大小格式化
将字节数转换为可读的文件大小。

示意图：
```
字节转换：
输入: 2048
↓ filesize
输出: 2 KB

输入: 1572864  
↓ filesize
输出: 1.5 MB
```

实现：
```typescript
@Pipe({ name: 'filesize' })
export class FileSizePipe implements PipeTransform {
  transform(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  }
}
```

### 搜索过滤管道
在列表中实现实时搜索过滤。

示意图：
```
搜索过滤：
项目列表 + 搜索词 → filter管道 → 过滤结果

使用: 
<div *ngFor="let item of items | search:searchTerm">
```