const { IP_WHITELIST, IP_BLACKLIST } = require('../config');
const { logger } = require('./logger');

function normalizeIp(ip) {
  if (!ip) {
    return '';
  }

  const firstIp = Array.isArray(ip) ? ip[0] : ip.split(',')[0].trim();

  if (firstIp.startsWith('::ffff:')) {
    return firstIp.substring(7);
  }

  if (firstIp === '::1') {
    return '127.0.0.1';
  }

  return firstIp;
}

function matchIpPattern(ip, pattern) {
  if (!pattern) {
    return false;
  }

  if (pattern === '*') {
    return true;
  }

  if (pattern.endsWith('*')) {
    const prefix = pattern.slice(0, -1);
    return ip.startsWith(prefix);
  }

  return ip === pattern;
}

function isIpInList(ip, list) {
  if (!ip || !Array.isArray(list) || list.length === 0) {
    return false;
  }

  return list.some((pattern) => matchIpPattern(ip, pattern));
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return normalizeIp(forwarded);
  }
  return normalizeIp(req.ip || req.connection?.remoteAddress || '');
}

function isIpWhitelisted(ip) {
  if (!IP_WHITELIST || IP_WHITELIST.length === 0) {
    return false;
  }
  return isIpInList(ip, IP_WHITELIST);
}

function isIpBlacklisted(ip) {
  if (!IP_BLACKLIST || IP_BLACKLIST.length === 0) {
    return false;
  }
  return isIpInList(ip, IP_BLACKLIST);
}

function isIpAllowed(ip) {
  if (isIpBlacklisted(ip)) {
    return false;
  }

  if (!IP_WHITELIST || IP_WHITELIST.length === 0) {
    return true;
  }

  return isIpWhitelisted(ip);
}

/**
 * IP黑名单中间件
 * 阻止黑名单中的IP访问
 */
function ipBlacklistFilter(req, res, next) {
  const clientIp = getClientIp(req);

  if (isIpBlacklisted(clientIp)) {
    logger.warn('IP黑名单拦截', { ip: clientIp, path: req.path });
    return res.status(403).json({ error: '访问被拒绝' });
  }

  next();
}

/**
 * IP白名单中间件
 * 只允许白名单中的IP访问
 */
function ipWhitelistFilter(req, res, next) {
  const clientIp = getClientIp(req);

  if (IP_WHITELIST && IP_WHITELIST.length > 0 && !isIpWhitelisted(clientIp)) {
    logger.warn('IP白名单拦截', { ip: clientIp, path: req.path });
    return res.status(403).json({ error: '访问被拒绝' });
  }

  next();
}

/**
 * 简单的SQL注入防护
 */
function sqlInjectionFilter(req, res, next) {
  const dangerousPatterns = [
    /(\bUNION\b.*\bSELECT\b)/i,
    /(\bDROP\b.*\bTABLE\b)/i,
    /(\bINSERT\b.*\bINTO\b)/i,
    /(\bDELETE\b.*\bFROM\b)/i,
    /(-{2}|\/\*|\*\/)/,
    /(\bEXEC\b|\bEXECUTE\b)/i,
    /(;.*\bDROP\b)/i,
  ];

  const checkForInjection = (value) => {
    if (typeof value === 'string') {
      for (const pattern of dangerousPatterns) {
        if (pattern.test(value)) {
          return true;
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      for (const key in value) {
        if (checkForInjection(value[key])) {
          return true;
        }
      }
    }
    return false;
  };

  if (checkForInjection(req.body) || checkForInjection(req.query) || checkForInjection(req.params)) {
    logger.warn('疑似SQL注入攻击', {
      ip: req.ip,
      path: req.path,
      body: req.body,
      query: req.query,
    });
    return res.status(400).json({ error: '请求包含非法字符' });
  }

  next();
}

/**
 * XSS防护 - 简单的HTML标签过滤
 */
function xssFilter(req, res, next) {
  const htmlPattern = /<script[^>]*>.*?<\/script>/gi;
  const iframePattern = /<iframe[^>]*>.*?<\/iframe>/gi;
  const dangerousPatterns = [htmlPattern, iframePattern];

  const checkForXSS = (value) => {
    if (typeof value === 'string') {
      for (const pattern of dangerousPatterns) {
        if (pattern.test(value)) {
          return true;
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      for (const key in value) {
        if (checkForXSS(value[key])) {
          return true;
        }
      }
    }
    return false;
  };

  if (checkForXSS(req.body) || checkForXSS(req.query)) {
    logger.warn('疑似XSS攻击', {
      ip: req.ip,
      path: req.path,
      body: req.body,
      query: req.query,
    });
    return res.status(400).json({ error: '请求包含非法内容' });
  }

  next();
}

/**
 * 安全响应头
 */
function securityHeaders(req, res, next) {
  // 防止点击劫持
  res.setHeader('X-Frame-Options', 'DENY');
  // 防止MIME类型嗅探
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // XSS保护
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // 强制HTTPS (在生产环境中启用)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
}

module.exports = {
  ipBlacklistFilter,
  ipWhitelistFilter,
  sqlInjectionFilter,
  xssFilter,
  securityHeaders,
};
