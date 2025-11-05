function createIndexes(db) {
  console.log('创建数据库索引...');

  const indexes = [
    {
      name: 'idx_customers_category',
      table: 'Customers',
      column: 'category',
      description: '客户分类索引（用于分类查询）',
    },
    {
      name: 'idx_customers_intention',
      table: 'Customers',
      column: 'intention',
      description: '客户意向等级索引（用于意向筛选）',
    },
    {
      name: 'idx_customers_region',
      table: 'Customers',
      column: 'region',
      description: '客户地区索引（用于地区筛选）',
    },
    {
      name: 'idx_customers_created_at',
      table: 'Customers',
      column: 'created_at',
      description: '客户创建时间索引（用于时间排序）',
    },
    {
      name: 'idx_customers_name',
      table: 'Customers',
      column: 'name',
      description: '客户姓名索引（用于搜索）',
    },
    {
      name: 'idx_products_customer_id',
      table: 'Products',
      column: 'customerId',
      description: '产品客户ID索引（用于关联查询）',
    },
    {
      name: 'idx_products_purchase_date',
      table: 'Products',
      column: 'purchaseDate',
      description: '产品购买日期索引（用于时间筛选）',
    },
    {
      name: 'idx_products_follow_up_date',
      table: 'Products',
      column: 'followUpDate',
      description: '产品回访日期索引（用于提醒查询）',
    },
    {
      name: 'idx_visits_customer_id',
      table: 'Visits',
      column: 'customerId',
      description: '回访客户ID索引（用于关联查询）',
    },
    {
      name: 'idx_visits_visit_time',
      table: 'Visits',
      column: 'visitTime',
      description: '回访时间索引（用于时间筛选和排序）',
    },
    {
      name: 'idx_customers_planned_visit_date',
      table: 'Customers',
      column: 'planned_visit_date',
      description: '计划回访日期索引（用于提醒查询）',
    },
    {
      name: 'idx_customers_birthday',
      table: 'Customers',
      column: 'birthday',
      description: '客户生日索引（用于生日提醒）',
    },
  ];

  let successCount = 0;
  let skipCount = 0;

  const checkAndCreateIndex = (index) => {
    return new Promise((resolve) => {
      const checkSql = `SELECT name FROM sqlite_master WHERE type='index' AND name='${index.name}'`;

      db.get(checkSql, (err, row) => {
        if (err) {
          console.error(`检查索引 ${index.name} 时出错:`, err.message);
          resolve();
          return;
        }

        if (row) {
          skipCount++;
          resolve();
          return;
        }

        const createSql = `CREATE INDEX IF NOT EXISTS ${index.name} ON ${index.table}(${index.column})`;

        db.run(createSql, (createErr) => {
          if (createErr) {
            console.error(`创建索引 ${index.name} 失败:`, createErr.message);
          } else {
            successCount++;
          }
          resolve();
        });
      });
    });
  };

  Promise.all(indexes.map((index) => checkAndCreateIndex(index)))
    .then(() => {
      console.log(`索引创建完成: 新增 ${successCount} 个, 已存在 ${skipCount} 个`);
    })
    .catch((err) => {
      console.error('索引创建过程出错:', err);
    });
}

module.exports = {
  createIndexes,
};
