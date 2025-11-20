# Electron 硬件功能开发

## 硬件功能开发概述

Electron 硬件功能开发指的是利用 Electron 应用访问和控制系统硬件设备的能力。与传统 Web 应用受限于浏览器沙箱不同，Electron 通过 Node.js 集成可以**直接调用系统硬件接口**，访问 USB 设备、串口、蓝牙设备、摄像头、麦克风、打印机等物理硬件资源。

硬件功能开发的核心挑战在于**桥接 Web 技术与原生硬件接口**。Electron 应用通过主进程运行在 Node.js 环境中，可以加载各种硬件相关的原生模块，而渲染进程则负责用户界面展示，两者通过 IPC 机制进行数据交换。

```
用户界面 (渲染进程)
       |
       | IPC 通信
       ↓
硬件控制层 (主进程)
       |
       | 原生硬件 API
       ↓
物理硬件设备 (USB/蓝牙/串口等)
```

## 硬件访问架构设计

### 多层硬件访问架构

Electron 硬件功能开发通常采用分层架构：

```
渲染进程 (UI层)
    ↑↓ IPC
主进程 (硬件控制层)
    ↑↓ Node.js 原生模块
系统硬件接口
    ↑↓ 设备驱动
物理硬件设备
```

### 安全的硬件访问模式

由于硬件操作涉及系统级权限，必须采用安全的访问模式：

```javascript
// preload.js - 硬件 API 安全暴露
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('hardwareAPI', {
  // USB 设备操作
  usb: {
    getDevices: () => ipcRenderer.invoke('hardware:usb:getDevices'),
    openDevice: (deviceId) => ipcRenderer.invoke('hardware:usb:openDevice', deviceId),
    sendData: (deviceId, data) => ipcRenderer.invoke('hardware:usb:sendData', deviceId, data),
    receiveData: (callback) => ipcRenderer.on('hardware:usb:dataReceived', callback)
  },
  
  // 串口操作
  serial: {
    listPorts: () => ipcRenderer.invoke('hardware:serial:listPorts'),
    openPort: (portName, options) => ipcRenderer.invoke('hardware:serial:openPort', portName, options),
    writeData: (portName, data) => ipcRenderer.invoke('hardware:serial:writeData', portName, data)
  },
  
  // 蓝牙操作
  bluetooth: {
    requestDevice: (options) => ipcRenderer.invoke('hardware:bluetooth:requestDevice', options),
    connect: (deviceId) => ipcRenderer.invoke('hardware:bluetooth:connect', deviceId),
    disconnect: (deviceId) => ipcRenderer.invoke('hardware:bluetooth:disconnect', deviceId)
  }
});
```

## USB 设备开发

### node-usb 库使用

`node-usb` 库提供底层的 USB 设备访问能力。

```javascript
// hardware/usbManager.js
import usb from 'usb';

class USBManager {
  constructor() {
    this.devices = new Map();
    this.setupUSBEvents();
  }

  setupUSBEvents() {
    // 监听设备连接事件
    usb.on('attach', (device) => {
      console.log('USB 设备连接:', device.deviceDescriptor);
      this.handleDeviceAttach(device);
    });

    // 监听设备断开事件
    usb.on('detach', (device) => {
      console.log('USB 设备断开:', device.deviceDescriptor);
      this.handleDeviceDetach(device);
    });
  }

  // 获取所有 USB 设备
  getDevices() {
    const devices = usb.getDeviceList();
    return devices.map(device => ({
      id: this.getDeviceId(device),
      vendorId: device.deviceDescriptor.idVendor,
      productId: device.deviceDescriptor.idProduct,
      manufacturer: device.deviceDescriptor.iManufacturer,
      product: device.deviceDescriptor.iProduct,
      busNumber: device.busNumber,
      deviceAddress: device.deviceAddress
    }));
  }

  // 打开 USB 设备
  async openDevice(deviceId) {
    const device = this.findDeviceById(deviceId);
    if (!device) {
      throw new Error(`设备未找到: ${deviceId}`);
    }

    device.open();
    
    // 获取设备接口
    const iface = device.interface(0);
    if (iface.isKernelDriverActive()) {
      iface.detachKernelDriver();
    }
    
    iface.claim();
    
    // 设置端点
    const endpointIn = iface.endpoint(0x81);
    const endpointOut = iface.endpoint(0x01);
    
    this.devices.set(deviceId, {
      device,
      iface,
      endpointIn,
      endpointOut
    });
    
    return { success: true, deviceId };
  }

  // 发送数据到 USB 设备
  async sendData(deviceId, data) {
    const deviceInfo = this.devices.get(deviceId);
    if (!deviceInfo) {
      throw new Error(`设备未打开: ${deviceId}`);
    }

    return new Promise((resolve, reject) => {
      deviceInfo.endpointOut.transfer(Buffer.from(data), (error) => {
        if (error) {
          reject(error);
        } else {
          resolve({ success: true });
        }
      });
    });
  }

  // 从 USB 设备接收数据
  startReceivingData(deviceId, callback) {
    const deviceInfo = this.devices.get(deviceId);
    if (!deviceInfo) {
      throw new Error(`设备未打开: ${deviceId}`);
    }

    const receive = () => {
      deviceInfo.endpointIn.transfer(64, (error, data) => {
        if (error) {
          console.error('接收数据错误:', error);
        } else if (data && data.length > 0) {
          callback(data);
        }
        
        // 继续接收下一个数据包
        if (this.devices.has(deviceId)) {
          setImmediate(receive);
        }
      });
    };

    receive();
  }

  getDeviceId(device) {
    return `${device.busNumber}-${device.deviceAddress}`;
  }

  findDeviceById(deviceId) {
    const devices = usb.getDeviceList();
    return devices.find(device => 
      this.getDeviceId(device) === deviceId
    );
  }
}

export default USBManager;
```

在主进程中集成 USB 管理：

```javascript
// main.js - USB 功能集成
import USBManager from './hardware/usbManager.js';

const usbManager = new USBManager();

// USB 设备列表
ipcMain.handle('hardware:usb:getDevices', () => {
  return usbManager.getDevices();
});

// 打开 USB 设备
ipcMain.handle('hardware:usb:openDevice', async (event, deviceId) => {
  try {
    return await usbManager.openDevice(deviceId);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 发送数据到 USB 设备
ipcMain.handle('hardware:usb:sendData', async (event, deviceId, data) => {
  try {
    return await usbManager.sendData(deviceId, data);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 启动数据接收
ipcMain.handle('hardware:usb:startReceive', async (event, deviceId) => {
  try {
    const mainWindow = BrowserWindow.fromWebContents(event.sender);
    usbManager.startReceivingData(deviceId, (data) => {
      mainWindow.webContents.send('hardware:usb:dataReceived', {
        deviceId,
        data: Array.from(data)
      });
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

在渲染进程中使用 USB 功能：

```javascript
// renderer.js - USB 设备操作
class USBDeviceController {
  constructor() {
    this.connectedDevice = null;
  }

  // 扫描 USB 设备
  async scanDevices() {
    try {
      const devices = await window.hardwareAPI.usb.getDevices();
      this.displayDevices(devices);
      return devices;
    } catch (error) {
      console.error('扫描 USB 设备失败:', error);
    }
  }

  // 连接 USB 设备
  async connectDevice(deviceId) {
    try {
      const result = await window.hardwareAPI.usb.openDevice(deviceId);
      if (result.success) {
        this.connectedDevice = deviceId;
        
        // 启动数据接收监听
        window.hardwareAPI.usb.receiveData((event, data) => {
          this.handleReceivedData(data);
        });
        
        await window.hardwareAPI.usb.startReceive(deviceId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('连接设备失败:', error);
      return false;
    }
  }

  // 发送数据到设备
  async sendDataToDevice(data) {
    if (!this.connectedDevice) {
      throw new Error('没有已连接的设备');
    }

    const result = await window.hardwareAPI.usb.sendData(
      this.connectedDevice, 
      data
    );
    
    if (!result.success) {
      throw new Error(result.error);
    }
  }

  displayDevices(devices) {
    const deviceList = document.getElementById('usb-device-list');
    deviceList.innerHTML = devices.map(device => `
      <div class="device-item">
        <div>厂商: 0x${device.vendorId.toString(16)}</div>
        <div>产品: 0x${device.productId.toString(16)}</div>
        <div>地址: ${device.busNumber}-${device.deviceAddress}</div>
        <button onclick="connectToDevice('${device.id}')">连接</button>
      </div>
    `).join('');
  }

  handleReceivedData(data) {
    console.log('收到设备数据:', data);
    // 更新 UI 显示接收到的数据
    const dataDisplay = document.getElementById('received-data');
    dataDisplay.textContent = `收到数据: [${data.data.join(', ')}]`;
  }
}

// 初始化 USB 控制器
const usbController = new USBDeviceController();

// 页面加载完成后扫描设备
document.addEventListener('DOMContentLoaded', () => {
  usbController.scanDevices();
});
```

## 串口通信开发

### serialport 库使用

`serialport` 库提供跨平台的串口通信能力。

```javascript
// hardware/serialManager.js
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

class SerialManager {
  constructor() {
    this.ports = new Map();
  }

  // 获取可用串口列表
  async listPorts() {
    try {
      const ports = await SerialPort.list();
      return ports.map(port => ({
        path: port.path,
        manufacturer: port.manufacturer,
        serialNumber: port.serialNumber,
        pnpId: port.pnpId,
        locationId: port.locationId,
        vendorId: port.vendorId,
        productId: port.productId
      }));
    } catch (error) {
      console.error('获取串口列表失败:', error);
      return [];
    }
  }

  // 打开串口
  async openPort(portPath, options = {}) {
    try {
      const portOptions = {
        path: portPath,
        baudRate: options.baudRate || 9600,
        dataBits: options.dataBits || 8,
        stopBits: options.stopBits || 1,
        parity: options.parity || 'none',
        autoOpen: false
      };

      const port = new SerialPort(portOptions);
      
      // 创建解析器（按行解析）
      const parser = port.pipe(new ReadlineParser({ 
        delimiter: '\n',
        encoding: 'utf8'
      }));

      return new Promise((resolve, reject) => {
        port.open((error) => {
          if (error) {
            reject(error);
          } else {
            const portInfo = {
              port,
              parser,
              isOpen: true
            };
            
            this.ports.set(portPath, portInfo);
            
            // 设置数据接收处理
            parser.on('data', (data) => {
              this.handleDataReceived(portPath, data);
            });
            
            resolve({ success: true, portPath });
          }
        });
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 关闭串口
  async closePort(portPath) {
    const portInfo = this.ports.get(portPath);
    if (!portInfo) {
      throw new Error(`串口未找到: ${portPath}`);
    }

    return new Promise((resolve) => {
      portInfo.port.close(() => {
        this.ports.delete(portPath);
        resolve({ success: true });
      });
    });
  }

  // 向串口写入数据
  async writeData(portPath, data) {
    const portInfo = this.ports.get(portPath);
    if (!portInfo || !portInfo.isOpen) {
      throw new Error(`串口未打开: ${portPath}`);
    }

    return new Promise((resolve, reject) => {
      portInfo.port.write(data, (error) => {
        if (error) {
          reject(error);
        } else {
          // 确保数据发送完成
          portInfo.port.drain(() => {
            resolve({ success: true });
          });
        }
      });
    });
  }

  // 处理接收到的数据
  handleDataReceived(portPath, data) {
    // 通过 IPC 发送数据到渲染进程
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('hardware:serial:dataReceived', {
        portPath,
        data: data.trim()
      });
    }
  }

  // 获取端口状态
  getPortStatus(portPath) {
    const portInfo = this.ports.get(portPath);
    return portInfo ? {
      isOpen: portInfo.isOpen,
      path: portPath
    } : null;
  }
}

export default SerialManager;
```

串口功能 IPC 集成：

```javascript
// main.js - 串口功能集成
import SerialManager from './hardware/serialManager.js';

const serialManager = new SerialManager();

// 获取串口列表
ipcMain.handle('hardware:serial:listPorts', async () => {
  return await serialManager.listPorts();
});

// 打开串口
ipcMain.handle('hardware:serial:openPort', async (event, portPath, options) => {
  try {
    return await serialManager.openPort(portPath, options);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 关闭串口
ipcMain.handle('hardware:serial:closePort', async (event, portPath) => {
  try {
    return await serialManager.closePort(portPath);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 写入串口数据
ipcMain.handle('hardware:serial:writeData', async (event, portPath, data) => {
  try {
    return await serialManager.writeData(portPath, data);
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

串口操作界面示例：

```javascript
// renderer.js - 串口通信界面
class SerialPortController {
  constructor() {
    this.connectedPort = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // 刷新串口列表
    document.getElementById('refresh-ports').addEventListener('click', () => {
      this.refreshPortList();
    });

    // 连接串口
    document.getElementById('connect-port').addEventListener('click', () => {
      this.connectToPort();
    });

    // 发送数据
    document.getElementById('send-data').addEventListener('click', () => {
      this.sendData();
    });

    // 监听接收数据
    window.hardwareAPI.serial.receiveData((event, data) => {
      this.displayReceivedData(data);
    });
  }

  async refreshPortList() {
    try {
      const ports = await window.hardwareAPI.serial.listPorts();
      this.updatePortSelect(ports);
    } catch (error) {
      console.error('刷新串口列表失败:', error);
    }
  }

  updatePortSelect(ports) {
    const select = document.getElementById('port-select');
    select.innerHTML = '<option value="">选择串口</option>';
    
    ports.forEach(port => {
      const option = document.createElement('option');
      option.value = port.path;
      option.textContent = `${port.path} - ${port.manufacturer || '未知设备'}`;
      select.appendChild(option);
    });
  }

  async connectToPort() {
    const portSelect = document.getElementById('port-select');
    const portPath = portSelect.value;
    
    if (!portPath) {
      alert('请选择串口');
      return;
    }

    const baudRate = parseInt(document.getElementById('baud-rate').value) || 9600;
    
    try {
      const result = await window.hardwareAPI.serial.openPort(portPath, {
        baudRate: baudRate
      });
      
      if (result.success) {
        this.connectedPort = portPath;
        this.updateConnectionStatus(true);
      }
    } catch (error) {
      alert(`连接串口失败: ${error.message}`);
    }
  }

  async sendData() {
    if (!this.connectedPort) {
      alert('请先连接串口');
      return;
    }

    const dataInput = document.getElementById('send-data-input');
    const data = dataInput.value;
    
    if (!data) {
      alert('请输入要发送的数据');
      return;
    }

    try {
      await window.hardwareAPI.serial.writeData(this.connectedPort, data + '\n');
      dataInput.value = '';
    } catch (error) {
      alert(`发送数据失败: ${error.message}`);
    }
  }

  displayReceivedData(data) {
    const logArea = document.getElementById('receive-log');
    const timestamp = new Date().toLocaleTimeString();
    logArea.value += `[${timestamp}] ${data.data}\n`;
    logArea.scrollTop = logArea.scrollHeight;
  }

  updateConnectionStatus(connected) {
    const statusElement = document.getElementById('connection-status');
    const connectButton = document.getElementById('connect-port');
    
    if (connected) {
      statusElement.textContent = `已连接: ${this.connectedPort}`;
      statusElement.className = 'status-connected';
      connectButton.textContent = '断开连接';
      connectButton.onclick = () => this.disconnectPort();
    } else {
      statusElement.textContent = '未连接';
      statusElement.className = 'status-disconnected';
      connectButton.textContent = '连接串口';
      connectButton.onclick = () => this.connectToPort();
    }
  }

  async disconnectPort() {
    if (this.connectedPort) {
      await window.hardwareAPI.serial.closePort(this.connectedPort);
      this.connectedPort = null;
      this.updateConnectionStatus(false);
    }
  }
}

// 初始化串口控制器
const serialController = new SerialPortController();
```

## 蓝牙设备开发

### Web Bluetooth API 集成

Electron 支持 Web Bluetooth API，可以在渲染进程中直接使用。

```javascript
// hardware/bluetoothManager.js
class BluetoothManager {
  constructor() {
    this.device = null;
    this.server = null;
    this.characteristics = new Map();
  }

  // 请求蓝牙设备
  async requestDevice(options = {}) {
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: options.acceptAllDevices || true,
        optionalServices: options.services || ['generic_access', 'battery_service']
      });

      this.device = device;
      
      // 监听设备断开事件
      device.addEventListener('gattserverdisconnected', () => {
        this.handleDisconnected();
      });

      return { success: true, device: this.getDeviceInfo(device) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 连接蓝牙设备
  async connect() {
    if (!this.device) {
      throw new Error('没有选择的设备');
    }

    try {
      this.server = await this.device.gatt.connect();
      
      // 获取所有服务
      const services = await this.server.getPrimaryServices();
      const serviceInfo = [];
      
      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        serviceInfo.push({
          uuid: service.uuid,
          characteristics: characteristics.map(char => ({
            uuid: char.uuid,
            properties: this.getCharacteristicProperties(char)
          }))
        });
      }
      
      return { 
        success: true, 
        services: serviceInfo 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 读取特征值
  async readCharacteristic(serviceUuid, characteristicUuid) {
    const service = await this.server.getPrimaryService(serviceUuid);
    const characteristic = await service.getCharacteristic(characteristicUuid);
    
    const value = await characteristic.readValue();
    return {
      success: true,
      value: Array.from(new Uint8Array(value.buffer))
    };
  }

  // 写入特征值
  async writeCharacteristic(serviceUuid, characteristicUuid, data) {
    const service = await this.server.getPrimaryService(serviceUuid);
    const characteristic = await service.getCharacteristic(characteristicUuid);
    
    await characteristic.writeValue(new Uint8Array(data));
    return { success: true };
  }

  // 启动特征值通知
  async startNotifications(serviceUuid, characteristicUuid, callback) {
    const service = await this.server.getPrimaryService(serviceUuid);
    const characteristic = await service.getCharacteristic(characteristicUuid);
    
    await characteristic.startNotifications();
    
    characteristic.addEventListener('characteristicvaluechanged', (event) => {
      const value = event.target.value;
      callback(Array.from(new Uint8Array(value.buffer)));
    });
    
    return { success: true };
  }

  // 断开连接
  disconnect() {
    if (this.device && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.server = null;
    this.characteristics.clear();
  }

  getDeviceInfo(device) {
    return {
      id: device.id,
      name: device.name || '未知设备',
      gattConnected: device.gatt?.connected || false
    };
  }

  getCharacteristicProperties(characteristic) {
    const props = [];
    if (characteristic.properties.read) props.push('read');
    if (characteristic.properties.write) props.push('write');
    if (characteristic.properties.notify) props.push('notify');
    if (characteristic.properties.indicate) props.push('indicate');
    return props;
  }

  handleDisconnected() {
    console.log('蓝牙设备已断开');
    // 通知渲染进程设备已断开
    const event = new CustomEvent('bluetoothDisconnected');
    window.dispatchEvent(event);
  }
}
```

蓝牙设备界面控制：

```javascript
// renderer.js - 蓝牙设备控制
class BluetoothController {
  constructor() {
    this.bluetoothManager = new BluetoothManager();
    this.connected = false;
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.getElementById('scan-bluetooth').addEventListener('click', () => {
      this.scanDevices();
    });

    document.getElementById('connect-bluetooth').addEventListener('click', () => {
      this.connectDevice();
    });

    document.getElementById('disconnect-bluetooth').addEventListener('click', () => {
      this.disconnectDevice();
    });

    // 监听设备断开事件
    window.addEventListener('bluetoothDisconnected', () => {
      this.handleDisconnected();
    });
  }

  async scanDevices() {
    try {
      const result = await this.bluetoothManager.requestDevice({
        acceptAllDevices: true,
        services: ['battery_service', 'device_information']
      });

      if (result.success) {
        this.updateDeviceInfo(result.device);
      } else {
        alert('扫描设备失败: ' + result.error);
      }
    } catch (error) {
      alert('蓝牙扫描错误: ' + error.message);
    }
  }

  async connectDevice() {
    try {
      const result = await this.bluetoothManager.connect();
      
      if (result.success) {
        this.connected = true;
        this.updateConnectionStatus(true);
        this.displayServices(result.services);
      } else {
        alert('连接失败: ' + result.error);
      }
    } catch (error) {
      alert('连接错误: ' + error.message);
    }
  }

  disconnectDevice() {
    this.bluetoothManager.disconnect();
    this.handleDisconnected();
  }

  handleDisconnected() {
    this.connected = false;
    this.updateConnectionStatus(false);
    this.clearServices();
  }

  updateDeviceInfo(device) {
    const deviceInfo = document.getElementById('bluetooth-device-info');
    deviceInfo.innerHTML = `
      <div>设备名称: ${device.name}</div>
      <div>设备ID: ${device.id}</div>
      <div>连接状态: ${device.gattConnected ? '已连接' : '未连接'}</div>
    `;
  }

  updateConnectionStatus(connected) {
    const statusElement = document.getElementById('bluetooth-status');
    const connectButton = document.getElementById('connect-bluetooth');
    const disconnectButton = document.getElementById('disconnect-bluetooth');

    if (connected) {
      statusElement.textContent = '已连接';
      statusElement.className = 'status-connected';
      connectButton.disabled = true;
      disconnectButton.disabled = false;
    } else {
      statusElement.textContent = '未连接';
      statusElement.className = 'status-disconnected';
      connectButton.disabled = false;
      disconnectButton.disabled = true;
    }
  }

  displayServices(services) {
    const servicesContainer = document.getElementById('bluetooth-services');
    
    servicesContainer.innerHTML = services.map(service => `
      <div class="service-item">
        <div class="service-uuid">服务: ${service.uuid}</div>
        <div class="characteristics">
          ${service.characteristics.map(char => `
            <div class="characteristic">
              <span>特征: ${char.uuid}</span>
              <span>属性: [${char.properties.join(', ')}]</span>
              <button onclick="readCharacteristic('${service.uuid}', '${char.uuid}')">
                读取
              </button>
              ${char.properties.includes('notify') ? `
                <button onclick="startNotifications('${service.uuid}', '${char.uuid}')">
                  监听
                </button>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  clearServices() {
    document.getElementById('bluetooth-services').innerHTML = '';
    document.getElementById('bluetooth-device-info').innerHTML = '';
  }

  // 读取特征值
  async readCharacteristic(serviceUuid, characteristicUuid) {
    try {
      const result = await this.bluetoothManager.readCharacteristic(
        serviceUuid, 
        characteristicUuid
      );
      
      if (result.success) {
        this.displayCharacteristicValue(serviceUuid, characteristicUuid, result.value);
      }
    } catch (error) {
      console.error('读取特征值失败:', error);
    }
  }

  // 启动通知
  async startNotifications(serviceUuid, characteristicUuid) {
    try {
      await this.bluetoothManager.startNotifications(
        serviceUuid,
        characteristicUuid,
        (value) => {
          this.displayNotificationValue(serviceUuid, characteristicUuid, value);
        }
      );
    } catch (error) {
      console.error('启动通知失败:', error);
    }
  }

  displayCharacteristicValue(serviceUuid, characteristicUuid, value) {
    const logArea = document.getElementById('bluetooth-log');
    const timestamp = new Date().toLocaleTimeString();
    logArea.value += `[${timestamp}] 读取 ${characteristicUuid}: [${value.join(', ')}]\n`;
    logArea.scrollTop = logArea.scrollHeight;
  }

  displayNotificationValue(serviceUuid, characteristicUuid, value) {
    const logArea = document.getElementById('bluetooth-log');
    const timestamp = new Date().toLocaleTimeString();
    logArea.value += `[${timestamp}] 通知 ${characteristicUuid}: [${value.join(', ')}]\n`;
    logArea.scrollTop = logArea.scrollHeight;
  }
}

// 初始化蓝牙控制器
const bluetoothController = new BluetoothController();
```

## 摄像头和麦克风访问

### 媒体设备访问

Electron 支持通过 WebRTC API 访问摄像头和麦克风。

```javascript
// hardware/mediaManager.js
class MediaManager {
  constructor() {
    this.mediaStream = null;
    this.recorder = null;
    this.recordedChunks = [];
  }

  // 获取媒体设备列表
  async getMediaDevices() {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      return {
        audioInputs: devices.filter(device => device.kind === 'audioinput'),
        videoInputs: devices.filter(device => device.kind === 'videoinput'),
        audioOutputs: devices.filter(device => device.kind === 'audiooutput')
      };
    } catch (error) {
      console.error('获取媒体设备失败:', error);
      return { audioInputs: [], videoInputs: [], audioOutputs: [] };
    }
  }

  // 启动摄像头
  async startCamera(deviceId = null, constraints = {}) {
    try {
      const videoConstraints = {
        width: constraints.width || 1280,
        height: constraints.height || 720,
        frameRate: constraints.frameRate || 30,
        deviceId: deviceId ? { exact: deviceId } : undefined
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: constraints.audio || false
      });

      return { success: true, stream: this.mediaStream };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 启动麦克风
  async startMicrophone(deviceId = null, constraints = {}) {
    try {
      const audioConstraints = {
        sampleRate: constraints.sampleRate || 44100,
        channelCount: constraints.channelCount || 2,
        deviceId: deviceId ? { exact: deviceId } : undefined,
        echoCancellation: constraints.echoCancellation || true,
        noiseSuppression: constraints.noiseSuppression || true
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
        video: false
      });

      return { success: true, stream: this.mediaStream };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 开始录制
  async startRecording(options = {}) {
    if (!this.mediaStream) {
      throw new Error('没有可用的媒体流');
    }

    try {
      this.recordedChunks = [];
      
      this.recorder = new MediaRecorder(this.mediaStream, {
        mimeType: options.mimeType || 'video/webm;codecs=vp9',
        videoBitsPerSecond: options.videoBitsPerSecond || 2500000,
        audioBitsPerSecond: options.audioBitsPerSecond || 128000
      });

      this.recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.recorder.onstop = () => {
        this.handleRecordingStopped();
      };

      this.recorder.start(1000); // 每1秒收集一次数据
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 停止录制
  stopRecording() {
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.stop();
    }
  }

  // 停止所有媒体流
  stopAll() {
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.stop();
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => {
        track.stop();
      });
      this.mediaStream = null;
    }
  }

  // 处理录制完成
  handleRecordingStopped() {
    const blob = new Blob(this.recordedChunks, { 
      type: this.recorder.mimeType 
    });
    
    const url = URL.createObjectURL(blob);
    
    // 触发下载或播放
    const event = new CustomEvent('recordingCompleted', {
      detail: { url, blob, mimeType: this.recorder.mimeType }
    });
    window.dispatchEvent(event);
  }

  // 捕获当前帧
  captureFrame(canvasElement) {
    if (!this.mediaStream) {
      throw new Error('没有可用的视频流');
    }

    const videoTrack = this.mediaStream.getVideoTracks()[0];
    const imageCapture = new ImageCapture(videoTrack);
    
    return imageCapture.grabFrame().then((imageBitmap) => {
      const context = canvasElement.getContext('2d');
      canvasElement.width = imageBitmap.width;
      canvasElement.height = imageBitmap.height;
      context.drawImage(imageBitmap, 0, 0);
      
      return canvasElement.toDataURL('image/png');
    });
  }
}
```

媒体设备控制界面：

```javascript
// renderer.js - 媒体设备控制
class MediaController {
  constructor() {
    this.mediaManager = new MediaManager();
    this.isRecording = false;
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.getElementById('refresh-media-devices').addEventListener('click', () => {
      this.refreshMediaDevices();
    });

    document.getElementById('start-camera').addEventListener('click', () => {
      this.startCamera();
    });

    document.getElementById('stop-camera').addEventListener('click', () => {
      this.stopCamera();
    });

    document.getElementById('start-recording').addEventListener('click', () => {
      this.toggleRecording();
    });

    document.getElementById('capture-frame').addEventListener('click', () => {
      this.captureFrame();
    });

    // 监听录制完成事件
    window.addEventListener('recordingCompleted', (event) => {
      this.handleRecordingCompleted(event.detail);
    });
  }

  async refreshMediaDevices() {
    try {
      const devices = await this.mediaManager.getMediaDevices();
      this.updateDeviceSelects(devices);
    } catch (error) {
      console.error('刷新媒体设备失败:', error);
    }
  }

  updateDeviceSelects(devices) {
    const videoSelect = document.getElementById('video-device-select');
    const audioSelect = document.getElementById('audio-device-select');
    
    videoSelect.innerHTML = '<option value="">默认摄像头</option>';
    audioSelect.innerHTML = '<option value="">默认麦克风</option>';
    
    devices.videoInputs.forEach(device => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.textContent = device.label || `摄像头 ${videoSelect.children.length}`;
      videoSelect.appendChild(option);
    });
    
    devices.audioInputs.forEach(device => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.textContent = device.label || `麦克风 ${audioSelect.children.length}`;
      audioSelect.appendChild(option);
    });
  }

  async startCamera() {
    const videoDevice = document.getElementById('video-device-select').value;
    const audioDevice = document.getElementById('audio-device-select').value;
    
    const constraints = {
      width: 1280,
      height: 720,
      frameRate: 30,
      audio: !!audioDevice
    };

    try {
      const result = await this.mediaManager.startCamera(
        videoDevice || null, 
        constraints
      );
      
      if (result.success) {
        this.setupVideoElement(result.stream);
        this.updateCameraControls(true);
      } else {
        alert('启动摄像头失败: ' + result.error);
      }
    } catch (error) {
      alert('摄像头错误: ' + error.message);
    }
  }

  stopCamera() {
    this.mediaManager.stopAll();
    this.updateCameraControls(false);
    
    const videoElement = document.getElementById('camera-preview');
    videoElement.srcObject = null;
    
    if (this.isRecording) {
      this.toggleRecording();
    }
  }

  setupVideoElement(stream) {
    const videoElement = document.getElementById('camera-preview');
    videoElement.srcObject = stream;
    videoElement.play();
  }

  async toggleRecording() {
    if (!this.isRecording) {
      // 开始录制
      const result = await this.mediaManager.startRecording();
      if (result.success) {
        this.isRecording = true;
        this.updateRecordingButton(true);
      }
    } else {
      // 停止录制
      this.mediaManager.stopRecording();
      this.isRecording = false;
      this.updateRecordingButton(false);
    }
  }

  async captureFrame() {
    const canvas = document.getElementById('capture-canvas');
    
    try {
      const dataUrl = await this.mediaManager.captureFrame(canvas);
      this.displayCapturedImage(dataUrl);
    } catch (error) {
      alert('捕获画面失败: ' + error.message);
    }
  }

  displayCapturedImage(dataUrl) {
    const container = document.getElementById('captured-images');
    const img = document.createElement('img');
    img.src = dataUrl;
    img.style.maxWidth = '200px';
    img.style.margin = '5px';
    container.appendChild(img);
  }

  handleRecordingCompleted(detail) {
    // 创建下载链接
    const a = document.createElement('a');
    a.href = detail.url;
    a.download = `recording-${new Date().getTime()}.webm`;
    a.textContent = '下载录制视频';
    
    const container = document.getElementById('recordings-container');
    container.appendChild(a);
    container.appendChild(document.createElement('br'));
    
    // 自动下载
    a.click();
  }

  updateCameraControls(started) {
    const startButton = document.getElementById('start-camera');
    const stopButton = document.getElementById('stop-camera');
    const recordButton = document.getElementById('start-recording');
    const captureButton = document.getElementById('capture-frame');
    
    startButton.disabled = started;
    stopButton.disabled = !started;
    recordButton.disabled = !started;
    captureButton.disabled = !started;
  }

  updateRecordingButton(recording) {
    const button = document.getElementById('start-recording');
    button.textContent = recording ? '停止录制' : '开始录制';
    button.className = recording ? 'recording' : '';
  }
}

// 初始化媒体控制器
const mediaController = new MediaController();
```

## 硬件功能项目结构

推荐的硬件功能项目组织结构：

```
electron-hardware-app/
├── package.json
├── main.js
├── preload.js
├── src/
│   ├── hardware/
│   │   ├── managers/
│   │   │   ├── usbManager.js
│   │   │   ├── serialManager.js
│   │   │   ├── bluetoothManager.js
│   │   │   └── mediaManager.js
│   │   ├── drivers/
│   │   │   ├── customUSBDriver.js
│   │   │   └── deviceProtocols.js
│   │   ├── utils/
│   │   │   ├── bufferUtils.js
│   │   │   ├── dataParser.js
│   │   │   └── errorHandler.js
│   │   └── constants/
│   │       ├── usbConstants.js
│   │       └── serialConstants.js
│   ├── renderer/
│   │   ├── controllers/
│   │   │   ├── usbController.js
│   │   │   ├── serialController.js
│   │   │   ├── bluetoothController.js
│   │   │   └── mediaController.js
│   │   ├── components/
│   │   │   ├── DeviceList.js
│   │   │   ├── DataMonitor.js
│   │   │   └── ConnectionStatus.js
│   │   └── utils/
│   │       ├── uiHelpers.js
│   │       └── dataFormatters.js
│   └── shared/
│       ├── ipcChannels.js
│       └── eventTypes.js
├── assets/
│   ├── icons/
│   └── device-profiles/
└── build/
    ├── native-modules/
    └── drivers/
```

## 硬件访问权限配置

在不同平台上，硬件访问可能需要特定的权限配置：

```javascript
// package.json - 硬件权限配置
{
  "name": "electron-hardware-app",
  "version": "1.0.0",
  "description": "Electron 硬件功能应用",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder",
    "rebuild": "electron-rebuild"
  },
  "build": {
    "appId": "com.example.hardwareapp",
    "productName": "硬件控制应用",
    "directories": {
      "output": "dist"
    },
    "files": [
      "src/**/*",
      "main.js",
      "preload.js",
      "package.json"
    ],
    "mac": {
      "category": "public.app-category.developer-tools",
      "entitlements": "build/entitlements.mac.plist",
      "extendInfo": {
        "com.apple.security.device.usb": true,
        "com.apple.security.device.bluetooth": true,
        "com.apple.security.device.audio-input": true,
        "com.apple.security.device.camera": true
      }
    },
    "win": {
      "target": "nsis",
      "requestedExecutionLevel": "requireAdministrator"
    },
    "linux": {
      "category": "Development",
      "target": "AppImage"
    }
  },
  "dependencies": {
    "usb": "^2.5.0",
    "serialport": "^10.5.0",
    "@serialport/parser-readline": "^10.5.0",
    "node-hid": "^2.1.1",
    "node-bluetooth": "^1.2.6"
  },
  "devDependencies": {
    "electron": "^22.0.0",
    "electron-builder": "^23.6.0",
    "electron-rebuild": "^3.2.9"
  }
}
```