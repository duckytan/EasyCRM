function registerNavigationModeRoutes(app, db) {
  app.get('/api/navigation-modes', (_req, res) => {
    db.all('SELECT * FROM NavigationModes ORDER BY displayOrder', [], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  });

  app.post('/api/navigation-modes', (req, res) => {
    const { name, urlPattern, displayOrder } = req.body;

    if (!name || !urlPattern) {
      return res.status(400).json({ error: '名称和URLPattern不能为空' });
    }

    db.run(
      'INSERT INTO NavigationModes (name, urlPattern, displayOrder) VALUES (?, ?, ?)',
      [name, urlPattern, displayOrder || 999],
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        res.json({
          id: this.lastID,
          name,
          urlPattern,
          displayOrder: displayOrder || 999,
          success: true,
        });
      },
    );
  });

  app.put('/api/navigation-modes/:id', (req, res) => {
    const id = req.params.id;
    const { name, urlPattern, displayOrder } = req.body;

    if (!name || !urlPattern) {
      return res.status(400).json({ error: '名称和URLPattern不能为空' });
    }

    const sql = `UPDATE NavigationModes SET 
      name = ?,
      urlPattern = ?,
      displayOrder = ?
      WHERE id = ?`;

    db.run(sql, [name, urlPattern, displayOrder || 999, id], function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (this.changes === 0) {
        res.status(404).json({ error: '导航模式不存在' });
        return;
      }

      res.json({ id, success: true });
    });
  });

  app.delete('/api/navigation-modes/:id', (req, res) => {
    const id = req.params.id;

    db.run('DELETE FROM NavigationModes WHERE id = ?', id, function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (this.changes === 0) {
        res.status(404).json({ error: '导航模式不存在' });
        return;
      }

      res.json({ success: true });
    });
  });

  app.post('/api/navigation-modes/reorder', (req, res) => {
    const { order } = req.body;

    if (!order || !Array.isArray(order)) {
      return res.status(400).json({ error: '无效的排序数据' });
    }

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      order.forEach((id, index) => {
        db.run('UPDATE NavigationModes SET displayOrder = ? WHERE id = ?', [index + 1, id], (err) => {
          if (err) {
            console.error('更新导航模式排序失败:', err.message);
          }
        });
      });

      db.run('COMMIT', (err) => {
        if (err) {
          console.error('提交事务失败:', err.message);
          db.run('ROLLBACK');
          return res.status(500).json({ error: '保存排序失败' });
        }

        res.json({ success: true, message: '导航模式排序已保存' });
      });
    });
  });
}

module.exports = {
  registerNavigationModeRoutes,
};
