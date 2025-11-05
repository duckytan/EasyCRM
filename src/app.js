const express = require('express');
const cors = require('cors');
const path = require('path');
const { PUBLIC_DIR } = require('./config');
const { registerAllRoutes } = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const { requestLogger } = require('./middlewares/logger');

function createApp(db) {
  const app = express();

  // 基础中间件
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  
  // 日志中间件
  app.use(requestLogger);
  
  // 静态文件服务
  app.use(express.static(PUBLIC_DIR));

  // 首页路由
  app.get('/', (_req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
  });

  // 注册所有业务路由
  registerAllRoutes(app, db);

  // 错误处理中间件（必须放在最后）
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp,
};
