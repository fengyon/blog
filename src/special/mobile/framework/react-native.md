# React Native

React Native 是 Facebook 推出的开源跨平台移动应用开发框架，它允许开发者使用 JavaScript 和 React 来构建真正的原生移动应用。凭借其“Learn once，write anywhere”的理念，React Native 已成为现代移动开发的重要技术选择。

## 核心概念

React Native 结合了 React 的声明式 UI 框架与原生平台能力，为 iOS 和 Android 提供了一套统一的开发方案。

- **原生组件**：React Native 组件在运行时被转换为真正的原生视图
- **跨平台开发**：使用单一代码库同时 targeting iOS 和 Android
- **热更新**：支持应用更新而不需要重新发布到应用商店

架构示意图：
JavaScript 代码 → React Native 桥接层 → 原生组件渲染
↓
iOS UIKit 视图 / Android 原生视图

## 技术架构特点

React Native 的架构设计是其成功的关键，它在开发效率和性能之间取得了良好平衡。

### 跨平台特性

React Native 允许开发者使用相同的代码基础为多个平台开发应用。

```
同一套 JavaScript 代码
        ↓
┌─────────────┬─────────────┐
│   iOS 平台   │ Android 平台 │
│ 原生组件渲染  │ 原生组件渲染  │
└─────────────┴─────────────┘
```

### 渲染机制

与 Hybrid 应用不同，React Native 不使用 WebView 渲染，而是通过原生组件：

```
React 组件树 → 序列化 → 原生模块 → 原生视图树
```

### 桥接通信

JavaScript 与原生代码通过异步桥接进行通信：

```
JS Thread ←→ Bridge ←→ Native Thread
   异步消息队列      序列化数据传递
```

### 性能优化

- **原生渲染**：使用真正的原生组件而非 WebView
- **多线程模型**：UI 渲染、JavaScript 执行和原生模块运行在不同线程
- **增量加载**：支持应用内更新和代码推送

## 开发环境与工具

### 快速开始选择

React Native 提供两种主要的开发方式：

- **Expo Go**：最适合初学者，无需配置原生开发环境

  ```bash
  # 安装 Expo CLI
  npm install -g expo-cli
  # 创建新项目
  expo init MyProject
  ```

- **React Native CLI**：适合需要深度原生集成的项目
  ```bash
  # 初始化项目
  npx react-native init MyProject
  # 运行 iOS 应用
  npx react-native run-ios
  # 运行 Android 应用
  npx react-native run-android
  ```

### 开发工具链

```
代码编辑 → 调试工具 → 打包构建 → 测试部署
    ↓           ↓         ↓         ↓
VS Code    Chrome DevTools Metro 应用商店
```

## 核心组件体系

React Native 提供丰富的内置组件，这些组件在不同平台上都会被映射到相应的原生视图。

### 基础组件

大多数应用都会用到的基础构建块：

```jsx
import { View, Text, Image, TextInput, ScrollView, StyleSheet } from 'react-native';

// View - 容器组件
<View style={styles.container}>
  <Text>Hello World</Text>
  <Image source={{uri: 'https://example.com/image.jpg'}} style={styles.image} />
  <TextInput placeholder="Enter text" onChangeText={(text) => console.log(text)} />
</View>

// ScrollView - 可滚动容器
<ScrollView>
  <Text>Long content here...</Text>
</ScrollView>

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  image: {
    width: 100,
    height: 100,
  }
});
```

### 交互控件

提供常见的用户交互组件：

```jsx
import { Button, Switch } from 'react-native';

// 按钮组件
<Button
  title="Press me"
  onPress={() => alert('Button pressed!')}
/>

// 开关控件
<Switch
  value={isEnabled}
  onValueChange={(value) => setIsEnabled(value)}
/>
```

### 列表组件

针对大量数据优化的高性能列表：

```jsx
import { FlatList, SectionList } from 'react-native';

// FlatList - 简单列表
<FlatList
  data={[{id: '1', title: 'Item 1'}, {id: '2', title: 'Item 2'}]}
  renderItem={({item}) => <Text>{item.title}</Text>}
  keyExtractor={item => item.id}
/>

// SectionList - 分组列表
<SectionList
  sections={[
    {title: 'Section A', data: ['A1', 'A2']},
    {title: 'Section B', data: ['B1', 'B2']}
  ]}
  renderItem={({item}) => <Text>{item}</Text>}
  renderSectionHeader={({section}) => <Text style={styles.header}>{section.title}</Text>}
/>
```

## 常用 API 详解

React Native 提供了丰富的 API 来处理各种移动端特性和功能。

### 导航 API

使用 React Navigation 实现屏幕导航：

```jsx
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

// 堆栈导航
const Stack = createStackNavigator()
function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Details" component={DetailsScreen} />
    </Stack.Navigator>
  )
}

// 底部标签导航
const Tab = createBottomTabNavigator()
function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Home" component={HomeStack} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  )
}
```

### 动画 API

使用 Animated 创建流畅的动画效果：

```jsx
import { Animated, Easing } from 'react-native'

class FadeInView extends React.Component {
  constructor(props) {
    super(props)
    this.fadeAnim = new Animated.Value(0) // 初始透明度为0
  }

  componentDidMount() {
    Animated.timing(this.fadeAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start()
  }

  render() {
    return (
      <Animated.View
        style={{
          ...this.props.style,
          opacity: this.fadeAnim,
        }}>
        {this.props.children}
      </Animated.View>
    )
  }
}

// 使用示例
;<FadeInView style={styles.fadingContainer}>
  <Text>Fading in</Text>
</FadeInView>
```

### 存储 API

使用 AsyncStorage 进行持久化数据存储：

```jsx
import AsyncStorage from '@react-native-async-storage/async-storage'

// 存储数据
const storeData = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('Failed to save data:', e)
  }
}

// 读取数据
const getData = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key)
    return value != null ? JSON.parse(value) : null
  } catch (e) {
    console.error('Failed to fetch data:', e)
  }
}

// 使用示例
await storeData('user', { name: 'John', age: 30 })
const user = await getData('user')
```

### 网络请求 API

使用 fetch 或 axios 进行网络请求：

```jsx
// 使用内置 fetch API
const fetchUserData = async () => {
  try {
    const response = await fetch('https://api.example.com/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Network response was not ok')
    }

    const userData = await response.json()
    return userData
  } catch (error) {
    console.error('Error fetching data:', error)
    throw error
  }
}

// 使用示例
useEffect(() => {
  fetchUserData()
    .then((data) => setUsers(data))
    .catch((error) => setError(error.message))
}, [])
```

### 设备功能 API

访问设备特定功能和信息：

```jsx
import { Dimensions, PixelRatio, Linking, Alert } from 'react-native'
import DeviceInfo from 'react-native-device-info'

// 获取设备尺寸
const { width, height } = Dimensions.get('window')

// 获取像素密度
const pixelRatio = PixelRatio.get()

// 打开链接
const openURL = async (url) => {
  try {
    const canOpen = await Linking.canOpenURL(url)
    if (canOpen) {
      await Linking.openURL(url)
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to open URL')
  }
}

// 获取设备信息
const deviceModel = DeviceInfo.getModel()
const appVersion = DeviceInfo.getVersion()
```

### 平台特定 API

处理平台差异的代码：

```jsx
import { Platform, BackHandler, ToastAndroid } from 'react-native'

// 平台检测
if (Platform.OS === 'ios') {
  // iOS 特定代码
} else if (Platform.OS === 'android') {
  // Android 特定代码
}

// Android 返回按钮处理
useEffect(() => {
  const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
    // 处理返回按钮
    return true // 阻止默认行为
  })

  return () => backHandler.remove()
}, [])

// Android Toast 消息
const showToast = (message) => {
  ToastAndroid.show(message, ToastAndroid.SHORT)
}
```

## 开发实践与模式

### 组件化开发

React Native 采用组件化架构，促进代码复用：

```
功能模块 → 可复用组件 → 组合应用
    ↓           ↓           ↓
独立开发    多处使用    统一维护
```

### 样式处理

使用 StyleSheet 创建优化过的样式：

```jsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  button: {
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 5,
  },
})

// 平台特定样式
const platformStyles = StyleSheet.create({
  container: {
    flex: 1,
    ...Platform.select({
      ios: {
        backgroundColor: '#F2F2F7',
      },
      android: {
        backgroundColor: '#FFFFFF',
      },
    }),
  },
})
```

### 状态管理

结合 React Hooks 进行状态管理：

```jsx
import React, { useState, useEffect, useReducer } from 'react'
import { View, Text } from 'react-native'

// 使用 useState
const Counter = () => {
  const [count, setCount] = useState(0)

  return (
    <View>
      <Text>Count: {count}</Text>
      <Button title="Increment" onPress={() => setCount(count + 1)} />
    </View>
  )
}

// 使用 useReducer 处理复杂状态
const todoReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TODO':
      return [...state, { id: Date.now(), text: action.text, completed: false }]
    case 'TOGGLE_TODO':
      return state.map((todo) =>
        todo.id === action.id ? { ...todo, completed: !todo.completed } : todo
      )
    default:
      return state
  }
}

const TodoApp = () => {
  const [todos, dispatch] = useReducer(todoReducer, [])

  return <View>{/* Todo 实现 */}</View>
}
```

## 优势与局限

### 主要优势

- **开发效率**：单一代码库支持多平台，减少开发时间
- **性能表现**：使用原生组件，接近原生应用的性能
- **生态系统**：丰富的第三方库和社区支持
- **热重载**：实时预览更改，提升开发体验
- **成本效益**：减少人力和时间投入

### 当前局限

- **性能瓶颈**：复杂动画和计算密集型任务可能存在性能问题
- **原生依赖**：某些特定功能仍需原生开发
- **包体积**：应用体积相对纯原生应用较大
- **调试复杂度**：JavaScript 与原生代码交互调试较复杂
