# 常见 Web 攻击与防护

## Web 安全威胁概述 {#web-security-threats-overview}

Web 应用程序面临着多样化的安全威胁，攻击者利用各种技术手段突破系统防线。这些威胁从简单的数据窃取到复杂的系统控制，呈现出不同的攻击特征和危害程度。

攻击路径示意图：
```
攻击者 -> 网络层(嗅探) -> 应用层(注入) -> 数据层(窃取) -> 系统层(控制)
防护措施: HTTPS/WAF -> 输入验证/认证 -> 加密/权限 -> 监控/补丁
```

## 注入攻击 {#injection-attacks}

### SQL 注入

**攻击原理**：通过用户输入插入恶意 SQL 代码，操纵数据库查询逻辑。

攻击示意图：
```
正常查询: SELECT * FROM users WHERE user='admin' AND pass='123'
注入输入: admin' OR '1'='1
最终查询: SELECT * FROM users WHERE user='admin' OR '1'='1' AND pass='xxx'
查询结果: 返回所有用户记录，绕过身份验证
```

**高级变种**：
- 联合查询注入：`' UNION SELECT username, password FROM users--`
- 布尔盲注：`' AND (SELECT SUBSTRING(password,1,1) FROM users)='a'--`
- 时间盲注：`' AND IF(1=1,SLEEP(5),0)--`

**防护措施**：
- 参数化查询：使用 PreparedStatement
- 存储过程：封装数据库逻辑
- ORM 框架：MyBatis、Hibernate
- 输入验证：白名单过滤
- 最小权限：数据库账户降权

### 命令注入

**攻击原理**：通过系统调用执行恶意操作系统命令。

攻击示意图：
```
正常功能: system("ping " + userInput)
恶意输入: 127.0.0.1; cat /etc/passwd
最终命令: ping 127.0.0.1; cat /etc/passwd
执行结果: 同时执行两条命令，泄露敏感文件
```

**防护措施**：
- 输入验证：严格白名单
- 命令转义：properly escape shell metacharacters
- 沙箱环境：限制执行权限
- API 替代：使用安全库函数

## 跨站脚本攻击 {#cross-site-scripting}

### 反射型 XSS

**攻击原理**：恶意脚本通过 URL 参数注入，服务器直接返回给浏览器执行。

攻击示意图：
```
恶意URL: http://site.com/search?q=<script>alert('XSS')</script>
服务器响应: <html>搜索结果: <script>alert('XSS')</script></html>
浏览器执行: 弹出警告框，脚本在受害者浏览器中运行
```

### 存储型 XSS

**攻击原理**：恶意脚本存储到服务器数据库，影响所有访问用户。

攻击示意图：
```
攻击者提交: <script>stealCookie()</script> -> 存储到数据库
其他用户访问: 加载包含恶意脚本的页面 -> 执行stealCookie()
结果: 会话cookie被窃取，账户被盗
```

### DOM 型 XSS

**攻击原理**：客户端 JavaScript 处理数据时产生漏洞，不涉及服务器交互。

攻击示意图：
```
漏洞代码: document.write('<img src="' + userInput + '">')
恶意输入: " onerror="alert('XSS')
最终HTML: <img src="" onerror="alert('XSS')">
执行结果: 图片加载失败触发onerror事件
```

**防护措施**：
- 输出编码：HTML 实体编码 `< → &lt;`
- CSP 策略：Content-Security-Policy 头
- 输入验证：过滤特殊字符
- HttpOnly Cookie：防止 cookie 窃取

## 跨站请求伪造 {#cross-site-request-forgery}

**攻击原理**：利用用户已登录状态，诱导其执行非预期操作。

攻击示意图：
```
用户登录银行网站 -> 会话有效
攻击者发送恶意链接: <img src="http://bank.com/transfer?to=hacker&amount=1000">
用户访问恶意页面 -> 浏览器自动发送转账请求
服务器验证会话 -> 执行转账操作
```

**防护措施**：
- CSRF Token：随机令牌验证
- 同源检测：Referer 头验证
- 双重验证：关键操作需重新认证
- SameSite Cookie：限制第三方 Cookie

## 文件上传漏洞 {#file-upload-vulnerabilities}

**攻击原理**：通过上传恶意文件获取服务器控制权。

攻击示意图：
```
攻击者上传: shell.php <?php system($_GET['cmd']); ?>
服务器存储: /uploads/shell.php
攻击者访问: http://site.com/uploads/shell.php?cmd=whoami
执行结果: 服务器执行系统命令，返回当前用户
```

**防护措施**：
- 文件类型验证：MIME 类型检测 + 扩展名白名单
- 内容检查：文件头验证 + 病毒扫描
- 重命名存储：随机文件名 + 非 Web 目录
- 权限控制：上传目录无执行权限

## 访问控制漏洞 {#access-control-vulnerabilities}

### 水平越权

**攻击原理**：访问其他用户的相同权限资源。

攻击示意图：
```
用户A访问: /profile?id=123 (自己的资料)
修改ID参数: /profile?id=124 (他人资料)
系统未验证 -> 返回用户B的敏感信息
```

### 垂直越权

**攻击原理**：普通用户获取管理员权限功能。

攻击示意图：
```
普通用户 -> 隐藏管理员功能 -> 直接访问/admin/dashboard
系统未检查角色权限 -> 显示管理员面板
```

**防护措施**：
- 权限验证：每次请求检查访问权限
- 会话管理：安全会话超时
- 角色分离：最小权限原则
- 日志审计：记录敏感操作

## 安全配置错误 {#security-misconfiguration}

**常见问题**：
- 默认账户密码未修改
- 错误信息泄露敏感数据
- 不必要的服务端口开放
- 过时的软件版本

攻击示意图：
```
扫描发现: 服务器开放22,80,443,8080端口
8080端口: 管理控制台，默认密码admin/admin
登录成功: 获取系统控制权限
```

**防护措施**：
- 安全加固：关闭不必要服务
- 最小权限：服务账户降权
- 定期更新：安全补丁管理
- 自动化扫描：配置检查工具

## 敏感数据泄露 {#sensitive-data-exposure}

**泄露途径**：
- 传输未加密：HTTP 明文传输
- 存储未加密：数据库明文存储
- 弱加密算法：MD5、DES 等
- 密钥硬编码：代码中暴露密钥

攻击示意图：
```
网络嗅探: 拦截HTTP请求 -> 获取明文密码
数据库泄露: 用户表密码未哈希 -> 直接获取所有密码
代码仓库: 发现API密钥硬编码 -> 滥用云服务资源
```

**防护措施**：
- 传输加密：全站 HTTPS
- 存储加密：强哈希算法 (bcrypt、Argon2)
- 密钥管理：专用密钥管理服务
- 数据脱敏：日志中屏蔽敏感信息

## 服务器端请求伪造 {#server-side-request-forgery}

**攻击原理**：利用服务器作为代理访问内部资源。

攻击示意图：
```
漏洞URL: http://site.com/proxy?url=user_input
恶意输入: http://192.168.1.1/admin
服务器访问: 内网管理界面 -> 返回给攻击者
结果: 攻击者通过外网服务器访问内网资源
```

**防护措施**：
- URL 白名单：只允许访问可信域名
- 网络隔离：关键系统禁止外网访问
- 协议限制：禁止 file://、gopher://等协议
- 身份验证：内部服务也需要认证

## API 安全威胁 {#api-security-threats}

**常见问题**：
- 未授权 API 访问
- 批量分配漏洞
- 速率限制缺失
- 敏感信息过度返回

攻击示意图：
```
发现API端点: /api/v1/users/ 无需认证
批量请求: POST /api/v1/users {“role”:”admin”}
系统接受参数 -> 创建管理员账户
```

**防护措施**：
- API 认证：JWT、OAuth 2.0
- 输入验证：严格参数检查
- 速率限制：防暴力破解
- 数据过滤：只返回必要字段

## 防护体系架构 {#protection-system-architecture}

**纵深防御策略**：
```
网络层: WAF + DDoS防护 + 网络隔离
应用层: 输入验证 + 输出编码 + 访问控制
数据层: 参数化查询 + 加密存储 + 备份恢复
监控层: 安全日志 + 实时告警 + 行为分析
```

**安全开发生命周期**：
```
需求阶段: 威胁建模 + 安全需求
设计阶段: 安全架构 + 设计审查
开发阶段: 安全编码 + 代码审查
测试阶段: 渗透测试 + 漏洞扫描
运维阶段: 安全监控 + 应急响应
```