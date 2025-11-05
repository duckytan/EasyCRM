function getSubordinateContactsDetails(db, customer, res) {
  if (!customer.subordinateContactIds || customer.subordinateContactIds.length === 0) {
    customer.subordinateContacts = [];
    res.json(customer);
    return;
  }

  const placeholders = customer.subordinateContactIds.map(() => '?').join(',');

  db.all(
    `SELECT * FROM SubordinateContacts WHERE id IN (${placeholders})`,
    customer.subordinateContactIds,
    (err, subordinates) => {
      if (err) {
        console.error('获取下级联系人信息失败:', err);
        customer.subordinateContacts = [];
      } else {
        customer.subordinateContacts = subordinates.map((sub) => ({
          id: sub.id,
          name: sub.name,
          company: sub.company,
          isDirect: sub.isDirect,
        }));
      }
      res.json(customer);
    },
  );
}

function registerCustomerRoutes(app, db) {
  app.get('/api/customers', (_req, res) => {
    db.all('SELECT * FROM Customers', [], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  });

  app.get('/api/customers/:id', (req, res) => {
    const id = req.params.id;

    db.get(`SELECT * FROM Customers WHERE id = ?`, [id], (err, customer) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: '获取客户信息失败' });
        return;
      }

      if (!customer) {
        res.status(404).json({ error: '客户不存在' });
        return;
      }

      if (customer.subordinateContactIds) {
        try {
          customer.subordinateContactIds = JSON.parse(customer.subordinateContactIds);
        } catch (parseErr) {
          console.error('解析下级联系人ID失败:', parseErr);
          customer.subordinateContactIds = [];
        }
      } else {
        customer.subordinateContactIds = [];
      }

      if (customer.superiorContactId) {
        db.get(`SELECT * FROM SuperiorContacts WHERE id = ?`, [customer.superiorContactId], (superiorErr, superior) => {
          if (superiorErr || !superior) {
            console.error('获取上级联系人信息失败:', superiorErr);
            res.json(customer);
          } else {
            customer.superiorContact = {
              id: superior.id,
              name: superior.name,
              company: superior.company,
              isDirect: superior.isDirect,
            };

            getSubordinateContactsDetails(db, customer, res);
          }
        });
      } else {
        getSubordinateContactsDetails(db, customer, res);
      }
    });
  });

  app.post('/api/customers', (req, res) => {
    const {
      name,
      gender,
      age,
      birthday,
      phone,
      email,
      address,
      company,
      position,
      region,
      registration_date,
      category,
      intention,
      demand,
      wechat,
      whatsapp,
      facebook,
      budget,
      remark,
      superiorContactId,
      subordinateContactIds,
      planned_visit_date,
      planned_visit_method,
      planned_visit_content,
    } = req.body;

    if (!name) {
      res.status(400).json({ error: '客户姓名不能为空' });
      return;
    }

    const subordinateContactIdsString = Array.isArray(subordinateContactIds)
      ? JSON.stringify(subordinateContactIds)
      : subordinateContactIds;

    const sql = `
      INSERT INTO Customers (
        name, gender, age, birthday, phone, email, address, company, position,
        region, registration_date, category, intention, demand, wechat,
        whatsapp, facebook, budget, remark, superiorContactId, subordinateContactIds,
        planned_visit_date, planned_visit_method, planned_visit_content
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
      sql,
      [
        name,
        gender,
        age,
        birthday,
        phone,
        email,
        address,
        company,
        position,
        region,
        registration_date,
        category,
        intention,
        demand,
        wechat,
        whatsapp,
        facebook,
        budget,
        remark,
        superiorContactId,
        subordinateContactIdsString,
        planned_visit_date,
        planned_visit_method,
        planned_visit_content,
      ],
      function runHandler(err) {
        if (err) {
          console.error(err);
          res.status(500).json({ error: '创建客户失败' });
          return;
        }

        res.status(201).json({
          id: this.lastID,
          name,
        });
      },
    );
  });

  app.put('/api/customers/:id', (req, res) => {
    const customerId = req.params.id;
    const {
      name,
      gender,
      age,
      birthday,
      phone,
      email,
      address,
      company,
      position,
      region,
      registrationDate,
      category,
      intention,
      demand,
      wechat,
      whatsapp,
      facebook,
      budget,
      remark,
      superiorContactId,
      subordinateContactIds,
      planned_visit_date,
      planned_visit_method,
      planned_visit_content,
    } = req.body;

    if (!name) {
      res.status(400).json({ error: '客户姓名不能为空' });
      return;
    }

    const subordinateContactIdsString = Array.isArray(subordinateContactIds)
      ? JSON.stringify(subordinateContactIds)
      : subordinateContactIds;

    const sql = `
      UPDATE Customers SET
        name = ?,
        gender = ?,
        age = ?,
        birthday = ?,
        phone = ?,
        email = ?,
        address = ?,
        company = ?,
        position = ?,
        region = ?,
        registration_date = ?,
        category = ?,
        intention = ?,
        demand = ?,
        wechat = ?,
        whatsapp = ?,
        facebook = ?,
        budget = ?,
        remark = ?,
        superiorContactId = ?,
        subordinateContactIds = ?,
        planned_visit_date = ?,
        planned_visit_method = ?,
        planned_visit_content = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    db.run(
      sql,
      [
        name,
        gender,
        age,
        birthday,
        phone,
        email,
        address,
        company,
        position,
        region,
        registrationDate,
        category,
        intention,
        demand,
        wechat,
        whatsapp,
        facebook,
        budget,
        remark,
        superiorContactId,
        subordinateContactIdsString,
        planned_visit_date,
        planned_visit_method,
        planned_visit_content,
        customerId,
      ],
      function runHandler(err) {
        if (err) {
          console.error(err);
          res.status(500).json({ error: '更新客户信息失败' });
          return;
        }

        if (this.changes === 0) {
          res.status(404).json({ error: '客户不存在' });
          return;
        }

        res.json({
          id: customerId,
          name,
          message: '客户信息更新成功',
        });
      },
    );
  });

  app.delete('/api/customers/:id', (req, res) => {
    const id = req.params.id;

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      db.run('DELETE FROM Visits WHERE customerId = ?', [id], function deleteVisits(err) {
        if (err) {
          console.error('删除客户回访记录失败:', err.message);
          db.run('ROLLBACK');
          res.status(500).json({ error: err.message });
          return;
        }

        db.run('DELETE FROM Products WHERE customerId = ?', [id], function deleteProducts(err2) {
          if (err2) {
            console.error('删除客户产品记录失败:', err2.message);
            db.run('ROLLBACK');
            res.status(500).json({ error: err2.message });
            return;
          }

          db.run('DELETE FROM Customers WHERE id = ?', [id], function deleteCustomer(err3) {
            if (err3) {
              console.error('删除客户失败:', err3.message);
              db.run('ROLLBACK');
              res.status(500).json({ error: err3.message });
              return;
            }

            if (this.changes === 0) {
              db.run('ROLLBACK');
              res.status(404).json({ error: '客户不存在' });
              return;
            }

            db.run('COMMIT', (commitErr) => {
              if (commitErr) {
                console.error('提交事务失败:', commitErr.message);
                db.run('ROLLBACK');
                res.status(500).json({ error: commitErr.message });
                return;
              }

              console.log(`客户(ID: ${id})及其相关数据已被成功删除`);
              res.json({
                success: true,
                message: '客户及其相关数据已被成功删除',
              });
            });
          });
        });
      });
    });
  });
}

module.exports = {
  registerCustomerRoutes,
};
