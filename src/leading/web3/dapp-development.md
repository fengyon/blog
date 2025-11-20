# DApp 开发

## 什么是 DApp？

DApp (去中心化应用) 是在去中心化网络 (如区块链) 上运行的应用，结合了智能合约和前端用户界面。与传统应用依赖中心化服务器不同，DApp 的后端逻辑通过部署在区块链上的智能合约执行，数据存储在分布式网络中，从而消除单点控制并增强透明度和抗审查性。

DApp 的基本交互流程可以简化表示如下：
```
用户界面 (前端) -- 发起交易 --> 钱包 (签名) -- 广播 --> 区块链网络 (智能合约处理并更新状态)
```
## DApp 的技术架构

典型的 DApp 采用分层设计，核心包括：

**前端界面**：用户直接交互的网页或应用，通常使用传统 Web 技术 (如 JavaScript、HTML、CSS) 构建。

**智能合约**：部署在区块链上的业务逻辑，处理核心操作。例如，在以太坊上，合约通常用 Solidity 编写。
```
合约状态 (链上存储) <--> 合约函数 (逻辑) <--> 触发事件
```

**区块链连接层**：前端通过特定的 JavaScript 库 (如 Ethers.js、Web3.js) 与区块链网络交互。这些库充当桥梁，将前端的操作指令转换为区块链能理解的交易。

**去中心化存储**：为应对区块链存储成本高的问题，静态前端资源、用户数据等可存储在去中心化存储系统 (如 IPFS) 中。
```
前端资源 (HTML, CSS, JS) -- 存储于 --> IPFS 网络 -- 通过内容标识符 (CID) 访问
```

## DApp 的核心开发流程

### 需求分析与架构设计
开发始于明确的需求分析和目标设定，这决定了后续的设计边界与优先级。需要围绕目标用户和真实场景锁定核心功能，并建立需求变更治理机制。随后进行架构设计，绘制高层系统图，明确前端、后端、合约的职责边界，并评估链上调用次数和 Gas 成本。

### 智能合约开发
智能合约是 DApp 的核心，其开发需遵循可预测的行为与稳定的状态机原则。编写时应优先采用可读性强的实现，并附带充分注释。常用的安全模式包括防重放、可重入保护和原子性事务。在代码层面，要引入自动化静态分析、单元测试和覆盖率检查，确保变更可控。

### 前端集成与交互实现
前端对接是用户体验的关键环节，需通过钱包连接、签名流程和状态更新实现流畅交互。在前后端协作中，应约定统一的事件和错误处理机制，确保可追踪性。把合约事件映射为前端状态，可以减少用户等待时间。

### 测试、部署与运维自动化
测试、部署与运维是提升 DApp 可靠性的重要环节。先在测试网络全面验证功能、边界与安全性。再通过 CI/CD 管道实现从提交到上线的自动化流程。对生产环境设置监控、日志和告警，以缩短故障恢复时间。

## 常用开源库与 API 示例

### Ethers.js

Ethers.js 是一个轻量级、功能强大且设计现代的 JavaScript 库，专注于提供一个安全、易用且可扩展的以太坊钱包和 DApp 交互界面。它对 TypeScript 的支持非常完善，提供准确的类型定义。

以下是一些常用 API 的 ESM 格式使用示例：

**连接钱包并获取账户地址**
```javascript
import { BrowserProvider } from 'ethers';

// 检测浏览器中的钱包（如 MetaMask）
const provider = new BrowserProvider(window.ethereum);
// 请求连接账户
const signer = await provider.getSigner();
// 获取账户地址
const address = await signer.getAddress();
console.log(`Connected account: ${address}`);
```

**读取链上数据 (例如获取 ETH 余额)**
```javascript
import { BrowserProvider } from 'ethers';

const provider = new BrowserProvider(window.ethereum);
// 获取指定地址的 ETH 余额
const balance = await provider.getBalance("0x742E4fB0d55b3526A5C0f42b5aA7C68F52752B6D");
// 将余额从 Wei 转换为 ETH
console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
```

**与智能合约交互 (以读取 ERC-20 代币余额为例)**
```javascript
import { BrowserProvider, Contract } from 'ethers';
// ERC-20 代币标准的 ABI（部分函数）
const erc20Abi = [
  "function balanceOf(address owner) view returns (uint256)",
  "function symbol() view returns (string)"
];

const provider = new BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// 创建合约实例，连接到一个 USDT 合约地址
const contract = new Contract("0xdAC17F958D2ee523a2206206994597C13D831ec7", erc20Abi, signer);

// 调用合约的 symbol 函数
const symbol = await contract.symbol();
// 调用合约的 balanceOf 函数查询指定地址余额
const balance = await contract.balanceOf(await signer.getAddress());
console.log(`Balance: ${ethers.formatUnits(balance, 6)} ${symbol}`); // USDT 通常使用 6 位小数
```

**发送交易 (以转账 ETH 为例)**
```javascript
import { BrowserProvider } from 'ethers';

const provider = new BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// 构建交易对象
const transaction = {
  to: "0x742E4fB0d55b3526A5C0f42b5aA7C68F52752B6D",
  value: ethers.parseEther("0.01") // 转账 0.01 ETH
};

// 发送交易
const txResponse = await signer.sendTransaction(transaction);
console.log(`Transaction hash: ${txResponse.hash}`);

// 等待交易被打包
const receipt = await txResponse.wait();
console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
```

### Web3.js

Web3.js 是以太坊官方推荐的 JavaScript 库，拥有悠久的历史和庞大的用户基数。它提供了与以太坊节点交互的几乎所有功能。

以下是一些常用 API 的 ESM 格式使用示例：

**初始化并连接提供商**
```javascript
import Web3 from 'web3';

// 假设使用浏览器注入的 MetaMask 提供商
const web3 = new Web3(window.ethereum);
// 请求账户访问
await window.ethereum.request({ method: 'eth_requestAccounts' });
```

**获取账户信息及余额**
```javascript
import Web3 from 'web3';
const web3 = new Web3(window.ethereum);

// 获取账户列表
const accounts = await web3.eth.getAccounts();
const currentAccount = accounts[0];
console.log(`Connected account: ${currentAccount}`);

// 获取 ETH 余额
const balanceWei = await web3.eth.getBalance(currentAccount);
const balanceEth = web3.utils.fromWei(balanceWei, 'ether');
console.log(`Balance: ${balanceEth} ETH`);
```

**与智能合约交互 (以写入合约为示例)**
```javascript
import Web3 from 'web3';
const web3 = new Web3(window.ethereum);

// 合约 ABI 和地址
const contractAbi = [ /* ... 合约 ABI ... */ ];
const contractAddress = "0x...";

// 创建合约实例
const myContract = new web3.eth.Contract(contractAbi, contractAddress);
const accounts = await web3.eth.getAccounts();

// 调用合约的 setMinter 函数（需要消耗 Gas 的写入操作）
const receipt = await myContract.methods
  .setMinter(accounts[1], true)
  .send({ from: accounts[0] }); // 指定发送交易的地址

console.log(`Transaction receipt: ${receipt.transactionHash}`);
```

### OpenZeppelin 合约库

OpenZeppelin 是一个广泛使用的、开源的智能合约库，专门为以太坊等 EVM 兼容链提供安全、可复用的合约组件。它是构建去中心化应用 (DApp) 和协议时的“黄金标准”。

**在 Solidity 智能合约中使用 OpenZeppelin**
```javascript
// 这是一个 Solidity 合约示例，而非 JavaScript
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// 导入 OpenZeppelin 的 ERC-20 合约
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    // 调用 ERC20 父合约的构造函数
    constructor() ERC20("MyToken", "MTK") {
        // 向部署者地址铸造 1000 个代币
        _mint(msg.sender, 1000 * 10 ** decimals());
    }
}
```

**在前端使用 OpenZeppelin 合约的 ABI**
如果你的合约继承了 OpenZeppelin 的合约，你可以在前端像与任何其他合约一样与之交互。
```javascript
import { Contract, BrowserProvider } from 'ethers';
// 导入你编译后的合约 ABI 文件
import MyTokenAbi from './artifacts/contracts/MyToken.sol/MyToken.json' assert { type: 'json' };

const provider = new BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// 你的合约地址
const myTokenAddress = "0x...";
// 创建合约实例
const myTokenContract = new Contract(myTokenAddress, MyTokenAbi.abi, signer);

// 现在可以调用你的 MyToken 合约中的函数了，例如 balanceOf
const userBalance = await myTokenContract.balanceOf(await signer.getAddress());
```