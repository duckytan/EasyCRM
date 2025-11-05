function registerCustomerCategoryRoutes(app, db) {
  app.get('/api/customer-categories', (_req, res) => {
    db.all('SELECT * FROM CustomerCategories ORDER BY displayOrder', [], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  });

  app.post('/api/customer-categories', (req, res) => {
    const { id, name, description } = req.body;

    if (!id || !name) {
      res.status(400).json({ error: 'ID和名称不能为空' });
      return;
    }

    db.get('SELECT id FROM CustomerCategories WHERE id = ?', [id], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (row) {
        res.status(400).json({ error: '该ID已存在' });
        return;
      }

      db.get('SELECT MAX(displayOrder) as maxOrder FROM CustomerCategories', [], (orderErr, orderRow) => {
        if (orderErr) {
          res.status(500).json({ error: orderErr.message });
          return;
        }

        const displayOrder = (orderRow.maxOrder || 0) + 1;

        db.run(
          'INSERT INTO CustomerCategories (id, name, description, displayOrder) VALUES (?, ?, ?, ?)',
          [id, name, description, displayOrder],
          function runHandler(insertErr) {
            if (insertErr) {
              res.status(500).json({ error: insertErr.message });
              return;
            }

            res.json({ success: true, category: { id, name, description, displayOrder } });
          },
        );
      });
    });
  });

  app.put('/api/customer-categories/:id', (req, res) => {
    const id = req.params.id;
    const { name, description } = req.body;

    if (!name) {
      res.status(400).json({ error: '分类名称不能为空' });
      return;
    }

    db.run(
      'UPDATE CustomerCategories SET name = ?, description = ? WHERE id = ?',
      [name, description, id],
      function runHandler(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        if (this.changes === 0) {
          res.status(404).json({ error: '分类不存在' });
          return;
        }

        res.json({ success: true, category: { id, name, description } });
      },
    );
  });

  app.delete('/api/customer-categories/:id', (req, res) => {
    const id = req.params.id;

    db.run('DELETE FROM CustomerCategories WHERE id = ?', [id], function runHandler(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (this.changes === 0) {
        res.status(404).json({ error: '分类不存在' });
        return;
      }

      res.json({ success: true });
    });
  });

  app.post('/api/customer-categories/reorder', (req, res) => {
    const { order } = req.body;

    if (!order || !Array.isArray(order)) {
      res.status(400).json({ error: '无效的排序数据' });
      return;
    }

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      let hasError = false;

      order.forEach((categoryId, index) => {
        db.run(
          'UPDATE CustomerCategories SET displayOrder = ? WHERE id = ?',
          [index + 1, categoryId],
          (err) => {
            if (err) {
              console.error('更新分类顺序失败:', err.message);
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
  registerCustomerCategoryRoutes,
};
