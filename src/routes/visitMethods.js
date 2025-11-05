function registerVisitMethodRoutes(app, db) {
  app.get('/api/visit-methods', (_req, res) => {
    db.all('SELECT * FROM VisitMethods ORDER BY displayOrder', [], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  });

  app.post('/api/visit-methods', (req, res) => {
    const { name, description, displayOrder } = req.body;

    if (!name) {
      return res.status(400).json({ error: '名称不能为空' });
    }

    const sql = 'INSERT INTO VisitMethods (name, description, displayOrder) VALUES (?, ?, ?)';

    db.run(sql, [name, description, displayOrder || 999], function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      res.json({
        id: this.lastID,
        name,
        description,
        displayOrder: displayOrder || 999,
        success: true,
      });
    });
  });

  app.put('/api/visit-methods/:id', (req, res) => {
    const id = req.params.id;
    const { name, description, displayOrder } = req.body;

    if (!name) {
      return res.status(400).json({ error: '名称不能为空' });
    }

    const sql = `UPDATE VisitMethods SET 
      name = ?, 
      description = ?,
      displayOrder = ? 
      WHERE id = ?`;

    db.run(sql, [name, description, displayOrder || 999, id], function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (this.changes === 0) {
        res.status(404).json({ error: '回访方式不存在' });
        return;
      }

      res.json({ id, success: true });
    });
  });

  app.delete('/api/visit-methods/:id', (req, res) => {
    const id = req.params.id;

    db.run('DELETE FROM VisitMethods WHERE id = ?', id, function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (this.changes === 0) {
        res.status(404).json({ error: '回访方式不存在' });
        return;
      }

      res.json({ success: true });
    });
  });
}

module.exports = {
  registerVisitMethodRoutes,
};
