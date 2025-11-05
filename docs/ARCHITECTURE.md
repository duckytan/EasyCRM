# 项目架构说明

## 架构概览

本项目采用分层架构模式，将业务逻辑、数据访问和路由处理清晰分离。

```
┌─────────────────────────────────────┐
│         客户端（浏览器）              │
└─────────────────┬───────────────────┘
                  │ HTTP/JSON
┌─────────────────▼───────────────────┐
│      Express 中间件层                │
│  ├─ CORS                            │
│  ├─ 请求日志                         │
│  ├─ 输入验证                         │
│  ├─ 认证/授权                        │
│  └─ 错误处理                         │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│         路由层 (Routes)              │
│  处理 HTTP 请求和响应                │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│       控制器层 (Controllers)         │
│  业务流程编排、参数处理               │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│        服务层 (Services)             │
│  业务逻辑实现、事务管理               │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│       数据访问层 (Database)          │
│  SQL 查询、数据持久化                │
└─────────────────────────────────────┘
```

## 目录结构详解

```
src/
├── app.js                  # Express 应用初始化和中间件配置
├── config/                 # 配置管理
│   └── index.js           # 环境变量、路径配置
├── database/              # 数据库层
│   ├── connection.js      # 数据库连接单例
│   ├── setup.js          # 表结构和初始化
│   └── index.js          # 数据库模块导出
├── middlewares/           # 中间件
│   ├── auth.js           # 认证中间件
│   ├── errorHandler.js   # 错误处理
│   ├── logger.js         # 日志记录 ⭐新增⭐
│   └── validator.js      # 输入验证 ⭐新增⭐
├── controllers/           # 控制器层 ⭐新增⭐
│   └── customerController.js
├── services/              # 服务层 ⭐新增⭐
│   └── customerService.js
├── routes/                # 路由层
│   ├── index.js          # 路由注册中心
│   ├── customers.js      # 客户路由（原版）
│   ├── customers-v2.js   # 客户路由（使用 Controller/Service）⭐新增⭐
│   └── [其他路由...]
└── utils/                 # 工具函数
    └── fs.js
```

## 各层职责

### 1. 路由层 (Routes)

**职责**：
- 定义 API 端点
- 绑定 HTTP 方法和路径
- 调用控制器或直接处理简单逻辑

**示例**：
```javascript
// 传统方式（适合简单 CRUD）
app.get('/api/customers', (req, res) => {
  db.all('SELECT * FROM Customers', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 使用 Controller/Service（适合复杂业务）
app.get('/api/v2/customers', asyncHandler(async (req, res) => {
  await controller.getAllCustomers(req, res);
}));
```

### 2. 控制器层 (Controllers)

**职责**：
- 接收和解析请求参数
- 调用服务层处理业务逻辑
- 格式化响应数据
- 处理 HTTP 状态码

**示例**：
```javascript
class CustomerController {
  async getAllCustomers(req, res) {
    try {
      const customers = await this.service.getAllCustomers();
      res.json(customers);
    } catch (error) {
      logger.error('获取客户列表失败', { error: error.message });
      res.status(500).json({ error: '获取客户列表失败' });
    }
  }
}
```

### 3. 服务层 (Services)

**职责**：
- 实现业务逻辑
- 数据访问和处理
- 事务管理
- 记录操作日志

**示例**：
```javascript
class CustomerService {
  getAllCustomers() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM Customers', [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  }

  async createCustomer(data) {
    // 验证、处理、保存
    logOperation('创建客户', { customerId: id, name });
    return result;
  }
}
```

### 4. 中间件层 (Middlewares)

**职责**：
- 请求预处理
- 认证和授权
- 输入验证
- 日志记录
- 错误处理

**已实现的中间件**：

#### 认证中间件 (`auth.js`)
```javascript
const { verifyToken } = require('./middlewares/auth');
app.post('/api/protected', verifyToken, handler);
```

#### 日志中间件 (`logger.js`)
```javascript
const { requestLogger, logger } = require('./middlewares/logger');
app.use(requestLogger);
logger.info('操作成功', { userId: 1 });
```

#### 验证中间件 (`validator.js`)
```javascript
const { validate, CommonSchemas } = require('./middlewares/validator');
app.post('/api/customers', validate(CommonSchemas.customer), handler);
```

#### 错误处理中间件 (`errorHandler.js`)
```javascript
const { asyncHandler } = require('./middlewares/errorHandler');
app.get('/api/data', asyncHandler(async (req, res) => {
  const data = await fetchData();
  res.json(data);
}));
```

## 数据流向

### 请求流程

```
1. 客户端请求
   ↓
2. requestLogger 记录请求
   ↓
3. 认证中间件验证 token
   ↓
4. 验证中间件检查输入
   ↓
5. 路由匹配并调用控制器
   ↓
6. 控制器调用服务层
   ↓
7. 服务层访问数据库
   ↓
8. 数据逐层返回
   ↓
9. requestLogger 记录响应
   ↓
10. 返回给客户端
```

### 错误处理流程

```
任何层发生错误
   ↓
throw Error 或 reject Promise
   ↓
asyncHandler 捕获
   ↓
errorHandler 中间件处理
   ↓
logger 记录错误日志
   ↓
返回统一错误响应给客户端
```

## 两种架构模式对比

### 模式一：传统路由模式（已有）

**特点**：
- 简单直接，代码量少
- 适合简单的 CRUD 操作
- 数据库操作直接在路由中

**文件**：
- `src/routes/customers.js`
- `src/routes/products.js`
- 等等...

**优点**：
- 快速开发
- 代码简洁
- 适合小型项目

**缺点**：
- 业务逻辑和路由混在一起
- 难以测试
- 复杂逻辑会导致代码臃肿

### 模式二：Controller/Service 模式（新增）

**特点**：
- 分层清晰，职责分明
- 适合复杂业务逻辑
- 易于测试和维护

**文件**：
- `src/routes/customers-v2.js` (路由)
- `src/controllers/customerController.js` (控制器)
- `src/services/customerService.js` (服务)

**优点**：
- 易于单元测试
- 业务逻辑可复用
- 便于团队协作
- 易于维护和扩展

**缺点**：
- 代码量增加
- 需要更多文件
- 学习成本稍高

## 迁移指南

### 如何从模式一迁移到模式二

**步骤**：

1. **创建 Service 类**
   ```javascript
   // src/services/xxxService.js
   class XxxService {
     async getData() { /* 数据库操作 */ }
     async createData(data) { /* 业务逻辑 */ }
   }
   ```

2. **创建 Controller 类**
   ```javascript
   // src/controllers/xxxController.js
   class XxxController {
     constructor() {
       this.service = new XxxService();
     }
     async getData(req, res) {
       const data = await this.service.getData();
       res.json(data);
     }
   }
   ```

3. **更新路由**
   ```javascript
   // src/routes/xxx-v2.js
   const controller = new XxxController();
   app.get('/api/v2/xxx', asyncHandler((req, res) => {
     await controller.getData(req, res);
   }));
   ```

4. **添加日志和验证**
   ```javascript
   const { logger } = require('../middlewares/logger');
   const { validate, CommonSchemas } = require('../middlewares/validator');
   
   app.post('/api/v2/xxx', 
     validate(CommonSchemas.xxx),
     asyncHandler(async (req, res) => {
       logger.info('创建xxx', { data: req.body });
       await controller.create(req, res);
     })
   );
   ```

## 最佳实践

### 1. 错误处理
```javascript
// ✅ 推荐：使用 asyncHandler
app.get('/api/data', asyncHandler(async (req, res) => {
  const data = await service.getData();
  res.json(data);
}));

// ❌ 不推荐：手动 try-catch
app.get('/api/data', async (req, res) => {
  try {
    const data = await service.getData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2. 日志记录
```javascript
// ✅ 推荐：结构化日志
logger.info('用户登录', { 
  userId: user.id, 
  ip: req.ip,
  timestamp: new Date()
});

// ❌ 不推荐：简单 console.log
console.log('用户登录:', user.id);
```

### 3. 输入验证
```javascript
// ✅ 推荐：使用验证中间件
app.post('/api/customers', 
  validate(CommonSchemas.customer),
  handler
);

// ❌ 不推荐：手动验证
app.post('/api/customers', (req, res) => {
  if (!req.body.name) {
    return res.status(400).json({ error: '名称不能为空' });
  }
  // ...
});
```

### 4. 业务逻辑分离
```javascript
// ✅ 推荐：业务逻辑在 Service 层
class CustomerService {
  async createCustomer(data) {
    // 验证、处理、保存
    logOperation('创建客户', { name: data.name });
    return await this.save(data);
  }
}

// ❌ 不推荐：业务逻辑在路由中
app.post('/api/customers', (req, res) => {
  // 一大堆业务逻辑...
  db.run('INSERT...', () => {
    // ...
  });
});
```

## API 版本管理

### 当前版本策略

- **v1 (默认)**：`/api/customers` - 使用传统模式
- **v2 (新版)**：`/api/v2/customers` - 使用 Controller/Service 模式

### 版本迁移建议

1. 保持 v1 API 不变，确保向后兼容
2. 新功能优先使用 v2 模式开发
3. 逐步将 v1 复杂路由迁移到 v2
4. 在文档中标注推荐使用的版本

## 性能优化建议

1. **数据库连接池**：当前使用单例连接，未来可考虑连接池
2. **缓存机制**：对频繁查询的数据添加缓存
3. **分页查询**：大量数据查询应使用分页
4. **索引优化**：为常用查询字段添加索引
5. **日志异步写入**：避免日志写入阻塞请求

## 未来改进方向

- [ ] 引入 ORM（如 Sequelize、TypeORM）
- [ ] 添加数据库迁移工具
- [ ] 实现缓存层（Redis）
- [ ] 添加消息队列处理异步任务
- [ ] 实现完整的权限管理系统
- [ ] 添加 API 文档自动生成（Swagger）

---

**更新日期**：2024-11-05  
**版本**：2.1
