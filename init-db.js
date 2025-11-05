const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

// 创建数据库连接
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
    process.exit(1);
  } else {
    console.log('已连接到SQLite数据库');
    initDatabase();
  }
});

// 初始化数据库表和示例数据
function initDatabase() {
  // 使用事务确保所有操作要么全部成功，要么全部失败
  db.serialize(() => {
    // 开始事务
    db.run('BEGIN TRANSACTION');

    // 删除现有表（如果存在）
    db.run('DROP TABLE IF EXISTS Visits');
    db.run('DROP TABLE IF EXISTS Products');
    db.run('DROP TABLE IF EXISTS Customers');
    db.run('DROP TABLE IF EXISTS Managers');

    console.log('已删除现有表结构');

    // 创建客户表
    db.run(`CREATE TABLE IF NOT EXISTS Customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      company TEXT,
      position TEXT,
      avatar TEXT,
      category TEXT DEFAULT 'normal',
      intention TEXT DEFAULT 'C',
      registration_date TEXT,
      gender TEXT,
      age INTEGER,
      region TEXT,
      demand TEXT,
      wechat TEXT,
      budget TEXT,
      remark TEXT,
      superior INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (superior) REFERENCES Customers(id)
    )`);

    // 插入示例数据
    db.run(`INSERT INTO Customers (name, phone, email, address, company, position, category, intention) VALUES 
      ('张三', '13800138000', 'zhangsan@example.com', '北京市朝阳区', '创新科技有限公司', '采购经理', 'vip', 'H'),
      ('李四', '13900139000', 'lisi@example.com', '上海市浦东新区', '未来电子有限公司', '总经理', 'enterprise', 'A'),
      ('王五', '13700137000', 'wangwu@example.com', '广州市天河区', '智能设备有限公司', '技术总监', 'agent', 'B'),
      ('赵六', '13600136000', 'zhaoliu@example.com', '深圳市南山区', '新锐科技有限公司', '销售经理', 'normal', 'C'),
      ('钱七', '13500135000', 'qianqi@example.com', '杭州市西湖区', '数字科技有限公司', 'CEO', 'potential', 'D')`);

    console.log('已插入示例客户数据');

    // 创建产品表
    db.run(`CREATE TABLE Products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customerId INTEGER,
      productName TEXT,
      quantity INTEGER,
      price REAL,
      purchaseDate TEXT,
      afterSale TEXT,
      FOREIGN KEY (customerId) REFERENCES Customers(id)
    )`, err => {
      if (err) {
        console.error('创建产品表失败:', err.message);
        return;
      }
      console.log('已创建产品表');

      // 插入示例产品数据
      const products = [
        {
          customerId: 1,
          productName: '人体工学办公椅',
          quantity: 10,
          purchaseDate: '2023-03-15',
          afterSale: '2年保修'
        },
        {
          customerId: 3,
          productName: '智能升降办公桌',
          quantity: 20,
          purchaseDate: '2023-04-20',
          afterSale: '3年保修'
        }
      ];

      products.forEach(product => {
        db.run(
          `INSERT INTO Products (customerId, productName, quantity, purchaseDate, afterSale) 
          VALUES (?, ?, ?, ?, ?)`,
          [
            product.customerId, 
            product.productName, 
            product.quantity, 
            product.purchaseDate, 
            product.afterSale
          ],
          function(err) {
            if (err) {
              console.error('插入产品数据失败:', err.message);
            }
          }
        );
      });

      console.log('已插入示例产品数据');
    });

    // 创建回访表
    db.run(`CREATE TABLE Visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customerId INTEGER,
      visitTime TEXT,
      content TEXT,
      effect TEXT,
      satisfaction TEXT,
      intention TEXT,
      followUp TEXT,
      FOREIGN KEY (customerId) REFERENCES Customers(id)
    )`, err => {
      if (err) {
        console.error('创建回访表失败:', err.message);
        return;
      }
      console.log('已创建回访表');

      // 插入示例回访数据
      const today = new Date().toISOString().split('T')[0];
      const visits = [
        {
          customerId: 1,
          visitTime: `${today}T10:30:00`,
          content: '跟进客户关于办公家具采购的最新进展',
          effect: '良好',
          satisfaction: '客户对产品样品表示满意',
          intention: 'H',
          followUp: '下周再次联系确认订单细节'
        },
        {
          customerId: 2,
          visitTime: `${today}T14:00:00`,
          content: '介绍新产品功能和优惠方案',
          effect: '一般',
          satisfaction: '客户需要更多时间考虑',
          intention: 'B',
          followUp: '发送产品详细资料'
        },
        {
          customerId: 3,
          visitTime: `${today}T16:00:00`,
          content: '售后服务满意度调查',
          effect: '非常满意',
          satisfaction: '客户对服务非常满意，准备追加订单',
          intention: 'H',
          followUp: '准备新产品优惠方案'
        }
      ];

      visits.forEach(visit => {
        db.run(
          `INSERT INTO Visits (customerId, visitTime, content, effect, satisfaction, intention, followUp) 
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            visit.customerId, 
            visit.visitTime, 
            visit.content, 
            visit.effect, 
            visit.satisfaction,
            visit.intention,
            visit.followUp
          ],
          function(err) {
            if (err) {
              console.error('插入回访数据失败:', err.message);
            }
          }
        );
      });

      console.log('已插入示例回访数据');
    });

    // 创建管理员表
    db.run(`CREATE TABLE Managers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      password TEXT NOT NULL
    )`, err => {
      if (err) {
        console.error('创建管理员表失败:', err.message);
        return;
      }
      console.log('已创建管理员表');

      // 插入默认管理员账户（密码加密）
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      db.run(
        `INSERT INTO Managers (name, password) VALUES (?, ?)`,
        ['admin', hashedPassword],
        function(err) {
          if (err) {
            console.error('插入管理员数据失败:', err.message);
          } else {
            console.log('已创建默认管理员账户: admin/admin123 (密码已加密)');
          }
        }
      );
    });

    // 提交事务
    db.run('COMMIT', err => {
      if (err) {
        console.error('提交事务失败:', err.message);
        db.run('ROLLBACK');
      } else {
        console.log('数据库初始化完成！');
      }
      
      // 关闭数据库连接
      db.close(err => {
        if (err) {
          console.error('关闭数据库连接失败:', err.message);
        } else {
          console.log('数据库连接已关闭');
        }
      });
    });
  });
} 