# API 接口文档

本文档描述 AI-CRM 系统提供的 REST API 接口。

## 基础信息

- **Base URL**: `http://localhost:3001`
- **Content-Type**: `application/json`
- **字符编码**: `UTF-8`

## 认证

系统使用简单的 token 认证机制。登录成功后，服务端返回 token，前端需在后续请求的 header 中携带该 token（当前版本尚未强制验证，建议后续完善）。

## API 接口列表

### 1. 认证相关

#### 1.1 用户登录

- **URL**: `POST /api/auth/login`
- **描述**: 管理员登录
- **请求参数**:
  ```json
  {
    "username": "admin",
    "password": "admin123"
  }
  ```
- **响应示例**:
  ```json
  {
    "success": true,
    "user": {
      "id": 1,
      "name": "admin"
    },
    "token": "YWRtaW46MTcwMDAwMDAwMDAw..."
  }
  ```

#### 1.2 用户登出

- **URL**: `POST /api/auth/logout`
- **描述**: 退出登录

---

### 2. 客户管理

#### 2.1 获取所有客户

- **URL**: `GET /api/customers`
- **描述**: 获取客户列表
- **响应示例**:
  ```json
  [
    {
      "id": 1,
      "name": "张三",
      "phone": "13800138000",
      "email": "zhangsan@example.com",
      "company": "创新科技有限公司",
      ...
    }
  ]
  ```

#### 2.2 获取单个客户详情

- **URL**: `GET /api/customers/:id`
- **描述**: 根据客户 ID 获取详细信息
- **响应示例**:
  ```json
  {
    "id": 1,
    "name": "张三",
    "gender": "男",
    "birthday": "1990-01-01",
    "phone": "13800138000",
    ...
  }
  ```

#### 2.3 创建客户

- **URL**: `POST /api/customers`
- **描述**: 新建客户
- **请求参数**:
  ```json
  {
    "name": "客户姓名",
    "phone": "手机号",
    "email": "邮箱",
    "company": "公司名称",
    ...
  }
  ```
- **响应示例**:
  ```json
  {
    "id": 10,
    "name": "客户姓名",
    ...
  }
  ```

#### 2.4 更新客户

- **URL**: `PUT /api/customers/:id`
- **描述**: 更新客户信息

#### 2.5 删除客户

- **URL**: `DELETE /api/customers/:id`
- **描述**: 删除指定客户及其关联的回访、产品记录

---

### 3. 回访管理

#### 3.1 获取回访记录

- **URL**: `GET /api/visits`
- **查询参数**:
  - `customerId`: 可选，根据客户 ID 过滤
- **响应示例**:
  ```json
  [
    {
      "id": 1,
      "customerId": 1,
      "customerName": "张三",
      "visitTime": "2024-01-01T10:30:00",
      "content": "跟进采购需求",
      ...
    }
  ]
  ```

#### 3.2 获取单个回访记录

- **URL**: `GET /api/visits/:id`

#### 3.3 创建回访记录

- **URL**: `POST /api/visits`
- **请求参数**:
  ```json
  {
    "customerId": 1,
    "visitTime": "2024-01-10T14:00:00",
    "content": "电话回访",
    "effect": "良好",
    "satisfaction": "满意",
    "intention": "A",
    "followUp": "继续跟进"
  }
  ```

#### 3.4 更新回访记录

- **URL**: `PUT /api/visits/:id`

#### 3.5 删除回访记录

- **URL**: `DELETE /api/visits/:id`

---

### 4. 产品订单管理

#### 4.1 获取产品记录

- **URL**: `GET /api/products`
- **查询参数**:
  - `customerId`: 可选，根据客户 ID 过滤

#### 4.2 获取单个产品记录

- **URL**: `GET /api/products/:id`

#### 4.3 创建产品记录

- **URL**: `POST /api/products`
- **请求参数**:
  ```json
  {
    "customerId": 1,
    "productName": "产品名称",
    "quantity": 10,
    "price": 200.0,
    "purchaseDate": "2024-01-01",
    "afterSale": "1年质保",
    "followUpDate": "2024-04-01"  // 可选，默认为购买日期+90天
  }
  ```

#### 4.4 更新产品记录

- **URL**: `PUT /api/products/:id`

#### 4.5 删除产品记录

- **URL**: `DELETE /api/products/:id`

#### 4.6 产品统计数据

- **URL**: `GET /api/products/statistics/summary`
- **描述**: 获取产品销售统计

---

### 5. 仪表盘统计

#### 5.1 获取仪表盘统计数据

- **URL**: `GET /api/dashboard/statistics`
- **描述**: 返回月度销售额、订单数、新增客户、回访数、提醒等数据
- **响应示例**:
  ```json
  {
    "monthlySalesAmount": 10000,
    "monthlyOrderCount": 50,
    "averageOrderValue": 200,
    "monthlyNewCustomers": 10,
    "monthlyVisitCount": 30,
    "monthlyDealCustomers": 15,
    "intentionDistribution": {
      "H": 5,
      "A": 10,
      "B": 15,
      "C": 20,
      "D": 5
    },
    "importantReminders": [...]
  }
  ```

---

### 6. 预设数据管理

#### 6.1 客户分类

- `GET /api/customer-categories` - 获取所有分类
- `POST /api/customer-categories` - 创建分类
- `PUT /api/customer-categories/:id` - 更新分类
- `DELETE /api/customer-categories/:id` - 删除分类
- `POST /api/customer-categories/reorder` - 重新排序

#### 6.2 客户意向等级

- `GET /api/customer-intentions`
- `POST /api/customer-intentions`
- `PUT /api/customer-intentions/:level`
- `DELETE /api/customer-intentions/:level`
- `POST /api/customer-intentions/reorder`

#### 6.3 地区管理

- `GET /api/regions`
- `POST /api/regions`
- `PUT /api/regions/:id`
- `DELETE /api/regions/:id`
- `POST /api/regions/reorder`

#### 6.4 预算范围

- `GET /api/budget-ranges`
- `POST /api/budget-ranges`
- `PUT /api/budget-ranges/:id`
- `DELETE /api/budget-ranges/:id`
- `POST /api/budget-ranges/reorder`

#### 6.5 上级/下级联系人

- `GET /api/superior-contacts`
- `POST /api/superior-contacts`
- `PUT /api/superior-contacts/:id`
- `DELETE /api/superior-contacts/:id`
- `POST /api/superior-contacts/reorder`

- `GET /api/subordinate-contacts`
- `POST /api/subordinate-contacts`
- `PUT /api/subordinate-contacts/:id`
- `DELETE /api/subordinate-contacts/:id`
- `POST /api/subordinate-contacts/reorder`

#### 6.6 预设产品

- `GET /api/preset-products`
- `POST /api/preset-products`
- `PUT /api/preset-products/:id`
- `DELETE /api/preset-products/:id`
- `POST /api/preset-products/reorder`

#### 6.7 回访方式/类型

- `GET /api/visit-methods`
- `POST /api/visit-methods`
- `PUT /api/visit-methods/:id`
- `DELETE /api/visit-methods/:id`

- `GET /api/visit-types`
- `POST /api/visit-types`
- `PUT /api/visit-types/:id`
- `DELETE /api/visit-types/:id`

#### 6.8 导航模式

- `GET /api/navigation-modes`
- `POST /api/navigation-modes`
- `PUT /api/navigation-modes/:id`
- `DELETE /api/navigation-modes/:id`
- `POST /api/navigation-modes/reorder`

#### 6.9 提醒周期

- `GET /api/reminder-cycles`
- `POST /api/reminder-cycles`
- `PUT /api/reminder-cycles/:id`
- `DELETE /api/reminder-cycles/:id`

---

### 7. 用户设置

#### 7.1 获取用户设置

- **URL**: `GET /api/user-settings`

#### 7.2 更新用户设置

- **URL**: `PUT /api/user-settings`
- **请求参数**:
  ```json
  {
    "darkMode": true,
    "visitReminder": true,
    "birthdayReminder": false,
    "language": "zh-CN"
  }
  ```

#### 7.3 更新深色模式

- **URL**: `PUT /api/user-settings/dark-mode`
- **请求参数**: `{ "enabled": true }`

#### 7.4 更新通知设置

- **URL**: `PUT /api/user-settings/notification`
- **请求参数**: `{ "type": "visitReminder", "enabled": true }`

---

### 8. 数据管理

#### 8.1 备份数据

- **URL**: `POST /api/backup`
- **描述**: 备份数据库，返回备份文件名

#### 8.2 恢复数据

- **URL**: `POST /api/restore`
- **请求参数**: `{ "fileName": "backup_xxxx.db" }`（可选，不提供则恢复最新备份）

#### 8.3 清空所有数据

- **URL**: `POST /api/clear-data`
- **描述**: 清空客户、产品、回访数据（危险操作）

#### 8.4 删除所有数据

- **URL**: `DELETE /api/data/delete-all`
- **描述**: 删除所有客户、产品、回访记录

---

### 9. 管理员管理

#### 9.1 修改管理员密码

- **URL**: `POST /api/managers/change-password`
- **请求参数**:
  ```json
  {
    "currentPassword": "admin123",
    "newPassword": "newpassword"
  }
  ```

---

### 10. 其他

#### 10.1 检查更新

- **URL**: `GET /api/check-update`
- **描述**: 检查系统是否有新版本（当前为模拟数据）

---

## 错误处理

所有 API 在发生错误时返回统一格式：

```json
{
  "error": "错误描述信息"
}
```

HTTP 状态码：
- `200` - 成功
- `400` - 请求参数错误
- `401` - 未授权
- `404` - 资源不存在
- `500` - 服务器内部错误

---

## 注意事项

1. 所有日期字段格式为 ISO 8601，如 `2024-01-01` 或 `2024-01-01T10:30:00`
2. 部分接口（如删除）为危险操作，建议在使用前备份数据
3. 当前版本的 token 验证机制较简单，生产环境建议加强
