# wagmi & viem

wagmi 和 viem 构成了现代 Web3 开发的强大工具组合。wagmi 提供了一套完整的 React Hooks，用于简化以太坊交互，而 viem 则是一个类型安全、高性能的以太坊 TypeScript 接口库。两者结合为开发者提供了比传统 Web3.js 和 ethers.js 更优的开发体验。

## wagmi & viem 核心特点

### 现代化架构

wagmi 采用 React Hooks 设计模式，与现代 React 开发范式完美契合。viem 提供低级别的以太坊交互能力，两者分工明确，协同高效。

示意图：

```
传统架构: DApp -> Web3.js/ethers.js -> 以太坊节点
现代架构: DApp -> wagmi(Hooks) -> viem(核心逻辑) -> 以太坊节点
```

### 类型安全与 TypeScript 原生支持

viem 从一开始就为 TypeScript 设计，提供完整的类型推断。wagmi 能够从 ABI 自动推断类型，大幅减少运行时错误。

### 高性能与轻量级

viem 相比 ethers.js 具有更小的打包体积和更快的执行速度。内部优化包括缓存、重复请求降重和批量处理。

### 开发者体验优化

wagmi 提供开箱即用的功能：自动连接钱包、多链支持、实时状态同步。开发服务器支持热重载，加速开发流程。

## 安装与项目配置

### 环境要求

确保你的环境满足以下要求：

- Node.js 版本 18 或以上
- React 16.8+ 或支持 Hooks 的框架
- 现代包管理器 (npm，yarn，pnpm，bun)

### 安装依赖

```bash
# 使用 npm
npm install wagmi viem @tanstack/react-query

# 使用 yarn
yarn add wagmi viem @tanstack/react-query

# 使用 pnpm
pnpm add wagmi viem @tanstack/react-query
```

### 基础配置

创建 wagmi 配置文件：

```javascript
// lib/wagmi.config.js
import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    injected(),
    walletConnect({
      projectId: 'your-walletconnect-project-id',
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true, // 启用 SSR 支持
})
```

### React 应用集成

```javascript
// App.jsx
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './lib/wagmi.config.js'

const queryClient = new QueryClient()

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <YourAppComponent />
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
```

## wagmi 核心 Hooks 使用

### 钱包连接管理

#### useConnect - 连接钱包

```javascript
// hooks/useWalletConnect.js
import { useConnect } from 'wagmi'

export function WalletConnector() {
  const { connect, connectors, error, status } = useConnect()

  return (
    <div>
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          onClick={() => connect({ connector })}
          disabled={!connector.ready}>
          连接 {connector.name}
        </button>
      ))}
      {error && <div>错误: {error.message}</div>}
    </div>
  )
}
```

#### useAccount - 账户信息

```javascript
// hooks/useAccountInfo.js
import { useAccount, useEnsName, useEnsAvatar } from 'wagmi'

export function AccountInfo() {
  const { address, isConnected, chain } = useAccount()
  const { data: ensName } = useEnsName({ address })
  const { data: ensAvatar } = useEnsAvatar({ name: ensName })

  if (!isConnected) return <div>未连接钱包</div>

  return (
    <div>
      {ensAvatar && <img src={ensAvatar} alt="ENS Avatar" />}
      <div>{ensName || address}</div>
      <div>网络: {chain?.name}</div>
    </div>
  )
}
```

#### useDisconnect - 断开连接

```javascript
// hooks/useDisconnectButton.js
import { useDisconnect } from 'wagmi'

export function DisconnectButton() {
  const { disconnect } = useDisconnect()

  return <button onClick={() => disconnect()}>断开钱包连接</button>
}
```

### 网络与链管理

#### useSwitchChain - 切换网络

```javascript
// hooks/useNetworkSwitcher.js
import { useSwitchChain, useAccount } from 'wagmi'

export function NetworkSwitcher() {
  const { chains, switchChain, status } = useSwitchChain()
  const { chain } = useAccount()

  return (
    <div>
      <select
        value={chain?.id}
        onChange={(e) => switchChain({ chainId: Number(e.target.value) })}>
        {chains.map((network) => (
          <option key={network.id} value={network.id}>
            {network.name}
          </option>
        ))}
      </select>
      <div>状态: {status}</div>
    </div>
  )
}
```

### 资产与余额查询

#### useBalance - 查询余额

```javascript
// hooks/useTokenBalance.js
import { useBalance, useAccount } from 'wagmi'

export function TokenBalance({ tokenAddress }) {
  const { address } = useAccount()
  const { data, error, isLoading } = useBalance({
    address,
    token: tokenAddress,
  })

  if (isLoading) return <div>查询中...</div>
  if (error) return <div>错误: {error.message}</div>

  return (
    <div>
      余额: {data?.formatted} {data?.symbol}
    </div>
  )
}
```

## viem 核心功能使用

### 客户端创建与配置

#### 公共客户端 (Public Client)

```javascript
// lib/viemClient.js
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
})
```

#### 钱包客户端 (Wallet Client)

```javascript
// lib/walletClient.js
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

// 浏览器环境
export const walletClient = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})
```

### 区块链数据读取

#### 查询区块信息

```javascript
// services/blockService.js
import { publicClient } from '../lib/viemClient.js'

export async function getBlockData() {
  try {
    // 获取最新区块号
    const blockNumber = await publicClient.getBlockNumber()

    // 获取区块详情
    const block = await publicClient.getBlock({
      blockNumber,
    })

    // 获取 Gas 价格
    const gasPrice = await publicClient.getGasPrice()

    return {
      blockNumber,
      block,
      gasPrice,
    }
  } catch (error) {
    console.error('获取区块数据失败:', error)
    throw error
  }
}
```

#### 交易查询

```javascript
// services/transactionService.js
import { publicClient } from '../lib/viemClient.js'

export async function getTransaction(txHash) {
  try {
    const transaction = await publicClient.getTransaction({
      hash: txHash,
    })

    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash,
    })

    return { transaction, receipt }
  } catch (error) {
    console.error('获取交易数据失败:', error)
    throw error
  }
}
```

### 交易发送与签名

#### 发送 ETH 交易

```javascript
// services/transactionService.js
import { walletClient } from '../lib/walletClient.js'

export async function sendETH(toAddress, amount) {
  try {
    const [account] = await walletClient.getAddresses()

    const hash = await walletClient.sendTransaction({
      account,
      to: toAddress,
      value: BigInt(amount),
    })

    return hash
  } catch (error) {
    console.error('发送交易失败:', error)
    throw error
  }
}
```

#### 消息签名

```javascript
// services/signatureService.js
import { walletClient } from '../lib/walletClient.js'

export async function signMessage(message) {
  try {
    const [account] = await walletClient.getAddresses()

    const signature = await walletClient.signMessage({
      account,
      message,
    })

    return signature
  } catch (error) {
    console.error('签名失败:', error)
    throw error
  }
}
```

## 智能合约交互

### ABI 定义与合约实例

#### ERC-20 合约交互

```javascript
// contracts/erc20Contract.js
import { createPublicClient, http, parseAbi } from 'viem'
import { mainnet } from 'viem/chains'

const erc20Abi = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
])

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})

export async function getERC20Info(tokenAddress) {
  const [name, symbol, decimals, totalSupply] = await Promise.all([
    client.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'name',
    }),
    client.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'symbol',
    }),
    client.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'decimals',
    }),
    client.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'totalSupply',
    }),
  ])

  return { name, symbol, decimals, totalSupply }
}
```

### 使用 wagmi 进行合约读写

#### useReadContract - 读取合约数据

```javascript
// hooks/useTokenData.js
import { useReadContract } from 'wagmi';

const erc20Abi = [...]; // 同上

export function useTokenData(tokenAddress) {
  const { data: name } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'name',
  });

  const { data: symbol } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'symbol',
  });

  const { data: balance } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: ['0x...'], // 目标地址
  });

  return { name, symbol, balance };
}
```

#### useWriteContract - 写入合约数据

```javascript
// hooks/useTokenTransfer.js
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

const erc20Abi = [...]; // 同上

export function useTokenTransfer(tokenAddress) {
  const {
    writeContract,
    data: hash,
    error,
    isPending
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const transfer = (to, amount) => {
    writeContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [to, BigInt(amount)],
    });
  };

  return {
    transfer,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}
```

## 高级功能与模式

### 事件监听

#### 合约事件监听

```javascript
// hooks/useContractEvents.js
import { useWatchContractEvent } from 'wagmi';

const erc20Abi = [...]; // 同上

export function useTokenTransfers(tokenAddress) {
  useWatchContractEvent({
    address: tokenAddress,
    abi: erc20Abi,
    eventName: 'Transfer',
    onLogs: (logs) => {
      console.log('新的转账事件:', logs);
      // 处理转账事件
    },
  });
}
```

### 批量操作

#### 多合约调用批量查询

```javascript
// services/batchQueryService.js
import { publicClient } from '../lib/viemClient.js'

export async function batchTokenInfo(tokenAddresses) {
  const contracts = tokenAddresses
    .map((address) => [
      {
        address,
        abi: erc20Abi,
        functionName: 'name',
      },
      {
        address,
        abi: erc20Abi,
        functionName: 'symbol',
      },
      {
        address,
        abi: erc20Abi,
        functionName: 'decimals',
      },
    ])
    .flat()

  const results = await publicClient.multicall({
    contracts,
  })

  // 处理批量结果
  return tokenAddresses.map((address, index) => {
    const baseIndex = index * 3
    return {
      address,
      name: results[baseIndex].result,
      symbol: results[baseIndex + 1].result,
      decimals: results[baseIndex + 2].result,
    }
  })
}
```

### 错误处理与状态管理

#### 统一的错误处理

```javascript
// utils/errorHandler.js
export function handleWagmiError(error) {
  if (error?.name === 'ConnectorNotFoundError') {
    return '未找到钱包连接器，请安装 MetaMask 或其他兼容钱包'
  }

  if (error?.name === 'ChainNotConfiguredError') {
    return '当前网络未配置，请切换网络'
  }

  if (error?.message?.includes('user rejected')) {
    return '用户拒绝了交易请求'
  }

  if (error?.message?.includes('insufficient funds')) {
    return '余额不足，无法完成交易'
  }

  return error?.message || '未知错误发生'
}
```

## 实战示例：完整的 DApp 组件

### 钱包连接组件

```javascript
// components/ConnectWallet.jsx
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected, walletConnect } from 'wagmi/connectors'

export function ConnectWallet() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected) {
    return (
      <div>
        <div>已连接: {address}</div>
        <button onClick={() => disconnect()}>断开连接</button>
      </div>
    )
  }

  return (
    <div>
      <button onClick={() => connect({ connector: injected() })}>
        连接 MetaMask
      </button>
      <button
        onClick={() =>
          connect({
            connector: walletConnect({
              projectId: 'your-project-id',
            }),
          })
        }>
        连接 WalletConnect
      </button>
    </div>
  )
}
```

### 代币交易组件

```javascript
// components/TokenTransfer.jsx
import { useState } from 'react'
import { useAccount, useBalance } from 'wagmi'
import { useTokenTransfer } from '../hooks/useTokenTransfer.js'

export function TokenTransfer({ tokenAddress }) {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')

  const { address } = useAccount()
  const { data: balance } = useBalance({
    address,
    token: tokenAddress,
  })

  const { transfer, isPending, isConfirmed, error } =
    useTokenTransfer(tokenAddress)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (recipient && amount) {
      transfer(recipient, amount)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>接收地址:</label>
        <input
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x..."
        />
      </div>
      <div>
        <label>金额:</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
        />
      </div>
      <div>
        余额: {balance?.formatted} {balance?.symbol}
      </div>

      <button type="submit" disabled={isPending}>
        {isPending ? '发送中...' : '发送代币'}
      </button>

      {error && <div>错误: {error.message}</div>}
      {isConfirmed && <div>交易确认成功!</div>}
    </form>
  )
}
```
