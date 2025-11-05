# AI-CRM 客户关系管理系统

一个基于 Node.js + Express + SQLite 的轻量级客户关系管理（CRM）系统，用于高效管理客户资料、跟踪客户需求和意向、记录回访及产品订单信息。

## 功能特性

- **客户管理**：添加、编辑、删除客户信息，支持分类、意向等级、地区等维度管理
- **回访记录**：记录客户回访情况，支持计划回访、产品回访、生日回访等多种类型
- **产品订单**：管理客户购买的产品，自动计算回访提醒日期
- **数据仪表盘**：统计月度销售额、订单数、新增客户数等关键指标
- **提醒功能**：支持多种提醒周期，自动汇总计划回访、生日提醒、产品回访等
- **预设数据管理**：可配置客户分类、意向等级、地区、预算范围、预设产品等基础数据
- **用户设置**：支持深色模式、提醒开关、备份恢复等个性化设置
- **权限管理**：管理员登录 + JWT 认证机制

## 技术栈

- **后端**：Node.js + Express（已完成模块化重构）
- **数据库**：SQLite
- **前端**：HTML + CSS + 原生 JavaScript
- **架构模式**：MVC 分层架构（路由-中间件-数据库）
- **安全**：JWT 认证 + bcrypt 密码加密 ⭐新增⭐

## 目录结构

```
.
├── server.js              # 主服务器文件（启动入口）
├── init-db.js             # 数据库初始化脚本
├── package.json           # 项目依赖配置
├── .gitignore            # Git 忽略文件配置
├── README.md             # 项目说明文档（本文件）
├── data/                 # 数据库文件存放目录
│   └── database.db       # SQLite 数据库文件
├── public/               # 静态资源目录
│   ├── index.html        # 系统首页
│   ├── favicon.ico       # 网站图标
│   ├── pages/            # HTML 页面
│   ├── css/              # 样式文件
│   ├── js/               # 前端 JavaScript
│   └── assets/           # 图标等资源
├── src/                  # 源代码目录（已完成模块化）
│   ├── app.js            # Express应用初始化
│   ├── config/           # 配置管理（端口、路径等）
│   ├── database/         # 数据库连接和初始化
│   ├── routes/           # 17个独立路由模块
│   ├── middlewares/      # 认证、错误处理中间件
│   ├── controllers/      # 控制器（预留）
│   ├── services/         # 业务逻辑（预留）
│   ├── models/           # 数据模型（预留）
│   └── utils/            # 工具函数
└── docs/                 # 文档目录
    ├── API.md            # API 接口文档
    ├── development.md    # 开发指南
    ├── project_restructuring_report.md  # 重构报告
    ├── REFACTORING_GUIDE.md             # 模块化重构指南
    ├── ARCHITECTURE.md   # 架构说明 ⭐新增⭐
    ├── TASK_LIST.md      # 任务进度
    ├── 优化清单.md       # 系统优化建议清单
    └── CHANGELOG.md      # 更新日志
```

## 安装与运行

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，至少修改 JWT_SECRET 为强随机字符串
```

### 3. 创建运行目录

```bash
mkdir -p data backups logs
```

### 4. 初始化数据库（可选）

如果需要重新初始化数据库（会清空现有数据并插入示例数据）：

```bash
npm run init-db
```

### 5. 启动服务器

**生产模式**：

```bash
npm start
```

**开发模式**（需要先安装 nodemon）：

```bash
npm install nodemon --save-dev
npm run dev
```

### 6. 访问系统

启动成功后，在浏览器中访问：

- 系统首页：http://localhost:3001
- 仪表盘：http://localhost:3001/pages/dashboard.html
- 登录页面：http://localhost:3001/pages/login.html

默认管理员账号：
- 用户名：`admin`
- 密码：`admin123`

**⚠️ 重要安全提示**：
- 生产环境务必修改默认密码！
- 在 `.env` 文件中设置强 JWT_SECRET（至少32位随机字符串）
- 密码已自动使用 bcrypt 加密存储

## 主要 API 接口

### 客户管理

- `GET /api/customers` - 获取所有客户
- `GET /api/customers/:id` - 获取单个客户详情
- `POST /api/customers` - 创建客户
- `PUT /api/customers/:id` - 更新客户
- `DELETE /api/customers/:id` - 删除客户

### 回访管理

- `GET /api/visits` - 获取回访记录
- `GET /api/visits/:id` - 获取单个回访详情
- `POST /api/visits` - 创建回访记录
- `PUT /api/visits/:id` - 更新回访记录
- `DELETE /api/visits/:id` - 删除回访记录

### 产品订单管理

- `GET /api/products` - 获取产品记录
- `GET /api/products/:id` - 获取单个产品详情
- `POST /api/products` - 创建产品记录
- `PUT /api/products/:id` - 更新产品记录
- `DELETE /api/products/:id` - 删除产品记录

### 仪表盘统计

- `GET /api/dashboard/statistics` - 获取仪表盘统计数据

### 用户认证

- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出

更多接口请参考 `docs/API.md` 文档。

## 数据库表结构

系统包含以下主要数据表：

1. **Customers** - 客户信息表
2. **Products** - 产品订单表
3. **Visits** - 回访记录表
4. **Managers** - 管理员表
5. **CustomerCategories** - 客户分类表
6. **CustomerIntentions** - 客户意向等级表
7. **Regions** - 地区表
8. **BudgetRanges** - 预算范围表
9. **SuperiorContacts** - 上级联系人表
10. **SubordinateContacts** - 下级联系人表
11. **UserSettings** - 用户设置表
12. **PresetProducts** - 预设产品表
13. **VisitMethods** - 回访方式表
14. **VisitTypes** - 回访类型表
15. **NavigationModes** - 导航模式表
16. **ReminderCycles** - 提醒周期表

## 常见问题

### 端口被占用

如果遇到端口 3001 被占用的情况：

**Windows**：
```bash
netstat -ano | findstr :3001
taskkill /PID <进程ID> /F
```

**Linux/Mac**：
```bash
lsof -i :3001
kill -9 <进程ID>
```

或者修改 `server.js` 中的端口号：
```javascript
const port = 3001; // 改为其他端口，如 3000
```

### 数据库损坏

如果数据库文件损坏，可以删除 `data/database.db` 文件，系统会在下次启动时自动创建新的数据库。

### 备份与恢复

系统提供了备份和恢复功能：

- 备份：`POST /api/backup` - 备份文件保存在 `backups/` 目录
- 恢复：`POST /api/restore` - 从备份恢复数据

## 注意事项

1. 本系统使用 SQLite 本地数据库，所有数据存储在 `data/database.db` 文件中
2. 系统不适合多用户并发访问的生产环境，建议作为个人或小团队使用
3. 管理员密码未加密存储，请勿在生产环境使用或及时修改为加密存储
4. 建议定期备份数据库文件

## 开发计划

系统当前处于可用状态，但存在一些需要优化的地方。详细的优化建议请参考 `docs/优化清单.md` 文档。

## 许可证

ISC

## 贡献

欢迎提交 Issue 和 Pull Request。
