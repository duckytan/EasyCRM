const rateLimit = require('express-rate-limit');
const { logger } = require('./logger');

/**
 * 登录接口限流器 - 防止暴力破解
 * 每个IP每15分钟最多尝试5次
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次尝试
  message: {
    error: '登录尝试次数过多，请15分钟后再试',
    retryAfter: '15分钟',
  },
  standardHeaders: true, // 返回标准的 `RateLimit-*` 响应头
  legacyHeaders: false, // 禁用 `X-RateLimit-*` 响应头
  handler: (req, res) => {
    logger.warn('登录限流触发', {
      ip: req.ip,
      path: req.path,
      username: req.body?.username,
    });
    res.status(429).json({
      error: '登录尝试次数过多，请15分钟后再试',
      retryAfter: '15分钟',
    });
  },
  skip: (req) => {
    // 如果配置了白名单IP，可以跳过限流
    const whitelistIPs = process.env.RATE_LIMIT_WHITELIST?.split(',') || [];
    return whitelistIPs.includes(req.ip);
  },
});

/**
 * 通用API限流器 - 防止API滥用
 * 每个IP每分钟最多100次请求
 */
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 100, // 最多100次请求
  message: {
    error: '请求过于频繁，请稍后再试',
    retryAfter: '1分钟',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('API限流触发', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      error: '请求过于频繁，请稍后再试',
      retryAfter: '1分钟',
    });
  },
  skip: (req) => {
    // 白名单IP跳过限流
    const whitelistIPs = process.env.RATE_LIMIT_WHITELIST?.split(',') || [];
    return whitelistIPs.includes(req.ip);
  },
});

/**
 * 严格限流器 - 用于敏感操作
 * 每个IP每小时最多10次
 */
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 10, // 最多10次
  message: {
    error: '操作过于频繁，请1小时后再试',
    retryAfter: '1小时',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('严格限流触发', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      error: '操作过于频繁，请1小时后再试',
      retryAfter: '1小时',
    });
  },
});

/**
 * 创建自定义限流器
 */
function createLimiter(options = {}) {
  const {
    windowMs = 60 * 1000, // 默认1分钟
    max = 60, // 默认60次
    message = '请求过于频繁，请稍后再试',
    skipWhitelist = true,
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('自定义限流触发', {
        ip: req.ip,
        path: req.path,
        options,
      });
      res.status(429).json({ error: message });
    },
    skip: skipWhitelist
      ? (req) => {
          const whitelistIPs = process.env.RATE_LIMIT_WHITELIST?.split(',') || [];
          return whitelistIPs.includes(req.ip);
        }
      : undefined,
  });
}

module.exports = {
  loginLimiter,
  apiLimiter,
  strictLimiter,
  createLimiter,
};
