function registerVisitRoutes(app, db) {
  app.get('/api/visits', (req, res) => {
    const customerId = req.query.customerId;

    let sql = `
      SELECT v.*, c.name as customerName
      FROM Visits v
      LEFT JOIN Customers c ON v.customerId = c.id`;

    const params = [];

    if (customerId) {
      sql += ' WHERE v.customerId = ?';
      params.push(customerId);
    }

    sql += ' ORDER BY v.visitTime DESC';

    db.all(sql, params, (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  });

  app.get('/api/visits/:id', (req, res) => {
    const id = req.params.id;
    const sql = `
      SELECT v.*, c.name as customerName
      FROM Visits v
      LEFT JOIN Customers c ON v.customerId = c.id
      WHERE v.id = ?`;

    db.get(sql, [id], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (!row) {
        res.status(404).json({ error: '回访记录不存在' });
        return;
      }

      res.json(row);
    });
  });

  app.post('/api/visits', (req, res) => {
    const { customerId, visitTime, content, effect, satisfaction, intention, followUp } = req.body;
    const sql = `INSERT INTO Visits (customerId, visitTime, content, effect, satisfaction, intention, followUp)
      VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [customerId, visitTime, content, effect, satisfaction, intention, followUp], function runHandler(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID });
    });
  });

  app.put('/api/visits/:id', (req, res) => {
    const id = req.params.id;
    const { customerId, visitTime, content, effect, satisfaction, intention, followUp } = req.body;
    const sql = `UPDATE Visits SET
      customerId = ?,
      visitTime = ?,
      content = ?,
      effect = ?,
      satisfaction = ?,
      intention = ?,
      followUp = ?
      WHERE id = ?`;

    db.run(sql, [customerId, visitTime, content, effect, satisfaction, intention, followUp, id], function runHandler(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (this.changes === 0) {
        res.status(404).json({ error: '回访记录不存在' });
        return;
      }

      res.json({ success: true });
    });
  });

  app.delete('/api/visits/:id', (req, res) => {
    const id = req.params.id;

    db.run('DELETE FROM Visits WHERE id = ?', [id], function runHandler(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (this.changes === 0) {
        res.status(404).json({ error: '回访记录不存在' });
        return;
      }

      res.json({ success: true });
    });
  });
}

module.exports = {
  registerVisitRoutes,
};
