# 客户信息管理系统 - 开发说明

## 技术栈

- 前端：HTML + CSS + JavaScript
- 后端：Node.js + Express
- 数据库：SQLite

## 安装步骤

1. 克隆或下载项目到本地

2. 安装依赖
```bash
npm install
```

3. 安装开发依赖（可选）
```bash
npm install nodemon --save-dev
```

## 运行程序

### 普通启动
```bash
npm start
```

### 开发模式启动（自动重载）
```bash
npm run dev
```

启动后，访问 http://localhost:3000 即可打开系统。

## 系统结构

- `server.js`: 后端服务器入口文件
- `database.db`: SQLite数据库文件（自动创建）
- `pages/`: 前端HTML页面
- `css/`: CSS样式文件
- `js/`: JavaScript文件

## 数据库结构

系统包含四个主要数据表：

1. `Customers`: 客户信息表
2. `Products`: 产品信息表
3. `Visits`: 回访记录表
4. `Managers`: 管理员表

## API接口

### 客户相关

- `GET /api/customers`: 获取所有客户信息
- `POST /api/customers`: 添加新客户

### 回访相关

- `GET /api/visits`: 获取所有回访记录
- `POST /api/visits`: 添加新回访记录

## 主要功能

1. 客户信息管理：添加、查看客户信息
2. 回访记录管理：添加、查看回访记录

## 注意事项

- 本系统为简化版，仅包含核心功能
- 系统使用SQLite本地数据库，数据存储在项目目录下的database.db文件中
- 首次启动时会自动创建数据库表结构 