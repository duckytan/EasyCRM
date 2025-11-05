function registerBudgetRangeRoutes(app, db) {
  app.get('/api/budget-ranges', (_req, res) => {
    db.all('SELECT * FROM BudgetRanges ORDER BY displayOrder', [], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  });

  app.post('/api/budget-ranges', (req, res) => {
    const { id, name } = req.body;

    if (!id || !name) {
      return res.status(400).json({ error: 'ID和名称不能为空' });
    }

    db.get('SELECT id FROM BudgetRanges WHERE id = ?', [id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (row) {
        return res.status(400).json({ error: '该预算范围ID已存在' });
      }

      db.get('SELECT MAX(displayOrder) as maxOrder FROM BudgetRanges', [], (orderErr, orderRow) => {
        if (orderErr) {
          return res.status(500).json({ error: orderErr.message });
        }

        const displayOrder = (orderRow && orderRow.maxOrder ? orderRow.maxOrder : 0) + 1;

        db.run(
          'INSERT INTO BudgetRanges (id, name, displayOrder) VALUES (?, ?, ?)',
          [id, name, displayOrder],
          function (insertErr) {
            if (insertErr) {
              return res.status(500).json({ error: insertErr.message });
            }

            res.json({
              success: true,
              budgetRange: { id, name, displayOrder },
            });
          },
        );
      });
    });
  });

  app.put('/api/budget-ranges/:id', (req, res) => {
    const id = req.params.id;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: '预算范围名称不能为空' });
    }

    db.run('UPDATE BudgetRanges SET name = ? WHERE id = ?', [name, id], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: '预算范围不存在' });
      }

      res.json({
        success: true,
        budgetRange: { id, name },
      });
    });
  });

  app.delete('/api/budget-ranges/:id', (req, res) => {
    const id = req.params.id;

    db.run('DELETE FROM BudgetRanges WHERE id = ?', [id], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: '预算范围不存在' });
      }

      res.json({ success: true });
    });
  });

  app.post('/api/budget-ranges/reorder', (req, res) => {
    const { order } = req.body;

    if (!order || !Array.isArray(order)) {
      return res.status(400).json({ error: '无效的排序数据' });
    }

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      let hasError = false;

      order.forEach((rangeId, index) => {
        db.run('UPDATE BudgetRanges SET displayOrder = ? WHERE id = ?', [index + 1, rangeId], (err) => {
          if (err) {
            console.error('更新预算范围顺序失败:', err.message);
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
          message: '预算范围排序已保存',
        });
      });
    });
  });
}

module.exports = {
  registerBudgetRangeRoutes,
};
