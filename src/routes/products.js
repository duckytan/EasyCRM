function registerProductRoutes(app, db) {
  app.get('/api/products', (req, res) => {
    const customerId = req.query.customerId;

    let sql = `
      SELECT p.*, c.name as customerName
      FROM Products p
      LEFT JOIN Customers c ON p.customerId = c.id`;

    const params = [];

    if (customerId) {
      sql += ' WHERE p.customerId = ?';
      params.push(customerId);
    }

    sql += ' ORDER BY p.purchaseDate DESC';

    db.all(sql, params, (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  });

  app.get('/api/products/:id', (req, res) => {
    const id = req.params.id;

    db.get(
      `SELECT p.*, c.name as customerName
       FROM Products p
       LEFT JOIN Customers c ON p.customerId = c.id
       WHERE p.id = ?`,
      [id],
      (err, row) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (!row) {
          res.status(404).json({ error: '产品记录不存在' });
          return;
        }
        res.json(row);
      },
    );
  });

  app.post('/api/products', (req, res) => {
    const { customerId, productName, quantity, price, purchaseDate, afterSale, followUpDate } = req.body;

    if (!customerId) {
      res.status(400).json({ error: '客户ID是必填项' });
      return;
    }

    let calculatedFollowUpDate = followUpDate;
    if (!calculatedFollowUpDate && purchaseDate) {
      try {
        const pDate = new Date(purchaseDate);
        const fDate = new Date(pDate);
        fDate.setDate(fDate.getDate() + 90);
        calculatedFollowUpDate = fDate.toISOString().split('T')[0];
      } catch (error) {
        console.error('计算回访日期时出错:', error);
      }
    }

    const sql = `INSERT INTO Products
      (customerId, productName, quantity, price, purchaseDate, afterSale, followUpDate)
      VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.run(
      sql,
      [customerId, productName, quantity, price, purchaseDate, afterSale, calculatedFollowUpDate],
      function runHandler(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ id: this.lastID });
      },
    );
  });

  app.put('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const { customerId, productName, quantity, price, purchaseDate, afterSale, followUpDate } = req.body;

    if (!customerId || !productName) {
      res.status(400).json({ error: '客户ID和产品名称是必填项' });
      return;
    }

    let calculatedFollowUpDate = followUpDate;
    if (purchaseDate && !followUpDate) {
      try {
        const pDate = new Date(purchaseDate);
        const fDate = new Date(pDate);
        fDate.setDate(fDate.getDate() + 90);
        calculatedFollowUpDate = fDate.toISOString().split('T')[0];
      } catch (error) {
        console.error('计算回访日期时出错:', error);
      }
    }

    const sql = `
      UPDATE Products SET
        customerId = ?,
        productName = ?,
        quantity = ?,
        price = ?,
        purchaseDate = ?,
        afterSale = ?,
        followUpDate = ?
      WHERE id = ?`;

    db.run(
      sql,
      [
        customerId,
        productName,
        quantity || null,
        price || null,
        purchaseDate || null,
        afterSale || null,
        calculatedFollowUpDate || null,
        id,
      ],
      function runHandler(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        if (this.changes === 0) {
          res.status(404).json({ error: '购买记录不存在' });
          return;
        }

        res.json({ id, success: true });
      },
    );
  });

  app.delete('/api/products/:id', (req, res) => {
    const id = req.params.id;

    db.run('DELETE FROM Products WHERE id = ?', [id], function runHandler(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (this.changes === 0) {
        res.status(404).json({ error: '产品记录不存在' });
        return;
      }

      res.json({ success: true });
    });
  });

  app.get('/api/products/statistics/summary', (_req, res) => {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const firstDayOfMonthStr = firstDayOfMonth.toISOString().split('T')[0];

    Promise.all([
      new Promise((resolve, reject) => {
        db.get(
          'SELECT COUNT(*) as count FROM Products WHERE purchaseDate >= ?',
          [firstDayOfMonthStr],
          (err, row) => {
            if (err) reject(err);
            else resolve(row ? row.count : 0);
          },
        );
      }),
      new Promise((resolve, reject) => {
        db.get(
          'SELECT SUM(quantity * price) as total FROM Products WHERE purchaseDate >= ?',
          [firstDayOfMonthStr],
          (err, row) => {
            if (err) reject(err);
            else resolve(row && row.total !== null ? row.total : 0);
          },
        );
      }),
      new Promise((resolve, reject) => {
        db.get(
          `SELECT ROUND(COUNT(*) * 1.0 / CASE WHEN COUNT(DISTINCT customerId) = 0 THEN 1 ELSE COUNT(DISTINCT customerId) END, 2) as frequency
           FROM Products
           WHERE purchaseDate >= date('now', '-1 year')`,
          [],
          (err, row) => {
            if (err) reject(err);
            else resolve(row && row.frequency !== null ? row.frequency : 0);
          },
        );
      }),
      new Promise((resolve, reject) => {
        db.get(
          `SELECT productName, SUM(quantity) as totalQuantity
           FROM Products
           GROUP BY productName
           ORDER BY totalQuantity DESC
           LIMIT 1`,
          [],
          (err, row) => {
            if (err) reject(err);
            else resolve(row && row.productName ? row.productName : '-');
          },
        );
      }),
    ])
      .then(([monthlyCount, monthlySales, purchaseFrequency, topProduct]) => {
        res.json({
          monthlyRecordsCount: monthlyCount,
          monthlySales,
          purchaseFrequency,
          topProduct,
        });
      })
      .catch((err) => {
        console.error('产品统计数据查询错误:', err.message);
        res.status(500).json({ error: err.message });
      });
  });
}

module.exports = {
  registerProductRoutes,
};
