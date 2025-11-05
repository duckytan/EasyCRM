const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config');

function createToken(manager) {
  const payload = {
    id: manager.id,
    name: manager.name,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
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
    req.user = decoded;
    req.isAuthenticated = true;
  } catch (error) {
    req.isAuthenticated = false;
  }

  next();
}

module.exports = {
  createToken,
  revokeToken,
  verifyToken,
  optionalAuth,
};
