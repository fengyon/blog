# Kubernetes

## 概述

Kubernetes (常简称为 **K8s**) 是一个可移植、可扩展的**开源容器编排平台**，用于管理容器化的工作负载和服务，并促进声明式配置和自动化。它拥有一个庞大且快速增长的生态系统，其服务、支持和工具的使用范围广泛。

Kubernetes 这个名字源于希腊语，意为“舵手”或“飞行员”。K8s 这个缩写是因为 K 和 s 之间有 8 个字符。Google 在 2014 年开源了 Kubernetes 项目，它建立在 Google 大规模运行生产工作负载十几年经验的基础上，结合了社区中最优秀的想法和实践。

## 核心架构

### 架构组成

Kubernetes 遵循**客户端-服务器架构**，主要由**控制平面 (Control Plane)** 和**工作节点 (Worker Nodes)** 组成。

```
控制平面 (Master)
├── kube-apiserver: API 入口
├── etcd: 键值存储
├── kube-scheduler: 调度决策
└── kube-controller-manager: 控制循环

工作节点 (Nodes)
├── kubelet: 节点代理
├── kube-proxy: 网络代理
└── 容器运行时: Docker, containerd 等
```

### 组件详解

**控制平面组件**：

- **kube-apiserver**：公开基础 Kubernetes API，是控制平面的前端
- **etcd**：一致且高可用的键值存储，用作 Kubernetes 所有集群数据的后备存储
- **kube-scheduler**：监视新创建的 Pod 并选择要运行它们的节点
- **kube-controller-manager**：运行控制器进程，处理集群的常规任务

**节点组件**：

- **kubelet**：在集群中的每个节点上运行的代理，确保容器在 Pod 中运行
- **kube-proxy**：在节点上维护网络规则，实现 Kubernetes 服务概念
- **容器运行时**：负责运行容器的软件，如 Docker、containerd

## 核心概念

### Pod

**Pod** 是 Kubernetes 中最小的可部署计算单元，代表集群中运行的一个进程。

```
Pod 结构：
+-------------------+
|       Pod         |
|  +-------------+  |
|  |  Container  |  |
|  +-------------+  |
|  |  Container  |  |
|  +-------------+  |
| 共享网络和存储命名空间 |
+-------------------+
```

Pod 特点：
- 可以包含一个或多个紧密相关的容器
- 共享网络命名空间 (同一 IP) 和存储卷
- 是临时性的、可丢弃的实体

### Controller

**控制器**通过跟踪 Kubernetes 资源状态的更改，帮助将资源置于其所需状态。常见的工作负载控制器类型包括：

- **Deployment**：管理无状态应用，支持滚动更新和回滚
- **ReplicaSet**：确保指定数量的 Pod 副本一直在运行
- **StatefulSet**：管理有状态应用，提供有序部署和缩放
- **DaemonSet**：确保所有 (或某些) 节点上运行一个 Pod 的副本
- **Job** 和 **CronJob**：运行一次性或定时任务

### Service

**Service** 是一组抽象的或有逻辑的 Pod 集合，以及用于访问它们的策略。服务提供稳定的 IP 地址和 DNS 名称，实现负载均衡。

```
服务流量路由：
+----------+    +----------+    +-------+
| 客户端    | -> | Service  | -> | Pod 1 |
+----------+    +----------+    +-------+
                         | -> | Pod 2 |
                         +-------+
                         | -> | Pod 3 |
                         +-------+
```

## 关键特性

### 自动修复

Kubernetes 通过以下机制实现**自我修复**：

- 自动重启失败的容器
- 替换无响应的容器 (根据健康检查)
- 杀死不通过用户定义的健康检查的容器
- 在容器就绪前不向客户端通告

### 服务发现与负载均衡

Kubernetes 可以使用 DNS 名称或自己的 IP 地址来暴露容器。如果进入容器的流量很大，Kubernetes 可以负载均衡并分配网络流量，从而使部署稳定。

### 存储编排

Kubernetes 允许你自动挂载你选择的存储系统，例如本地存储、公共云提供商等。支持多种存储类型：

- **临时卷**：为只读输入数据提供临时存储，容器重启后不再可用
- **持久卷**：将存储卷作为 Kubernetes 资源提供，容器重启后数据和卷仍然可用

### 自动部署和回滚

你可以使用 Kubernetes 描述已部署容器的所需状态，它可以以受控的速率将实际状态更改为期望状态。例如，你可以自动化 Kubernetes 来为你的部署创建新容器，删除现有容器并将它们的所有资源用于新容器。

### 密钥与配置管理

Kubernetes 允许你存储和管理敏感信息，例如密码、OAuth 令牌和 SSH 密钥。你可以在不重建容器镜像的情况下部署和更新密钥和应用程序配置，也无需在堆栈配置中暴露密钥。

## 常用 API 示例

### Pod 配置

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
  labels:
    app: nginx
spec:
  containers:
  - name: nginx-container
    image: nginx:1.19
    ports:
    - containerPort: 80
    env:
    - name: ENV_VAR
      value: "production"
    resources:
      requests:
        memory: "64Mi"
        cpu: "250m"
      limits:
        memory: "128Mi"
        cpu: "500m"
```

### Deployment 配置

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.19
        ports:
        - containerPort: 80
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 10
```

### Service 配置

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  selector:
    app: nginx
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  type: LoadBalancer
```

### ConfigMap 和 Secret

**ConfigMap 示例**：
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  config.properties: |
    server.port=8080
    logging.level=INFO
```

**Secret 示例**：
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-secret
type: Opaque
data:
  username: YWRtaW4=
  password: cGFzc3dvcmQ=
```

## 实践示例

### 应用部署流程

1. **创建命名空间**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: my-app
```

2. **部署应用**
```bash
kubectl apply -f deployment.yaml -n my-app
```

3. **暴露服务**
```bash
kubectl expose deployment nginx-deployment --port=80 --type=LoadBalancer -n my-app
```

4. **检查状态**
```bash
kubectl get pods -n my-app
kubectl describe deployment nginx-deployment -n my-app
kubectl get services -n my-app
```

### 水平扩缩容

```bash
# 手动扩缩
kubectl scale deployment nginx-deployment --replicas=5 -n my-app

# 自动扩缩（需要 metrics-server）
kubectl autoscale deployment nginx-deployment --cpu-percent=50 --min=1 --max=10 -n my-app
```

### 滚动更新

```bash
# 更新镜像版本
kubectl set image deployment nginx-deployment nginx=nginx:1.20 -n my-app

# 监视更新状态
kubectl rollout status deployment nginx-deployment -n my-app

# 回滚更新
kubectl rollout undo deployment nginx-deployment -n my-app
```

## 网络与存储

### 网络模型

Kubernetes 网络遵循基本原则：
- 每个 Pod 都有唯一的 IP 地址
- Pod 内所有容器共享网络命名空间
- Pod 可以不经过 NAT 与所有其他 Pod 通信

### 存储卷

**持久卷声明示例**：
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

**使用存储卷的 Pod**：
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-with-storage
spec:
  containers:
  - name: app
    image: nginx
    volumeMounts:
    - name: storage
      mountPath: /data
  volumes:
  - name: storage
    persistentVolumeClaim:
      claimName: my-pvc
```

## 运维与监控

### 资源监控

```bash
# 查看集群资源使用情况
kubectl top nodes
kubectl top pods -n my-app

# 查看 Pod 详细状态
kubectl describe pod pod-name -n my-app

# 查看容器日志
kubectl logs pod-name -n my-app
kubectl logs pod-name -c container-name -n my-app
```

### 调试命令

```bash
# 进入运行中的容器
kubectl exec -it pod-name -c container-name -- /bin/bash -n my-app

# 端口转发用于本地访问
kubectl port-forward pod-name 8080:80 -n my-app

# 检查集群事件
kubectl get events -n my-app --sort-by=.metadata.creationTimestamp
```