const { getConnection } = require('../database');
const { logOperation } = require('../middlewares/logger');

class CustomerService {
  constructor(db = getConnection()) {
    this.db = db;
  }

  getAllCustomers() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM Customers', [], (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows || []);
      });
    });
  }

  getCustomerById(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM Customers WHERE id = ?', [id], (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row || null);
      });
    });
  }

  createCustomer(data) {
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
    } = data;

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO Customers (
          name, gender, age, birthday, phone, email, address, company, position,
          region, registration_date, category, intention, demand, wechat,
          whatsapp, facebook, budget, remark, superiorContactId, subordinateContactIds,
          planned_visit_date, planned_visit_method, planned_visit_content
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
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
          JSON.stringify(subordinateContactIds || []),
          planned_visit_date,
          planned_visit_method,
          planned_visit_content,
        ],
        function (err) {
          if (err) {
            return reject(err);
          }

          logOperation('创建客户', { customerId: this.lastID, name });
          resolve({ id: this.lastID, name });
        },
      );
    });
  }

  updateCustomer(id, data) {
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
    } = data;

    return new Promise((resolve, reject) => {
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

      this.db.run(
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
          JSON.stringify(subordinateContactIds || []),
          planned_visit_date,
          planned_visit_method,
          planned_visit_content,
          id,
        ],
        function (err) {
          if (err) {
            return reject(err);
          }

          if (this.changes === 0) {
            resolve(null);
            return;
          }

          logOperation('更新客户', { customerId: id, name });
          resolve({ id, name });
        },
      );
    });
  }

  deleteCustomer(id) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');

        this.db.run('DELETE FROM Visits WHERE customerId = ?', [id], (err) => {
          if (err) {
            this.db.run('ROLLBACK');
            return reject(err);
          }

          this.db.run('DELETE FROM Products WHERE customerId = ?', [id], (err2) => {
            if (err2) {
              this.db.run('ROLLBACK');
              return reject(err2);
            }

            this.db.run('DELETE FROM Customers WHERE id = ?', [id], function (err3) {
              if (err3) {
                this.db.run('ROLLBACK');
                return reject(err3);
              }

              if (this.changes === 0) {
                this.db.run('ROLLBACK');
                resolve(null);
                return;
              }

              this.db.run('COMMIT', (commitErr) => {
                if (commitErr) {
                  this.db.run('ROLLBACK');
                  return reject(commitErr);
                }

                logOperation('删除客户', { customerId: id });
                resolve({ success: true });
              });
            });
          });
        });
      });
    });
  }
}

module.exports = {
  CustomerService,
};
