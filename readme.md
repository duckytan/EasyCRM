# EasyCRM

一个基于 Node.js/Express + SQLite 的简洁 CRM（客户关系管理）应用。后端提供 REST API 并同时托管静态前端（原生 HTML/CSS/JS）。

- 快速了解项目架构、功能、数据模型与 API，请查看 docs/overview.md
- 主要用途：客户/联系人管理、购买记录与回访、仪表盘统计、提醒聚合、预设数据与用户设置、数据备份/恢复


## 快速开始

前置条件：
- Node.js ≥ 16（推荐 18+）
- 无需单独安装数据库（内置 SQLite）

安装与运行：
1) 安装依赖
   - npm install
2) 初始化数据库（推荐首次执行，写入示例数据与默认管理员）
   - npm run init-db
3) 启动服务
   - npm start
4) 打开浏览器访问
   - http://localhost:3001/pages/login.html
   - 默认管理员账号：admin / admin123

可选：开发模式热重载
- npm run dev（需自行安装 nodemon）


## 常见问题
- 端口占用：lsof -i:3001 或 netstat -ano | findstr :3001（Windows）定位并释放端口
- 登录失败：确保已执行 npm run init-db 创建默认管理员
- sqlite3 依赖安装问题：建议使用 LTS Node 版本，必要时删除 node_modules 后重装


## 目录结构（简要）
- server.js：后端主入口（建表/迁移、默认数据、REST API、静态资源）
- init-db.js：数据库初始化脚本（清空/重建，写入示例与默认管理员）
- pages/、css/、js/、assets/：前端静态资源
- database.db：SQLite 数据文件（运行时生成）
- docs/overview.md：项目概览文档（功能/架构/依赖/运行方式等）


## 主要依赖与脚本
- 依赖：express、cors、sqlite3
- 脚本：
  - npm start：node server.js
  - npm run dev：nodemon server.js（需安装 nodemon）
  - npm run init-db：初始化/重置数据库


## 许可证
本项目以 ISC 许可证开源，详见 package.json。
