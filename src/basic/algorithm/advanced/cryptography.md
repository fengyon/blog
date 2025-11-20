# 密码学算法

## 什么是密码学算法

密码学算法是保护信息安全的数学方法，通过加密、解密、签名和验证等操作确保数据的机密性、完整性和真实性。密码学是现代数字世界的基石，支撑着网络安全、数字货币和隐私保护等关键领域。

特点：
- 机密性：防止未授权访问信息内容
- 完整性：确保信息在传输过程中不被篡改
- 认证性：验证信息发送者的身份
- 不可否认性：防止发送者事后否认发送行为

示意图 (加密解密过程)：
```
明文 → [加密算法] → 密文 → [解密算法] → 明文
        ↑              ↑
       密钥           密钥
```

## 密码学基础概念

### 加密系统组成

密码系统由算法、密钥、明文、密文等核心要素构成。

特点：
- 算法公开：现代密码学遵循 Kerckhoffs 原则，安全性依赖于密钥而非算法保密
- 密钥管理：密钥的安全存储和分发至关重要
- 安全目标：实现机密性、完整性、认证性和不可否认性

```javascript
// 密码系统基础类
export class Cryptosystem {
  constructor() {
    this.algorithm = null;
    this.keySize = 0;
    this.mode = null;
  }

  // 密钥生成接口
  generateKey() {
    throw new Error('generateKey method must be implemented');
  }

  // 加密接口
  encrypt(plaintext, key) {
    throw new Error('encrypt method must be implemented');
  }

  // 解密接口
  decrypt(ciphertext, key) {
    throw new Error('decrypt method must be implemented');
  }

  // 密钥验证
  validateKey(key) {
    if (!key || key.length !== this.keySize) {
      throw new Error(`Invalid key size. Expected ${this.keySize} bytes`);
    }
    return true;
  }

  // 填充方案
  applyPadding(data, blockSize) {
    const paddingLength = blockSize - (data.length % blockSize);
    const padding = new Array(paddingLength).fill(paddingLength);
    return new Uint8Array([...data, ...padding]);
  }

  // 移除填充
  removePadding(data) {
    const paddingLength = data[data.length - 1];
    return data.slice(0, data.length - paddingLength);
  }
}
```

### 密码学分类

密码学算法根据密钥使用方式分为对称加密和非对称加密。

特点：
- 对称加密：加解密使用相同密钥，效率高但密钥分发困难
- 非对称加密：使用公钥-私钥对，解决密钥分发问题但效率较低
- 混合加密：结合两者优势，用非对称加密传输对称密钥

示意图 (密码学分类)：
```
密码学算法
├── 对称加密
│   ├── 流密码
│   │   ├── RC4
│   │   └── ChaCha20
│   └── 分组密码
│       ├── AES
│       ├── DES
│       └── 3DES
├── 非对称加密
│   ├── RSA
│   ├── ECC
│   └── ElGamal
└── 密码学哈希
    ├── SHA-256
    ├── SHA-3
    └── BLAKE2
```

## 对称加密算法

### AES 算法

高级加密标准，是目前最常用的对称加密算法。

特点：
- 分组加密：固定 128 位分组大小
- 多轮加密：根据密钥长度进行 10-14 轮变换
- 强安全性：抵抗已知密码分析攻击

```javascript
// AES加密实现
export class AES extends Cryptosystem {
  constructor(keySize = 256) {
    super();
    this.keySize = keySize; // 128, 192, 256位
    this.blockSize = 16; // 128位 = 16字节
    this.rounds = this.getRounds(keySize);
    this.algorithm = 'AES';
  }

  getRounds(keySize) {
    switch (keySize) {
      case 128: return 10;
      case 192: return 12;
      case 256: return 14;
      default: throw new Error('Invalid key size');
    }
  }

  // S盒 - 字节替换表
  static S_BOX = new Uint8Array([
    0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
    0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
    // ... 完整的S盒数据
  ]);

  // 轮常数
  static RCON = new Uint8Array([
    0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36
  ]);

  // 密钥扩展
  keyExpansion(key) {
    const keyWords = key.length / 4;
    const expandedKey = new Uint8Array(4 * 4 * (this.rounds + 1));
    expandedKey.set(key);

    for (let i = keyWords; i < 4 * (this.rounds + 1); i++) {
      let temp = expandedKey.slice(4 * (i - 1), 4 * i);
      
      if (i % keyWords === 0) {
        // 密钥扩展核心函数
        temp = this.subWord(this.rotWord(temp));
        temp[0] ^= AES.RCON[Math.floor(i / keyWords) - 1];
      } else if (keyWords > 6 && i % keyWords === 4) {
        temp = this.subWord(temp);
      }
      
      for (let j = 0; j < 4; j++) {
        expandedKey[4 * i + j] = expandedKey[4 * (i - keyWords) + j] ^ temp[j];
      }
    }
    
    return expandedKey;
  }

  // 字节替换
  subWord(word) {
    return new Uint8Array(word.map(byte => AES.S_BOX[byte]));
  }

  // 字循环
  rotWord(word) {
    return new Uint8Array([word[1], word[2], word[3], word[0]]);
  }

  // 加密单块
  encryptBlock(block, expandedKey) {
    let state = new Uint8Array(block);
    
    // 初始轮密钥加
    this.addRoundKey(state, expandedKey, 0);
    
    // 主轮次
    for (let round = 1; round < this.rounds; round++) {
      this.subBytes(state);
      this.shiftRows(state);
      this.mixColumns(state);
      this.addRoundKey(state, expandedKey, round);
    }
    
    // 最终轮
    this.subBytes(state);
    this.shiftRows(state);
    this.addRoundKey(state, expandedKey, this.rounds);
    
    return state;
  }

  // 字节替换
  subBytes(state) {
    for (let i = 0; i < 16; i++) {
      state[i] = AES.S_BOX[state[i]];
    }
  }

  // 行移位
  shiftRows(state) {
    // 第1行左移1位
    [state[1], state[5], state[9], state[13]] = [state[5], state[9], state[13], state[1]];
    // 第2行左移2位
    [state[2], state[6], state[10], state[14]] = [state[10], state[14], state[2], state[6]];
    // 第3行左移3位
    [state[3], state[7], state[11], state[15]] = [state[15], state[3], state[7], state[11]];
  }

  // 列混合
  mixColumns(state) {
    for (let i = 0; i < 4; i++) {
      const a = state.slice(i * 4, i * 4 + 4);
      state[i * 4] = this.gmul(0x02, a[0]) ^ this.gmul(0x03, a[1]) ^ a[2] ^ a[3];
      state[i * 4 + 1] = a[0] ^ this.gmul(0x02, a[1]) ^ this.gmul(0x03, a[2]) ^ a[3];
      state[i * 4 + 2] = a[0] ^ a[1] ^ this.gmul(0x02, a[2]) ^ this.gmul(0x03, a[3]);
      state[i * 4 + 3] = this.gmul(0x03, a[0]) ^ a[1] ^ a[2] ^ this.gmul(0x02, a[3]);
    }
  }

  // Galois域乘法
  gmul(a, b) {
    let p = 0;
    for (let i = 0; i < 8; i++) {
      if (b & 1) p ^= a;
      const hiBit = a & 0x80;
      a <<= 1;
      if (hiBit) a ^= 0x1b;
      b >>= 1;
    }
    return p & 0xff;
  }

  // 轮密钥加
  addRoundKey(state, expandedKey, round) {
    for (let i = 0; i < 16; i++) {
      state[i] ^= expandedKey[round * 16 + i];
    }
  }

  // 加密
  encrypt(plaintext, key) {
    this.validateKey(key);
    const expandedKey = this.keyExpansion(key);
    const blocks = this.splitIntoBlocks(plaintext);
    const ciphertext = new Uint8Array(plaintext.length);
    
    for (let i = 0; i < blocks.length; i++) {
      const encryptedBlock = this.encryptBlock(blocks[i], expandedKey);
      ciphertext.set(encryptedBlock, i * this.blockSize);
    }
    
    return ciphertext;
  }

  // 分块处理
  splitIntoBlocks(data) {
    const blocks = [];
    for (let i = 0; i < data.length; i += this.blockSize) {
      const block = new Uint8Array(this.blockSize);
      block.set(data.slice(i, i + this.blockSize));
      blocks.push(block);
    }
    return blocks;
  }
}
```

示意图 (AES 加密轮次)：
```
AES-128加密流程 (10轮):

明文块 (16字节)
↓
初始轮密钥加
↓
循环9轮:
  字节替换 (SubBytes)
  行移位 (ShiftRows) 
  列混合 (MixColumns)
  轮密钥加 (AddRoundKey)
↓
最终轮:
  字节替换
  行移位
  轮密钥加
↓
密文块

状态矩阵变化:
初始:    [s00 s01 s02 s03]
         [s10 s11 s12 s13]
         [s20 s21 s22 s23] 
         [s30 s31 s32 s33]

字节替换后: [S(s00) S(s01) S(s02) S(s03)]
          [S(s10) S(s11) S(s12) S(s13)]
          [S(s20) S(s21) S(s22) S(s23)]
          [S(s30) S(s31) S(s32) S(s33)]

行移位后:  [S(s00) S(s01) S(s02) S(s03)]
          [S(s11) S(s12) S(s13) S(s10)]
          [S(s22) S(s23) S(s20) S(s21)]
          [S(s33) S(s30) S(s31) S(s32)]
```

### 加密模式

分组密码的工作模式，定义如何对多个数据块进行加密。

特点：
- ECB 模式：简单但不安全，相同明文块产生相同密文块
- CBC 模式：使用初始化向量，每个块依赖于前一个块
- CTR 模式：将分组密码转换为流密码，支持并行加密

```javascript
// 加密模式实现
export class BlockCipherModes {
  static ECB = class {
    static encrypt(plaintext, key, cipher) {
      const blocks = cipher.splitIntoBlocks(plaintext);
      const ciphertext = new Uint8Array(plaintext.length);
      
      for (let i = 0; i < blocks.length; i++) {
        const encryptedBlock = cipher.encryptBlock(blocks[i], key);
        ciphertext.set(encryptedBlock, i * cipher.blockSize);
      }
      
      return ciphertext;
    }
  };

  static CBC = class {
    static encrypt(plaintext, key, cipher, iv) {
      if (iv.length !== cipher.blockSize) {
        throw new Error('IV must match block size');
      }
      
      const blocks = cipher.splitIntoBlocks(plaintext);
      const ciphertext = new Uint8Array(plaintext.length);
      let previousBlock = iv;
      
      for (let i = 0; i < blocks.length; i++) {
        // 与前一个密文块异或
        const xoredBlock = new Uint8Array(cipher.blockSize);
        for (let j = 0; j < cipher.blockSize; j++) {
          xoredBlock[j] = blocks[i][j] ^ previousBlock[j];
        }
        
        const encryptedBlock = cipher.encryptBlock(xoredBlock, key);
        ciphertext.set(encryptedBlock, i * cipher.blockSize);
        previousBlock = encryptedBlock;
      }
      
      return ciphertext;
    }

    static decrypt(ciphertext, key, cipher, iv) {
      const blocks = cipher.splitIntoBlocks(ciphertext);
      const plaintext = new Uint8Array(ciphertext.length);
      let previousBlock = iv;
      
      for (let i = 0; i < blocks.length; i++) {
        const decryptedBlock = cipher.decryptBlock(blocks[i], key);
        
        // 与前一个密文块异或
        const xoredBlock = new Uint8Array(cipher.blockSize);
        for (let j = 0; j < cipher.blockSize; j++) {
          xoredBlock[j] = decryptedBlock[j] ^ previousBlock[j];
        }
        
        plaintext.set(xoredBlock, i * cipher.blockSize);
        previousBlock = blocks[i];
      }
      
      return plaintext;
    }
  };

  static CTR = class {
    static encrypt(plaintext, key, cipher, nonce) {
      const blocks = cipher.splitIntoBlocks(plaintext);
      const ciphertext = new Uint8Array(plaintext.length);
      
      for (let i = 0; i < blocks.length; i++) {
        // 生成计数器值: nonce + counter
        const counter = new Uint8Array(cipher.blockSize);
        counter.set(nonce);
        this.incrementCounter(counter, i);
        
        // 加密计数器值作为密钥流
        const keyStream = cipher.encryptBlock(counter, key);
        
        // 与明文异或
        const encryptedBlock = new Uint8Array(cipher.blockSize);
        for (let j = 0; j < cipher.blockSize; j++) {
          encryptedBlock[j] = blocks[i][j] ^ keyStream[j];
        }
        
        ciphertext.set(encryptedBlock, i * cipher.blockSize);
      }
      
      return ciphertext;
    }

    static incrementCounter(counter, value) {
      // 简单的计数器递增实现
      for (let i = counter.length - 1; i >= 8; i--) {
        const sum = counter[i] + (value & 0xff);
        counter[i] = sum & 0xff;
        value = (value >> 8) + (sum >> 8);
        if (value === 0) break;
      }
    }
  };
}
```

示意图 (CBC 模式加密)：
```
CBC加密模式:

初始化向量 (IV)
    ↓
明文块1 → XOR → 加密 → 密文块1
    ↓               ↓
明文块2 → XOR → 加密 → 密文块2
    ↓               ↓
明文块3 → XOR → 加密 → 密文块3

解密过程:
密文块1 → 解密 → XOR → 明文块1
    ↓               ↑
    └───────────────┘ (使用IV)

密文块2 → 解密 → XOR → 明文块2  
    ↓               ↑
    └───────────────┘ (使用密文块1)

每个块的解密依赖于前一个密文块
```

## 非对称加密算法

### RSA 算法

基于大数分解困难性的非对称加密算法。

特点：
- 密钥对：公钥用于加密，私钥用于解密
- 数学基础：依赖大素数分解的困难性
- 数字签名：支持签名和验证功能

```javascript
// RSA算法实现
export class RSA extends Cryptosystem {
  constructor(keySize = 2048) {
    super();
    this.keySize = keySize;
    this.algorithm = 'RSA';
    this.publicKey = null;
    this.privateKey = null;
  }

  // 生成RSA密钥对
  generateKey() {
    // 生成大素数
    const p = this.generateLargePrime(this.keySize / 2);
    const q = this.generateLargePrime(this.keySize / 2);
    
    const n = p * q; // 模数
    const phi = (p - 1n) * (q - 1n); // 欧拉函数
    
    // 选择公钥指数
    let e = 65537n;
    while (this.gcd(e, phi) !== 1n) {
      e += 2n;
    }
    
    // 计算私钥指数
    const d = this.modInverse(e, phi);
    
    this.publicKey = { e, n };
    this.privateKey = { d, n };
    
    return {
      publicKey: this.publicKey,
      privateKey: this.privateKey
    };
  }

  // 生成大素数（简化版）
  generateLargePrime(bits) {
    // 实际应用中应使用更复杂的素数生成算法
    const min = 2n ** BigInt(bits - 1);
    const max = 2n ** BigInt(bits) - 1n;
    
    while (true) {
      const candidate = this.randomBigInt(min, max);
      if (this.isPrime(candidate)) {
        return candidate;
      }
    }
  }

  // 随机大整数
  randomBigInt(min, max) {
    const range = max - min;
    const bits = range.toString(2).length;
    let result;
    
    do {
      result = 0n;
      for (let i = 0; i < bits; i++) {
        if (Math.random() < 0.5) {
          result |= 1n << BigInt(i);
        }
      }
      result += min;
    } while (result > max);
    
    return result;
  }

  // 米勒-拉宾素性测试
  isPrime(n, k = 10) {
    if (n === 2n || n === 3n) return true;
    if (n % 2n === 0n || n < 2n) return false;
    
    // 将n-1写成2^s * d
    let s = 0;
    let d = n - 1n;
    while (d % 2n === 0n) {
      d /= 2n;
      s++;
    }
    
    for (let i = 0; i < k; i++) {
      const a = this.randomBigInt(2n, n - 2n);
      let x = this.modPow(a, d, n);
      
      if (x === 1n || x === n - 1n) continue;
      
      let continueLoop = false;
      for (let j = 0; j < s - 1; j++) {
        x = this.modPow(x, 2n, n);
        if (x === n - 1n) {
          continueLoop = true;
          break;
        }
      }
      
      if (!continueLoop) return false;
    }
    
    return true;
  }

  // 模幂运算
  modPow(base, exponent, modulus) {
    let result = 1n;
    base = base % modulus;
    
    while (exponent > 0) {
      if (exponent % 2n === 1n) {
        result = (result * base) % modulus;
      }
      exponent = exponent >> 1n;
      base = (base * base) % modulus;
    }
    
    return result;
  }

  // 扩展欧几里得算法
  extendedGcd(a, b) {
    if (b === 0n) return [a, 1n, 0n];
    
    const [gcd, x1, y1] = this.extendedGcd(b, a % b);
    const x = y1;
    const y = x1 - (a / b) * y1;
    
    return [gcd, x, y];
  }

  // 模逆元
  modInverse(a, m) {
    const [gcd, x] = this.extendedGcd(a, m);
    if (gcd !== 1n) throw new Error('Modular inverse does not exist');
    return (x % m + m) % m;
  }

  // 最大公约数
  gcd(a, b) {
    while (b !== 0n) {
      [a, b] = [b, a % b];
    }
    return a;
  }

  // 加密
  encrypt(plaintext, publicKey) {
    const message = this.textToBigInt(plaintext);
    const { e, n } = publicKey;
    
    if (message >= n) {
      throw new Error('Message too large for modulus');
    }
    
    const ciphertext = this.modPow(message, e, n);
    return this.bigIntToText(ciphertext);
  }

  // 解密
  decrypt(ciphertext, privateKey) {
    const message = this.textToBigInt(ciphertext);
    const { d, n } = privateKey;
    
    const plaintext = this.modPow(message, d, n);
    return this.bigIntToText(plaintext);
  }

  // 文本与大整数转换
  textToBigInt(text) {
    let result = 0n;
    for (let i = 0; i < text.length; i++) {
      result = result * 256n + BigInt(text.charCodeAt(i));
    }
    return result;
  }

  bigIntToText(bigint) {
    let result = '';
    let n = bigint;
    
    while (n > 0n) {
      result = String.fromCharCode(Number(n % 256n)) + result;
      n = n / 256n;
    }
    
    return result;
  }

  // RSA签名
  sign(message, privateKey) {
    const hash = this.hashMessage(message);
    const signature = this.modPow(hash, privateKey.d, privateKey.n);
    return signature;
  }

  // 验证签名
  verify(message, signature, publicKey) {
    const hash = this.hashMessage(message);
    const decryptedHash = this.modPow(signature, publicKey.e, publicKey.n);
    return hash === decryptedHash;
  }

  // 简单的哈希函数
  hashMessage(message) {
    // 实际应用中应使用加密哈希函数如SHA-256
    let hash = 0n;
    for (let i = 0; i < message.length; i++) {
      hash = (hash * 31n + BigInt(message.charCodeAt(i))) % (2n ** 256n);
    }
    return hash;
  }
}
```

示意图 (RSA 加密过程)：
```
RSA密钥生成:
1. 选择两个大素数 p 和 q
2. 计算 n = p × q
3. 计算 φ(n) = (p-1)(q-1)  
4. 选择 e 使得 1 < e < φ(n) 且 gcd(e, φ(n)) = 1
5. 计算 d = e⁻¹ mod φ(n)

公钥: (e, n)
私钥: (d, n)

加密: c = mᵉ mod n
解密: m = cᵈ mod n

数字签名:
签名: s = hash(m)ᵈ mod n  
验证: hash(m) = sᵉ mod n

示例:
p=61, q=53
n=3233, φ(n)=3120
选择e=17
计算d=2753 (17×2753=46801≡1 mod 3120)

加密m=65: 
c=65¹⁷ mod 3233=2790
解密c=2790:
m=2790²⁷⁵³ mod 3233=65
```

### 椭圆曲线密码学

基于椭圆曲线离散对数问题的非对称加密算法。

特点：
- 高安全性：相同安全强度下密钥长度比 RSA 短
- 计算效率：运算速度比 RSA 快
- 资源友好：适合资源受限环境

```javascript
// 椭圆曲线密码学实现
export class ECC extends Cryptosystem {
  constructor(curveName = 'secp256k1') {
    super();
    this.curve = this.getCurveParameters(curveName);
    this.algorithm = 'ECC';
  }

  // 获取椭圆曲线参数
  getCurveParameters(curveName) {
    const curves = {
      'secp256k1': {
        p: 2n ** 256n - 2n ** 32n - 977n,
        a: 0n,
        b: 7n,
        n: 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141n,
        Gx: 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798n,
        Gy: 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8n
      }
    };
    
    return curves[curveName];
  }

  // 椭圆曲线点类
  class Point {
    constructor(x, y, isInfinity = false) {
      this.x = x;
      this.y = y;
      this.isInfinity = isInfinity;
    }

    // 点相等判断
    equals(other) {
      if (this.isInfinity && other.isInfinity) return true;
      if (this.isInfinity || other.isInfinity) return false;
      return this.x === other.x && this.y === other.y;
    }

    toString() {
      return this.isInfinity ? 'Point(Infinity)' : `Point(${this.x}, ${this.y})`;
    }
  }

  // 点加法
  pointAdd(P, Q, curve) {
    if (P.isInfinity) return Q;
    if (Q.isInfinity) return P;
    if (P.equals(Q)) return this.pointDouble(P, curve);

    const { p, a } = curve;
    
    // 计算斜率 λ = (Qy - Py) / (Qx - Px) mod p
    const numerator = (Q.y - P.y) % p;
    const denominator = (Q.x - P.x) % p;
    const lambda = (numerator * this.modInverse(denominator, p)) % p;
    
    // 计算新点坐标
    const x = (lambda * lambda - P.x - Q.x) % p;
    const y = (lambda * (P.x - x) - P.y) % p;
    
    return new Point(this.modPositive(x, p), this.modPositive(y, p));
  }

  // 点倍乘
  pointDouble(P, curve) {
    if (P.isInfinity) return P;
    
    const { p, a } = curve;
    
    // 计算斜率 λ = (3Px² + a) / (2Py) mod p
    const numerator = (3n * P.x * P.x + a) % p;
    const denominator = (2n * P.y) % p;
    const lambda = (numerator * this.modInverse(denominator, p)) % p;
    
    // 计算新点坐标
    const x = (lambda * lambda - 2n * P.x) % p;
    const y = (lambda * (P.x - x) - P.y) % p;
    
    return new Point(this.modPositive(x, p), this.modPositive(y, p));
  }

  // 标量乘法 k * P
  scalarMultiply(k, P, curve) {
    if (k === 0n) return new Point(0n, 0n, true);
    
    let result = new Point(0n, 0n, true); // 无穷远点
    let addend = P;
    
    while (k > 0n) {
      if (k & 1n) {
        result = this.pointAdd(result, addend, curve);
      }
      addend = this.pointDouble(addend, curve);
      k = k >> 1n;
    }
    
    return result;
  }

  // 模逆元
  modInverse(a, m) {
    return this.modPow(a, m - 2n, m); // 使用费马小定理
  }

  // 模幂运算
  modPow(base, exponent, modulus) {
    let result = 1n;
    base = base % modulus;
    
    while (exponent > 0n) {
      if (exponent & 1n) {
        result = (result * base) % modulus;
      }
      exponent = exponent >> 1n;
      base = (base * base) % modulus;
    }
    
    return result;
  }

  // 确保模运算结果为正值
  modPositive(a, p) {
    return (a % p + p) % p;
  }

  // 生成密钥对
  generateKey() {
    const { n, Gx, Gy } = this.curve;
    const G = new Point(Gx, Gy);
    
    // 生成私钥 (1 < privateKey < n)
    const privateKey = this.randomBigInt(1n, n - 1n);
    
    // 计算公钥 publicKey = privateKey * G
    const publicKey = this.scalarMultiply(privateKey, G, this.curve);
    
    return {
      privateKey,
      publicKey
    };
  }

  // ECDH密钥交换
  computeSharedSecret(privateKey, otherPublicKey) {
    const sharedPoint = this.scalarMultiply(privateKey, otherPublicKey, this.curve);
    
    // 使用共享点的x坐标作为共享密钥
    return sharedPoint.x;
  }

  // 随机大整数
  randomBigInt(min, max) {
    const range = max - min;
    const bits = range.toString(2).length;
    let result;
    
    do {
      result = 0n;
      for (let i = 0; i < bits; i++) {
        if (Math.random() < 0.5) {
          result |= 1n << BigInt(i);
        }
      }
      result += min;
    } while (result > max);
    
    return result;
  }
}
```

示意图 (椭圆曲线运算)：
```
椭圆曲线: y² = x³ + ax + b mod p

点加法几何解释:
给定点P和Q，连接P和Q的直线与曲线交于第三点R'
点P+Q是R'关于x轴的对称点R

点倍乘: 
给定点P，曲线在P点的切线与曲线交于另一点R'
点2P是R'关于x轴的对称点

secp256k1曲线参数:
p = 2²⁵⁶ - 2³² - 977
a = 0, b = 7
基点G: 
x=79BE667E F9DCBBAC 55A06295 CE870B07 029BFCDB 2DCE28D9 59F2815B 16F81798
y=483ADA77 26A3C465 5DA4FBFC 0E1108A8 FD17B448 A6855419 9C47D08F FB10D4B8

密钥生成:
私钥d: 随机数 1 < d < n
公钥Q: Q = d × G

ECDH密钥交换:
Alice: 私钥a, 公钥A = a×G
Bob: 私钥b, 公钥B = b×G  
共享密钥: a×B = a×(b×G) = b×(a×G) = b×A
```

## 密码学哈希函数

### SHA-256 算法

安全哈希算法，产生 256 位哈希值。

特点：
- 抗碰撞性：难以找到两个不同输入产生相同哈希值
- 雪崩效应：输入微小变化导致输出巨大变化
- 单向性：从哈希值无法推导出原始输入

```javascript
// SHA-256实现
export class SHA256 {
  constructor() {
    this.algorithm = 'SHA-256';
    this.blockSize = 64; // 字节
    this.digestSize = 32; // 字节
    
    // 初始哈希值
    this.h = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];
    
    // 常数K
    this.K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
  }

  // 右旋转
  rotr(n, x) {
    return (x >>> n) | (x << (32 - n));
  }

  // 右移位
  shr(n, x) {
    return x >>> n;
  }

  // SHA-256函数
  sigma0(x) {
    return this.rotr(7, x) ^ this.rotr(18, x) ^ this.shr(3, x);
  }

  sigma1(x) {
    return this.rotr(17, x) ^ this.rotr(19, x) ^ this.shr(10, x);
  }

  Sigma0(x) {
    return this.rotr(2, x) ^ this.rotr(13, x) ^ this.rotr(22, x);
  }

  Sigma1(x) {
    return this.rotr(6, x) ^ this.rotr(11, x) ^ this.rotr(25, x);
  }

  ch(x, y, z) {
    return (x & y) ^ (~x & z);
  }

  maj(x, y, z) {
    return (x & y) ^ (x & z) ^ (y & z);
  }

  // 消息填充
  padMessage(message) {
    const bitLength = message.length * 8;
    const padded = new Uint8Array(this.blockSize * Math.ceil((message.length + 9) / this.blockSize));
    
    // 添加原始消息
    padded.set(message);
    
    // 添加1位后跟0位
    padded[message.length] = 0x80;
    
    // 添加长度（大端序64位）
    const lengthBytes = new DataView(new ArrayBuffer(8));
    lengthBytes.setBigUint64(0, BigInt(bitLength), false);
    
    for (let i = 0; i < 8; i++) {
      padded[padded.length - 8 + i] = lengthBytes.getUint8(i);
    }
    
    return padded;
  }

  // 计算哈希
  hash(message) {
    if (typeof message === 'string') {
      message = new TextEncoder().encode(message);
    }
    
    const padded = this.padMessage(message);
    const blocks = this.parseMessage(padded);
    
    let [a, b, c, d, e, f, g, h] = this.h;
    
    // 处理每个512位块
    for (const block of blocks) {
      const W = new Array(64);
      
      // 准备消息调度
      for (let t = 0; t < 16; t++) {
        W[t] = block[t];
      }
      
      for (let t = 16; t < 64; t++) {
        W[t] = (this.sigma1(W[t-2]) + W[t-7] + this.sigma0(W[t-15]) + W[t-16]) >>> 0;
      }
      
      // 初始化工作变量
      let [a2, b2, c2, d2, e2, f2, g2, h2] = [a, b, c, d, e, f, g, h];
      
      // 主循环
      for (let t = 0; t < 64; t++) {
        const T1 = (h2 + this.Sigma1(e2) + this.ch(e2, f2, g2) + this.K[t] + W[t]) >>> 0;
        const T2 = (this.Sigma0(a2) + this.maj(a2, b2, c2)) >>> 0;
        
        h2 = g2;
        g2 = f2;
        f2 = e2;
        e2 = (d2 + T1) >>> 0;
        d2 = c2;
        c2 = b2;
        b2 = a2;
        a2 = (T1 + T2) >>> 0;
      }
      
      // 更新哈希值
      a = (a + a2) >>> 0;
      b = (b + b2) >>> 0;
      c = (c + c2) >>> 0;
      d = (d + d2) >>> 0;
      e = (e + e2) >>> 0;
      f = (f + f2) >>> 0;
      g = (g + g2) >>> 0;
      h = (h + h2) >>> 0;
    }
    
    // 生成最终哈希值
    const hashBytes = new Uint8Array(32);
    const hashView = new DataView(hashBytes.buffer);
    
    [a, b, c, d, e, f, g, h].forEach((value, index) => {
      hashView.setUint32(index * 4, value, false);
    });
    
    return hashBytes;
  }

  // 解析消息为32位字数组
  parseMessage(padded) {
    const blocks = [];
    const view = new DataView(padded.buffer);
    
    for (let i = 0; i < padded.length; i += 64) {
      const block = new Array(16);
      for (let j = 0; j < 16; j++) {
        block[j] = view.getUint32(i + j * 4, false);
      }
      blocks.push(block);
    }
    
    return blocks;
  }

  // 哈希值转换为十六进制字符串
  toHex(hashBytes) {
    return Array.from(hashBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
```

示意图 (SHA-256 压缩函数)：
```
SHA-256处理流程:

消息填充:
原始消息 → 添加1 → 添加0 → 添加长度(64位) → 填充后消息

分块处理(512位/块):
对于每个消息块:
  扩展消息调度W[0..63]:
    W[0..15] = 消息块
    W[16..63]: W[t] = σ1(W[t-2]) + W[t-7] + σ0(W[t-15]) + W[t-16]

  压缩函数:
    初始化: a,b,c,d,e,f,g,h = 当前哈希值
    for t=0 to 63:
      T1 = h + Σ1(e) + Ch(e,f,g) + K[t] + W[t]
      T2 = Σ0(a) + Maj(a,b,c)
      h = g
      g = f  
      f = e
      e = d + T1
      d = c
      c = b
      b = a
      a = T1 + T2

    更新哈希值: 
      a,b,c,d,e,f,g,h += 工作变量

最终哈希 = 连接a,b,c,d,e,f,g,h

函数定义:
Ch(x,y,z) = (x ∧ y) ⊕ (¬x ∧ z)
Maj(x,y,z) = (x ∧ y) ⊕ (x ∧ z) ⊕ (y ∧ z)
Σ0(x) = ROTR²(x) ⊕ ROTR¹³(x) ⊕ ROTR²²(x)
Σ1(x) = ROTR⁶(x) ⊕ ROTR¹¹(x) ⊕ ROTR²⁵(x)
σ0(x) = ROTR⁷(x) ⊕ ROTR¹⁸(x) ⊕ SHR³(x)
σ1(x) = ROTR¹⁷(x) ⊕ ROTR¹⁹(x) ⊕ SHR¹⁰(x)
```

## 密钥交换协议

### Diffie-Hellman 密钥交换

允许双方在不安全信道上建立共享密钥。

特点：
- 完美前向保密：长期私钥泄露不影响过去会话安全
- 中间人攻击：需要额外认证机制防止中间人攻击
- 数学基础：基于离散对数问题的困难性

```javascript
// Diffie-Hellman密钥交换实现
export class DiffieHellman {
  constructor(primeLength = 2048) {
    this.primeLength = primeLength;
    this.p = null; // 大素数
    this.g = null; // 生成元
    this.privateKey = null;
    this.publicKey = null;
  }

  // 生成DH参数
  generateParameters() {
    // 生成安全素数 p = 2q + 1
    this.p = this.generateSafePrime(this.primeLength);
    
    // 寻找生成元 g
    this.g = this.findGenerator(this.p);
    
    return { p: this.p, g: this.g };
  }

  // 生成安全素数
  generateSafePrime(bits) {
    while (true) {
      // 生成随机奇数
      let q = this.randomBigInt(
        2n ** BigInt(bits - 2),
        2n ** BigInt(bits - 1) - 1n
      );
      
      // 确保q是奇数
      if (q % 2n === 0n) q += 1n;
      
      const p = 2n * q + 1n;
      
      if (this.isPrime(p) && this.isPrime(q)) {
        return p;
      }
    }
  }

  // 寻找生成元
  findGenerator(p) {
    const q = (p - 1n) / 2n;
    
    for (let g = 2n; g < p - 1n; g++) {
      // 检查g是模p的生成元
      if (this.modPow(g, 2n, p) !== 1n && this.modPow(g, q, p) !== 1n) {
        return g;
      }
    }
    
    return 2n; // 回退值
  }

  // 生成密钥对
  generateKeyPair() {
    if (!this.p || !this.g) {
      this.generateParameters();
    }
    
    // 生成私钥 (1 < privateKey < p-1)
    this.privateKey = this.randomBigInt(2n, this.p - 2n);
    
    // 计算公钥 publicKey = g^privateKey mod p
    this.publicKey = this.modPow(this.g, this.privateKey, this.p);
    
    return {
      privateKey: this.privateKey,
      publicKey: this.publicKey
    };
  }

  // 计算共享密钥
  computeSharedSecret(otherPublicKey) {
    if (!this.privateKey) {
      throw new Error('Private key not generated');
    }
    
    // sharedSecret = otherPublicKey^privateKey mod p
    return this.modPow(otherPublicKey, this.privateKey, this.p);
  }

  // 模幂运算
  modPow(base, exponent, modulus) {
    let result = 1n;
    base = base % modulus;
    
    while (exponent > 0n) {
      if (exponent & 1n) {
        result = (result * base) % modulus;
      }
      exponent = exponent >> 1n;
      base = (base * base) % modulus;
    }
    
    return result;
  }

  // 随机大整数
  randomBigInt(min, max) {
    const range = max - min;
    const bits = range.toString(2).length;
    let result;
    
    do {
      result = 0n;
      for (let i = 0; i < bits; i++) {
        if (Math.random() < 0.5) {
          result |= 1n << BigInt(i);
        }
      }
      result += min;
    } while (result > max);
    
    return result;
  }

  // 米勒-拉宾素性测试
  isPrime(n, k = 10) {
    if (n === 2n || n === 3n) return true;
    if (n % 2n === 0n || n < 2n) return false;
    
    let s = 0;
    let d = n - 1n;
    while (d % 2n === 0n) {
      d /= 2n;
      s++;
    }
    
    for (let i = 0; i < k; i++) {
      const a = this.randomBigInt(2n, n - 2n);
      let x = this.modPow(a, d, n);
      
      if (x === 1n || x === n - 1n) continue;
      
      let continueLoop = false;
      for (let j = 0; j < s - 1; j++) {
        x = this.modPow(x, 2n, n);
        if (x === n - 1n) {
          continueLoop = true;
          break;
        }
      }
      
      if (!continueLoop) return false;
    }
    
    return true;
  }
}
```

示意图 (Diffie-Hellman 密钥交换)：
```
Diffie-Hellman协议:

公共参数: 大素数p, 生成元g

Alice                         Bob
生成私钥a                    生成私钥b
计算公钥A = gᵃ mod p        计算公钥B = gᵇ mod p
交换公钥 A → → → → → → → → → B
交换公钥 A ← ← ← ← ← ← ← ← ← B
计算共享密钥                计算共享密钥
s = Bᵃ mod p               s = Aᵇ mod p

数学原理:
Bᵃ mod p = (gᵇ)ᵃ mod p = gᵃᵇ mod p
Aᵇ mod p = (gᵃ)ᵇ mod p = gᵃᵇ mod p

双方得到相同的共享密钥s = gᵃᵇ mod p

示例:
p=23, g=5
Alice: a=6, A=5⁶ mod 23=8
Bob: b=15, B=5¹⁵ mod 23=19
共享密钥: 
Alice: 19⁶ mod 23=2
Bob: 8¹⁵ mod 23=2
```

## 数字签名算法

### 数字签名基础

使用私钥对消息摘要进行加密，提供认证和不可否认性。

特点：
- 身份认证：验证消息发送者身份
- 完整性保护：确保消息未被篡改
- 不可否认性：防止发送者事后否认

```javascript
// 数字签名基类
export class DigitalSignature {
  constructor() {
    this.algorithm = null;
  }

  // 生成密钥对
  generateKeyPair() {
    throw new Error('generateKeyPair method must be implemented');
  }

  // 签名
  sign(message, privateKey) {
    throw new Error('sign method must be implemented');
  }

  // 验证
  verify(message, signature, publicKey) {
    throw new Error('verify method must be implemented');
  }

  // 消息哈希
  hashMessage(message) {
    const sha256 = new SHA256();
    return sha256.hash(message);
  }
}
```

### ECDSA 签名

基于椭圆曲线的数字签名算法。

特点：
- 高效安全：相比 RSA 签名更短的签名长度
- 标准广泛：被比特币、TLS 等广泛采用
- 随机数敏感：签名随机数泄露会导致私钥泄露

```javascript
// ECDSA实现
export class ECDSA extends DigitalSignature {
  constructor(curveName = 'secp256k1') {
    super();
    this.curve = new ECC(curveName);
    this.algorithm = 'ECDSA';
  }

  // 生成密钥对
  generateKeyPair() {
    return this.curve.generateKey();
  }

  // 签名
  sign(message, privateKey) {
    const { n, Gx, Gy } = this.curve.curve;
    const G = new this.curve.Point(Gx, Gy);
    const hash = this.bigIntFromHash(this.hashMessage(message));
    
    let r, s;
    do {
      // 生成随机数k
      const k = this.curve.randomBigInt(1n, n - 1n);
      
      // 计算点 (x1, y1) = k * G
      const point = this.curve.scalarMultiply(k, G, this.curve.curve);
      r = point.x % n;
      
      if (r === 0n) continue;
      
      // 计算 s = k⁻¹ * (hash + r * privateKey) mod n
      const kInv = this.curve.modInverse(k, n);
      s = (kInv * (hash + r * privateKey)) % n;
      
      if (s === 0n) continue;
      
    } while (r === 0n || s === 0n);
    
    return { r, s };
  }

  // 验证签名
  verify(message, signature, publicKey) {
    const { r, s } = signature;
    const { n, Gx, Gy } = this.curve.curve;
    const G = new this.curve.Point(Gx, Gy);
    
    // 验证签名范围
    if (r <= 0n || r >= n || s <= 0n || s >= n) {
      return false;
    }
    
    const hash = this.bigIntFromHash(this.hashMessage(message));
    
    // 计算 w = s⁻¹ mod n
    const w = this.curve.modInverse(s, n);
    
    // 计算 u1 = hash * w mod n, u2 = r * w mod n
    const u1 = (hash * w) % n;
    const u2 = (r * w) % n;
    
    // 计算点 (x1, y1) = u1 * G + u2 * publicKey
    const point1 = this.curve.scalarMultiply(u1, G, this.curve.curve);
    const point2 = this.curve.scalarMultiply(u2, publicKey, this.curve.curve);
    const point = this.curve.pointAdd(point1, point2, this.curve.curve);
    
    // 验证 r ≡ x1 mod n
    return (point.x % n) === r;
  }

  // 从哈希值生成大整数
  bigIntFromHash(hashBytes) {
    let result = 0n;
    for (let i = 0; i < hashBytes.length; i++) {
      result = (result << 8n) | BigInt(hashBytes[i]);
    }
    return result;
  }

  // 签名序列化
  serializeSignature(signature) {
    const rBytes = this.bigIntToBytes(signature.r, 32);
    const sBytes = this.bigIntToBytes(signature.s, 32);
    return new Uint8Array([...rBytes, ...sBytes]);
  }

  // 反序列化签名
  deserializeSignature(signatureBytes) {
    const r = this.bytesToBigInt(signatureBytes.slice(0, 32));
    const s = this.bytesToBigInt(signatureBytes.slice(32, 64));
    return { r, s };
  }

  // 大整数转换为字节数组
  bigIntToBytes(bigint, length) {
    const bytes = new Uint8Array(length);
    for (let i = length - 1; i >= 0; i--) {
      bytes[i] = Number(bigint & 0xffn);
      bigint = bigint >> 8n;
    }
    return bytes;
  }

  // 字节数组转换为大整数
  bytesToBigInt(bytes) {
    let result = 0n;
    for (let i = 0; i < bytes.length; i++) {
      result = (result << 8n) | BigInt(bytes[i]);
    }
    return result;
  }
}
```

示意图 (ECDSA 签名流程)：
```
ECDSA签名:

输入: 消息m, 私钥d, 椭圆曲线参数
输出: 签名(r,s)

1. 计算消息哈希: h = hash(m)
2. 生成随机数k, 1 ≤ k ≤ n-1
3. 计算点(x₁,y₁) = k×G
4. 计算 r = x₁ mod n, 如果r=0则回到步骤2
5. 计算 s = k⁻¹(h + r×d) mod n, 如果s=0则回到步骤2
6. 输出签名(r,s)

ECDSA验证:

输入: 消息m, 签名(r,s), 公钥Q
输出: 签名是否有效

1. 验证 1 ≤ r ≤ n-1 且 1 ≤ s ≤ n-1
2. 计算消息哈希: h = hash(m)  
3. 计算 w = s⁻¹ mod n
4. 计算 u₁ = h×w mod n, u₂ = r×w mod n
5. 计算点(x₁,y₁) = u₁×G + u₂×Q
6. 验证 r ≡ x₁ mod n

数学原理:
验证时: u₁×G + u₂×Q = h×w×G + r×w×Q 
        = w×(h×G + r×d×G) 
        = w×(h + r×d)×G
        = (h + r×d)×w×G
        = (h + r×d)×s⁻¹×G
        = (h + r×d)×(k×(h + r×d)⁻¹)×G  
        = k×G

因此 x₁ = r mod n
```