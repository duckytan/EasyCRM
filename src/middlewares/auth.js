const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN } = require('../config');

function createToken(manager) {
  const payload = {
    id: manager.id,
    name: manager.name,
    type: 'access',
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

function createRefreshToken(manager) {
  const payload = {
    id: manager.id,
    name: manager.name,
    type: 'refresh',
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });
}

function createTokenPair(manager) {
  return {
    token: createToken(manager),
    refreshToken: createRefreshToken(manager),
  };
}

function verifyRefreshToken(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw error;
  }
}

function revokeToken(_token) {
  // 基于 JWT 的无状态认证，目前不追踪退出状态
  return true;
}

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: '未授权访问，请先登录' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const tokenType = decoded.type || 'access';

    if (tokenType !== 'access') {
      return res.status(401).json({ error: '无效的访问令牌' });
    }

    req.user = decoded;
    req.isAuthenticated = true;
    next();
  } catch (error) {
    return res.status(401).json({ error: '登录状态已失效，请重新登录' });
  }
}

function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    req.isAuthenticated = false;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const tokenType = decoded.type || 'access';

    if (tokenType !== 'access') {
      req.isAuthenticated = false;
    } else {
      req.user = decoded;
      req.isAuthenticated = true;
    }
  } catch (error) {
    req.isAuthenticated = false;
  }

  next();
}

module.exports = {
  createToken,
  createRefreshToken,
  createTokenPair,
  verifyRefreshToken,
  revokeToken,
  verifyToken,
  optionalAuth,
};
