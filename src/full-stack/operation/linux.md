# Linux

## 引言

Linux 是一个开源的类 Unix 操作系统内核，由林纳斯·托瓦兹在 1991 年首次发布。作为现代计算基础设施的基石，Linux 以其稳定性、安全性和灵活性著称，广泛应用于服务器、嵌入式设备、超级计算机和个人电脑等领域。

## 体系架构

### 整体架构

Linux 采用分层架构，各组件之间通过清晰的接口进行通信：

```
应用程序
    |
系统调用接口
    |
Linux 内核
    |
硬件抽象层
    |
物理硬件
```

### 内核空间与用户空间

```
用户空间
├── 应用程序 (进程)
├── 系统库 (glibc)
└── 运行环境

系统调用边界
↓

内核空间
├── 系统调用接口
├── 进程管理
├── 内存管理
├── 文件系统
├── 设备驱动
└── 网络栈
```

## 核心组件

### 进程管理

Linux 使用进程和线程作为执行单元，通过调度器管理 CPU 时间分配。

**进程状态转换：**

```
新建 → 就绪 ↔ 运行 → 终止
            ↑
            └── 等待/阻塞
```

**进程相关命令示例：**

```bash
# 查看进程树
pstree -p

# 实时进程监控
top
htop

# 进程信号发送
kill -TERM 1234
kill -KILL 5678
```

### 内存管理

Linux 使用虚拟内存管理，为每个进程提供独立的地址空间。

**虚拟内存布局：**

```
0xFFFFFFFF
┌─────────────┐
│   内核空间   │
├─────────────┤
│   栈空间     │ ← 向下增长
├─────────────┤
│   共享库     │
├─────────────┤
│   堆空间     │ ← 向上增长
├─────────────┤
│   BSS段     │
├─────────────┤
│   数据段     │
├─────────────┤
│   代码段     │
└─────────────┘
0x00000000
```

### 文件系统

Linux 采用统一的文件系统模型，“一切皆文件”是其核心哲学。

**文件系统层次结构：**

```
/
├── bin    (基本命令)
├── etc    (系统配置)
├── home   (用户目录)
├── proc   (进程信息)
├── sys    (内核参数)
├── tmp    (临时文件)
├── usr    (用户程序)
└── var    (可变数据)
```

## 系统调用

### 文件操作系统调用

```c
#include <fcntl.h>
#include <unistd.h>
#include <sys/stat.h>

// 文件描述符操作
int open(const char *pathname, int flags, mode_t mode);
ssize_t read(int fd, void *buf, size_t count);
ssize_t write(int fd, const void *buf, size_t count);
int close(int fd);

// 示例：文件复制
int copy_file(const char *src, const char *dst) {
    int src_fd = open(src, O_RDONLY);
    int dst_fd = open(dst, O_WRONLY | O_CREAT | O_TRUNC, 0644);
    
    char buffer[4096];
    ssize_t bytes_read;
    
    while ((bytes_read = read(src_fd, buffer, sizeof(buffer))) > 0) {
        write(dst_fd, buffer, bytes_read);
    }
    
    close(src_fd);
    close(dst_fd);
    return 0;
}
```

### 进程控制系统调用

```c
#include <unistd.h>
#include <sys/wait.h>
#include <signal.h>

// 进程创建和执行
pid_t fork(void);
int execve(const char *pathname, char *const argv[], char *const envp[]);
pid_t waitpid(pid_t pid, int *wstatus, int options);

// 信号处理
int kill(pid_t pid, int sig);
sighandler_t signal(int sig, sighandler_t handler);

// 示例：创建子进程
pid_t child_pid = fork();
if (child_pid == 0) {
    // 子进程
    execl("/bin/ls", "ls", "-l", NULL);
    exit(1);  // 如果exec失败
} else if (child_pid > 0) {
    // 父进程
    waitpid(child_pid, NULL, 0);
}
```

### 网络系统调用

```c
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

// 网络通信
int socket(int domain, int type, int protocol);
int bind(int sockfd, const struct sockaddr *addr, socklen_t addrlen);
int listen(int sockfd, int backlog);
int accept(int sockfd, struct sockaddr *addr, socklen_t *addrlen);
ssize_t send(int sockfd, const void *buf, size_t len, int flags);
ssize_t recv(int sockfd, void *buf, size_t len, int flags);

// 示例：TCP服务器
int create_tcp_server(int port) {
    int sockfd = socket(AF_INET, SOCK_STREAM, 0);
    
    struct sockaddr_in addr = {
        .sin_family = AF_INET,
        .sin_port = htons(port),
        .sin_addr.s_addr = INADDR_ANY
    };
    
    bind(sockfd, (struct sockaddr*)&addr, sizeof(addr));
    listen(sockfd, 10);
    return sockfd;
}
```

## Shell 编程

### 基础语法

```bash
#!/bin/bash

# 变量定义和使用
name="Linux"
echo "Hello, $name!"

# 条件判断
if [ -f "/etc/passwd" ]; then
    echo "文件存在"
elif [ -d "/etc" ]; then
    echo "目录存在"
else
    echo "都不存在"
fi

# 循环处理
for file in *.txt; do
    echo "处理文件: $file"
done

# 函数定义
create_backup() {
    local src=$1
    local dst="${src}.bak"
    cp "$src" "$dst"
    echo "备份创建: $dst"
}
```

### 高级脚本技巧

```bash
#!/bin/bash

# 错误处理
set -euo pipefail

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> /var/log/myscript.log
}

# 信号处理
cleanup() {
    log "收到中断信号，正在清理..."
    rm -f /tmp/tempfile.*
    exit 0
}
trap cleanup SIGINT SIGTERM

# 进程锁
LOCKFILE="/var/run/myscript.lock"
if [ -e "$LOCKFILE" ]; then
    echo "脚本已在运行" >&2
    exit 1
fi
echo $$ > "$LOCKFILE"

# 确保锁文件被删除
trap 'rm -f "$LOCKFILE"' EXIT
```

## 系统管理

### 用户和权限管理

```bash
# 用户管理
useradd -m -s /bin/bash newuser
usermod -aG wheel newuser
userdel -r olduser

# 权限管理
chmod 755 script.sh
chown user:group file.txt
chmod u+s executable  # 设置SUID位

# ACL高级权限
setfacl -m u:username:rwx /path/to/dir
getfacl /path/to/dir
```

### 软件包管理

**APT (Debian/Ubuntu):**

```bash
# 更新软件源
apt update

# 安装软件
apt install nginx

# 搜索软件包
apt search python3

# 卸载软件
apt remove package-name
apt autoremove
```

**YUM (RHEL/CentOS):**

```bash
# 安装软件
yum install httpd

# 更新系统
yum update

# 管理服务
systemctl start httpd
systemctl enable httpd
```

## 网络配置

### 网络接口管理

```bash
# 查看网络接口
ip addr show
ip link show

# 配置IP地址
ip addr add 192.168.1.100/24 dev eth0
ip route add default via 192.168.1.1

# 网络诊断
ping -c 4 google.com
traceroute google.com
netstat -tuln
ss -tuln
```

### 防火墙配置

```bash
# iptables 基础配置
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -P INPUT DROP

# firewalld (现代Linux)
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

## 性能监控

### 系统资源监控

```bash
# 实时系统监控
top
htop

# 内存使用情况
free -h
cat /proc/meminfo

# 磁盘使用情况
df -h
du -sh /path/to/dir

# I/O 监控
iostat -x 1
iotop
```

### 进程和性能分析

```bash
# 进程监控
ps aux --sort=-%cpu | head -10
ps aux --sort=-%mem | head -10

# 系统负载
uptime
cat /proc/loadavg

# 性能分析工具
perf record -g ./program
perf report

# 跟踪系统调用
strace -f -o trace.log ./program
```

## 内核模块

### 模块开发基础

```c
#include <linux/init.h>
#include <linux/module.h>
#include <linux/kernel.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Your Name");
MODULE_DESCRIPTION("A simple Linux driver");

static int __init hello_init(void) {
    printk(KERN_INFO "Hello, Linux Kernel!\n");
    return 0;
}

static void __exit hello_exit(void) {
    printk(KERN_INFO "Goodbye, Linux Kernel!\n");
}

module_init(hello_init);
module_exit(hello_exit);
```

**Makefile:**

```makefile
obj-m += hello.o

KDIR := /lib/modules/$(shell uname -r)/build

all:
	make -C $(KDIR) M=$(PWD) modules

clean:
	make -C $(KDIR) M=$(PWD) clean
```

### 字符设备驱动

```c
#include <linux/fs.h>
#include <linux/cdev.h>

static int device_open(struct inode *inode, struct file *file) {
    printk(KERN_INFO "设备被打开\n");
    return 0;
}

static ssize_t device_read(struct file *filp, char __user *buffer, 
                          size_t length, loff_t *offset) {
    const char *message = "Hello from kernel!\n";
    size_t message_len = strlen(message);
    
    if (*offset >= message_len)
        return 0;
        
    if (length > message_len - *offset)
        length = message_len - *offset;
        
    if (copy_to_user(buffer, message + *offset, length))
        return -EFAULT;
        
    *offset += length;
    return length;
}

static struct file_operations fops = {
    .open = device_open,
    .read = device_read,
};
```

## 容器技术

### Docker 基础

```dockerfile
# Dockerfile 示例
FROM ubuntu:20.04

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

COPY . /app
WORKDIR /app

RUN pip3 install -r requirements.txt

EXPOSE 8000
CMD ["python3", "app.py"]
```

**容器管理命令：**

```bash
# 构建镜像
docker build -t myapp .

# 运行容器
docker run -d -p 8000:8000 --name myapp-container myapp

# 容器管理
docker ps
docker logs myapp-container
docker exec -it myapp-container bash
```

### 系统调用封装

```c
// 使用命名空间进行进程隔离
#define _GNU_SOURCE
#include <sched.h>
#include <sys/wait.h>
#include <sys/mount.h>

int create_container() {
    int container_pid = clone(
        container_main,
        container_stack + STACK_SIZE,
        CLONE_NEWPID | CLONE_NEWNS | CLONE_NEWNET | SIGCHLD,
        NULL
    );
    
    return container_pid;
}

int container_main(void *arg) {
    // 设置主机名
    sethostname("container", 9);
    
    // 挂载proc文件系统
    mount("proc", "/proc", "proc", 0, NULL);
    
    // 执行容器内的命令
    execl("/bin/bash", "/bin/bash", NULL);
    
    return 0;
}
```

## 安全机制

### SELinux 配置

```bash
# SELinux 状态管理
getenforce
setenforce 1

# 上下文管理
ls -Z /var/www/html
chcon -t httpd_sys_content_t /path/to/file

# 策略管理
semanage fcontext -a -t httpd_sys_content_t "/web(/.*)?"
restorecon -R /web
```

### 能力管理

```c
#include <sys/capability.h>

// 放弃不必要的权限
int drop_privileges() {
    cap_t caps = cap_init();
    
    // 只保留网络绑定能力
    cap_value_t cap_list[] = { CAP_NET_BIND_SERVICE };
    cap_set_flag(caps, CAP_EFFECTIVE, 1, cap_list, CAP_SET);
    cap_set_flag(caps, CAP_PERMITTED, 1, cap_list, CAP_SET);
    
    if (cap_set_proc(caps) == -1) {
        return -1;
    }
    
    cap_free(caps);
    return 0;
}
```

## 调试与诊断

### 核心转储分析

```bash
# 启用核心转储
ulimit -c unlimited
echo "/tmp/core.%e.%p" > /proc/sys/kernel/core_pattern

# 分析核心转储
gdb /path/to/program /tmp/core.program.1234

# 在GDB中常用命令
bt          # 查看调用栈
info locals # 查看局部变量
print var   # 打印变量值
```

### 系统日志分析

```bash
# 查看系统日志
journalctl -f
tail -f /var/log/syslog

# 日志过滤
journalctl --since "2024-01-01" --until "2024-01-02"
journalctl -u nginx.service

# 自定义日志
logger -p local0.info "自定义日志消息"
```