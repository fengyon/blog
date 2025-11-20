# API 安全

## API 安全威胁全景 {#api-security-threats}

随着微服务和移动应用的普及，API 已成为现代应用架构的核心组件，同时也成为攻击者的主要目标。API 安全涉及从传输层到业务层的全面防护，需要构建纵深防御体系。

攻击向量示意图：
```
客户端 -> 网络传输 -> API网关 -> 业务逻辑 -> 数据存储
    ↓           ↓           ↓           ↓           ↓
 凭证泄露   ->  中间人攻击   ->  端点发现   ->  逻辑漏洞   ->  数据泄露
 设备劫持   ->  流量嗅探   ->  参数篡改   ->  权限绕过   ->  注入攻击
```

## 认证机制安全 {#authentication-security}

### API 密钥管理

**密钥生命周期管理**：
```
密钥生成 -> 安全分发 -> 存储保护 -> 轮换更新 -> 吊销清理
    ↓           ↓           ↓           ↓           ↓
 强随机数   ->  加密传输   ->  环境变量   ->  定期强制   ->  即时失效
 唯一标识   ->  首次使用   ->  密钥管理   ->  无缝切换   ->  审计追踪
```

**密钥安全存储实践**：
```
不安全: 硬编码在客户端代码、提交到版本库
较安全: 配置文件、环境变量
安全: 密钥管理服务、硬件安全模块
```

### JWT 安全实践

**安全的 JWT 结构**：
```
Header: 
  {"alg": "HS256", "typ": "JWT", "kid": "key-identifier"}
  
Payload:
  {"sub": "user123", "role": "user", "iat": 1516239022, 
   "exp": 1516242622, "jti": "unique-token-id"}
   
Signature: 
  HMACSHA256(base64UrlEncode(header) + "." + 
             base64UrlEncode(payload), secret)
```

**JWT 安全防护措施**：
```
令牌过期: 短期访问令牌 (15-30分钟)
令牌撤销: 使用黑名单或短有效期
密钥轮换: 定期更新签名密钥
算法防护: 强制使用HS256或RS256，禁用none算法
```

## 授权与访问控制 {#authorization-access-control}

### 细粒度权限模型

**RBAC + ABAC 混合模型**：
```
用户属性 -> 角色映射 -> 权限计算 -> 策略执行
    ↓           ↓           ↓           ↓
 部门:销售   ->  销售角色   ->  客户读/写   ->  允许访问
 区域:北美   ->  区域限制   ->  时间验证   ->  资源过滤
```

**API 端点权限控制**：
```
GET /api/v1/users/{id}   -> 用户只能访问自己的数据
PUT /api/v1/users/{id}   -> 管理员或资源所有者
DELETE /api/v1/users/{id} -> 仅管理员
POST /api/v1/users       -> 公开注册或管理员
```

### OAuth 2.0 安全配置

**授权码流程安全增强**：
```
客户端注册: 严格的重定向URI验证、客户端密钥加密存储
授权请求: 使用PKCE (Proof Key for Code Exchange)、state参数防CSRF
令牌发放: 短期访问令牌、安全刷新令牌机制
令牌使用: 令牌绑定、TLS强制要求
```

PKCE 流程示意图：
```
客户端生成: code_verifier (随机字符串)
           code_challenge = SHA256(code_verifier)
           
授权请求: 包含 code_challenge
授权响应: 返回 authorization_code
令牌请求: 包含 authorization_code + code_verifier
令牌端点: 验证 code_verifier 与 code_challenge 匹配
```

## 输入验证与数据处理 {#input-validation-data-processing}

### 请求验证层次

**多层验证架构**：
```
客户端验证 -> API网关验证 -> 业务逻辑验证 -> 数据库约束
    ↓           ↓           ↓           ↓
 基础检查   ->  结构验证   ->  语义验证   ->  最终防线
 用户体验   ->  统一规则   ->  业务规则   ->  数据完整
```

**JSON Schema 验证示例**：
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["username", "email"],
  "properties": {
    "username": {
      "type": "string",
      "pattern": "^[a-zA-Z0-9_-]{3,20}$",
      "maxLength": 20
    },
    "email": {
      "type": "string",
      "format": "email",
      "maxLength": 254
    },
    "age": {
      "type": "integer",
      "minimum": 0,
      "maximum": 150
    }
  }
}
```

### 注入攻击防护

**SQL 注入防护**：
```python
# 不安全的方式
query = f"SELECT * FROM users WHERE username = '{username}'"

# 安全的方式：参数化查询
query = "SELECT * FROM users WHERE username = ?"
cursor.execute(query, (username,))
```

**NoSQL 注入防护**：
```javascript
// 不安全：直接拼接查询
db.users.find({username: req.body.username});

// 安全：使用操作符、类型检查
const username = String(req.body.username).substring(0, 100);
db.users.find({username: {$eq: username}});
```

## 输出编码与数据过滤 {#output-encoding-data-filtering}

### 响应数据净化

**敏感信息过滤**：
```
完整用户对象: 
  {id: 123, email: "user@example.com", password_hash: "...", 
   ssn: "123-45-6789", phone: "13800138000"}
   
过滤后响应:
  {id: 123, email: "u***@example.com", phone: "138****8000"}
```

**动态字段选择**：
```
请求: GET /api/users/123?fields=id,name,email
响应: 仅返回指定字段，排除敏感信息
```

### 错误信息管理

**安全错误响应**：
```
信息泄露的错误:
  HTTP/1.1 500 Internal Server Error
  {"error": "Database connection failed: Access denied for user 'admin'@'localhost'"}

安全的错误:
  HTTP/1.1 500 Internal Server Error  
  {"error": "internal_server_error", "id": "err_5a1b3c4d"}
  
内部日志:
  [ERROR] [req_id: req_5a1b3c4d] Database connection failed: ...
```

## 速率限制与防滥用 {#rate-limiting-abuse-prevention}

### 分层限流策略

**多维度限流设计**：
```
全局限流 -> 用户级限流 -> 端点级限流 -> 业务级限流
    ↓           ↓           ↓           ↓
 系统保护   ->  公平使用   ->  资源保护   ->  业务规则
 防止DDoS   ->  配额管理   ->  关键接口   ->  防业务滥用
```

**Redis 实现示例**：
```python
def check_rate_limit(user_id, endpoint, limit, window):
    key = f"rate_limit:{user_id}:{endpoint}"
    pipeline = redis.pipeline()
    pipeline.incr(key)
    pipeline.expire(key, window)
    results = pipeline.execute()
    
    request_count = results[0]
    if request_count > limit:
        raise RateLimitExceededError("Too many requests")
    
    return {
        "limit": limit,
        "remaining": limit - request_count,
        "reset": time.time() + window
    }
```

### 智能行为分析

**异常检测规则**：
```
频率异常: 同一端点短时间内高频调用
模式异常: 非正常时间或地理位置的访问
序列异常: 接口调用顺序不符合业务逻辑
内容异常: 提交数据包含可疑模式或测试数据
```

## 传输与加密安全 {#transport-encryption-security}

### TLS 最佳实践

**安全配置要求**：
```
协议版本: TLS 1.2+ (禁用SSLv3, TLS 1.0/1.1)
密码套件: 优先使用AEAD算法 (AES-GCM, CHACHA20)
证书管理: 有效证书、定期轮换、强密钥长度
扩展安全: HSTS头、证书透明度、OCSP装订
```

### 数据加密策略

**端到端加密**：
```
客户端 -> 请求加密 -> 传输加密 -> 存储加密 -> 响应加密
    ↓           ↓           ↓           ↓           ↓
 字段级加密   ->  TLS 1.3   ->  数据库加密   ->  选择性解密
 密钥派生     ->  前向安全   ->  应用层加密   ->  安全返回
```

## API 网关安全 {#api-gateway-security}

### 网关防护功能

**安全功能集成**：
```
入口流量 -> TLS终止 -> 身份验证 -> 授权检查 -> 速率限制
    ↓           ↓           ↓           ↓           ↓
 客户端请求   ->  证书验证   ->  JWT验证   ->  权限验证   ->  防滥用
            ->  请求验证   ->  数据转换   ->  响应过滤   ->  缓存控制
```

### 零信任架构

**API 零信任原则**：
```
永不信任: 所有请求必须验证身份和权限
始终验证: 每次请求都进行完整认证和授权检查
最小权限: 仅授予完成当前任务所需的最小权限
假设入侵: 网络内部和外部同样危险
```

## 安全监控与审计 {#security-monitoring-auditing}

### 审计日志规范

**结构化日志格式**：
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "service": "user-api",
  "event": "USER_LOGIN",
  "user_id": "user_123",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "request_id": "req_abc123",
  "endpoint": "/api/v1/login",
  "method": "POST",
  "status_code": 200,
  "response_time_ms": 45,
  "metadata": {
    "auth_method": "password",
    "device_fingerprint": "fp_xyz789"
  }
}
```

### 实时威胁检测

**异常行为监控**：
```
认证异常: 频繁登录失败、多地点同时登录
访问异常: 异常时间访问、权限提升尝试
数据异常: 大量数据下载、敏感模式访问
业务异常: 违反业务规则的请求序列
```

## API 安全测试 {#api-security-testing}

### 安全测试方法

**测试覆盖范围**：
```
认证测试: 令牌验证、会话管理、密码策略
授权测试: 权限绕过、水平越权、垂直越权
输入测试: 注入攻击、缓冲区溢出、格式字符串
业务测试: 逻辑漏洞、工作流绕过、竞争条件
```

**自动化安全测试**：
```
静态分析: 代码扫描、依赖检查、配置验证
动态分析: 漏洞扫描、模糊测试、渗透测试
交互分析: DAST工具、API安全扫描器
```

### 漏洞管理流程

**漏洞处理生命周期**：
```
漏洞发现 -> 风险评估 -> 修复开发 -> 测试验证 -> 部署上线
    ↓           ↓           ↓           ↓           ↓
 安全扫描   ->  优先级分类   ->  补丁开发   ->  回归测试   ->  监控确认
 外部报告   ->  影响分析   ->  安全审查   ->  性能测试   ->  文档更新
```

## 合规与标准化 {#compliance-standardization}

### API 安全标准

**主要安全框架**：
```
OWASP API Security Top 10: API特定安全风险
ISO 27001: 信息安全管理体系
NIST SP 800-53: 安全与隐私控制
GDPR: 数据保护与隐私要求
PCI DSS: 支付卡行业数据安全
```

### 安全开发生命周期

**API 安全集成**：
```
需求阶段: 威胁建模、安全需求定义
设计阶段: 安全架构、API规范审查
开发阶段: 安全编码、代码审查、自动化测试
测试阶段: 安全测试、渗透测试、漏洞评估
运维阶段: 安全监控、事件响应、持续改进
```