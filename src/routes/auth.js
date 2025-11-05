const { createToken, revokeToken } = require('../middlewares/auth');
const { validate, CommonSchemas } = require('../middlewares/validator');
const { logger } = require('../middlewares/logger');

function registerAuthRoutes(app, db) {
  app.post('/api/auth/login', validate(CommonSchemas.login), (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM Managers WHERE name = ? AND password = ?', [username, password], (err, row) => {
      if (err) {
        logger.error('登录验证失败', { username, error: err.message });
        return res.status(500).json({ success: false, error: err.message });
      }

      if (!row) {
        logger.warn('登录失败: 无效的用户名或密码', { username });
        return res.status(401).json({ success: false, error: '用户名或密码错误' });
      }

      const token = createToken(row.id);

      logger.info('登录成功', { username, userId: row.id });
      return res.json({
        success: true,
        user: { id: row.id, name: row.name },
        token: token,
      });
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      revokeToken(token);
    }
    res.json({ success: true });
  });

  app.post('/api/managers/change-password', validate(CommonSchemas.changePassword), (req, res) => {
    const { oldPassword, newPassword } = req.body;

    db.get('SELECT * FROM Managers WHERE id = 1', [], (err, row) => {
      if (err) {
        logger.error('查询管理员失败', { error: err.message });
        return res.status(500).json({ error: err.message });
      }

      if (!row || row.password !== oldPassword) {
        logger.warn('修改密码失败: 原密码错误');
        return res.status(401).json({ error: '原密码错误' });
      }

      db.run(`UPDATE Managers SET password = ? WHERE id = 1`, [newPassword], function (updateErr) {
        if (updateErr) {
          logger.error('更新密码失败', { error: updateErr.message });
          return res.status(500).json({ error: updateErr.message });
        }

        logger.info('密码修改成功', { managerId: 1 });
        res.json({ success: true, message: '密码修改成功' });
      });
    });
  });
}

module.exports = {
  registerAuthRoutes,
};
