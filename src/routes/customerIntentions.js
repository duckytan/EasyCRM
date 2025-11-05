function registerCustomerIntentionRoutes(app, db) {
  app.get('/api/customer-intentions', (_req, res) => {
    db.all('SELECT * FROM CustomerIntentions ORDER BY displayOrder', [], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  });

  app.post('/api/customer-intentions', (req, res) => {
    const { level, name, description, criteria, followUpPriority } = req.body;

    if (!level || !name || !description) {
      res.status(400).json({ error: '等级、名称和描述不能为空' });
      return;
    }

    db.get('SELECT level FROM CustomerIntentions WHERE level = ?', [level], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (row) {
        res.status(400).json({ error: '该等级已存在' });
        return;
      }

      db.get('SELECT MAX(displayOrder) as maxOrder FROM CustomerIntentions', [], (orderErr, orderRow) => {
        if (orderErr) {
          res.status(500).json({ error: orderErr.message });
          return;
        }

        const displayOrder = (orderRow.maxOrder || 0) + 1;

        db.run(
          'INSERT INTO CustomerIntentions (level, name, description, criteria, followUpPriority, displayOrder) VALUES (?, ?, ?, ?, ?, ?)',
          [level, name, description, criteria, followUpPriority, displayOrder],
          function runHandler(insertErr) {
            if (insertErr) {
              res.status(500).json({ error: insertErr.message });
              return;
            }

            res.json({
              success: true,
              intention: { level, name, description, criteria, followUpPriority, displayOrder },
            });
          },
        );
      });
    });
  });

  app.put('/api/customer-intentions/:level', (req, res) => {
    const level = req.params.level;
    const { name, description, criteria, followUpPriority } = req.body;

    if (!name || !description) {
      res.status(400).json({ error: '名称和描述不能为空' });
      return;
    }

    db.run(
      'UPDATE CustomerIntentions SET name = ?, description = ?, criteria = ?, followUpPriority = ? WHERE level = ?',
      [name, description, criteria, followUpPriority, level],
      function runHandler(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        if (this.changes === 0) {
          res.status(404).json({ error: '意向等级不存在' });
          return;
        }

        res.json({
          success: true,
          intention: { level, name, description, criteria, followUpPriority },
        });
      },
    );
  });

  app.delete('/api/customer-intentions/:level', (req, res) => {
    const level = req.params.level;

    db.run('DELETE FROM CustomerIntentions WHERE level = ?', [level], function runHandler(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (this.changes === 0) {
        res.status(404).json({ error: '意向等级不存在' });
        return;
      }

      res.json({ success: true });
    });
  });

  app.post('/api/customer-intentions/reorder', (req, res) => {
    const { order } = req.body;

    if (!order || !Array.isArray(order)) {
      res.status(400).json({ error: '无效的排序数据' });
      return;
    }

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      let hasError = false;

      order.forEach((intentionLevel, index) => {
        db.run(
          'UPDATE CustomerIntentions SET displayOrder = ? WHERE level = ?',
          [index + 1, intentionLevel],
          (err) => {
            if (err) {
              console.error('更新意向等级顺序失败:', err.message);
              hasError = true;
            }
          },
        );
      });

      if (hasError) {
        db.run('ROLLBACK', (err) => {
          if (err) {
            console.error('回滚事务失败:', err.message);
          }
          res.status(500).json({ error: '更新顺序失败' });
        });
      } else {
        db.run('COMMIT', (err) => {
          if (err) {
            console.error('提交事务失败:', err.message);
            res.status(500).json({ error: '提交更新失败' });
          } else {
            res.json({ success: true });
          }
        });
      }
    });
  });
}

module.exports = {
  registerCustomerIntentionRoutes,
};
