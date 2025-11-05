function registerVisitTypeRoutes(app, db) {
  app.get('/api/visit-types', (_req, res) => {
    db.all('SELECT * FROM VisitTypes ORDER BY displayOrder', [], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  });

  app.post('/api/visit-types', (req, res) => {
    const { name, description, displayOrder } = req.body;

    if (!name) {
      return res.status(400).json({ error: '名称不能为空' });
    }

    db.run(
      'INSERT INTO VisitTypes (name, description, displayOrder) VALUES (?, ?, ?)',
      [name, description, displayOrder || 999],
      function (err) {
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
      },
    );
  });

  app.put('/api/visit-types/:id', (req, res) => {
    const id = req.params.id;
    const { name, description, displayOrder } = req.body;

    if (!name) {
      return res.status(400).json({ error: '名称不能为空' });
    }

    const sql = `UPDATE VisitTypes SET 
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
        res.status(404).json({ error: '回访类型不存在' });
        return;
      }

      res.json({ id, success: true });
    });
  });

  app.delete('/api/visit-types/:id', (req, res) => {
    const id = req.params.id;

    db.run('DELETE FROM VisitTypes WHERE id = ?', id, function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (this.changes === 0) {
        res.status(404).json({ error: '回访类型不存在' });
        return;
      }

      res.json({ success: true });
    });
  });
}

module.exports = {
  registerVisitTypeRoutes,
};
