# 开发指南

本文档面向开发者，介绍本地开发环境的搭建、常用命令以及项目约定。

## 环境要求

- Node.js 18+
- npm 8+

## 安装依赖

```bash
npm install
```

## 开发模式

使用 `nodemon` 可在文件变更时自动重启服务器：

```bash
npm install nodemon --save-dev
npm run dev
```

## 生产模式

```bash
npm start
```

服务器默认监听端口 `3001`，可通过环境变量 `PORT` 覆盖。

## 数据库处理

系统使用 SQLite 存储数据，数据库文件默认位于 `data/database.db`。

- 重新初始化数据库（会清空数据并插入示例数据）：

  ```bash
  npm run init-db
  ```

- 手动备份数据库，将 `data/database.db` 复制到安全位置；也可以通过 `/api/backup`、`/api/restore` API 完成备份和恢复。

## 项目结构约定

- `src/` 下存放所有后端源代码：
  - `config/`：配置相关
  - `database/`：数据库连接、迁移、默认数据
  - `routes/`：路由模块
  - `controllers/`：业务控制器
  - `services/`：领域服务
  - `middlewares/`：中间件
  - `models/`：数据库模型定义（如有需要）
  - `utils/`：工具函数
- `public/` 下存放所有静态资源
- `docs/` 存放文档

## 代码风格约定

- 使用 ES2015+ 语法，遵循 CommonJS 模块规范
- 变量和函数命名采用 `camelCase`
- 数据库操作应通过统一的数据库模块，避免在路由中直接新建连接
- 模块拆分遵循单一职责原则

## 提交规范

提交前请确保：

- `npm run lint`（若配置）通过
- `npm test`（若配置）通过
- 变更已附带必要的文档更新

## 常见问题

### 1. 端口占用

修改 `.env` 或环境变量中的 `PORT`，或在本地释放端口。

### 2. 数据库锁

SQLite 在多个写操作并发时可能出现锁冲突。建议将相关操作合并到事务中，或避免长时间持有写锁。

### 3. 路由冲突

在 `src/routes` 中按照领域拆分路由，避免在主入口重复注册。
