const bcrypt = require('bcryptjs');
const { createIndexes } = require('./indexes');

function migrateDatabase(db) {
  console.log('检查表结构并进行迁移...');

  db.all("PRAGMA table_info(Customers)", (err, rows) => {
    if (err) {
      console.error('检查表结构时出错:', err);
      return;
    }

    const hasSuperiorContactId = Array.isArray(rows) && rows.some((row) => row.name === 'superiorContactId');
    const hasSubordinateContactIds = Array.isArray(rows) && rows.some((row) => row.name === 'subordinateContactIds');
    const hasBirthday = Array.isArray(rows) && rows.some((row) => row.name === 'birthday');
    const hasWhatsapp = Array.isArray(rows) && rows.some((row) => row.name === 'whatsapp');
    const hasFacebook = Array.isArray(rows) && rows.some((row) => row.name === 'facebook');
    const hasSuperior = Array.isArray(rows) && rows.some((row) => row.name === 'superior');

    if (!hasBirthday) {
      db.run(`ALTER TABLE Customers ADD COLUMN birthday TEXT`, (alterErr) => {
        if (alterErr) {
          console.error('添加 birthday 字段时出错:', alterErr);
        } else {
          console.log('成功添加 birthday 字段');
        }
      });
    }

    if (!hasWhatsapp) {
      db.run(`ALTER TABLE Customers ADD COLUMN whatsapp TEXT`, (alterErr) => {
        if (alterErr) {
          console.error('添加 whatsapp 字段时出错:', alterErr);
        } else {
          console.log('成功添加 whatsapp 字段');
        }
      });
    }

    if (!hasFacebook) {
      db.run(`ALTER TABLE Customers ADD COLUMN facebook TEXT`, (alterErr) => {
        if (alterErr) {
          console.error('添加 facebook 字段时出错:', alterErr);
        } else {
          console.log('成功添加 facebook 字段');
        }
      });
    }

    if (!hasSuperiorContactId) {
      db.run(
        `ALTER TABLE Customers ADD COLUMN superiorContactId INTEGER REFERENCES SuperiorContacts(id)`,
        (alterErr) => {
          if (alterErr) {
            console.error('添加 superiorContactId 字段时出错:', alterErr);
          } else {
            console.log('成功添加 superiorContactId 字段');

            if (hasSuperior) {
              db.run(
                `UPDATE Customers SET superiorContactId = superior WHERE superior IS NOT NULL`,
                (updateErr) => {
                  if (updateErr) {
                    console.error('迁移 superior 数据时出错:', updateErr);
                  } else {
                    console.log('成功迁移 superior 数据到 superiorContactId');
                  }
                },
              );
            }
          }
        },
      );
    }

    if (!hasSubordinateContactIds) {
      db.run(`ALTER TABLE Customers ADD COLUMN subordinateContactIds TEXT`, (alterErr) => {
        if (alterErr) {
          console.error('添加 subordinateContactIds 字段时出错:', alterErr);
        } else {
          console.log('成功添加 subordinateContactIds 字段');
        }
      });
    }

    db.all("PRAGMA table_info(Products)", (productErr, productRows) => {
      if (productErr) {
        console.error('检查Products表结构时出错:', productErr);
        return;
      }

      const hasFollowUpDate = Array.isArray(productRows) && productRows.some((row) => row.name === 'followUpDate');

      if (!hasFollowUpDate) {
        db.run(`ALTER TABLE Products ADD COLUMN followUpDate TEXT`, (alterErr) => {
          if (alterErr) {
            console.error('添加 followUpDate 字段时出错:', alterErr);
            return;
          }

          console.log('成功添加 followUpDate 字段');

          db.all("SELECT id, purchaseDate FROM Products WHERE purchaseDate IS NOT NULL", (selectErr, products) => {
            if (selectErr) {
              console.error('获取产品记录时出错:', selectErr);
              return;
            }

            products.forEach((product) => {
              if (product.purchaseDate) {
                try {
                  const purchaseDate = new Date(product.purchaseDate);
                  const followUpDate = new Date(purchaseDate);
                  followUpDate.setDate(followUpDate.getDate() + 90);

                  const followUpDateStr = followUpDate.toISOString().split('T')[0];

                  db.run(
                    'UPDATE Products SET followUpDate = ? WHERE id = ?',
                    [followUpDateStr, product.id],
                    (updateErr) => {
                      if (updateErr) {
                        console.error(`更新产品ID ${product.id} 的回访日期时出错:`, updateErr);
                      }
                    },
                  );
                } catch (calcErr) {
                  console.error(`计算产品ID ${product.id} 的回访日期时出错:`, calcErr);
                }
              }
            });

            console.log('已更新现有产品记录的回访日期');
          });
        });
      }
    });
  });
}

function initializeDefaultData(db) {
  console.log('初始化默认数据...');

  db.get('SELECT COUNT(*) as count FROM Managers', (err, row) => {
    if (err) {
      console.error('检查管理员表时出错:', err);
      return;
    }

    if (row.count === 0) {
      console.log('添加默认管理员账户...');
      const defaultPassword = 'admin123';
      const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
      db.run(
        `INSERT INTO Managers (name, password) VALUES (?, ?)`,
        ['admin', hashedPassword],
        (insertErr) => {
          if (insertErr) {
            console.error('添加默认管理员时出错:', insertErr);
          } else {
            console.log('默认管理员账户已创建: admin/admin123');
          }
        },
      );
    }
  });

  db.get('SELECT COUNT(*) as count FROM SuperiorContacts', (err, row) => {
    if (err) {
      console.error('检查上级联系人表时出错:', err);
      return;
    }

    if (row.count === 0) {
      console.log('添加默认上级联系人数据...');

      const defaultSuperiors = [
        { name: '张总监', company: '集团总部', isDirect: 1, displayOrder: 1 },
        { name: '王经理', company: '地区分公司', isDirect: 1, displayOrder: 2 },
        { name: '李主管', company: '部门领导', isDirect: 0, displayOrder: 3 },
      ];

      defaultSuperiors.forEach((superior) => {
        db.run(
          `INSERT INTO SuperiorContacts (name, company, isDirect, displayOrder) VALUES (?, ?, ?, ?)`,
          [superior.name, superior.company, superior.isDirect, superior.displayOrder],
          (insertErr) => {
            if (insertErr) {
              console.error('添加默认上级联系人时出错:', insertErr);
            }
          },
        );
      });
    }
  });

  db.get('SELECT COUNT(*) as count FROM SubordinateContacts', (err, row) => {
    if (err) {
      console.error('检查下级联系人表时出错:', err);
      return;
    }

    if (row.count === 0) {
      console.log('添加默认下级联系人数据...');

      const defaultSubordinates = [
        { name: '刘助理', company: '销售部', isDirect: 1, displayOrder: 1 },
        { name: '陈员工', company: '市场部', isDirect: 1, displayOrder: 2 },
        { name: '赵实习', company: '研发部', isDirect: 0, displayOrder: 3 },
      ];

      defaultSubordinates.forEach((subordinate) => {
        db.run(
          `INSERT INTO SubordinateContacts (name, company, isDirect, displayOrder) VALUES (?, ?, ?, ?)`,
          [subordinate.name, subordinate.company, subordinate.isDirect, subordinate.displayOrder],
          (insertErr) => {
            if (insertErr) {
              console.error('添加默认下级联系人时出错:', insertErr);
            }
          },
        );
      });
    }
  });

  db.get('SELECT COUNT(*) as count FROM PresetProducts', (err, row) => {
    if (err) {
      console.error('检查预设产品表时出错:', err);
      return;
    }

    if (row.count === 0) {
      console.log('添加默认预设产品数据...');

      const defaultProducts = [
        { productName: '保湿滋养面霜', price: 298.0, description: '深层保湿滋养，适合干性皮肤', displayOrder: 1 },
        { productName: '清爽控油洁面乳', price: 168.0, description: '温和清洁，控油不紧绷', displayOrder: 2 },
        { productName: '亮肤焕颜精华液', price: 488.0, description: '提亮肤色，改善暗沉', displayOrder: 3 },
        { productName: '多效修护眼霜', price: 368.0, description: '淡化细纹，改善眼周问题', displayOrder: 4 },
        { productName: '舒缓修复面膜', price: 128.0, description: '舒缓敏感，修护屏障', displayOrder: 5 },
      ];

      defaultProducts.forEach((product) => {
        db.run(
          `INSERT INTO PresetProducts (productName, price, description, displayOrder) VALUES (?, ?, ?, ?)`,
          [product.productName, product.price, product.description, product.displayOrder],
          (insertErr) => {
            if (insertErr) {
              console.error('添加默认预设产品时出错:', insertErr);
            }
          },
        );
      });
    }
  });

  db.get('SELECT COUNT(*) as count FROM VisitTypes', (err, row) => {
    if (err) {
      console.error('检查回访类型表时出错:', err);
      return;
    }

    if (row.count === 0) {
      console.log('添加默认回访类型数据...');

      const defaultVisitTypes = [
        { name: '计划回访', description: '按计划进行的常规回访', displayOrder: 1 },
        { name: '产品回访', description: '针对产品使用情况的回访', displayOrder: 2 },
        { name: '客户生日', description: '客户生日祝福回访', displayOrder: 3 },
        { name: '其他回访', description: '其他类型的回访', displayOrder: 4 },
      ];

      defaultVisitTypes.forEach((type) => {
        db.run(
          `INSERT INTO VisitTypes (name, description, displayOrder) VALUES (?, ?, ?)`,
          [type.name, type.description, type.displayOrder],
          (insertErr) => {
            if (insertErr) {
              console.error('添加默认回访类型时出错:', insertErr);
            }
          },
        );
      });
    }
  });

  db.get('SELECT COUNT(*) as count FROM NavigationModes', (err, row) => {
    if (err) {
      console.error('检查导航模式表时出错:', err);
      return;
    }

    if (row.count === 0) {
      console.log('添加默认导航模式数据...');

      const defaultNavigationModes = [
        { name: '手机导航', urlPattern: 'geo:latitude,longitude?q={Address}', displayOrder: 1 },
        { name: 'Apple导航', urlPattern: 'maps://maps.apple.com/?daddr=目的地地址', displayOrder: 2 },
        { name: 'Google地图', urlPattern: 'https://www.google.com/maps?q={Address}', displayOrder: 3 },
        { name: '百度地图', urlPattern: 'https://map.baidu.com/search?query={Address}', displayOrder: 4 },
      ];

      defaultNavigationModes.forEach((mode) => {
        db.run(
          `INSERT INTO NavigationModes (name, urlPattern, displayOrder) VALUES (?, ?, ?)`,
          [mode.name, mode.urlPattern, mode.displayOrder],
          (insertErr) => {
            if (insertErr) {
              console.error('添加默认导航模式时出错:', insertErr);
            }
          },
        );
      });
    }
  });

  db.get('SELECT COUNT(*) as count FROM ReminderCycles', (err, row) => {
    if (err) {
      console.error('检查提醒周期表时出错:', err);
      return;
    }

    if (row.count === 0) {
      console.log('添加默认提醒周期数据...');

      const defaultReminderCycles = [
        { name: '今天', days: 0, displayOrder: 1 },
        { name: '3天内', days: 3, displayOrder: 2 },
        { name: '7天内', days: 7, displayOrder: 3 },
        { name: '15天内', days: 15, displayOrder: 4 },
        { name: '30天内', days: 30, displayOrder: 5 },
        { name: '90天内', days: 90, displayOrder: 6 },
        { name: '180天内', days: 180, displayOrder: 7 },
        { name: '360天内', days: 360, displayOrder: 8 },
      ];

      defaultReminderCycles.forEach((cycle) => {
        db.run(
          `INSERT INTO ReminderCycles (name, days, displayOrder) VALUES (?, ?, ?)`,
          [cycle.name, cycle.days, cycle.displayOrder],
          (insertErr) => {
            if (insertErr) {
              console.error('添加默认提醒周期时出错:', insertErr);
            }
          },
        );
      });
    }
  });
}

function createSchema(db) {
  db.run(`CREATE TABLE IF NOT EXISTS Customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    gender TEXT,
    age TEXT,
    birthday TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    company TEXT,
    position TEXT,
    avatar BLOB,
    region TEXT,
    registration_date TEXT,
    category TEXT,
    intention TEXT,
    demand TEXT,
    wechat TEXT,
    whatsapp TEXT,
    facebook TEXT,
    budget TEXT,
    remark TEXT,
    superiorContactId INTEGER,
    subordinateContactIds TEXT,
    planned_visit_date TEXT,
    planned_visit_method TEXT,
    planned_visit_content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (superiorContactId) REFERENCES SuperiorContacts(id)
  )`);

  migrateDatabase(db);

  db.run(`CREATE TABLE IF NOT EXISTS Products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customerId INTEGER NOT NULL,
    productName TEXT NOT NULL,
    quantity INTEGER,
    price REAL,
    purchaseDate TEXT,
    afterSale TEXT,
    followUpDate TEXT,
    FOREIGN KEY (customerId) REFERENCES Customers(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS Visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customerId INTEGER,
    visitTime TEXT,
    content TEXT,
    effect TEXT,
    satisfaction TEXT,
    intention TEXT,
    followUp TEXT,
    FOREIGN KEY (customerId) REFERENCES Customers(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS VisitMethods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    displayOrder INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS Managers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    password TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS CustomerCategories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    displayOrder INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS CustomerIntentions (
    level TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    criteria TEXT,
    followUpPriority TEXT,
    displayOrder INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS Regions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    displayOrder INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS BudgetRanges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    displayOrder INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS SuperiorContacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    company TEXT,
    isDirect INTEGER DEFAULT 0,
    displayOrder INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS SubordinateContacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    company TEXT,
    isDirect INTEGER DEFAULT 0,
    displayOrder INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS UserSettings (
    id INTEGER PRIMARY KEY,
    darkMode INTEGER DEFAULT 0,
    visitReminder INTEGER DEFAULT 1,
    birthdayReminder INTEGER DEFAULT 0,
    language TEXT DEFAULT 'zh-CN',
    lastBackup TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS PresetProducts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    productName TEXT NOT NULL,
    price REAL,
    description TEXT,
    displayOrder INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS VisitTypes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    displayOrder INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS NavigationModes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    urlPattern TEXT NOT NULL,
    displayOrder INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS ReminderCycles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    days INTEGER NOT NULL,
    displayOrder INTEGER
  )`);

  console.log('数据库表已初始化');
}

function initializeDatabase(db) {
  return new Promise((resolve) => {
    db.serialize(() => {
      createSchema(db);
      initializeDefaultData(db);
      createIndexes(db);
      resolve();
    });
  });
}

module.exports = {
  initializeDatabase,
  migrateDatabase,
  initializeDefaultData,
};
