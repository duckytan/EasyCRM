function registerRegionRoutes(app, db) {
  app.get('/api/regions', (_req, res) => {
    db.all('SELECT * FROM Regions ORDER BY displayOrder', [], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  });

  app.post('/api/regions', (req, res) => {
    const { id, name } = req.body;

    if (!id || !name) {
      return res.status(400).json({ error: 'ID和名称不能为空' });
    }

    db.get('SELECT id FROM Regions WHERE id = ?', [id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (row) {
        return res.status(400).json({ error: '该地区ID已存在' });
      }

      db.get('SELECT MAX(displayOrder) as maxOrder FROM Regions', [], (orderErr, orderRow) => {
        if (orderErr) {
          return res.status(500).json({ error: orderErr.message });
        }

        const displayOrder = (orderRow && orderRow.maxOrder ? orderRow.maxOrder : 0) + 1;

        db.run(
          'INSERT INTO Regions (id, name, displayOrder) VALUES (?, ?, ?)',
          [id, name, displayOrder],
          function (insertErr) {
            if (insertErr) {
              return res.status(500).json({ error: insertErr.message });
            }

            res.json({
              success: true,
              region: { id, name, displayOrder },
            });
          },
        );
      });
    });
  });

  app.put('/api/regions/:id', (req, res) => {
    const id = req.params.id;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: '地区名称不能为空' });
    }

    db.run('UPDATE Regions SET name = ? WHERE id = ?', [name, id], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: '地区不存在' });
      }

      res.json({
        success: true,
        region: { id, name },
      });
    });
  });

  app.delete('/api/regions/:id', (req, res) => {
    const id = req.params.id;

    db.run('DELETE FROM Regions WHERE id = ?', [id], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: '地区不存在' });
      }

      res.json({ success: true });
    });
  });

  app.post('/api/regions/reorder', (req, res) => {
    const { order } = req.body;

    if (!order || !Array.isArray(order)) {
      return res.status(400).json({ error: '无效的排序数据' });
    }

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      let hasError = false;

      order.forEach((regionId, index) => {
        db.run('UPDATE Regions SET displayOrder = ? WHERE id = ?', [index + 1, regionId], (err) => {
          if (err) {
            console.error('更新地区顺序失败:', err.message);
            hasError = true;
          }
        });
      });

      if (hasError) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: '保存排序失败，已回滚更改' });
      }

      db.run('COMMIT', (err) => {
        if (err) {
          console.error('提交事务失败:', err.message);
          db.run('ROLLBACK');
          return res.status(500).json({ error: '保存排序失败，提交事务出错' });
        }

        res.json({
          success: true,
          message: '地区排序已保存',
        });
      });
    });
  });
}

module.exports = {
  registerRegionRoutes,
};
