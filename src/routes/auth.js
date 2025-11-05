const { createToken, revokeToken } = require('../middlewares/auth');

function registerAuthRoutes(app, db) {
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: '用户名和密码不能为空' });
    }

    db.get('SELECT * FROM Managers WHERE name = ? AND password = ?', [username, password], (err, row) => {
      if (err) {
        console.error('登录验证失败:', err.message);
        return res.status(500).json({ success: false, error: err.message });
      }

      if (!row) {
        console.log('登录失败: 无效的用户名或密码', username);
        return res.status(401).json({ success: false, error: '用户名或密码错误' });
      }

      const token = createToken(row.id);

      console.log('登录成功:', username);
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

  app.post('/api/managers/change-password', (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: '旧密码和新密码不能为空' });
    }

    db.get('SELECT * FROM Managers WHERE id = 1', [], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!row || row.password !== oldPassword) {
        return res.status(401).json({ error: '原密码错误' });
      }

      db.run(`UPDATE Managers SET password = ? WHERE id = 1`, [newPassword], function (updateErr) {
        if (updateErr) {
          return res.status(500).json({ error: updateErr.message });
        }

        res.json({ success: true, message: '密码修改成功' });
      });
    });
  });
}

module.exports = {
  registerAuthRoutes,
};
