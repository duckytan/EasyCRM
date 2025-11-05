function registerContactRoutes(app, db) {
  // Superior Contacts
  app.get('/api/superior-contacts', (_req, res) => {
    db.all('SELECT * FROM SuperiorContacts ORDER BY displayOrder', [], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  });

  app.post('/api/superior-contacts', (req, res) => {
    const { name, company, isDirect } = req.body;

    if (!name) {
      return res.status(400).json({ error: '名称不能为空' });
    }

    db.get('SELECT MAX(displayOrder) as maxOrder FROM SuperiorContacts', [], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const displayOrder = (row && row.maxOrder ? row.maxOrder : 0) + 1;

      db.run(
        'INSERT INTO SuperiorContacts (name, company, isDirect, displayOrder) VALUES (?, ?, ?, ?)',
        [name, company, isDirect ? 1 : 0, displayOrder],
        function (insertErr) {
          if (insertErr) {
            return res.status(500).json({ error: insertErr.message });
          }

          res.json({
            id: this.lastID,
            name,
            company,
            isDirect,
            displayOrder,
            success: true,
          });
        },
      );
    });
  });

  app.put('/api/superior-contacts/:id', (req, res) => {
    const id = req.params.id;
    const { name, company, isDirect } = req.body;

    if (!name) {
      return res.status(400).json({ error: '名称不能为空' });
    }

    db.run(
      'UPDATE SuperiorContacts SET name = ?, company = ?, isDirect = ? WHERE id = ?',
      [name, company, isDirect ? 1 : 0, id],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: '上级联系人不存在' });
        }

        res.json({ id, name, company, isDirect, success: true });
      },
    );
  });

  app.delete('/api/superior-contacts/:id', (req, res) => {
    const id = req.params.id;

    db.run('DELETE FROM SuperiorContacts WHERE id = ?', [id], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: '上级联系人不存在' });
      }

      res.json({ success: true });
    });
  });

  app.post('/api/superior-contacts/reorder', (req, res) => {
    const { order } = req.body;

    if (!order || !Array.isArray(order)) {
      return res.status(400).json({ error: '无效的排序数据' });
    }

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      order.forEach((id, index) => {
        db.run('UPDATE SuperiorContacts SET displayOrder = ? WHERE id = ?', [index + 1, id], (err) => {
          if (err) {
            console.error('更新上级联系人排序失败:', err.message);
          }
        });
      });

      db.run('COMMIT', (err) => {
        if (err) {
          console.error('提交事务失败:', err.message);
          db.run('ROLLBACK');
          return res.status(500).json({ error: '保存排序失败' });
        }

        res.json({ success: true, message: '上级联系人排序已保存' });
      });
    });
  });

  // Subordinate Contacts
  app.get('/api/subordinate-contacts', (_req, res) => {
    db.all('SELECT * FROM SubordinateContacts ORDER BY displayOrder', [], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  });

  app.post('/api/subordinate-contacts', (req, res) => {
    const { name, company, isDirect } = req.body;

    if (!name) {
      return res.status(400).json({ error: '名称不能为空' });
    }

    db.get('SELECT MAX(displayOrder) as maxOrder FROM SubordinateContacts', [], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const displayOrder = (row && row.maxOrder ? row.maxOrder : 0) + 1;

      db.run(
        'INSERT INTO SubordinateContacts (name, company, isDirect, displayOrder) VALUES (?, ?, ?, ?)',
        [name, company, isDirect ? 1 : 0, displayOrder],
        function (insertErr) {
          if (insertErr) {
            return res.status(500).json({ error: insertErr.message });
          }

          res.json({
            id: this.lastID,
            name,
            company,
            isDirect,
            displayOrder,
            success: true,
          });
        },
      );
    });
  });

  app.put('/api/subordinate-contacts/:id', (req, res) => {
    const id = req.params.id;
    const { name, company, isDirect } = req.body;

    if (!name) {
      return res.status(400).json({ error: '名称不能为空' });
    }

    db.run(
      'UPDATE SubordinateContacts SET name = ?, company = ?, isDirect = ? WHERE id = ?',
      [name, company, isDirect ? 1 : 0, id],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: '下级联系人不存在' });
        }

        res.json({ id, name, company, isDirect, success: true });
      },
    );
  });

  app.delete('/api/subordinate-contacts/:id', (req, res) => {
    const id = req.params.id;

    db.run('DELETE FROM SubordinateContacts WHERE id = ?', [id], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: '下级联系人不存在' });
      }

      res.json({ success: true });
    });
  });

  app.post('/api/subordinate-contacts/reorder', (req, res) => {
    const { order } = req.body;

    if (!order || !Array.isArray(order)) {
      return res.status(400).json({ error: '无效的排序数据' });
    }

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      order.forEach((id, index) => {
        db.run('UPDATE SubordinateContacts SET displayOrder = ? WHERE id = ?', [index + 1, id], (err) => {
          if (err) {
            console.error('更新下级联系人排序失败:', err.message);
          }
        });
      });

      db.run('COMMIT', (err) => {
        if (err) {
          console.error('提交事务失败:', err.message);
          db.run('ROLLBACK');
          return res.status(500).json({ error: '保存排序失败' });
        }

        res.json({ success: true, message: '下级联系人排序已保存' });
      });
    });
  });
}

module.exports = {
  registerContactRoutes,
};
