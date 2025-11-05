function registerDashboardRoutes(app, db) {
  app.get('/api/dashboard/statistics', (_req, res) => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfMonthStr = firstDayOfMonth.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    Promise.all([
      new Promise((resolve, reject) => {
        db.get(
          `SELECT SUM(quantity * price) as total
           FROM Products
           WHERE date(purchaseDate) >= date(?) AND date(purchaseDate) <= date(?)`,
          [firstDayOfMonthStr, todayStr],
          (err, row) => (err ? reject(err) : resolve(row ? row.total || 0 : 0)),
        );
      }),
      new Promise((resolve, reject) => {
        db.get(
          `SELECT COUNT(*) as count
           FROM Products
           WHERE date(purchaseDate) >= date(?) AND date(purchaseDate) <= date(?)`,
          [firstDayOfMonthStr, todayStr],
          (err, row) => (err ? reject(err) : resolve(row ? row.count : 0)),
        );
      }),
      new Promise((resolve, reject) => {
        db.get(
          'SELECT COUNT(*) as count FROM Customers WHERE date(created_at) >= date(?)',
          [firstDayOfMonthStr],
          (err, row) => (err ? reject(err) : resolve(row ? row.count : 0)),
        );
      }),
      new Promise((resolve, reject) => {
        db.get(
          `SELECT COUNT(*) as count
           FROM Visits
           WHERE date(visitTime) >= date(?) AND date(visitTime) <= date(?)`,
          [firstDayOfMonthStr, todayStr],
          (err, row) => (err ? reject(err) : resolve(row ? row.count : 0)),
        );
      }),
      new Promise((resolve, reject) => {
        db.get(
          `SELECT COUNT(DISTINCT customerId) as count
           FROM Products
           WHERE date(purchaseDate) >= date(?) AND date(purchaseDate) <= date(?)`,
          [firstDayOfMonthStr, todayStr],
          (err, row) => (err ? reject(err) : resolve(row ? row.count : 0)),
        );
      }),
      new Promise((resolve, reject) => {
        db.all(
          `SELECT intention, COUNT(*) as count
           FROM Customers
           WHERE intention IS NOT NULL
           GROUP BY intention`,
          [],
          (err, rows) => {
            if (err) {
              reject(err);
            } else {
              const distribution = { H: 0, A: 0, B: 0, C: 0, D: 0 };
              rows.forEach((row) => {
                if (row.intention in distribution) {
                  distribution[row.intention] = row.count;
                }
              });
              resolve(distribution);
            }
          },
        );
      }),
      new Promise((resolve, reject) => {
        const maxCycleDays = 360;
        const maxDaysLater = new Date(today);
        maxDaysLater.setDate(today.getDate() + maxCycleDays);
        const maxDaysLaterStr = maxDaysLater.toISOString().split('T')[0];

        const visitsPromise = new Promise((resolveVisits, rejectVisits) => {
          db.all(
            `SELECT
              'visit' as type,
              v.id,
              v.customerId,
              c.name as customerName,
              date(v.visitTime) as eventTime,
              v.content,
              '计划回访' as eventType
             FROM Visits v
             LEFT JOIN Customers c ON v.customerId = c.id
             WHERE date(v.visitTime) >= date(?) AND date(v.visitTime) <= date(?)
             ORDER BY date(v.visitTime) ASC`,
            [todayStr, maxDaysLaterStr],
            (err, rows) => (err ? rejectVisits(err) : resolveVisits(rows || [])),
          );
        });

        const birthdaysPromise = new Promise((resolveBirthdays, rejectBirthdays) => {
          const todayMD = today.toISOString().split('T')[0].substr(5);
          const endDate = new Date(today);
          endDate.setDate(today.getDate() + maxCycleDays);
          const endDateMD = endDate.toISOString().split('T')[0].substr(5);

          let whereClause = '';
          if (todayMD <= endDateMD) {
            whereClause = `strftime('%m-%d', birthday) >= '${todayMD}' AND strftime('%m-%d', birthday) <= '${endDateMD}'`;
          } else {
            whereClause = `strftime('%m-%d', birthday) >= '${todayMD}' OR strftime('%m-%d', birthday) <= '${endDateMD}'`;
          }

          db.all(
            `SELECT
              'birthday' as type,
              id as customerId,
              name as customerName,
              birthday as originalDate,
              CASE
                WHEN strftime('%m-%d', birthday) >= '${todayMD}' THEN date(strftime('%Y-', 'now') || strftime('%m-%d', birthday))
                ELSE date(strftime('%Y-', 'now', '+1 year') || strftime('%m-%d', birthday))
              END as eventTime,
              '客户生日' as eventType,
              NULL as content
             FROM Customers
             WHERE birthday IS NOT NULL AND birthday != '' AND (${whereClause})
             ORDER BY
               CASE WHEN strftime('%m-%d', birthday) < '${todayMD}' THEN 1 ELSE 0 END,
               strftime('%m-%d', birthday) ASC`,
            [],
            (err, rows) => {
              if (err) {
                rejectBirthdays(err);
              } else {
                resolveBirthdays(rows || []);
              }
            },
          );
        });

        const plannedVisitsPromise = new Promise((resolvePlanned, rejectPlanned) => {
          db.all(
            `SELECT
              'planned_visit' as type,
              id as customerId,
              name as customerName,
              date(planned_visit_date) as eventTime,
              planned_visit_content as content,
              '计划客户回访' as eventType
             FROM Customers
             WHERE planned_visit_date IS NOT NULL AND planned_visit_date != ''
               AND date(planned_visit_date) >= date(?)
               AND date(planned_visit_date) <= date(?)
             ORDER BY date(planned_visit_date) ASC`,
            [todayStr, maxDaysLaterStr],
            (err, rows) => (err ? rejectPlanned(err) : resolvePlanned(rows || [])),
          );
        });

        const productVisitsPromise = new Promise((resolveProduct, rejectProduct) => {
          db.all(
            `SELECT
              'product_visit' as type,
              p.customerId,
              c.name as customerName,
              date(p.purchaseDate, '+90 days') as eventTime,
              '产品 ' || p.productName || ' 回访' as content,
              '产品回访' as eventType
             FROM Products p
             LEFT JOIN Customers c ON p.customerId = c.id
             WHERE p.purchaseDate IS NOT NULL AND p.purchaseDate != ''
               AND date(p.purchaseDate, '+90 days') >= date(?)
               AND date(p.purchaseDate, '+90 days') <= date(?)
             ORDER BY date(p.purchaseDate, '+90 days') ASC`,
            [todayStr, maxDaysLaterStr],
            (err, rows) => (err ? rejectProduct(err) : resolveProduct(rows || [])),
          );
        });

        Promise.all([visitsPromise, birthdaysPromise, plannedVisitsPromise, productVisitsPromise])
          .then(([visits, birthdays, plannedVisits, productVisits]) => {
            const allReminders = [...visits, ...birthdays, ...plannedVisits, ...productVisits];
            allReminders.sort((a, b) => new Date(a.eventTime) - new Date(b.eventTime));
            resolve(allReminders);
          })
          .catch((err) => reject(err));
      }),
    ])
      .then(([
        monthlySales,
        monthlyOrders,
        monthlyNewCustomers,
        monthlyVisits,
        monthlyDealCustomers,
        intentionDistribution,
        importantReminders,
      ]) => {
        const averageOrderValue = monthlyOrders > 0 ? Math.round(monthlySales / monthlyOrders) : 0;

        res.json({
          monthlySalesAmount: monthlySales,
          monthlyOrderCount: monthlyOrders,
          averageOrderValue,
          monthlyNewCustomers,
          monthlyVisitCount: monthlyVisits,
          monthlyDealCustomers,
          intentionDistribution,
          importantReminders,
        });
      })
      .catch((err) => {
        console.error('Dashboard统计数据查询错误:', err.message);
        res.status(500).json({ error: err.message });
      });
  });
}

module.exports = {
  registerDashboardRoutes,
};
