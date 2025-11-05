const { setupDatabase } = require('./src/database');
const { createApp } = require('./src/app');
const { PORT } = require('./src/config');

async function startServer() {
  try {
    const db = await setupDatabase();
    console.log('已连接到SQLite数据库');

    const app = createApp(db);

    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();
