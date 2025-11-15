# Nest.js

Nest.js 是一个用于构建高效、可扩展的 `Node.js` 服务器端应用程序的开发框架。它使用 `TypeScript` 构建，并完全支持 `TypeScript` (也允许使用纯 `JavaScript` 编程)，结合了面向对象编程 (`OOP`)、函数式编程 (`FP`) 和函数式响应式编程 (`FRP`) 的元素。

## 核心概念与架构设计

Nest.js 的核心思想是提供开箱即用的应用程序架构，允许开发者创建高度可测试、可扩展、松耦合且易于维护的应用程序。

### 分层架构

```
┌─────────────────┐
│   Controllers   │  ← HTTP请求入口层
└─────────────────┘
         ↓
┌─────────────────┐
│    Services     │  ← 业务逻辑处理层
└─────────────────┘
         ↓
┌─────────────────┐
│  Repositories   │  ← 数据访问层
└─────────────────┘
```

### 模块系统

Nest.js 采用模块化架构，每个应用程序至少有一个根模块 (`AppModule`)，你可以根据需要创建多个特性模块。

**模块关系示意图：**
```
AppModule (根模块)
├── UsersModule (用户模块)
├── AuthModule (认证模块)  
└── ProductsModule (产品模块)
```

### 依赖注入

Nest.js 内置了依赖注入容器，自动管理组件之间的依赖关系。

**依赖注入流程：**
```
ComponentA 需要 ComponentB
    ↓
IoC容器创建ComponentB实例
    ↓
IoC容器将ComponentB注入到ComponentA
    ↓
ComponentA直接使用ComponentB
```

## 主要特性

### 面向切面编程 (AOP)

Nest.js 通过拦截器、中间件、守卫等实现 AOP，允许你将横切关注点 (如日志、认证、异常处理) 与业务逻辑分离。

### 企业级框架支持

Nest.js 提供了完整的开箱即用体验，包含大量企业级应用所需的特性：
- 依赖注入容器
- 模块化系统
- 配置管理
- 验证和序列化
- 认证和授权
- 数据库集成
- 测试工具

### 平台无关性

虽然 Nest.js 默认使用 `Express`，但它构建在平台无关的架构上，可以轻松切换到其他 HTTP 框架如 `Fastify`。

```typescript
// 使用 Express 平台
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

const app = await NestFactory.create<NestExpressApplication>(AppModule);

// 使用 Fastify 平台  
import { NestFastifyApplication } from '@nestjs/platform-fastify';

const app = await NestFactory.create<NestFastifyApplication>(AppModule);
```

## 快速开始

### 环境准备

确保已安装 `Node.js` (v14 及以上版本)，然后安装 Nest.js CLI：

```bash
npm i -g @nestjs/cli
```

### 创建新项目

```bash
nest new my-nest-app
```

### 项目目录结构

```bash
src/
├── app.module.ts          # 应用程序的根模块
├── app.controller.ts      # 基本控制器
├── app.service.ts         # 基本服务
└── main.ts                # 应用程序入口文件
```

### 启动应用

```bash
cd my-nest-app
npm run start:dev
```

访问 `http://localhost:3000` 即可看到运行结果。

## 核心组件详解

### 模块 (Modules)

模块是用 `@Module()` 装饰器注解的类，它组织了应用程序的结构。

```typescript
@Module({
  imports: [UsersModule, AuthModule],      // 导入的其他模块
  controllers: [UsersController],          // 该模块的控制器
  providers: [UsersService],               // 该模块的服务
  exports: [UsersService]                  // 导出给其他模块使用
})
export class UsersModule {}
```

### 控制器 (Controllers)

控制器负责处理传入的请求和返回响应。

```typescript
import { Controller, Get, Post, Body, Param } from '@nestjs/common';

@Controller('users')  // 路由前缀 '/users'
export class UsersController {
  
  @Get()              // GET /users
  getAllUsers() {
    return '所有用户列表';
  }

  @Get(':id')         // GET /users/1
  getUser(@Param('id') id: string) {
    return `用户 ID: ${id}`;
  }

  @Post()             // POST /users
  createUser(@Body() userData: any) {
    return `创建用户: ${JSON.stringify(userData)}`;
  }
}
```

### 服务 (Providers)

服务是 Nest.js 的业务逻辑层，使用 `@Injectable()` 装饰器。

```typescript
import { Injectable } from '@nestjs/common';

export interface User {
  id: number;
  name: string;
  email: string;
}

@Injectable()
export class UsersService {
  private readonly users: User[] = [];

  create(user: User): User {
    this.users.push(user);
    return user;
  }

  findAll(): User[] {
    return this.users;
  }

  findOne(id: number): User {
    return this.users.find(user => user.id === id);
  }
}
```

### 完整的模块示例

```typescript
// user.entity.ts
export class User {
  id: number;
  name: string;
  email: string;
}

// users.service.ts
import { Injectable } from '@nestjs/common';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  private users: User[] = [
    { id: 1, name: '张三', email: 'zhangsan@example.com' },
    { id: 2, name: '李四', email: 'lisi@example.com' }
  ];

  findAll(): User[] {
    return this.users;
  }

  findOne(id: number): User {
    return this.users.find(user => user.id === id);
  }

  create(user: User): User {
    const newUser = { ...user, id: this.users.length + 1 };
    this.users.push(newUser);
    return newUser;
  }
}

// users.controller.ts
import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getAllUsers(): User[] {
    return this.usersService.findAll();
  }

  @Get(':id')
  getUser(@Param('id') id: string): User {
    return this.usersService.findOne(+id);
  }

  @Post()
  createUser(@Body() userData: User): User {
    return this.usersService.create(userData);
  }
}

// users.module.ts
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]  // 导出服务，供其他模块使用
})
export class UsersModule {}
```

## 常用装饰器

### 请求装饰器

```typescript
import { Controller, Get, Post, Param, Query, Body, Headers, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

@Controller('examples')
export class ExamplesController {
  
  @Get('query')
  getWithQuery(@Query() query: any) {
    return `查询参数: ${JSON.stringify(query)}`;
  }

  @Get(':id')
  getWithParam(@Param('id') id: string) {
    return `参数 ID: ${id}`;
  }

  @Post()
  createWithBody(@Body() body: any) {
    return `请求体: ${JSON.stringify(body)}`;
  }

  @Get('headers')
  getWithHeaders(@Headers() headers: any) {
    return `请求头: ${JSON.stringify(headers)}`;
  }

  // 使用平台特定的请求/响应对象
  @Get('native/req')
  getNativeReq(@Req() req: Request) {
    return `原始请求 URL: ${req.url}`;
  }

  @Get('native/res')
  getNativeRes(@Res() res: Response) {
    return res.status(200).json({ message: '直接响应' });
  }
}
```

### DTO (数据传输对象)

使用 `DTO` 来定义接口请求和响应的数据结构：

```typescript
// create-user.dto.ts
import { IsString, IsEmail, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;
}

// users.controller.ts
@Post()
createUser(@Body() createUserDto: CreateUserDto) {
  // Nest.js 会自动验证 createUserDto
  return this.usersService.create(createUserDto);
}
```

## 中间件和守卫

### 中间件

中间件在路由处理程序之前调用，可以访问请求和响应对象。

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  }
}

// 在模块中应用中间件
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*');  // 应用到所有路由
  }
}
```

### 守卫

守卫用于实现认证和授权逻辑：

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.validateRequest(request);
  }

  private validateRequest(request: any): boolean {
    // 实现你的认证逻辑
    const token = request.headers['authorization'];
    return !!token; // 简单示例，实际需要更复杂的验证
  }
}

// 使用守卫
@Controller('protected')
@UseGuards(AuthGuard)
export class ProtectedController {
  @Get()
  getProtectedData() {
    return '这是受保护的数据';
  }
}
```

## 异常处理

Nest.js 提供了内置的异常层，可以自动处理应用程序中抛出的所有异常。

```typescript
import { 
  Controller, Get, 
  HttpException, HttpStatus 
} from '@nestjs/common';

@Controller('exceptions')
export class ExceptionsController {
  
  @Get('not-found')
  getNotFound() {
    throw new HttpException('资源未找到', HttpStatus.NOT_FOUND);
  }

  @Get('custom')
  getCustomError() {
    throw new HttpException({
      status: HttpStatus.BAD_REQUEST,
      error: '这是自定义错误消息',
      timestamp: new Date().toISOString()
    }, HttpStatus.BAD_REQUEST);
  }
}

// 自定义异常过滤器
import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message
    });
  }
}
```

## 数据库集成

### 使用 TypeORM

`TypeORM` 是 Nest.js 官方推荐的 `ORM`，支持多种数据库。

```typescript
// user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 30 })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ default: true })
  isActive: boolean;
}

// users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findOne(id: number): Promise<User> {
    return this.usersRepository.findOneBy({ id });
  }

  async create(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }
}

// users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
```

## 生态系统

Nest.js 拥有丰富的生态系统，提供了大量官方和第三方模块：

### 常用官方模块

- `@nestjs/config` - 配置管理
- `@nestjs/jwt` + `@nestjs/passport` - 用户认证授权
- `@nestjs/swagger` - API 文档生成
- `@nestjs/cache-manager` - 缓存系统
- `@nestjs/schedule` - 定时任务
- `@nestjs/websockets` - WebSocket 支持
- `@nestjs/microservices` - 微服务架构

### 配置管理示例

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,  // 全局可用
      envFilePath: '.env',
    }),
  ],
})
export class AppModule {}

// config.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  get databaseHost(): string {
    return this.configService.get<string>('DATABASE_HOST');
  }

  get databasePort(): number {
    return this.configService.get<number>('DATABASE_PORT');
  }
}
```

Nest.js 通过其模块化架构、依赖注入系统和丰富的生态系统，为构建企业级 `Node.js` 应用程序提供了完整的解决方案。其优雅的设计模式和强大的类型支持使得开发大规模应用变得更加可维护和可扩展。