const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { PUBLIC_DIR } = require('./config');
const { registerAllRoutes } = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const { requestLogger } = require('./middlewares/logger');
const { apiLimiter } = require('./middlewares/rateLimiter');
const {
  ipBlacklistFilter,
  ipWhitelistFilter,
  sqlInjectionFilter,
  xssFilter,
  securityHeaders,
} = require('./middlewares/security');

function createApp(db) {
  const app = express();

  // 安全响应头
  app.use(securityHeaders);

  // 安全中间件 - helmet
  app.use(helmet({
    contentSecurityPolicy: false, // 静态HTML文件需要禁用CSP或自定义配置
  }));

  // IP过滤
  app.use(ipBlacklistFilter);

  // 基础中间件
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  
  // 日志中间件
  app.use(requestLogger);

  // SQL注入和XSS防护
  app.use(sqlInjectionFilter);
  app.use(xssFilter);

  // API 限流中间件
  app.use('/api/', apiLimiter);
  
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
