# Docker

## 概述

Docker 是一个开源的**容器化平台**，它提供了一种将应用程序与其依赖环境打包成容器的解决方案。这些容器可以在任何支持 Docker 的环境中快速部署和运行，从而实现应用程序的轻松迁移和高效管理。

### 核心概念

- **镜像**：Docker 镜像是一个**只读模板**，包含运行应用程序所需的一切：代码、运行时、系统工具、库和设置。它类似于虚拟机的快照，是容器的基础。
- **容器**：容器是镜像的**运行实例**。它是一个轻量级、可执行的软件包，包含运行应用所需的所有依赖项。你可以同时运行多个基于同一镜像的容器。
- **Dockerfile**：Dockerfile 是一个文本文件，包含一系列用于构建 Docker 镜像的指令。

## 核心特性

### 轻量级与资源高效

与传统虚拟机相比，Docker 容器更加轻量级，因为它们**共享宿主机的操作系统内核**，不需要为每个应用运行完整的操作系统。

```
传统虚拟机架构：
+-------------------+-------------------+-------------------+
|     应用 A        |      应用 B       |      应用 C       |
+-------------------+-------------------+-------------------+
|    Guest OS A     |    Guest OS B     |    Guest OS C     |
+-------------------+-------------------+-------------------+
|               Hypervisor / 虚拟机监视器                   |
+-----------------------------------------------------------+
|                    宿主机操作系统                          |
+-----------------------------------------------------------+
|                      物理硬件                             |
+-----------------------------------------------------------+

Docker容器架构：
+-------------------+-------------------+-------------------+
|    容器 A         |     容器 B        |     容器 C        |
+-------------------+-------------------+-------------------+
|              Docker 引擎 (容器运行时)                     |
+-----------------------------------------------------------+
|                    宿主机操作系统                          |
+-----------------------------------------------------------+
|                      物理硬件                             |
+-----------------------------------------------------------+
```

这种架构使得 Docker 可以在同一台主机上运行更多的容器实例，从而**提高资源利用率**。

### 可移植性

Docker 容器可以在任何支持 Docker 的平台上运行，无论是物理服务器、虚拟机还是云服务环境。这种跨平台兼容性为应用程序的灵活部署提供了有力支持。

### 标准化与隔离性

Docker 提供了一种**标准化的方式**来打包和部署应用程序。这种标准化降低了开发人员在不同环境之间迁移应用的复杂度。

同时，Docker 为每个容器提供了一个**隔离的运行环境**，确保容器之间不会相互影响。这种隔离性有助于提高应用程序的安全性和稳定性。

## Docker 与传统虚拟化的区别

Docker 基于 Linux 内核的 **Cgroup 和 namespace** 功能，实现了进程级的虚拟化技术。

- **启动速度**：Docker 容器可以在几秒钟内启动和关闭，而传统虚拟机通常需要数分钟
- **资源消耗**：Docker 容器共享主机内核，无需额外的操作系统开销，资源消耗更少
- **性能**：Docker 容器直接运行在主机内核上，性能接近原生

## Docker 架构

### 核心组件

Docker 采用客户端-服务器架构：

```
+-------------+    Docker REST API    +---------------+
| Docker 客户端 | -------------------> | Docker 守护进程 |
+-------------+                       +---------------+
                                            |
                                            | 管理
                                            v
                                      +---------------+
                                      |   容器运行时   |
                                      +---------------+
                                            |
                                            | 使用
                                            v
                                      +---------------+
                                      |    containerd |
                                      +---------------+
                                            |
                                            | 低层操作
                                            v
                                      +---------------+
                                      |     runc      |
                                      +---------------+
```

- **Docker 守护进程**：管理 Docker 对象，如镜像、容器、网络和卷
- **Docker 客户端**：用户与 Docker 交互的主要方式
- **容器运行时**：负责运行容器的组件，Docker 默认使用 **runc**

## 常用操作

### Dockerfile 示例

```dockerfile
FROM ubuntu:22.04
RUN apt-get update && apt-get install -y python3 python3-pip
COPY . /app
WORKDIR /app
RUN pip3 install -r requirements.txt
EXPOSE 5000
CMD ["python3", "app.py"]
```

构建镜像：
```bash
docker build -t my-python-app .
```

### 容器生命周期管理

```bash
# 运行容器
docker run -d -p 5000:5000 --name my-app my-python-app

# 查看运行中的容器
docker ps

# 查看容器日志
docker logs my-app

# 进入容器
docker exec -it my-app /bin/bash

# 停止容器
docker stop my-app

# 启动已停止的容器
docker start my-app

# 删除容器
docker rm my-app
```

### 数据持久化

```bash
# 创建卷
docker volume create my-data

# 使用卷运行容器
docker run -d -v my-data:/data --name data-container my-python-app

# 挂载主机目录
docker run -d -v /host/path:/container/path --name mount-container my-python-app
```

## Docker API 使用

Docker 提供了丰富的 API 用于管理和操作 Docker 容器、镜像、网络和数据卷等资源。

### API 版本

Docker API 分为三个版本：
- **V1**：Docker 最初的 API 版本，目前已被废弃
- **V2**：Docker 现在的稳定版本 API，与 Docker CLI 和 Docker Engine 完全兼容
- **V3**：Docker 的最新 API 版本 (alpha 版本)，提供 Swarm、Network、Plugin 等新特性的支持

### API 调用方式

#### Docker CLI

Docker CLI 是 Docker 命令行工具，可以通过命令行界面来管理和操作 Docker 引擎。Docker CLI 实际上是对 Docker API 的一层封装，它可以直接调用 Docker API 来完成相应的操作。

```bash
# 使用 Docker CLI 启动一个新的 Docker 容器
docker run -d -p 8080:80 nginx:latest
```

#### Docker SDK

Docker SDK 是一组编程语言特定的 API，用于访问和管理 Docker 引擎。Docker SDK 提供了一组简单的 API，可以直接在程序中调用而无需手动构造 HTTP 请求和解析响应。

**Python 示例：**

```python
import docker

client = docker.from_env()
container = client.containers.run('nginx:latest', detach=True, ports={'80/tcp': '8080'})
print(container.id)
```

**Node.js 示例：**

```javascript
const Docker = require('dockerode');
const docker = new Docker();

// 列出所有容器
docker.listContainers((err, containers) => {
  if (err) throw err;
  console.log(containers);
});

// 运行新容器
docker.run('nginx:latest', ['ls', '-la'], process.stdout, (err, data) => {
  if (err) throw err;
  console.log(data);
});
```

#### HTTP RESTful API

HTTP RESTful API 是 Docker API 最基本的调用方式，通过 HTTP 请求和响应来管理和操作 Docker 引擎。

**列出所有容器：**

```bash
curl -X GET http://localhost:2375/containers/json
```

**创建新容器：**

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "Image": "nginx:latest",
    "HostConfig": {
      "PortBindings": {
        "80/tcp": [{ "HostPort": "8080" }]
      }
    }
  }' \
  http://localhost:2375/containers/create
```

**启动容器：**

```bash
curl -X POST \
  http://localhost:2375/containers/<container_id>/start
```

### Registry API

Docker Registry API 是 Docker Registry 的 REST API，它简化了镜像和仓库的存储。

```bash
# 取出镜像层
GET /v1/images/(image_id)/layer

# 检索镜像
GET /v1/images/(image_id)/json

# 获取库里所有的标签或者指定标签
GET /v1/repositories/(namespace)/(repository)/tags
GET /v1/repositories/(namespace)/(repository)/tags/(tag*)

# 删除标签
DELETE /v1/repositories/(namespace)/(repository)/tags/(tag*)
```

### 安全机制

#### TLS 加密

Docker API 支持基于 TLS 的加密机制，可以通过 HTTPS 协议来加密 Docker API 的通信，防止数据在传输过程中被篡改或窃取。

**生成证书和密钥：**

```bash
openssl req -newkey rsa:4096 -nodes -keyout key.pem -x509 -days 365 -out cert.pem
```

**配置 Docker 引擎使用 TLS：**

```bash
dockerd \
  --tlsverify \
  --tlscacert=ca.pem \
  --tlscert=cert.pem \
  --tlskey=key.pem \
  -H=0.0.0.0:2376
```

#### 认证授权

Docker API 支持基于 OAuth2.0 的认证和授权机制，可以通过访问令牌来验证客户端的身份并授权客户端访问 Docker API 的特定资源。

**获取访问令牌：**

```bash
curl -X POST \
  -d "client_id=<CLIENT_ID>&client_secret=<CLIENT_SECRET>&grant_type=client_credentials" \
  http://localhost:4180/token
```

**使用访问令牌访问 API：**

```bash
curl -H "Authorization: Bearer <ACCESS_TOKEN>" http://localhost:2375/containers/json
```

## Docker 的优势与不足

### 优势

1.  **快速部署**：短时间内可以部署成百上千个应用，更快速交付到线上。
2.  **简化配置**：将运行环境打包保存至容器，使用时直接启动即可。
3.  **快速迁移和扩展**：可跨平台运行在物理机、虚拟公有云等环境，良好的兼容性可以方便将应用从 A 宿主机迁移到 B 宿主机，甚至是 A 平台迁移到 B 平台。
4.  **提高开发效率**：Docker 容器可以将应用程序和其依赖项打包在一起，形成一个独立的容器。开发人员可以快速部署、测试和调试应用程序，无需担心环境差异导致的问题。

### 不足

1.  **隔离性**：各应用之间的隔离不如虚拟机彻底，因为同一台宿主机所有 Docker 的容器公用宿主机内核。
2.  **安全性问题**：Docker 容器虽然提供了隔离性，但它们与宿主机共享相同的内核。如果容器配置不当或存在漏洞，可能会对整个宿主机造成影响。
3.  **持久化存储需求**：Docker 容器的默认存储是临时性的。若需要实现数据的持久化保存，则需要通过额外的配置来挂载宿主机上的目录或使用专门的持久化存储卷。
4.  **网络配置复杂性**：Docker 容器的网络配置可能相对复杂。在构建跨容器的通信网络时，开发人员需要熟悉 Docker 的网络模型和配置方法，以确保容器之间的正常通信。