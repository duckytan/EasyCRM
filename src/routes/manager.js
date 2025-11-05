const bcrypt = require('bcryptjs');

function isHashed(password) {
  return typeof password === 'string' && password.startsWith('$2');
}

function registerManagerRoutes(app, db) {
  app.post('/api/managers/change-password', (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: '请提供当前密码和新密码' });
      return;
    }

    db.get('SELECT * FROM Managers WHERE name = ?', ['admin'], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (!row) {
        res.status(404).json({ error: '管理员不存在' });
        return;
      }

      const storedPassword = row.password || '';
      const passwordMatched = isHashed(storedPassword)
        ? bcrypt.compareSync(currentPassword, storedPassword)
        : storedPassword === currentPassword;

      if (!passwordMatched) {
        res.status(401).json({ error: '当前密码错误' });
        return;
      }

      const hashedNewPassword = bcrypt.hashSync(newPassword, 10);

      db.run('UPDATE Managers SET password = ? WHERE name = ?', [hashedNewPassword, 'admin'], (updateErr) => {
        if (updateErr) {
          res.status(500).json({ error: updateErr.message });
          return;
        }

        res.json({ success: true });
      });
    });
  });
}

module.exports = {
  registerManagerRoutes,
};
