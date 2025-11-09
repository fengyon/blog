# Angular 表单

## 表单概述

Angular 提供两种表单构建方式：模板驱动表单和响应式表单，用于处理用户输入、验证和数据管理。

示意图：
```
Angular 表单类型：
┌─────────────────┐          ┌─────────────────┐
│  模板驱动表单     │          │   响应式表单     │
│  - 简单场景      │          │  - 复杂场景      │
│  - 模板中定义    │          │  - 组件中定义    │
│  - 隐式创建      │          │  - 显式创建      │
└─────────────────┘          └─────────────────┘
```

## 模板驱动表单

### 基本概念
在模板中通过指令定义表单结构和验证规则。

示意图：
```
模板驱动流程：
模板指令 → Angular自动创建表单模型 → 数据绑定

核心指令：
ngModel - 双向数据绑定
ngModelGroup - 分组管理
模板引用变量 - 访问表单状态
```

### 表单设置
使用 FormsModule 并定义表单结构。

示意图：
```
模块导入：
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [FormsModule]
})

模板结构：
<form #myForm="ngForm" (ngSubmit)="onSubmit(myForm)">
  <input name="username" ngModel required>
  <button type="submit">提交</button>
</form>
```

### 数据绑定
使用 ngModel 实现双向数据绑定。

示意图：
```
双向绑定：
组件属性 ←→ [(ngModel)] ←→ 表单输入

示例：
<input [(ngModel)]="user.name" name="name">

等价于：
<input [ngModel]="user.name" (ngModelChange)="user.name = $event" name="name">
```

## 响应式表单

### 基本概念
在组件类中显式创建和管理表单模型。

示意图：
```
响应式流程：
组件创建表单模型 → 模板绑定 → 响应式更新

核心类：
FormControl - 单个表单控件
FormGroup - 表单组
FormArray - 动态表单数组
```

### 表单构建
使用 ReactiveFormsModule 并在组件中构建表单。

示意图：
```
模块导入：
import { ReactiveFormsModule } from '@angular/forms';

表单构建：
this.userForm = new FormGroup({
  name: new FormControl('', Validators.required),
  email: new FormControl('', [Validators.required, Validators.email])
});

模板绑定：
<form [formGroup]="userForm" (ngSubmit)="onSubmit()">
  <input formControlName="name">
  <input formControlName="email">
</form>
```

## 表单验证

### 内置验证器
Angular 提供常用的验证规则。

示意图：
```
内置验证器：
Required - 必填字段
MinLength - 最小长度
MaxLength - 最大长度
Pattern - 正则匹配
Email - 邮箱格式

使用方式：
模板驱动: required, minlength="3"
响应式: Validators.required, Validators.minLength(3)
```

### 验证状态
通过表单控件的状态属性检查验证结果。

示意图：
```
控件状态：
valid - 验证通过
invalid - 验证失败
pending - 异步验证中
disabled - 禁用状态

触摸状态：
pristine - 未修改过
dirty - 已修改
touched - 获得过焦点
untouched - 未获得焦点
```

### 验证显示
在模板中根据验证状态显示错误信息。

示意图：
```
验证提示：
<input [class.error]="name.invalid && name.touched">
<div *ngIf="name.errors?.['required'] && name.touched">
  用户名是必填项
</div>

状态组合：
invalid + touched → 显示错误信息
```

## 表单控件

### FormControl
管理单个表单控件的值和状态。

示意图：
```
FormControl 组成：
┌─────────────────┐
│   FormControl   │
├─────────────────┤
│   value         │ - 当前值
│   status        │ - 验证状态
│   errors        │ - 错误信息
│   validators    │ - 验证规则
└─────────────────┘
```

### FormGroup
管理一组相关表单控件。

示意图：
```
FormGroup 结构：
userForm: FormGroup
├── name: FormControl
├── email: FormControl  
└── address: FormGroup
    ├── street: FormControl
    └── city: FormControl

取值：
userForm.value → { name: '', email: '', address: { street: '', city: '' } }
```

### FormArray
管理动态数量的表单控件。

示意图：
```
FormArray 示例：
hobbies: FormArray = new FormArray([
  new FormControl(''),
  new FormControl('')
]);

动态操作：
addHobby() {
  this.hobbies.push(new FormControl(''));
}

removeHobby(index: number) {
  this.hobbies.removeAt(index);
}
```

## 高级表单功能

### 自定义验证器
创建特定业务规则的验证器。

示意图：
```
自定义验证器：
函数接收 FormControl → 验证逻辑 → 返回错误对象或null

示例：
function passwordMatch(control: FormControl) {
  const password = control.root.get('password');
  const confirm = control;
  
  if (password && confirm && password.value !== confirm.value) {
    return { passwordMismatch: true };
  }
  return null;
}
```

### 异步验证器
执行服务器端验证等异步操作。

示意图：
```
异步验证流程：
用户输入 → 触发异步验证 → 显示验证中状态 → 返回验证结果

示例：
this.email = new FormControl('', null, [emailExistsValidator]);

验证器：
function emailExistsValidator(control: FormControl): Observable {
  return this.api.checkEmail(control.value).pipe(
    map(exists => exists ? { emailExists: true } : null)
  );
}
```

### 动态表单
根据条件动态添加或移除表单控件。

示意图：
```
动态表单构建：
用户选择 → 条件判断 → 动态修改表单结构

示例：
// 添加手机号字段
if (user.needsPhone) {
  this.userForm.addControl('phone', new FormControl(''));
}

// 移除地址字段
this.userForm.removeControl('address');
```

## 表单数据操作

### 值变化监听
监听表单值的变化并执行相应操作。

示意图：
```
值监听：
表单值变化 → 触发监听 → 更新相关状态

响应式表单：
this.userForm.valueChanges.subscribe(value => {
  console.log('表单值变化:', value);
});

模板驱动表单：
<input [(ngModel)]="user.name" (ngModelChange)="onNameChange($event)">
```

### 表单状态监听
监听表单的验证状态和交互状态。

示意图：
```
状态监听：
状态变化 → 触发监听 → 更新UI

示例：
this.userForm.statusChanges.subscribe(status => {
  this.formStatus = status;
});
```

## 表单提交与重置

### 数据提交
处理表单提交，包括数据验证和清理。

示意图：
```
提交流程：
用户提交 → 验证检查 → 数据处理 → API调用

示例：
onSubmit() {
  if (this.userForm.valid) {
    const formData = this.userForm.value;
    this.service.saveUser(formData).subscribe();
  } else {
    this.markAllAsTouched();
  }
}
```

### 表单重置
重置表单到初始状态或特定值。

示意图：
```
重置操作：
用户操作 → 重置表单 → 清除状态

响应式表单：
this.userForm.reset(); // 重置为空
this.userForm.reset(initialData); // 重置为初始数据

模板驱动表单：
<form #myForm="ngForm" (reset)="myForm.reset()">
```

## 表单优化

### 性能考虑
大型表单的性能优化策略。

示意图：
```
优化策略：
├── 使用 OnPush 变更检测
├── 异步验证防抖
├── 大型表单分页
├── 延迟加载表单部分
└── 避免不必要的值监听
```

### 用户体验
提升用户填写表单的体验。

示意图：
```
UX 改进：
├── 清晰的验证提示
├── 适当的字段分组
├── 智能默认值
├── 自动保存草稿
└── 进度指示器
```

## 表单测试

### 单元测试
验证表单逻辑和验证规则。

示意图：
```
测试策略：
创建表单 → 设置值 → 检查状态 → 验证行为

示例：
it('应该验证必填字段', () => {
  const control = new FormControl('', Validators.required);
  control.setValue('');
  expect(control.valid).toBeFalse();
});
```

### 集成测试
测试表单在模板中的完整行为。

示意图：
```
集成测试：
渲染组件 → 用户交互 → 验证结果

示例：
it('应该提交有效表单', async(() => {
  const input = fixture.debugElement.query(By.css('input'));
  input.nativeElement.value = 'test';
  input.nativeElement.dispatchEvent(new Event('input'));
  
  fixture.detectChanges();
  
  const form = fixture.debugElement.query(By.css('form'));
  form.triggerEventHandler('submit', null);
  
  expect(component.submitted).toBeTrue();
}));
```