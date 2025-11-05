const { parsePagination, buildPagination } = require('../utils/pagination');

function registerVisitRoutes(app, db) {
  app.get('/api/visits', (req, res) => {
    const { usePagination, page, limit, offset } = parsePagination(req.query);
    const searchTerm = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    let customerId = undefined;
    if (req.query.customerId !== undefined) {
      const parsedCustomerId = Number.parseInt(req.query.customerId, 10);
      if (Number.isNaN(parsedCustomerId)) {
        res.status(400).json({ error: '客户ID必须是数字' });
        return;
      }
      customerId = parsedCustomerId;
    }

    const conditions = [];
    const params = [];

    if (customerId !== undefined) {
      conditions.push('v.customerId = ?');
      params.push(customerId);
    }

    if (searchTerm) {
      conditions.push('(v.content LIKE ? OR v.followUp LIKE ? OR v.effect LIKE ? OR c.name LIKE ?)');
      const searchPattern = `%${searchTerm}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
    const baseQuery = 'FROM Visits v LEFT JOIN Customers c ON v.customerId = c.id';
    const orderClause = ' ORDER BY COALESCE(v.visitTime, \'\') DESC, v.id DESC';

    if (usePagination) {
      const countSql = `SELECT COUNT(*) as total ${baseQuery}${whereClause}`;
      db.get(countSql, params, (countErr, countRow) => {
        if (countErr) {
          res.status(500).json({ error: countErr.message });
          return;
        }

        const total = countRow.total;
        const dataSql = `SELECT v.*, c.name as customerName ${baseQuery}${whereClause}${orderClause} LIMIT ? OFFSET ?`;
        const dataParams = [...params, limit, offset];

        db.all(dataSql, dataParams, (err, rows) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }

          res.json({
            data: rows,
            pagination: buildPagination(page, limit, total),
          });
        });
      });
    } else {
      const sql = `SELECT v.*, c.name as customerName ${baseQuery}${whereClause}${orderClause}`;
      db.all(sql, params, (err, rows) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json(rows);
      });
    }
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
