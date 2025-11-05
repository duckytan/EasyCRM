const validTokens = new Set();

function generateToken() {
  return Math.random().toString(36).substr(2) + Date.now().toString(36);
}

function createToken(managerId) {
  const token = generateToken();
  validTokens.add(token);
  return token;
}

function revokeToken(token) {
  validTokens.delete(token);
}

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token || !validTokens.has(token)) {
    return res.status(401).json({ error: '未授权访问，请先登录' });
  }

  next();
}

function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  req.isAuthenticated = token && validTokens.has(token);
  next();
}

module.exports = {
  createToken,
  revokeToken,
  verifyToken,
  optionalAuth,
};
