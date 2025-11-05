function registerPresetProductRoutes(app, db) {
  app.get('/api/preset-products', (_req, res) => {
    db.all('SELECT * FROM PresetProducts ORDER BY displayOrder', [], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  });

  app.post('/api/preset-products', (req, res) => {
    const { productName, price, description, displayOrder } = req.body;

    if (!productName) {
      return res.status(400).json({ error: '产品名称不能为空' });
    }

    db.run(
      'INSERT INTO PresetProducts (productName, price, description, displayOrder) VALUES (?, ?, ?, ?)',
      [productName, price, description, displayOrder || 999],
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        res.json({
          id: this.lastID,
          productName,
          price,
          description,
          displayOrder: displayOrder || 999,
          success: true,
        });
      },
    );
  });

  app.put('/api/preset-products/:id', (req, res) => {
    const id = req.params.id;
    const { productName, price, description, displayOrder } = req.body;

    if (!productName) {
      return res.status(400).json({ error: '产品名称不能为空' });
    }

    const sql = `UPDATE PresetProducts SET 
      productName = ?,
      price = ?,
      description = ?,
      displayOrder = ?
      WHERE id = ?`;

    db.run(sql, [productName, price, description, displayOrder || 999, id], function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (this.changes === 0) {
        res.status(404).json({ error: '预设产品不存在' });
        return;
      }

      res.json({ id, success: true });
    });
  });

  app.delete('/api/preset-products/:id', (req, res) => {
    const id = req.params.id;

    db.run('DELETE FROM PresetProducts WHERE id = ?', id, function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (this.changes === 0) {
        res.status(404).json({ error: '预设产品不存在' });
        return;
      }

      res.json({ success: true });
    });
  });
}

module.exports = {
  registerPresetProductRoutes,
};
