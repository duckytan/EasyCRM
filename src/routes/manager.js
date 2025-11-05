function registerManagerRoutes(app, db) {
  app.post('/api/managers/change-password', (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: '请提供当前密码和新密码' });
      return;
    }

    db.get('SELECT * FROM Managers WHERE name = ? AND password = ?', ['admin', currentPassword], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (!row) {
        res.status(401).json({ error: '当前密码错误' });
        return;
      }

      db.run('UPDATE Managers SET password = ? WHERE name = ?', [newPassword, 'admin'], (updateErr) => {
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
