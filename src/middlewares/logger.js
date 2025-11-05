const fs = require('fs');
const path = require('path');

// 日志级别
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

// 日志颜色（用于控制台输出）
const COLORS = {
  ERROR: '\x1b[31m', // 红色
  WARN: '\x1b[33m',  // 黄色
  INFO: '\x1b[36m',  // 青色
  DEBUG: '\x1b[90m', // 灰色
  RESET: '\x1b[0m',
};

class Logger {
  constructor(options = {}) {
    this.logDir = options.logDir || path.join(__dirname, '../../logs');
    this.logToFile = options.logToFile !== false;
    this.logToConsole = options.logToConsole !== false;
    this.level = options.level || 'INFO';
    
    if (this.logToFile) {
      this.ensureLogDirectory();
    }
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    return `[${timestamp}] [${level}] ${message} ${metaStr}`.trim();
  }

  writeToFile(level, message, meta) {
    if (!this.logToFile) return;

    const date = new Date().toISOString().split('T')[0];
    const logFile = path.join(this.logDir, `${date}.log`);
    const formattedMessage = this.formatMessage(level, message, meta);

    fs.appendFile(logFile, formattedMessage + '\n', (err) => {
      if (err) {
        console.error('写入日志文件失败:', err);
      }
    });
  }

  writeToConsole(level, message, meta) {
    if (!this.logToConsole) return;

    const color = COLORS[level] || COLORS.RESET;
    const formattedMessage = this.formatMessage(level, message, meta);
    console.log(`${color}${formattedMessage}${COLORS.RESET}`);
  }

  log(level, message, meta = {}) {
    this.writeToConsole(level, message, meta);
    this.writeToFile(level, message, meta);
  }

  error(message, meta = {}) {
    this.log(LOG_LEVELS.ERROR, message, meta);
  }

  warn(message, meta = {}) {
    this.log(LOG_LEVELS.WARN, message, meta);
  }

  info(message, meta = {}) {
    this.log(LOG_LEVELS.INFO, message, meta);
  }

  debug(message, meta = {}) {
    if (this.level === 'DEBUG') {
      this.log(LOG_LEVELS.DEBUG, message, meta);
    }
  }
}

// 创建全局 logger 实例
const logger = new Logger({
  logToFile: process.env.LOG_TO_FILE !== 'false',
  logToConsole: true,
  level: process.env.LOG_LEVEL || 'INFO',
});

// Express 请求日志中间件
function requestLogger(req, res, next) {
  const startTime = Date.now();
  const { method, url, ip } = req;

  // 记录请求
  logger.info(`${method} ${url}`, {
    ip: ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
  });

  // 监听响应完成
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;

    const logLevel = statusCode >= 400 ? 'error' : 'info';
    logger[logLevel](`${method} ${url} ${statusCode}`, {
      duration: `${duration}ms`,
      ip: ip || req.connection.remoteAddress,
    });
  });

  next();
}

// 操作日志记录函数
function logOperation(operation, data = {}, user = 'system') {
  logger.info(`操作: ${operation}`, {
    user,
    ...data,
  });
}

module.exports = {
  logger,
  requestLogger,
  logOperation,
  LOG_LEVELS,
};
