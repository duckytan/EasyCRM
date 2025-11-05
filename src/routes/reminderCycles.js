function registerReminderCycleRoutes(app, db) {
  app.get('/api/reminder-cycles', (_req, res) => {
    db.all('SELECT * FROM ReminderCycles ORDER BY displayOrder', [], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  });

  app.post('/api/reminder-cycles', (req, res) => {
    const { name, days, displayOrder } = req.body;

    if (!name || days === undefined) {
      return res.status(400).json({ error: '名称和天数是必填项' });
    }

    const sql = 'INSERT INTO ReminderCycles (name, days, displayOrder) VALUES (?, ?, ?)';

    db.run(sql, [name, days, displayOrder || 999], function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      res.json({
        id: this.lastID,
        name,
        days,
        success: true,
      });
    });
  });

  app.put('/api/reminder-cycles/:id', (req, res) => {
    const id = req.params.id;
    const { name, days, displayOrder } = req.body;

    if (!name || days === undefined) {
      return res.status(400).json({ error: '名称和天数是必填项' });
    }

    const sql = `UPDATE ReminderCycles SET 
      name = ?, 
      days = ?,
      displayOrder = ? 
      WHERE id = ?`;

    db.run(sql, [name, days, displayOrder || 999, id], function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (this.changes === 0) {
        res.status(404).json({ error: '提醒周期不存在' });
        return;
      }

      res.json({
        id: id,
        success: true,
      });
    });
  });

  app.delete('/api/reminder-cycles/:id', (req, res) => {
    const id = req.params.id;

    db.run('DELETE FROM ReminderCycles WHERE id = ?', id, function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (this.changes === 0) {
        res.status(404).json({ error: '提醒周期不存在' });
        return;
      }

      res.json({ success: true });
    });
  });
}

module.exports = {
  registerReminderCycleRoutes,
};
