# AI-CRM 系统

## 启动服务器

### 方法1：使用最小化版本服务器(推荐)

这个版本的服务器已经过简化，移除了可能导致错误的部分：

```
node minimal-server.js
```

启动后，访问:
- 测试页面: http://localhost:3001/test
- API测试: http://localhost:3001/api/test

### 方法2：使用主服务器

如果你想使用完整功能的服务器，但注意可能会出现启动问题：

```
node server.js
```

## 常见问题排查

### 端口占用问题

如果遇到端口被占用，可以使用以下命令查看占用端口的进程：

Windows:
```
netstat -ano | findstr :3001
```

然后使用任务管理器关闭占用端口的进程。

### 数据库问题

服务器使用SQLite数据库，数据库文件存储在`db/database.db`中。如果数据库损坏，可以删除该文件，服务器会自动重新创建。

## API列表

- `/api/test` - 基本API测试
- `/api/dashboard/statistics` - 仪表盘统计数据
- `/api/dashboard/monthly-statistics` - 月度统计数据
- `/api/reminder-cycles` - 提醒周期数据

## 项目结构

- `minimal-server.js` - 简化版服务器，只包含必要功能
- `server.js` - 完整版服务器
- `test.html` - API测试页面
- `pages/` - 存放各个页面
- `css/` - 样式文件
- `js/` - JavaScript文件
- `db/` - 数据库文件
