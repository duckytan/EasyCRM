const bcrypt = require('bcryptjs');
const { createToken, revokeToken } = require('../middlewares/auth');
const { validate, CommonSchemas } = require('../middlewares/validator');
const { logger } = require('../middlewares/logger');

function isHashed(password) {
  return typeof password === 'string' && password.startsWith('$2');
}

function registerAuthRoutes(app, db) {
  app.post('/api/auth/login', validate(CommonSchemas.login), (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM Managers WHERE name = ?', [username], (err, row) => {
      if (err) {
        logger.error('登录验证失败', { username, error: err.message });
        return res.status(500).json({ success: false, error: err.message });
      }

      if (!row) {
        logger.warn('登录失败: 无效的用户名或密码', { username });
        return res.status(401).json({ success: false, error: '用户名或密码错误' });
      }

      let passwordMatched = false;
      if (isHashed(row.password)) {
        passwordMatched = bcrypt.compareSync(password, row.password);
      } else {
        passwordMatched = row.password === password;
        if (passwordMatched) {
          const hashedPassword = bcrypt.hashSync(password, 10);
          db.run('UPDATE Managers SET password = ? WHERE id = ?', [hashedPassword, row.id], (updateErr) => {
            if (updateErr) {
              logger.error('登录时更新密码哈希失败', { error: updateErr.message, managerId: row.id });
            }
          });
          row.password = hashedPassword;
        }
      }

      if (!passwordMatched) {
        logger.warn('登录失败: 无效的用户名或密码', { username });
        return res.status(401).json({ success: false, error: '用户名或密码错误' });
      }

      const token = createToken(row);

      logger.info('登录成功', { username, userId: row.id });
      return res.json({
        success: true,
        user: { id: row.id, name: row.name },
        token,
      });
    });
  });

  app.post('/api/auth/logout', (_req, res) => {
    res.json({ success: true });
  });

  app.post('/api/managers/change-password', validate(CommonSchemas.changePassword), (req, res) => {
    const { oldPassword, newPassword } = req.body;

    db.get('SELECT * FROM Managers WHERE id = 1', [], (err, row) => {
      if (err) {
        logger.error('查询管理员失败', { error: err.message });
        return res.status(500).json({ error: err.message });
      }

      if (!row) {
        logger.warn('修改密码失败: 管理员不存在');
        return res.status(404).json({ error: '管理员不存在' });
      }

      const storedPassword = row.password || '';
      const passwordMatched = isHashed(storedPassword)
        ? bcrypt.compareSync(oldPassword, storedPassword)
        : storedPassword === oldPassword;

      if (!passwordMatched) {
        logger.warn('修改密码失败: 原密码错误');
        return res.status(401).json({ error: '原密码错误' });
      }

      const hashedNewPassword = bcrypt.hashSync(newPassword, 10);

      db.run(`UPDATE Managers SET password = ? WHERE id = 1`, [hashedNewPassword], function (updateErr) {
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
