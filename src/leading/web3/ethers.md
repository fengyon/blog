# ethers.js

ethers.js 是一个功能强大且轻量级的 JavaScript 库，专为与以太坊区块链及其生态系统进行交互而设计。它提供了一套完整的工具，帮助开发者连接以太坊网络、管理钱包、签署交易，并与智能合约进行无缝交互。其模块化架构和直观的 API 设计使其成为构建去中心化应用 (DApp) 的理想选择。

## ethers.js 核心特点

### 轻量级与模块化

ethers.js 采用轻量级设计，相较于其他同类库，其包体积更小，这有助于提升 DApp 的加载性能。其模块化架构允许开发者仅引入项目所需的组件，例如钱包管理、合约交互或提供者 (Provider) 连接，从而优化最终应用体积。

### 安全的钱包管理

库提供了强大的工具来创建、保护和管理加密货币钱包。ethers.js 支持多种钱包类型，包括助记词、JSON 密钥库和私钥，并强调私钥在安全环境中的存储，确保用户资产安全。

### 灵活的提供者系统

提供者 (Provider) 是与以太坊网络连接的桥梁。ethers.js 支持通过多种方式连接，包括标准的 JSON-RPC 接口以及 Infura、Alchemy 等流行服务节点。这使得它能够灵活地适应不同的开发和生产环境。

### 完整的类型支持

ethers.js 原生支持 TypeScript，提供了完善的类型定义。这能够在开发过程中实现更好的类型检查和代码提示，提升代码质量和开发效率。

## 安装与配置

### 环境要求

在开始之前，请确保你的开发环境满足以下要求：

- Node.js 版本 12 或以上
- npm、yarn、pnpm 或 bun 等包管理器

### 安装 ethers.js

你可以使用你喜欢的包管理器来安装 ethers.js。以下是使用 npm 安装的命令：

```bash
npm install ethers
```

### 项目结构

一个典型的使用 ethers.js 的项目目录结构如下：

```
your-project/
├── node_modules/
├── src/
│   ├── scripts/
│   │   ├── provider.js
│   │   ├── wallet.js
│   │   └── contract.js
│   └── utils/
├── package.json
└── README.md
```

## 核心概念与架构

### 提供者 (Provider)

提供者是一个抽象，用于连接以太坊网络并执行查询操作。它负责与以太坊节点通信，但不管理私钥。示意图如下：

```
你的DApp -> Provider -> 以太坊节点 (如 Infura、Alchemy 或本地节点)
```

### 签名者 (Signer)

签名者是一个对象，代表一个能够对交易和消息进行签名的以太坊账户。它封装了私钥，并提供了签名功能。示意图如下：

```
Signer (持有私钥) -> 对交易签名 -> 通过 Provider 发送到网络
```

### 合约 (Contract)

合约对象是与部署在区块链上的智能合约进行交互的接口。它通过合约地址和应用程序二进制接口 (ABI) 来定义可调用的函数和事件。

## 常用开源库与 API

### 提供者 API

#### JsonRpcProvider

`JsonRpcProvider` 用于连接一个指定的 JSON-RPC 节点，这可以是本地节点，也可以是 Infura、Alchemy 等提供的服务端点。

```javascript
import { ethers } from 'ethers'

// 使用 Infura 作为提供者，连接到 Sepolia 测试网
// 替换 'your-infura-project-id' 为你的实际 Project ID
const provider = new ethers.JsonRpcProvider(
  'https://sepolia.infura.io/v3/your-infura-project-id'
)

// 查询网络信息
const network = await provider.getNetwork()
console.log('当前网络:', network.name)

// 查询特定地址的 ETH 余额
const address = '0x742E4D6c9F1B2B5c44760d0447c43553e4543965'
const balance = await provider.getBalance(address)
console.log('余额:', ethers.formatEther(balance), 'ETH')
```

#### BrowserProvider

在浏览器环境中，如果用户安装了 MetaMask 等钱包，可以使用 `BrowserProvider` 来连接。

```javascript
import { ethers } from 'ethers'

// 检查 window.ethereum 是否存在（通常由 MetaMask 等钱包注入）
if (typeof window.ethereum !== 'undefined') {
  // 创建 BrowserProvider 实例
  const provider = new ethers.BrowserProvider(window.ethereum)

  // 请求用户授权连接账户
  const accounts = await provider.send('eth_requestAccounts', [])
  const signer = await provider.getSigner()
  console.log('已连接账户:', accounts[0])
} else {
  console.log('请安装 MetaMask!')
}
```

### 钱包 API

#### 创建钱包

ethers.js 提供了多种创建钱包的方式，包括随机生成、从助记词恢复或从加密 JSON 文件导入。

```javascript
import { ethers } from 'ethers'

// 随机生成一个新钱包（主要用于测试环境）
const randomWallet = ethers.Wallet.createRandom()
console.log('地址:', randomWallet.address)
console.log('私钥:', randomWallet.privateKey)
console.log('助记词:', randomWallet.mnemonic.phrase)

// 通过私钥创建钱包
const privateKey =
  '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
const walletFromPrivateKey = new ethers.Wallet(privateKey)

// 通过助记词创建钱包
const mnemonic =
  'legal winner thank year wave sausage worth useful legal winner thank yellow'
const walletFromMnemonic = ethers.Wallet.fromPhrase(mnemonic)
```

#### 连接钱包与提供者

创建钱包实例后，可以将其与提供者连接，以便与区块链进行交互。

```javascript
import { ethers } from 'ethers'

// 创建提供者和钱包
const provider = new ethers.JsonRpcProvider(
  'https://sepolia.infura.io/v3/your-infura-project-id'
)
const wallet = new ethers.Wallet(
  '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  provider
)

// 发送交易（示例：转账 ETH）
async function sendTransaction() {
  const transaction = {
    to: '0x742E4D6c9F1B2B5c44760d0447c43553e4543965',
    value: ethers.parseEther('0.001'),
  }

  // 发送交易
  const txResponse = await wallet.sendTransaction(transaction)
  console.log('交易已发送，哈希:', txResponse.hash)

  // 等待交易确认
  const receipt = await txResponse.wait()
  console.log('交易已确认，所在区块:', receipt.blockNumber)
}

sendTransaction()
```

### 合约 API

#### 创建合约实例

要与智能合约交互，首先需要创建合约实例，这需要合约地址和 ABI。

```javascript
import { ethers } from 'ethers'

// 示例：ERC-20 代币合约的部分 ABI
const erc20Abi = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint amount)',
]

// 合约地址（这里以 DAI 在 Sepolia 测试网为例）
const contractAddress = '0x7AF17bA886A5EdE2cB8eE946c7b3f0e1C1A84768'

// 创建提供者和签名者
const provider = new ethers.JsonRpcProvider(
  'https://sepolia.infura.io/v3/your-infura-project-id'
)
const signer = new ethers.Wallet(
  '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  provider
)

// 创建合约实例
const contract = new ethers.Contract(contractAddress, erc20Abi, signer)

// 如果只需要读取数据，不需要签名，可以不传入 signer
const readOnlyContract = new ethers.Contract(
  contractAddress,
  erc20Abi,
  provider
)
```

#### 与合约交互

创建合约实例后，可以调用其方法或监听事件。

```javascript
import { ethers } from 'ethers'

// 假设已有合约实例
const contract = new ethers.Contract(contractAddress, erc20Abi, signer)

async function interactWithContract() {
  try {
    // 调用 view 函数（只读，不消耗 Gas）
    const name = await contract.name()
    const symbol = await contract.symbol()
    const decimals = await contract.decimals()
    console.log(`代币信息: ${name} (${symbol})，精度: ${decimals}`)

    // 查询余额
    const address = '0x742E4D6c9F1B2B5c44760d0447c43553e4543965'
    const balance = await contract.balanceOf(address)
    console.log('余额:', ethers.formatUnits(balance, decimals), symbol)

    // 调用状态修改函数（需要签名并消耗 Gas）
    // 注意：此操作会真实发送交易并改变链上状态
    const toAddress = '0x1234567890123456789012345678901234567890'
    const amount = ethers.parseUnits('1.5', decimals) // 转账 1.5 个代币

    const tx = await contract.transfer(toAddress, amount)
    console.log('转账交易已发送，哈希:', tx.hash)

    const receipt = await tx.wait()
    console.log('转账成功，所在区块:', receipt.blockNumber)
  } catch (error) {
    console.error('交互出错:', error)
  }
}

interactWithContract()
```

#### 监听合约事件

许多智能合约在状态改变时会发出事件，你可以监听这些事件以实时更新你的应用。

```javascript
import { ethers } from 'ethers'

// 假设已有合约实例
const contract = new ethers.Contract(contractAddress, erc20Abi, provider)

// 监听 Transfer 事件
contract.on('Transfer', (from, to, amount, event) => {
  console.log(`转账事件: 从 ${from} 到 ${to}, 金额: ${amount}`)
  console.log('完整事件日志:', event)
})

// 也可以使用过滤器来监听特定地址的转账
const filter = contract.filters.Transfer(
  null,
  '0x742E4D6c9F1B2B5c44760d0447c43553e4543965'
)
contract.on(filter, (from, to, amount, event) => {
  console.log(`有代币转入目标地址: 从 ${from} 转入 ${amount} 个代币`)
})

// 在应用退出或需要清理时，移除监听器
// contract.removeAllListeners();
```

### 工具函数 API

ethers.js 提供了一系列实用的工具函数，用于处理数据格式转换、哈希计算和编码等常见任务。

```javascript
import { ethers } from 'ethers'

// 单位转换
console.log(ethers.formatEther('1000000000000000000')) // 1.0 (wei 转换为 ETH)
console.log(ethers.parseEther('1.5')) // 1500000000000000000n (ETH 转换为 wei，返回 BigInt)

// 格式化单位（适用于 ERC-20 代币）
console.log(ethers.formatUnits('1500000', 6)) // 1.5 (假设代币精度为 6)
console.log(ethers.parseUnits('2.5', 18)) // 2500000000000000000n

// 哈希计算
const message = 'Hello, Ethereum!'
const messageHash = ethers.hashMessage(message)
console.log('消息哈希:', messageHash)

// 地址工具
const address = '0x742e4d6c9f1b2b5c44760d0447c43553e4543965'
console.log('地址校验和:', ethers.getAddress(address)) // 输出大小写正确的校验和格式

// 编码与解码
const data = ethers.AbiCoder.defaultAbiCoder().encode(
  ['string', 'uint256'],
  ['Hello', 42]
)
console.log('编码数据:', data)
```

## 实用技巧与最佳实践

### 错误处理

在与区块链交互时，适当的错误处理至关重要。

```javascript
import { ethers } from 'ethers'

async function safeTransaction() {
  try {
    const provider = new ethers.JsonRpcProvider(
      'https://sepolia.infura.io/v3/your-infura-project-id'
    )
    const wallet = new ethers.Wallet(
      '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      provider
    )

    // 在发送交易前检查余额是否足够支付转账金额和 Gas 费
    const balance = await provider.getBalance(wallet.address)
    const requiredBalance = ethers.parseEther('0.001')

    if (balance < requiredBalance) {
      throw new Error(
        `余额不足。当前余额: ${ethers.formatEther(
          balance
        )} ETH，需要至少: ${ethers.formatEther(requiredBalance)} ETH`
      )
    }

    const tx = await wallet.sendTransaction({
      to: '0x742E4D6c9F1B2B5c44760d0447c43553e4543965',
      value: ethers.parseEther('0.001'),
    })

    return await tx.wait()
  } catch (error) {
    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.error('错误: 账户余额不足以支付交易')
    } else if (error.code === 'NETWORK_ERROR') {
      console.error('错误: 网络连接问题，请检查提供者设置')
    } else if (error.code === 'CALL_EXCEPTION') {
      console.error('错误: 合约调用失败，可能函数不存在或参数错误')
    } else {
      console.error('未知错误:', error)
    }
  }
}

safeTransaction()
```

### Gas 管理

合理设置 Gas 价格和 Gas 限制有助于交易更快确认并控制成本。

```javascript
import { ethers } from 'ethers'

async function sendTransactionWithGasOptions() {
  const provider = new ethers.JsonRpcProvider(
    'https://sepolia.infura.io/v3/your-infura-project-id'
  )
  const wallet = new ethers.Wallet(
    '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    provider
  )

  // 获取当前 Gas 价格
  const feeData = await provider.getFeeData()
  console.log(
    '当前 Gas 价格:',
    ethers.formatUnits(feeData.gasPrice, 'gwei'),
    'Gwei'
  )

  // 估算 Gas 限制
  const transaction = {
    to: '0x742E4D6c9F1B2B5c44760d0447c43553e4543965',
    value: ethers.parseEther('0.001'),
  }
  const estimatedGas = await provider.estimateGas(transaction)
  console.log('估算的 Gas 限制:', estimatedGas.toString())

  // 发送交易，自定义 Gas 设置
  const tx = await wallet.sendTransaction({
    ...transaction,
    gasLimit: estimatedGas, // 使用估算值，或稍增加一些余量
    gasPrice: feeData.gasPrice, // 使用当前网络 Gas 价格
    // 对于 EIP-1559 交易，可以设置 maxFeePerGas 和 maxPriorityFeePerGas
    // maxFeePerGas: feeData.maxFeePerGas,
    // maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
  })

  return await tx.wait()
}

sendTransactionWithGasOptions()
```
