# 代码重构指南

## 重构概览

本次重构将原来的单体 `server.js` 文件（3303行）拆分成了模块化的结构，提高了代码的可维护性和可扩展性。

## 新的架构结构

### 目录组织

```
src/
├── config/           # 配置管理
│   └── index.js
├── database/         # 数据库层
│   ├── connection.js
│   ├── setup.js
│   └── index.js
├── middlewares/      # 中间件
│   ├── auth.js
│   └── errorHandler.js
├── routes/           # 路由模块
│   ├── auth.js
│   ├── budgetRanges.js
│   ├── contacts.js
│   ├── customerCategories.js
│   ├── customerIntentions.js
│   ├── customers.js
│   ├── dashboard.js
│   ├── maintenance.js
│   ├── navigationModes.js
│   ├── presetProducts.js
│   ├── products.js
│   ├── regions.js
│   ├── reminderCycles.js
│   ├── userSettings.js
│   ├── visitMethods.js
│   ├── visitTypes.js
│   ├── visits.js
│   └── index.js      # 路由注册中心
└── utils/            # 工具函数
    └── fs.js
```

## 各模块说明

### 1. 配置管理 (`src/config/`)

集中管理所有配置参数：

- `PORT`: 服务器端口
- `DATABASE_FILE`: 数据库文件路径
- `PUBLIC_DIR`: 静态文件目录
- `BACKUP_DIR`: 备份目录
- 等等

### 2. 数据库层 (`src/database/`)

#### connection.js
- `createConnection()`: 创建数据库连接
- `getConnection()`: 获取现有连接
- `closeConnection()`: 关闭连接

#### setup.js
- `initializeDatabase()`: 初始化数据库表结构
- `migrateDatabase()`: 数据库迁移
- `initializeDefaultData()`: 初始化默认数据

#### index.js
- 导出统一的数据库接口

### 3. 中间件 (`src/middlewares/`)

#### errorHandler.js
- `errorHandler()`: 全局错误处理中间件
- `asyncHandler()`: 异步路由错误捕获包装器
- `notFoundHandler()`: 404处理

#### auth.js
- `createToken()`: 创建令牌
- `revokeToken()`: 撤销令牌
- `verifyToken()`: 验证令牌中间件
- `optionalAuth()`: 可选认证中间件

### 4. 路由模块 (`src/routes/`)

每个路由模块负责一个资源的CRUD操作：

#### customers.js - 客户管理
- `GET /api/customers` - 获取客户列表
- `GET /api/customers/:id` - 获取客户详情
- `POST /api/customers` - 创建客户
- `PUT /api/customers/:id` - 更新客户
- `DELETE /api/customers/:id` - 删除客户

#### visits.js - 回访管理
- `GET /api/visits` - 获取回访记录
- `POST /api/visits` - 创建回访记录
- `PUT /api/visits/:id` - 更新回访记录
- `DELETE /api/visits/:id` - 删除回访记录

#### products.js - 产品管理
- `GET /api/products` - 获取产品列表
- `POST /api/products` - 创建产品记录
- `PUT /api/products/:id` - 更新产品记录
- `DELETE /api/products/:id` - 删除产品记录
- `GET /api/products/statistics/summary` - 产品统计

#### dashboard.js - 仪表盘
- `GET /api/dashboard/statistics` - 获取统计数据

#### maintenance.js - 系统维护
- `POST /api/backup` - 数据库备份
- `POST /api/restore` - 数据库恢复
- `DELETE /api/data/delete-all` - 删除所有数据
- `POST /api/clear-data` - 清空数据
- `GET /api/check-update` - 检查更新

#### auth.js - 认证授权
- `POST /api/auth/login` - 登录
- `POST /api/auth/logout` - 退出
- `POST /api/managers/change-password` - 修改密码

#### 基础数据管理
- `customerCategories.js` - 客户分类管理
- `customerIntentions.js` - 客户意向等级管理
- `regions.js` - 地区管理
- `budgetRanges.js` - 预算范围管理
- `contacts.js` - 上级/下级联系人管理
- `visitMethods.js` - 回访方式管理
- `visitTypes.js` - 回访类型管理
- `presetProducts.js` - 预设产品管理
- `navigationModes.js` - 导航模式管理
- `reminderCycles.js` - 提醒周期管理
- `userSettings.js` - 用户设置管理

#### index.js - 路由注册中心
统一注册所有路由模块的入口。

## 迁移到新架构

### 方案一：渐进式迁移（推荐）

保留旧的 `server.js`，逐步验证新架构：

1. 保持 `server.js` 作为主文件运行
2. 使用 `server-new.js` 进行测试
3. 验证所有功能正常后，切换到新架构

```bash
# 测试新架构
node server-new.js

# 验证功能后，重命名
mv server.js server-old.js.bak
mv server-new.js server.js
```

### 方案二：直接切换

如果已经充分测试，可以直接替换：

```bash
mv server.js server-old.js
mv server-new.js server.js
npm start
```

## 使用新架构

### 添加新的路由模块

1. 在 `src/routes/` 创建新文件，例如 `orders.js`：

```javascript
function registerOrderRoutes(app, db) {
  app.get('/api/orders', (req, res) => {
    // 实现逻辑
  });

  app.post('/api/orders', (req, res) => {
    // 实现逻辑
  });
}

module.exports = {
  registerOrderRoutes,
};
```

2. 在 `src/routes/index.js` 中注册：

```javascript
const { registerOrderRoutes } = require('./orders');

function registerAllRoutes(app, db) {
  // ... 其他路由
  registerOrderRoutes(app, db);
}
```

### 添加新的中间件

1. 在 `src/middlewares/` 创建新文件
2. 在 `server-new.js` 中引入并使用

### 扩展配置

在 `src/config/index.js` 中添加新的配置项：

```javascript
const NEW_CONFIG = process.env.NEW_CONFIG || 'default';

module.exports = {
  // ... 现有配置
  NEW_CONFIG,
};
```

## 改进建议

### 已完成

- ✅ 模块化路由
- ✅ 统一配置管理
- ✅ 数据库连接管理
- ✅ 基础错误处理
- ✅ 简单的认证中间件

### 待完成

1. **分离业务逻辑**
   - 创建 `src/services/` 目录
   - 将业务逻辑从路由层移到服务层

2. **添加控制器层**
   - 创建 `src/controllers/` 目录
   - 路由 -> 控制器 -> 服务的分层架构

3. **完善中间件**
   - 请求日志中间件
   - 输入验证中间件（使用Joi或express-validator）
   - 速率限制中间件

4. **添加数据模型**
   - 创建 `src/models/` 目录
   - 定义数据模型和验证规则

5. **添加测试**
   - 单元测试
   - 集成测试
   - API测试

## 代码示例

### 使用异步错误处理

```javascript
const { asyncHandler } = require('../middlewares/errorHandler');

app.get('/api/resource', asyncHandler(async (req, res) => {
  const data = await someAsyncOperation();
  res.json(data);
}));
```

### 使用认证中间件

```javascript
const { verifyToken } = require('../middlewares/auth');

app.post('/api/protected', verifyToken, (req, res) => {
  // 只有认证用户可以访问
});
```

## 注意事项

1. **向后兼容**: 新架构保持了所有API端点的兼容性
2. **错误处理**: 统一的错误处理格式
3. **数据库连接**: 使用单例模式管理数据库连接
4. **环境变量**: 支持通过 `.env` 文件配置

## 测试清单

在切换到新架构前，请验证以下功能：

- [ ] 服务器正常启动
- [ ] 首页可以访问
- [ ] 客户管理（增删改查）
- [ ] 回访记录（增删改查）
- [ ] 产品订单（增删改查）
- [ ] 仪表盘统计
- [ ] 登录/登出
- [ ] 系统设置
- [ ] 基础数据管理
- [ ] 数据备份/恢复

## 相关文档

- [API 文档](./API.md)
- [开发指南](./development.md)
- [任务清单](./TASK_LIST.md)
- [优化建议](./优化清单.md)

---

**更新日期**: 2024-11-05  
**版本**: 2.0
