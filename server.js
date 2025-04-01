const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 创建应用
const app = express();
const port = 3001;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // 提供静态文件

// 创建数据库连接
let db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('已连接到SQLite数据库');
    initDatabase();
  }
});

// 初始化数据库表
function initDatabase() {
  db.serialize(() => {
    // 创建客户表
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

    // 进行数据库表迁移，添加新的计划回访字段
    migrateDatabase();

    // 创建产品表
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

    // 创建回访表
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

    // 创建回访方式表
    db.run(`CREATE TABLE IF NOT EXISTS VisitMethods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      displayOrder INTEGER
    )`);

    // 创建管理员表
    db.run(`CREATE TABLE IF NOT EXISTS Managers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      password TEXT NOT NULL
    )`);

    // 创建客户分类表
    db.run(`CREATE TABLE IF NOT EXISTS CustomerCategories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      displayOrder INTEGER
    )`);

    // 创建客户意向等级表
    db.run(`CREATE TABLE IF NOT EXISTS CustomerIntentions (
      level TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      criteria TEXT,
      followUpPriority TEXT,
      displayOrder INTEGER
    )`);

    // 创建地区表
    db.run(`CREATE TABLE IF NOT EXISTS Regions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      displayOrder INTEGER
    )`);

    // 创建预算范围表
    db.run(`CREATE TABLE IF NOT EXISTS BudgetRanges (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      displayOrder INTEGER
    )`);

    // 创建上级联系人表
    db.run(`CREATE TABLE IF NOT EXISTS SuperiorContacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company TEXT,
      isDirect INTEGER DEFAULT 0,
      displayOrder INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 创建下级联系人表
    db.run(`CREATE TABLE IF NOT EXISTS SubordinateContacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company TEXT,
      isDirect INTEGER DEFAULT 0,
      displayOrder INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 创建用户设置表
    db.run(`CREATE TABLE IF NOT EXISTS UserSettings (
      id INTEGER PRIMARY KEY,
      darkMode INTEGER DEFAULT 0,
      visitReminder INTEGER DEFAULT 1,
      birthdayReminder INTEGER DEFAULT 0,
      language TEXT DEFAULT 'zh-CN',
      lastBackup TEXT
    )`);

    // 创建预设产品表
    db.run(`CREATE TABLE IF NOT EXISTS PresetProducts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      productName TEXT NOT NULL,
      price REAL,
      description TEXT,
      displayOrder INTEGER
    )`);

    // 创建回访类型表
    db.run(`CREATE TABLE IF NOT EXISTS VisitTypes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      displayOrder INTEGER
    )`);

    // 创建导航模式表
    db.run(`CREATE TABLE IF NOT EXISTS NavigationModes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      urlPattern TEXT NOT NULL,
      displayOrder INTEGER
    )`);

    // 创建提醒周期表
    db.run(`CREATE TABLE IF NOT EXISTS ReminderCycles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      days INTEGER NOT NULL,
      displayOrder INTEGER
    )`);

    console.log('数据库表已初始化');
    
    // 初始化默认数据
    initializeDefaultData();
  });
}

// 数据库表迁移，添加新的字段
function migrateDatabase() {
    console.log('检查表结构并进行迁移...');
  
    // 检查是否需要进行迁移
    db.all("PRAGMA table_info(Customers)", (err, rows) => {
    if (err) {
            console.error('检查表结构时出错:', err);
      return;
    }
    
        // 检查是否已经存在新字段
        const hasSuperiorContactId = Array.isArray(rows) && rows.some(row => row.name === 'superiorContactId');
        const hasSubordinateContactIds = Array.isArray(rows) && rows.some(row => row.name === 'subordinateContactIds');
        const hasBirthday = Array.isArray(rows) && rows.some(row => row.name === 'birthday');
        const hasWhatsapp = Array.isArray(rows) && rows.some(row => row.name === 'whatsapp');
        const hasFacebook = Array.isArray(rows) && rows.some(row => row.name === 'facebook');
        const hasSuperior = Array.isArray(rows) && rows.some(row => row.name === 'superior');

        // 添加新字段：birthday
        if (!hasBirthday) {
            db.run(`ALTER TABLE Customers ADD COLUMN birthday TEXT`, err => {
          if (err) {
                    console.error('添加 birthday 字段时出错:', err);
          } else {
                    console.log('成功添加 birthday 字段');
          }
        });
      }
    
        // 添加新字段：whatsapp
        if (!hasWhatsapp) {
            db.run(`ALTER TABLE Customers ADD COLUMN whatsapp TEXT`, err => {
      if (err) {
                    console.error('添加 whatsapp 字段时出错:', err);
                } else {
                    console.log('成功添加 whatsapp 字段');
                }
            });
        }

        // 添加新字段：facebook
        if (!hasFacebook) {
            db.run(`ALTER TABLE Customers ADD COLUMN facebook TEXT`, err => {
          if (err) {
                    console.error('添加 facebook 字段时出错:', err);
          } else {
                    console.log('成功添加 facebook 字段');
          }
        });
      }
    
        if (!hasSuperiorContactId) {
            // 添加 superiorContactId 字段
            db.run(`ALTER TABLE Customers ADD COLUMN superiorContactId INTEGER REFERENCES SuperiorContacts(id)`, err => {
      if (err) {
                    console.error('添加 superiorContactId 字段时出错:', err);
          } else {
                    console.log('成功添加 superiorContactId 字段');
                    
                    // 如果有旧的 superior 字段，迁移数据
                    if (hasSuperior) {
                        db.run(`UPDATE Customers SET superiorContactId = superior WHERE superior IS NOT NULL`, err => {
          if (err) {
                                console.error('迁移 superior 数据时出错:', err);
          } else {
                                console.log('成功迁移 superior 数据到 superiorContactId');
          }
        });
      }
                }
            });
        }

        if (!hasSubordinateContactIds) {
            // 添加 subordinateContactIds 字段 (存储JSON字符串)
            db.run(`ALTER TABLE Customers ADD COLUMN subordinateContactIds TEXT`, err => {
    if (err) {
                    console.error('添加 subordinateContactIds 字段时出错:', err);
    } else {
                    console.log('成功添加 subordinateContactIds 字段');
        }
      });
    }

    // 检查Products表是否需要进行迁移
    db.all("PRAGMA table_info(Products)", (err, productRows) => {
      if (err) {
        console.error('检查Products表结构时出错:', err);
        return;
      }
      
      // 检查是否已经存在followUpDate字段
      const hasFollowUpDate = Array.isArray(productRows) && productRows.some(row => row.name === 'followUpDate');
      
      // 添加新字段：followUpDate
      if (!hasFollowUpDate) {
        db.run(`ALTER TABLE Products ADD COLUMN followUpDate TEXT`, err => {
          if (err) {
            console.error('添加 followUpDate 字段时出错:', err);
          } else {
            console.log('成功添加 followUpDate 字段');
            
            // 更新现有产品记录，设置回访日期为购买日期+90天
            db.all("SELECT id, purchaseDate FROM Products WHERE purchaseDate IS NOT NULL", (err, products) => {
              if (err) {
                console.error('获取产品记录时出错:', err);
                return;
              }
              
              products.forEach(product => {
                if (product.purchaseDate) {
                  try {
                    const purchaseDate = new Date(product.purchaseDate);
                    const followUpDate = new Date(purchaseDate);
                    followUpDate.setDate(followUpDate.getDate() + 90);
                    
                    const followUpDateStr = followUpDate.toISOString().split('T')[0];
                    
                    db.run("UPDATE Products SET followUpDate = ? WHERE id = ?", [followUpDateStr, product.id], updateErr => {
                      if (updateErr) {
                        console.error(`更新产品ID ${product.id} 的回访日期时出错:`, updateErr);
                      }
                    });
                  } catch (error) {
                    console.error(`计算产品ID ${product.id} 的回访日期时出错:`, error);
                  }
                }
              });
              
              console.log('已更新现有产品记录的回访日期');
            });
          }
        });
      }
    });
  });
}

// 初始化默认数据
function initializeDefaultData() {
    console.log('初始化默认数据...');
    
    // 检查上级联系人表是否有数据
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
                { name: '李主管', company: '部门领导', isDirect: 0, displayOrder: 3 }
            ];
            
            defaultSuperiors.forEach(superior => {
                db.run(
                    `INSERT INTO SuperiorContacts (name, company, isDirect, displayOrder) VALUES (?, ?, ?, ?)`,
                    [superior.name, superior.company, superior.isDirect, superior.displayOrder],
                    err => {
                        if (err) console.error('添加默认上级联系人时出错:', err);
                    }
                );
      });
    }
  });
  
    // 检查下级联系人表是否有数据
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
                { name: '赵实习', company: '研发部', isDirect: 0, displayOrder: 3 }
            ];
            
            defaultSubordinates.forEach(subordinate => {
                db.run(
                    `INSERT INTO SubordinateContacts (name, company, isDirect, displayOrder) VALUES (?, ?, ?, ?)`,
                    [subordinate.name, subordinate.company, subordinate.isDirect, subordinate.displayOrder],
                    err => {
                        if (err) console.error('添加默认下级联系人时出错:', err);
                    }
                );
            });
        }
    });
    
    // 检查预设产品表是否有数据
    db.get('SELECT COUNT(*) as count FROM PresetProducts', (err, row) => {
    if (err) {
            console.error('检查预设产品表时出错:', err);
      return;
    }
    
    if (row.count === 0) {
            console.log('添加默认预设产品数据...');
            
            const defaultProducts = [
                { productName: '保湿滋养面霜', price: 298.00, description: '深层保湿滋养，适合干性皮肤', displayOrder: 1 },
                { productName: '清爽控油洁面乳', price: 168.00, description: '温和清洁，控油不紧绷', displayOrder: 2 },
                { productName: '亮肤焕颜精华液', price: 488.00, description: '提亮肤色，改善暗沉', displayOrder: 3 },
                { productName: '多效修护眼霜', price: 368.00, description: '淡化细纹，改善眼周问题', displayOrder: 4 },
                { productName: '舒缓修复面膜', price: 128.00, description: '舒缓敏感，修护屏障', displayOrder: 5 }
            ];
            
            defaultProducts.forEach(product => {
                db.run(
                    `INSERT INTO PresetProducts (productName, price, description, displayOrder) VALUES (?, ?, ?, ?)`,
                    [product.productName, product.price, product.description, product.displayOrder],
                    err => {
                        if (err) console.error('添加默认预设产品时出错:', err);
                    }
                );
            });
    }
  });

  // 检查回访类型表是否有数据
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
        { name: '其他回访', description: '其他类型的回访', displayOrder: 4 }
      ];
      
      defaultVisitTypes.forEach(type => {
        db.run(
          `INSERT INTO VisitTypes (name, description, displayOrder) VALUES (?, ?, ?)`,
          [type.name, type.description, type.displayOrder],
          err => {
            if (err) console.error('添加默认回访类型时出错:', err);
          }
        );
      });
    }
  });
  
  // 检查导航模式表是否有数据
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
        { name: '百度地图', urlPattern: 'https://map.baidu.com/search?query={Address}', displayOrder: 4 }
      ];
      
      defaultNavigationModes.forEach(mode => {
        db.run(
          `INSERT INTO NavigationModes (name, urlPattern, displayOrder) VALUES (?, ?, ?)`,
          [mode.name, mode.urlPattern, mode.displayOrder],
          err => {
            if (err) console.error('添加默认导航模式时出错:', err);
          }
        );
      });
    }
  });

  // 检查提醒周期表是否有数据
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
        { name: '360天内', days: 360, displayOrder: 8 }
      ];
      
      defaultReminderCycles.forEach(cycle => {
        db.run(
          `INSERT INTO ReminderCycles (name, days, displayOrder) VALUES (?, ?, ?)`,
          [cycle.name, cycle.days, cycle.displayOrder],
          err => {
            if (err) console.error('添加默认提醒周期时出错:', err);
          }
        );
      });
    }
  });
}

// API路由 - 客户
app.get('/api/customers', (req, res) => {
  db.all('SELECT * FROM Customers', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 获取单个客户信息
app.get('/api/customers/:id', (req, res) => {
  const id = req.params.id;
  
  db.get(`SELECT * FROM Customers WHERE id = ?`, [id], (err, customer) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: '获取客户信息失败' });
    }
    
    if (!customer) {
      return res.status(404).json({ error: '客户不存在' });
    }
    
    // 处理下级联系人IDs（从JSON字符串转回数组）
    if (customer.subordinateContactIds) {
      try {
        customer.subordinateContactIds = JSON.parse(customer.subordinateContactIds);
      } catch (e) {
        console.error('解析下级联系人ID失败:', e);
        customer.subordinateContactIds = [];
      }
    } else {
      customer.subordinateContactIds = [];
    }
    
    // 如果有上级联系人ID，获取详细信息
    if (customer.superiorContactId) {
      db.get(`SELECT * FROM SuperiorContacts WHERE id = ?`, [customer.superiorContactId], (err, superior) => {
        if (err || !superior) {
          console.error('获取上级联系人信息失败:', err);
          res.json(customer);
        } else {
          customer.superiorContact = {
            id: superior.id,
            name: superior.name,
            company: superior.company,
            isDirect: superior.isDirect
          };
          
          // 获取下级联系人详细信息
          getSubordinateContactsDetails(customer, res);
        }
      });
    } else {
      // 获取下级联系人详细信息
      getSubordinateContactsDetails(customer, res);
    }
  });
});

// 获取下级联系人详细信息的辅助函数
function getSubordinateContactsDetails(customer, res) {
  if (!customer.subordinateContactIds || customer.subordinateContactIds.length === 0) {
    customer.subordinateContacts = [];
    res.json(customer);
      return;
    }
  
  // 使用参数化查询的占位符
  const placeholders = customer.subordinateContactIds.map(() => '?').join(',');
  
  db.all(
    `SELECT * FROM SubordinateContacts WHERE id IN (${placeholders})`, 
    customer.subordinateContactIds, 
    (err, subordinates) => {
    if (err) {
        console.error('获取下级联系人信息失败:', err);
        customer.subordinateContacts = [];
      } else {
        customer.subordinateContacts = subordinates.map(sub => ({
          id: sub.id,
          name: sub.name,
          company: sub.company,
          isDirect: sub.isDirect
        }));
      }
      res.json(customer);
    }
  );
}

app.post('/api/customers', (req, res) => {
  const { 
    name, gender, age, birthday, phone, email, address, company, position, 
    region, registration_date, category, intention, demand, wechat, 
    whatsapp, facebook, budget, remark, superiorContactId, subordinateContactIds, 
    planned_visit_date, planned_visit_method, planned_visit_content 
  } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: '客户姓名不能为空' });
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
  
  db.run(sql, [
      name, gender, age, birthday, phone, email, address, company, position,
      region, registration_date, category, intention, demand, wechat,
      whatsapp, facebook, budget, remark, superiorContactId, subordinateContactIdsString,
      planned_visit_date, planned_visit_method, planned_visit_content
  ], function(err) {
      if (err) {
          console.error(err);
          return res.status(500).json({ error: '创建客户失败' });
      }
      
      res.status(201).json({
        id: this.lastID,
        name,
        // ... 其他字段
      });
    });
});

// 更新客户
app.put('/api/customers/:id', (req, res) => {
  const customerId = req.params.id;
  const { 
    name, gender, age, birthday, phone, email, address, company, position,
    region, registrationDate, category, intention, demand, wechat,
    whatsapp, facebook, budget, remark, superiorContactId, subordinateContactIds,
    planned_visit_date, planned_visit_method, planned_visit_content
  } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: '客户姓名不能为空' });
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

  db.run(sql, [
      name, gender, age, birthday, phone, email, address, company, position,
      region, registrationDate, category, intention, demand, wechat,
      whatsapp, facebook, budget, remark, superiorContactId, subordinateContactIdsString,
      planned_visit_date, planned_visit_method, planned_visit_content,
      customerId
  ], function(err) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: '更新客户信息失败' });
        }
        
      if (this.changes === 0) {
          return res.status(404).json({ error: '客户不存在' });
      }

        res.json({ 
          id: customerId,
          name,
          // 其他字段...
          message: '客户信息更新成功'
      });
  });
});

// 删除客户
app.delete('/api/customers/:id', (req, res) => {
  const id = req.params.id;
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // 先删除相关的回访记录
    db.run('DELETE FROM Visits WHERE customerId = ?', [id], function(err) {
      if (err) {
        console.error('删除客户回访记录失败:', err.message);
        db.run('ROLLBACK');
        res.status(500).json({ error: err.message });
        return;
      }
      
      // 删除相关的产品记录
      db.run('DELETE FROM Products WHERE customerId = ?', [id], function(err) {
        if (err) {
          console.error('删除客户产品记录失败:', err.message);
          db.run('ROLLBACK');
          res.status(500).json({ error: err.message });
          return;
        }
        
        // 最后删除客户本身
        db.run('DELETE FROM Customers WHERE id = ?', [id], function(err) {
          if (err) {
            console.error('删除客户失败:', err.message);
            db.run('ROLLBACK');
            res.status(500).json({ error: err.message });
            return;
          }
          
          if (this.changes === 0) {
            db.run('ROLLBACK');
            res.status(404).json({ error: '客户不存在' });
            return;
          }
          
          db.run('COMMIT', err => {
            if (err) {
              console.error('提交事务失败:', err.message);
              db.run('ROLLBACK');
              res.status(500).json({ error: err.message });
              return;
            }
            
            console.log(`客户(ID: ${id})及其相关数据已被成功删除`);
            res.json({ 
              success: true,
              message: '客户及其相关数据已被成功删除'
            });
          });
        });
      });
    });
  });
});

// API路由 - 回访
app.get('/api/visits', (req, res) => {
  // 支持按客户ID筛选
  const customerId = req.query.customerId;
  
  let sql = `
    SELECT v.*, c.name as customerName 
    FROM Visits v
    LEFT JOIN Customers c ON v.customerId = c.id`;
  
  let params = [];
  
  if (customerId) {
    sql += ` WHERE v.customerId = ?`;
    params.push(customerId);
  }
  
  sql += ` ORDER BY v.visitTime DESC`;
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 获取单个回访记录
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
      res.status(404).json({ error: "回访记录不存在" });
      return;
    }
    
    res.json(row);
  });
});

app.post('/api/visits', (req, res) => {
  const { customerId, visitTime, content, effect, satisfaction, intention, followUp } = req.body;
  const sql = `INSERT INTO Visits 
    (customerId, visitTime, content, effect, satisfaction, intention, followUp) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [customerId, visitTime, content, effect, satisfaction, intention, followUp], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID });
  });
});

// 更新回访记录
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
  
  db.run(sql, [customerId, visitTime, content, effect, satisfaction, intention, followUp, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: "回访记录不存在" });
      return;
    }
    
    res.json({ success: true });
  });
});

// 删除回访记录
app.delete('/api/visits/:id', (req, res) => {
  const id = req.params.id;
  
  db.run('DELETE FROM Visits WHERE id = ?', [id], function(err) {
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

// API路由 - 产品
app.get('/api/products', (req, res) => {
  // 支持按客户ID筛选
  const customerId = req.query.customerId;
  
  let sql = `
    SELECT p.*, c.name as customerName 
    FROM Products p
    LEFT JOIN Customers c ON p.customerId = c.id`;
  
  let params = [];
  
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

app.post('/api/products', (req, res) => {
  const { customerId, productName, quantity, price, purchaseDate, afterSale, followUpDate } = req.body;
  
  if (!customerId) {
    res.status(400).json({ error: "客户ID是必填项" });
    return;
  }
  
  // 如果没有提供followUpDate，则自动计算为purchaseDate + 90天
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
  
  db.run(sql, [customerId, productName, quantity, price, purchaseDate, afterSale, calculatedFollowUpDate], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID });
  });
});

app.get('/api/products/:id', (req, res) => {
  const id = req.params.id;
  
  db.get(`
    SELECT p.*, c.name as customerName 
    FROM Products p
    LEFT JOIN Customers c ON p.customerId = c.id
    WHERE p.id = ?`, 
    [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: "产品记录不存在" });
      return;
    }
    res.json(row);
  });
});

app.put('/api/products/:id', (req, res) => {
  const id = req.params.id;
  const { customerId, productName, quantity, price, purchaseDate, afterSale, followUpDate } = req.body;
  
  // 验证必填项
  if (!customerId || !productName) {
    res.status(400).json({ error: "客户ID和产品名称是必填项" });
    return;
  }
  
  // 如果followUpDate未提供但purchaseDate变化了，自动更新followUpDate
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
    UPDATE Products 
    SET customerId = ?, 
        productName = ?, 
        quantity = ?, 
        price = ?, 
        purchaseDate = ?, 
        afterSale = ?,
        followUpDate = ?
    WHERE id = ?
  `;
  
  db.run(sql, [
    customerId, 
    productName, 
    quantity || null, 
    price || null, 
    purchaseDate || null, 
    afterSale || null,
    calculatedFollowUpDate || null,
    id
  ], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: "购买记录不存在" });
      return;
    }
    
    res.json({ 
      id: id,
      success: true 
    });
  });
});

// 删除产品记录
app.delete('/api/products/:id', (req, res) => {
  const id = req.params.id;
  
  db.run('DELETE FROM Products WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: "产品记录不存在" });
      return;
    }
    res.json({ success: true });
  });
});

// 清空所有数据（客户、购买和回访记录）
app.delete('/api/data/delete-all', (req, res) => {
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // 先删除所有回访记录
    db.run('DELETE FROM Visits', [], function(err) {
      if (err) {
        console.error('删除所有回访记录失败:', err.message);
        db.run('ROLLBACK');
        res.status(500).json({ error: err.message });
        return;
      }
      
      // 删除所有产品记录
      db.run('DELETE FROM Products', [], function(err) {
        if (err) {
          console.error('删除所有产品记录失败:', err.message);
          db.run('ROLLBACK');
          res.status(500).json({ error: err.message });
          return;
        }
        
        // 最后删除所有客户
        db.run('DELETE FROM Customers', [], function(err) {
          if (err) {
            console.error('删除所有客户失败:', err.message);
            db.run('ROLLBACK');
            res.status(500).json({ error: err.message });
            return;
          }
          
          db.run('COMMIT', err => {
            if (err) {
              console.error('提交事务失败:', err.message);
              db.run('ROLLBACK');
              res.status(500).json({ error: err.message });
              return;
            }
            
            console.log('所有客户、产品和回访数据已被成功删除');
            res.json({ 
              success: true,
              message: '所有客户、产品和回访数据已被成功删除'
            });
          });
        });
      });
    });
  });
});

// 获取产品统计数据
app.get('/api/products/statistics/summary', (req, res) => {
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const firstDayOfMonthStr = firstDayOfMonth.toISOString().split('T')[0];
  
  // 使用多个Promise来并行获取不同的统计数据
  Promise.all([
    // 本月购买记录数
    new Promise((resolve, reject) => {
      db.get(
        'SELECT COUNT(*) as count FROM Products WHERE purchaseDate >= ?',
        [firstDayOfMonthStr],
        (err, row) => {
          if (err) reject(err);
          else resolve(row ? row.count : 0);
        }
      );
    }),
    // 本月销售额（计算每条记录的 quantity * price 的总和）
    new Promise((resolve, reject) => {
      db.get(
        'SELECT SUM(quantity * price) as total FROM Products WHERE purchaseDate >= ?',
        [firstDayOfMonthStr],
        (err, row) => {
          if (err) reject(err);
          else resolve(row && row.total !== null ? row.total : 0);
        }
      );
    }),
    // 客户购买频率（每个客户的平均购买次数/月）
    new Promise((resolve, reject) => {
      db.get(
        `SELECT 
          ROUND(COUNT(*) * 1.0 / CASE WHEN COUNT(DISTINCT customerId) = 0 THEN 1 ELSE COUNT(DISTINCT customerId) END, 2) as frequency 
        FROM Products 
        WHERE purchaseDate >= date('now', '-1 year')`,
        [],
        (err, row) => {
          if (err) reject(err);
          else resolve(row && row.frequency !== null ? row.frequency : 0);
        }
      );
    }),
    // 热门产品（销量最高）
    new Promise((resolve, reject) => {
      db.get(
        `SELECT 
          productName,
          SUM(quantity) as totalQuantity
        FROM Products 
        GROUP BY productName 
        ORDER BY totalQuantity DESC 
        LIMIT 1`,
        [],
        (err, row) => {
          if (err) reject(err);
          else resolve(row && row.productName ? row.productName : '-');
        }
      );
    })
  ])
  .then(([monthlyCount, monthlySales, purchaseFrequency, topProduct]) => {
    res.json({
      monthlyRecordsCount: monthlyCount,
      monthlySales: monthlySales, // 修改为正确的销售额（价格 * 数量）
      purchaseFrequency: purchaseFrequency,
      topProduct: topProduct
    });
  })
  .catch(err => {
    console.error('产品统计数据查询错误:', err.message);
    res.status(500).json({ error: err.message });
  });
});

// 获取Dashboard统计数据
app.get('/api/dashboard/statistics', (req, res) => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstDayOfMonthStr = firstDayOfMonth.toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];
  
  Promise.all([
    // 本月销售额
    new Promise((resolve, reject) => {
      db.get(
        `SELECT SUM(quantity * price) as total
        FROM Products 
        WHERE date(purchaseDate) >= date(?) AND date(purchaseDate) <= date(?)`,
        [firstDayOfMonthStr, todayStr],
        (err, row) => err ? reject(err) : resolve(row ? row.total || 0 : 0)
      );
    }),
    // 本月订单数
    new Promise((resolve, reject) => {
      db.get(
        `SELECT COUNT(*) as count
        FROM Products 
        WHERE date(purchaseDate) >= date(?) AND date(purchaseDate) <= date(?)`,
        [firstDayOfMonthStr, todayStr],
        (err, row) => err ? reject(err) : resolve(row ? row.count : 0)
      );
    }),
    // 本月新增客户数
    new Promise((resolve, reject) => {
      db.get(
        'SELECT COUNT(*) as count FROM Customers WHERE date(created_at) >= date(?)',
        [firstDayOfMonthStr],
        (err, row) => err ? reject(err) : resolve(row ? row.count : 0)
      );
    }),
    // 本月跟进次数
    new Promise((resolve, reject) => {
      db.get(
        `SELECT COUNT(*) as count
        FROM Visits 
        WHERE date(visitTime) >= date(?) AND date(visitTime) <= date(?)`,
        [firstDayOfMonthStr, todayStr],
        (err, row) => err ? reject(err) : resolve(row ? row.count : 0)
      );
    }),
    // 本月成交客户数（有购买记录的去重客户数）
    new Promise((resolve, reject) => {
      db.get(
        `SELECT COUNT(DISTINCT customerId) as count
        FROM Products 
        WHERE date(purchaseDate) >= date(?) AND date(purchaseDate) <= date(?)`,
        [firstDayOfMonthStr, todayStr],
        (err, row) => err ? reject(err) : resolve(row ? row.count : 0)
      );
    }),
    // 客户意向分布
    new Promise((resolve, reject) => {
      db.all(
        `SELECT intention, COUNT(*) as count 
        FROM Customers 
        WHERE intention IS NOT NULL 
        GROUP BY intention`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else {
            const distribution = {H: 0, A: 0, B: 0, C: 0, D: 0};
            rows.forEach(row => {
              if (row.intention in distribution) {
                distribution[row.intention] = row.count;
              }
            });
            resolve(distribution);
          }
        }
      );
    }),
    // 重要提醒
    new Promise((resolve, reject) => {
      // 使用最大天数获取所有可能的提醒数据，前端会根据选择的提醒周期进行过滤
      const maxCycleDays = 360; // 使用最大的提醒周期
      const maxDaysLater = new Date(today);
      maxDaysLater.setDate(today.getDate() + maxCycleDays);
      const maxDaysLaterStr = maxDaysLater.toISOString().split('T')[0];
      
      // 1. 获取未来可能需要提醒的计划回访
      const visitsPromise = new Promise((resolve, reject) => {
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
          (err, rows) => err ? reject(err) : resolve(rows || [])
        );
      });
      
      // 2. 获取未来可能需要提醒的生日客户
      const birthdaysPromise = new Promise((resolve, reject) => {
        // 计算今天和未来maxCycleDays天的月-日格式
        const todayMD = today.toISOString().split('T')[0].substr(5); // 月-日 格式 (MM-DD)
        
        // 计算结束日期的月-日
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + maxCycleDays);
        const endDateMD = endDate.toISOString().split('T')[0].substr(5); // 月-日 格式 (MM-DD)
        
        let whereClause = '';
        
        // 如果日期范围没有跨年
        if (todayMD <= endDateMD) {
          whereClause = `strftime('%m-%d', birthday) >= '${todayMD}' AND strftime('%m-%d', birthday) <= '${endDateMD}'`;
        } else {
          // 如果日期范围跨年 (例如从12-15到下一年的02-15)
          whereClause = `strftime('%m-%d', birthday) >= '${todayMD}' OR strftime('%m-%d', birthday) <= '${endDateMD}'`;
        }
        
        db.all(
          `SELECT 
            'birthday' as type,
            id as customerId,
            name as customerName,
            birthday as originalDate,
            CASE 
              WHEN strftime('%m-%d', birthday) >= '${todayMD}' THEN 
                date(strftime('%Y-', 'now') || strftime('%m-%d', birthday))
              ELSE 
                date(strftime('%Y-', 'now', '+1 year') || strftime('%m-%d', birthday))
            END as eventTime,
            '客户生日' as eventType,
            NULL as content
          FROM Customers
          WHERE 
            birthday IS NOT NULL AND
            birthday != '' AND
            (${whereClause})
          ORDER BY 
            CASE 
              WHEN strftime('%m-%d', birthday) < '${todayMD}' THEN 1
              ELSE 0
            END,
            strftime('%m-%d', birthday) ASC`,
          [],
          (err, rows) => {
            if (err) {
              console.error('获取生日提醒错误:', err);
              reject(err);
            } else {
              resolve(rows || []);
            }
          }
        );
      });
      
      // 3. 获取未来可能需要提醒的计划客户回访
      const plannedVisitsPromise = new Promise((resolve, reject) => {
        db.all(
          `SELECT 
            'planned_visit' as type,
            id as customerId,
            name as customerName,
            date(planned_visit_date) as eventTime,
            planned_visit_content as content,
            '计划客户回访' as eventType
          FROM Customers
          WHERE 
            planned_visit_date IS NOT NULL AND
            planned_visit_date != '' AND
            date(planned_visit_date) >= date(?) AND 
            date(planned_visit_date) <= date(?)
          ORDER BY date(planned_visit_date) ASC`,
          [todayStr, maxDaysLaterStr],
          (err, rows) => err ? reject(err) : resolve(rows || [])
        );
      });
      
      // 4. 获取未来可能需要产品回访的客户（购买日期+90天内）
      const productVisitsPromise = new Promise((resolve, reject) => {
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
          WHERE 
            p.purchaseDate IS NOT NULL AND
            p.purchaseDate != '' AND
            date(p.purchaseDate, '+90 days') >= date(?) AND 
            date(p.purchaseDate, '+90 days') <= date(?)
          ORDER BY date(p.purchaseDate, '+90 days') ASC`,
          [todayStr, maxDaysLaterStr],
          (err, rows) => err ? reject(err) : resolve(rows || [])
        );
      });
      
      // 合并所有提醒
      Promise.all([visitsPromise, birthdaysPromise, plannedVisitsPromise, productVisitsPromise])
        .then(([visits, birthdays, plannedVisits, productVisits]) => {
          // 合并所有结果
          const allReminders = [...visits, ...birthdays, ...plannedVisits, ...productVisits];
          
          // 按日期排序
          allReminders.sort((a, b) => {
            const dateA = new Date(a.eventTime);
            const dateB = new Date(b.eventTime);
            return dateA - dateB;
          });
          
          resolve(allReminders);
        })
        .catch(err => reject(err));
    })
  ])
  .then(([
    monthlySales,
    monthlyOrders,
    monthlyNewCustomers,
    monthlyVisits,
    monthlyDealCustomers,
    intentionDistribution,
    importantReminders
  ]) => {
    // 计算客单价
    const averageOrderValue = monthlyOrders > 0 ? Math.round(monthlySales / monthlyOrders) : 0;
    
    res.json({
      monthlySalesAmount: monthlySales, // 直接返回数值，不格式化
      monthlyOrderCount: monthlyOrders,
      averageOrderValue: averageOrderValue,
      monthlyNewCustomers,
      monthlyVisitCount: monthlyVisits,
      monthlyDealCustomers,
      intentionDistribution,
      importantReminders
    });
  })
  .catch(err => {
    console.error('Dashboard统计数据查询错误:', err.message);
    res.status(500).json({ error: err.message });
  });
});

// API路由 - 客户分类和意向等级
app.get('/api/customer-categories', (req, res) => {
  db.all("SELECT * FROM CustomerCategories ORDER BY displayOrder", [], (err, rows) => {
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
  
  // 检查ID是否已存在
  db.get("SELECT id FROM CustomerCategories WHERE id = ?", [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (row) {
      res.status(400).json({ error: '该ID已存在' });
      return;
    }
    
    // 获取最大的显示顺序
    db.get("SELECT MAX(displayOrder) as maxOrder FROM CustomerCategories", [], (err, orderRow) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      const displayOrder = (orderRow.maxOrder || 0) + 1;
      
      // 添加新分类
      db.run(
        "INSERT INTO CustomerCategories (id, name, description, displayOrder) VALUES (?, ?, ?, ?)",
        [id, name, description, displayOrder],
        function(err) {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          
          res.json({ 
            success: true, 
            category: { id, name, description, displayOrder }
          });
        }
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
  
  // 更新分类
  db.run(
    "UPDATE CustomerCategories SET name = ?, description = ? WHERE id = ?",
    [name, description, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (this.changes === 0) {
        res.status(404).json({ error: '分类不存在' });
        return;
      }
      
      res.json({ 
        success: true, 
        category: { id, name, description }
      });
    }
  );
});

app.delete('/api/customer-categories/:id', (req, res) => {
  const id = req.params.id;
  
  // 删除分类
  db.run("DELETE FROM CustomerCategories WHERE id = ?", [id], function(err) {
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
  
  // 开始事务
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    
    let hasError = false;
    
    // 逐个更新显示顺序
    order.forEach((categoryId, index) => {
      db.run(
        "UPDATE CustomerCategories SET displayOrder = ? WHERE id = ?",
        [index + 1, categoryId],
        function(err) {
          if (err) {
            console.error('更新分类顺序失败:', err.message);
            hasError = true;
          }
        }
      );
    });
    
    // 提交或回滚事务
    if (hasError) {
      db.run("ROLLBACK", err => {
        if (err) console.error('回滚事务失败:', err.message);
        res.status(500).json({ error: '更新顺序失败' });
      });
    } else {
      db.run("COMMIT", err => {
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

app.get('/api/customer-intentions', (req, res) => {
  db.all("SELECT * FROM CustomerIntentions ORDER BY displayOrder", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/customer-intentions', (req, res) => {
  const { level, name, description, criteria, followUpPriority } = req.body;
  
  if (!level || !name || !description) {
    res.status(400).json({ error: '等级、名称和描述不能为空' });
    return;
  }
  
  // 检查等级是否已存在
  db.get("SELECT level FROM CustomerIntentions WHERE level = ?", [level], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (row) {
      res.status(400).json({ error: '该等级已存在' });
      return;
    }
    
    // 获取最大的显示顺序
    db.get("SELECT MAX(displayOrder) as maxOrder FROM CustomerIntentions", [], (err, orderRow) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      const displayOrder = (orderRow.maxOrder || 0) + 1;
      
      // 添加新意向等级
      db.run(
        "INSERT INTO CustomerIntentions (level, name, description, criteria, followUpPriority, displayOrder) VALUES (?, ?, ?, ?, ?, ?)",
        [level, name, description, criteria, followUpPriority, displayOrder],
        function(err) {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          
          res.json({ 
            success: true, 
            intention: { level, name, description, criteria, followUpPriority, displayOrder }
          });
        }
      );
    });
  });
});

app.put('/api/customer-intentions/:level', (req, res) => {
  const level = req.params.level;
  const { name, description, criteria, followUpPriority } = req.body;
  
  if (!name || !description) {
    res.status(400).json({ error: '名称和描述不能为空' });
    return;
  }
  
  // 更新意向等级
  db.run(
    "UPDATE CustomerIntentions SET name = ?, description = ?, criteria = ?, followUpPriority = ? WHERE level = ?",
    [name, description, criteria, followUpPriority, level],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (this.changes === 0) {
        res.status(404).json({ error: '意向等级不存在' });
        return;
      }
      
      res.json({ 
        success: true, 
        intention: { level, name, description, criteria, followUpPriority }
      });
    }
  );
});

app.delete('/api/customer-intentions/:level', (req, res) => {
  const level = req.params.level;
  
  // 删除意向等级
  db.run("DELETE FROM CustomerIntentions WHERE level = ?", [level], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: '意向等级不存在' });
      return;
    }
    
    res.json({ success: true });
  });
});

app.post('/api/customer-intentions/reorder', (req, res) => {
  const { order } = req.body;
  
  if (!order || !Array.isArray(order)) {
    res.status(400).json({ error: '无效的排序数据' });
    return;
  }
  
  // 开始事务
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    
    let hasError = false;
    
    // 逐个更新显示顺序
    order.forEach((intentionLevel, index) => {
      db.run(
        "UPDATE CustomerIntentions SET displayOrder = ? WHERE level = ?",
        [index + 1, intentionLevel],
        function(err) {
          if (err) {
            console.error('更新意向等级顺序失败:', err.message);
            hasError = true;
          }
        }
      );
    });
    
    // 提交或回滚事务
    if (hasError) {
      db.run("ROLLBACK", err => {
        if (err) console.error('回滚事务失败:', err.message);
        res.status(500).json({ error: '更新顺序失败' });
      });
    } else {
      db.run("COMMIT", err => {
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

// 修改管理员密码
app.post('/api/managers/change-password', (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "请提供当前密码和新密码" });
    return;
  }
  
  // 验证当前密码
  db.get('SELECT * FROM Managers WHERE name = ? AND password = ?', ['admin', currentPassword], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      res.status(401).json({ error: "当前密码错误" });
      return;
    }
    
    // 更新密码
    db.run('UPDATE Managers SET password = ? WHERE name = ?', [newPassword, 'admin'], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true });
    });
  });
});

// 备份数据
app.post('/api/backup', (req, res) => {
  try {
    const backupFileName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
    const backupDir = path.join(__dirname, 'backups');
    const backupPath = path.join(backupDir, backupFileName);
    
    // 确保备份目录存在
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // 关闭数据库连接
    db.close((err) => {
      if (err) {
        console.error('关闭数据库失败:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      
      // 直接复制数据库文件
      fs.copyFile('./database.db', backupPath, (err) => {
        if (err) {
          console.error('备份失败:', err);
          
          // 重新连接数据库
          db = new sqlite3.Database('./database.db', (connErr) => {
            if (connErr) {
              console.error('重新连接数据库失败:', connErr);
            }
            res.status(500).json({ error: err.message });
          });
          return;
        }
        
        // 重新连接数据库
        db = new sqlite3.Database('./database.db', (connErr) => {
          if (connErr) {
            console.error('重新连接数据库失败:', connErr);
            res.status(500).json({ error: connErr.message });
            return;
          }
          
          res.json({ 
            success: true,
            fileName: backupFileName
          });
        });
      });
    });
  } catch (error) {
    console.error('备份过程出错:', error);
    res.status(500).json({ error: error.message });
  }
});

// 恢复数据
app.post('/api/restore', (req, res) => {
  try {
    const { fileName } = req.body;
    
    // 如果没有提供文件名，使用最新的备份文件
    let backupPath;
    if (!fileName) {
      const backupsDir = path.join(__dirname, 'backups');
      
      // 检查备份目录是否存在
      if (!fs.existsSync(backupsDir)) {
        return res.status(404).json({ error: "没有找到任何备份" });
      }
      
      // 获取所有备份文件
      const backupFiles = fs.readdirSync(backupsDir)
        .filter(file => file.startsWith('backup_') && file.endsWith('.db'))
        .sort((a, b) => {
          // 按时间戳降序排列
          return fs.statSync(path.join(backupsDir, b)).mtime.getTime() - 
                 fs.statSync(path.join(backupsDir, a)).mtime.getTime();
        });
      
      if (backupFiles.length === 0) {
        return res.status(404).json({ error: "没有找到任何备份" });
      }
      
      backupPath = path.join(backupsDir, backupFiles[0]);
    } else {
      backupPath = path.join(__dirname, 'backups', fileName);
      
      if (!fs.existsSync(backupPath)) {
        return res.status(404).json({ error: "备份文件不存在" });
      }
    }
    
    // 关闭当前数据库连接
    db.close(err => {
      if (err) {
        console.error('关闭数据库失败:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      
      // 复制备份文件到主数据库
      fs.copyFile(backupPath, './database.db', err => {
        if (err) {
          console.error('恢复备份失败:', err);
          
          // 重新连接原数据库
          db = new sqlite3.Database('./database.db', (connErr) => {
            if (connErr) {
              console.error('重新连接数据库失败:', connErr);
            }
            res.status(500).json({ error: err.message });
          });
          return;
        }
        
        // 重新连接数据库
        db = new sqlite3.Database('./database.db', (connErr) => {
          if (connErr) {
            console.error('重新连接数据库失败:', connErr);
            res.status(500).json({ error: connErr.message });
            return;
          }
          res.json({ success: true });
        });
      });
    });
  } catch (error) {
    console.error('恢复过程出错:', error);
    res.status(500).json({ error: error.message });
  }
});

// 清空数据
app.post('/api/clear-data', (req, res) => {
  try {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      const tables = ['Visits', 'Products', 'Customers'];
      
      // 清空所有表
      tables.forEach(table => {
        db.run(`DELETE FROM ${table}`, err => {
          if (err) {
            console.error(`清空${table}表失败:`, err);
          }
        });
      });
      
      // 重置自增ID
      db.run('DELETE FROM sqlite_sequence WHERE name IN (?, ?, ?)', tables, err => {
        if (err) {
          console.error('重置自增ID失败:', err);
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
        
        db.run('COMMIT', err => {
          if (err) {
            console.error('提交事务失败:', err);
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message });
          }
          res.json({ success: true });
        });
      });
    });
  } catch (error) {
    console.error('清空数据过程出错:', error);
    db.run('ROLLBACK');
    res.status(500).json({ error: error.message });
  }
});

// 检查更新
app.get('/api/check-update', (req, res) => {
  // 这里应该实现实际的版本检查逻辑
  // 当前仅返回模拟数据
  res.json({
    hasUpdate: false,
    currentVersion: '1.0.0',
    latestVersion: '1.0.0'
  });
});

// 访问首页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API路由 - 内设数据管理

// 地区管理
app.get('/api/regions', (req, res) => {
  db.all("SELECT * FROM Regions ORDER BY displayOrder", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/regions', (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    res.status(400).json({ error: '地区名称不能为空' });
    return;
  }
  
  // 检查地区名称是否已存在
  db.get("SELECT name FROM Regions WHERE name = ?", [name], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (row) {
      res.status(400).json({ error: '该地区已存在' });
      return;
    }
    
    // 获取最大的显示顺序和ID
    db.get("SELECT MAX(displayOrder) as maxOrder, COUNT(*) as count FROM Regions", [], (err, orderRow) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      const displayOrder = (orderRow.maxOrder || 0) + 1;
      const id = `region-${orderRow.count}`;
      
      // 添加新地区
      db.run(
        "INSERT INTO Regions (id, name, displayOrder) VALUES (?, ?, ?)",
        [id, name, displayOrder],
        function(err) {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          
          res.json({ 
            success: true, 
            region: { id, name, displayOrder }
          });
        }
      );
    });
  });
});

app.put('/api/regions/:id', (req, res) => {
  const id = req.params.id;
  const { name } = req.body;
  
  if (!name) {
    res.status(400).json({ error: '地区名称不能为空' });
    return;
  }
  
  // 更新地区
  db.run(
    "UPDATE Regions SET name = ? WHERE id = ?",
    [name, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (this.changes === 0) {
        res.status(404).json({ error: '地区不存在' });
        return;
      }
      
      res.json({ 
        success: true, 
        region: { id, name }
      });
    }
  );
});

app.delete('/api/regions/:id', (req, res) => {
  const id = req.params.id;
  
  // 删除地区
  db.run("DELETE FROM Regions WHERE id = ?", [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: '地区不存在' });
      return;
    }
    
    res.json({ success: true });
  });
});

app.post('/api/regions/reorder', (req, res) => {
  const { order } = req.body;
  
  if (!order || !Array.isArray(order)) {
    res.status(400).json({ error: '无效的排序数据' });
    return;
  }
  
  // 开始事务
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    
    let hasError = false;
    
    // 逐个更新显示顺序
    order.forEach((regionId, index) => {
      db.run(
        "UPDATE Regions SET displayOrder = ? WHERE id = ?",
        [index + 1, regionId],
        function(err) {
          if (err) {
            console.error('更新地区顺序失败:', err.message);
            hasError = true;
          }
        }
      );
    });
    
    // 提交或回滚事务
    if (hasError) {
      db.run("ROLLBACK", err => {
        if (err) console.error('回滚事务失败:', err.message);
        res.status(500).json({ error: '更新顺序失败' });
      });
    } else {
      db.run("COMMIT", err => {
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

// 预算范围管理
app.get('/api/budget-ranges', (req, res) => {
  db.all("SELECT * FROM BudgetRanges ORDER BY displayOrder", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/budget-ranges', (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: "预算范围名称不能为空" });
  }
  
  // 生成ID
  const id = name.toLowerCase().replace(/\s+/g, '-');
  
  // 获取最大显示顺序
  db.get("SELECT MAX(displayOrder) as maxOrder FROM BudgetRanges", [], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
    const displayOrder = (row.maxOrder || 0) + 1;
      
      db.run(
        "INSERT INTO BudgetRanges (id, name, displayOrder) VALUES (?, ?, ?)",
        [id, name, displayOrder],
        function(err) {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          
          res.json({ 
          id: id,
          name: name,
          displayOrder: displayOrder
          });
        }
      );
  });
});

app.put('/api/budget-ranges/:id', (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: "预算范围名称不能为空" });
  }
  
  db.run(
    "UPDATE BudgetRanges SET name = ? WHERE id = ?",
    [name, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (this.changes === 0) {
        res.status(404).json({ error: "预算范围不存在" });
        return;
      }
      
      res.json({ 
        id: id,
        name: name
      });
    }
  );
});

app.delete('/api/budget-ranges/:id', (req, res) => {
  const { id } = req.params;
  
  db.run(
    "DELETE FROM BudgetRanges WHERE id = ?",
    [id],
    function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
        res.status(404).json({ error: "预算范围不存在" });
      return;
    }
    
    res.json({ success: true });
    }
  );
});

app.post('/api/budget-ranges/reorder', (req, res) => {
  const { order } = req.body;
  
  if (!order || !Array.isArray(order)) {
    return res.status(400).json({ error: "顺序数据无效" });
  }
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    order.forEach((id, index) => {
      db.run(
        "UPDATE BudgetRanges SET displayOrder = ? WHERE id = ?",
        [index + 1, id]
      );
    });
    
    db.run('COMMIT', err => {
      if (err) {
        db.run('ROLLBACK');
        res.status(500).json({ error: err.message });
        return;
      }
      
      res.json({ success: true });
    });
  });
});

// API路由 - 上级联系人关系类型
app.get('/api/superior-contacts', (req, res) => {
  db.all(`SELECT * FROM SuperiorContacts ORDER BY displayOrder`, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/superior-contacts', (req, res) => {
  const { name, company, isDirect } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  // 查询当前最大的显示顺序
  db.get(`SELECT MAX(displayOrder) as maxOrder FROM SuperiorContacts`, (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }

    const displayOrder = row.maxOrder ? row.maxOrder + 1 : 1;
    const isDirValue = isDirect ? 1 : 0;

    db.run(
      `INSERT INTO SuperiorContacts (name, company, isDirect, displayOrder) VALUES (?, ?, ?, ?)`,
      [name, company || '', isDirValue, displayOrder],
        function(err) {
          if (err) {
          console.error(err);
          return res.status(500).json({ error: err.message });
        }

        res.json({
          success: true,
          id: this.lastID,
          name,
          company: company || '',
          isDirect: isDirect || false,
          displayOrder
        });
      }
    );
  });
});

app.put('/api/superior-contacts/:id', (req, res) => {
  const id = req.params.id;
  const { name, company, isDirect } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const isDirValue = isDirect ? 1 : 0;

  db.run(
    `UPDATE SuperiorContacts SET name = ?, company = ?, isDirect = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [name, company || '', isDirValue, id],
    function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Superior contact not found' });
      }

      res.json({
        success: true,
        id: parseInt(id),
        name,
        company: company || '',
        isDirect: isDirect || false
      });
    }
  );
});

app.delete('/api/superior-contacts/:id', (req, res) => {
  const id = req.params.id;

  db.run(`DELETE FROM SuperiorContacts WHERE id = ?`, id, function(err) {
        if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Superior contact not found' });
    }

    // 更新顺序
    db.run(`UPDATE SuperiorContacts SET displayOrder = displayOrder - 1 WHERE displayOrder > (SELECT displayOrder FROM SuperiorContacts WHERE id = ?)`, id, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
      }

          res.json({ success: true });
    });
  });
});

// 下级联系人接口
app.get('/api/subordinate-contacts', (req, res) => {
  db.all(`SELECT * FROM SubordinateContacts ORDER BY displayOrder`, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/subordinate-contacts', (req, res) => {
  const { name, company, isDirect } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  // 查询当前最大的显示顺序
  db.get(`SELECT MAX(displayOrder) as maxOrder FROM SubordinateContacts`, (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }

    const displayOrder = row.maxOrder ? row.maxOrder + 1 : 1;
    const isDirValue = isDirect ? 1 : 0;

    db.run(
      `INSERT INTO SubordinateContacts (name, company, isDirect, displayOrder) VALUES (?, ?, ?, ?)`,
      [name, company || '', isDirValue, displayOrder],
      function(err) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: err.message });
        }

        res.json({
          success: true,
          id: this.lastID,
          name,
          company: company || '',
          isDirect: isDirect || false,
          displayOrder
        });
      }
    );
  });
});

app.put('/api/subordinate-contacts/:id', (req, res) => {
  const id = req.params.id;
  const { name, company, isDirect } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const isDirValue = isDirect ? 1 : 0;

  db.run(
    `UPDATE SubordinateContacts SET name = ?, company = ?, isDirect = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [name, company || '', isDirValue, id],
    function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Subordinate contact not found' });
      }

      res.json({
        success: true,
        id: parseInt(id),
        name,
        company: company || '',
        isDirect: isDirect || false
      });
    }
  );
});

app.delete('/api/subordinate-contacts/:id', (req, res) => {
  const id = req.params.id;

  db.run(`DELETE FROM SubordinateContacts WHERE id = ?`, id, function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Subordinate contact not found' });
    }

    // 更新顺序
    db.run(`UPDATE SubordinateContacts SET displayOrder = displayOrder - 1 WHERE displayOrder > (SELECT displayOrder FROM SubordinateContacts WHERE id = ?)`, id, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
      }

      res.json({ success: true });
    });
  });
});

// API路由 - 用户设置
app.get('/api/user-settings', (req, res) => {
  db.get("SELECT * FROM UserSettings WHERE id = 1", (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      // 如果没有设置，返回默认设置
      res.json({
        darkMode: 0,
        visitReminder: 1,
        birthdayReminder: 0,
        language: 'zh-CN',
        lastBackup: null
      });
    } else {
      // 将整数转换为布尔值
      res.json({
        darkMode: Boolean(row.darkMode),
        visitReminder: Boolean(row.visitReminder),
        birthdayReminder: Boolean(row.birthdayReminder),
        language: row.language,
        lastBackup: row.lastBackup
      });
    }
  });
});

app.put('/api/user-settings', (req, res) => {
  const { darkMode, visitReminder, birthdayReminder, language, lastBackup } = req.body;
  
  // 转换布尔值为整数
  const darkModeValue = darkMode ? 1 : 0;
  const visitReminderValue = visitReminder ? 1 : 0;
  const birthdayReminderValue = birthdayReminder ? 1 : 0;
  
  // 更新设置
  db.run(
    `UPDATE UserSettings SET 
      darkMode = ?, 
      visitReminder = ?, 
      birthdayReminder = ?, 
      language = ?, 
      lastBackup = ? 
    WHERE id = 1`,
    [darkModeValue, visitReminderValue, birthdayReminderValue, language, lastBackup],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (this.changes === 0) {
        // 如果没有更新任何行，说明表中没有数据，需要插入
        db.run(
          `INSERT INTO UserSettings (id, darkMode, visitReminder, birthdayReminder, language, lastBackup) 
           VALUES (1, ?, ?, ?, ?, ?)`,
          [darkModeValue, visitReminderValue, birthdayReminderValue, language, lastBackup],
          function(err) {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            
            res.json({ 
              success: true,
              message: '设置已创建'
            });
          }
        );
      } else {
        res.json({ 
          success: true,
          message: '设置已更新'
        });
      }
    }
  );
});

app.put('/api/user-settings/dark-mode', (req, res) => {
  const { enabled } = req.body;
  const darkModeValue = enabled ? 1 : 0;
  
  db.run("UPDATE UserSettings SET darkMode = ? WHERE id = 1", [darkModeValue], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      // 如果没有更新任何行，说明表中没有数据，需要插入
      db.run(
        "INSERT INTO UserSettings (id, darkMode) VALUES (1, ?)",
        [darkModeValue],
        function(err) {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          
          res.json({ 
            success: true,
            message: '深色模式设置已创建'
          });
        }
      );
    } else {
      res.json({ 
        success: true,
        message: '深色模式设置已更新'
      });
    }
  });
});

app.put('/api/user-settings/notification', (req, res) => {
  const { type, enabled } = req.body;
  
  if (!type || !['visitReminder', 'birthdayReminder'].includes(type)) {
    res.status(400).json({ error: '无效的通知类型' });
    return;
  }
  
  const value = enabled ? 1 : 0;
  
  db.run(`UPDATE UserSettings SET ${type} = ? WHERE id = 1`, [value], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      // 如果没有更新任何行，说明表中没有数据，需要插入
      db.run(
        `INSERT INTO UserSettings (id, ${type}) VALUES (1, ?)`,
        [value],
        function(err) {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          
          res.json({ 
            success: true,
            message: '通知设置已创建'
          });
        }
      );
    } else {
      res.json({ 
        success: true,
        message: '通知设置已更新'
      });
    }
  });
});

app.put('/api/user-settings/backup', (req, res) => {
  const lastBackup = new Date().toISOString();
  
  db.run("UPDATE UserSettings SET lastBackup = ? WHERE id = 1", [lastBackup], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      // 如果没有更新任何行，说明表中没有数据，需要插入
      db.run(
        "INSERT INTO UserSettings (id, lastBackup) VALUES (1, ?)",
        [lastBackup],
        function(err) {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          
          res.json({ 
            success: true,
            lastBackup
          });
        }
      );
    } else {
      res.json({ 
        success: true,
        lastBackup
      });
    }
  });
});

// API路由 - 回访方式
app.get('/api/visit-methods', (req, res) => {
  db.all('SELECT * FROM VisitMethods ORDER BY displayOrder ASC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/visit-methods', (req, res) => {
  const { name, description, displayOrder } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: "回访方式名称不能为空" });
  }
  
  const sql = `INSERT INTO VisitMethods (name, description, displayOrder) VALUES (?, ?, ?)`;
  
  db.run(sql, [name, description, displayOrder || 999], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({ 
      id: this.lastID,
      name: name,
      success: true
    });
  });
});

app.put('/api/visit-methods/:id', (req, res) => {
  const id = req.params.id;
  const { name, description, displayOrder } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: "回访方式名称不能为空" });
  }
  
  const sql = `UPDATE VisitMethods SET 
    name = ?, 
    description = ?, 
    displayOrder = ? 
    WHERE id = ?`;
  
  db.run(sql, [name, description, displayOrder, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: "回访方式不存在" });
      return;
    }
    
    res.json({ 
      id: id,
      success: true 
    });
  });
});

app.delete('/api/visit-methods/:id', (req, res) => {
  const id = req.params.id;
  
  db.run('DELETE FROM VisitMethods WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: "回访方式不存在" });
      return;
    }
    
    res.json({ success: true });
  });
});

// 登录验证API
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, error: "用户名和密码不能为空" });
  }
  
  // 验证管理员账户
  db.get('SELECT * FROM Managers WHERE name = ? AND password = ?', [username, password], (err, row) => {
    if (err) {
      console.error('登录验证失败:', err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
    
    if (!row) {
      console.log('登录失败: 无效的用户名或密码', username);
      return res.status(401).json({ success: false, error: "用户名或密码错误" });
    }
    
    // 生成简单的令牌
    const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
    
    console.log('登录成功:', username);
    return res.json({ 
      success: true, 
      user: { id: row.id, name: row.name },
      token: token
    });
  });
});

// 退出登录API
app.post('/api/auth/logout', (req, res) => {
  // 简单返回成功，具体的令牌失效处理在前端完成
  res.json({ success: true });
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});

// 上级联系人排序接口
app.post('/api/superior-contacts/reorder', (req, res) => {
    const { order } = req.body;
    
    if (!order || !Array.isArray(order)) {
        return res.status(400).json({ error: "Invalid order data" });
    }
    
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        order.forEach((id, index) => {
            db.run(
                `UPDATE SuperiorContacts SET displayOrder = ? WHERE id = ?`,
                [index + 1, id]
            );
        });
        
        db.run('COMMIT', err => {
            if (err) {
                db.run('ROLLBACK');
                console.error(err);
                return res.status(500).json({ error: err.message });
            }
            
            res.json({ success: true });
        });
    });
});

// 下级联系人排序接口
app.post('/api/subordinate-contacts/reorder', (req, res) => {
    const { order } = req.body;
    
    if (!order || !Array.isArray(order)) {
        return res.status(400).json({ error: "Invalid order data" });
    }
    
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        order.forEach((id, index) => {
            db.run(
                `UPDATE SubordinateContacts SET displayOrder = ? WHERE id = ?`,
                [index + 1, id]
            );
        });
        
        db.run('COMMIT', err => {
            if (err) {
                db.run('ROLLBACK');
                console.error(err);
                return res.status(500).json({ error: err.message });
            }
            
            res.json({ success: true });
        });
    });
});

// API路由 - 预设产品管理
app.get('/api/preset-products', (req, res) => {
  db.all("SELECT * FROM PresetProducts ORDER BY displayOrder", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/preset-products', (req, res) => {
  const { productName, price, description, displayOrder } = req.body;
  
  if (!productName) {
    return res.status(400).json({ error: "产品名称不能为空" });
  }
  
  const sql = `INSERT INTO PresetProducts (productName, price, description, displayOrder) VALUES (?, ?, ?, ?)`;
  
  db.run(sql, [productName, price || 0, description || '', displayOrder || 999], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({ 
      id: this.lastID,
      productName: productName,
      success: true
    });
  });
});

app.put('/api/preset-products/:id', (req, res) => {
  const id = req.params.id;
  const { productName, price, description, displayOrder } = req.body;
  
  if (!productName) {
    return res.status(400).json({ error: "产品名称不能为空" });
  }
  
  const sql = `UPDATE PresetProducts SET 
    productName = ?, 
    price = ?,
    description = ?, 
    displayOrder = ? 
    WHERE id = ?`;
  
  db.run(sql, [productName, price || 0, description || '', displayOrder || 999, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: "预设产品不存在" });
      return;
    }
    
    res.json({ 
      id: id,
      success: true 
    });
  });
});

app.delete('/api/preset-products/:id', (req, res) => {
  const id = req.params.id;
  
  db.run('DELETE FROM PresetProducts WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: "预设产品不存在" });
      return;
    }
    
    res.json({ success: true });
  });
});

// 预设产品排序接口
app.post('/api/preset-products/reorder', (req, res) => {
    const { order } = req.body;
    
    if (!order || !Array.isArray(order)) {
        return res.status(400).json({ error: "无效的排序数据" });
    }
    
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        order.forEach((id, index) => {
            db.run(
                `UPDATE PresetProducts SET displayOrder = ? WHERE id = ?`,
                [index + 1, id]
            );
        });
        
        db.run('COMMIT', err => {
            if (err) {
                db.run('ROLLBACK');
                console.error(err);
                return res.status(500).json({ error: err.message });
            }
            
            res.json({ success: true });
        });
    });
});

// API路由 - 回访类型
app.get('/api/visit-types', (req, res) => {
  db.all('SELECT * FROM VisitTypes ORDER BY displayOrder ASC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// API路由 - 导航模式
app.get('/api/navigation-modes', (req, res) => {
  db.all('SELECT * FROM NavigationModes ORDER BY displayOrder ASC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// API路由 - 添加回访类型
app.post('/api/visit-types', (req, res) => {
  const { name, description, displayOrder } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: "回访类型名称不能为空" });
  }
  
  const sql = `INSERT INTO VisitTypes (name, description, displayOrder) VALUES (?, ?, ?)`;
  
  db.run(sql, [name, description, displayOrder || 999], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({ 
      id: this.lastID,
      name: name,
      success: true
    });
  });
});

// API路由 - 更新回访类型
app.put('/api/visit-types/:id', (req, res) => {
  const id = req.params.id;
  const { name, description, displayOrder } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: "回访类型名称不能为空" });
  }
  
  const sql = `UPDATE VisitTypes SET name = ?, description = ?, displayOrder = ? WHERE id = ?`;
  
  db.run(sql, [name, description, displayOrder, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: "找不到指定的回访类型" });
    }
    
    res.json({ 
      id: id,
      success: true
    });
  });
});

// API路由 - 删除回访类型
app.delete('/api/visit-types/:id', (req, res) => {
  const id = req.params.id;
  
  db.run(`DELETE FROM VisitTypes WHERE id = ?`, [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: "找不到指定的回访类型" });
    }
    
    res.json({ 
      success: true
    });
  });
});

// API路由 - 添加导航模式
app.post('/api/navigation-modes', (req, res) => {
  const { name, urlPattern, displayOrder } = req.body;
  
  if (!name || !urlPattern) {
    return res.status(400).json({ error: "导航名称和URL模式不能为空" });
  }
  
  const sql = `INSERT INTO NavigationModes (name, urlPattern, displayOrder) VALUES (?, ?, ?)`;
  
  db.run(sql, [name, urlPattern, displayOrder || 999], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({ 
      id: this.lastID,
      name: name,
      success: true
    });
  });
});

// API路由 - 更新导航模式
app.put('/api/navigation-modes/:id', (req, res) => {
  const id = req.params.id;
  const { name, urlPattern, displayOrder } = req.body;
  
  if (!name || !urlPattern) {
    return res.status(400).json({ error: "导航名称和URL模式不能为空" });
  }
  
  const sql = `UPDATE NavigationModes SET name = ?, urlPattern = ?, displayOrder = ? WHERE id = ?`;
  
  db.run(sql, [name, urlPattern, displayOrder, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: "找不到指定的导航模式" });
    }
    
    res.json({ 
      id: id,
      success: true
    });
  });
});

// API路由 - 删除导航模式
app.delete('/api/navigation-modes/:id', (req, res) => {
  const id = req.params.id;
  
  db.run(`DELETE FROM NavigationModes WHERE id = ?`, [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: "找不到指定的导航模式" });
    }
    
    res.json({ 
      success: true
    });
  });
});

// API路由 - 重新排序导航模式
app.post('/api/navigation-modes/reorder', (req, res) => {
  const { order } = req.body;
  
  if (!order || !Array.isArray(order) || order.length === 0) {
    return res.status(400).json({ error: "无效的排序数据" });
  }
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    let hasError = false;
    
    // 为每个ID更新displayOrder
    order.forEach((id, index) => {
      db.run(
        'UPDATE NavigationModes SET displayOrder = ? WHERE id = ?',
        [index + 1, id],
        function(err) {
          if (err) {
            console.error(`更新导航模式ID ${id}的排序失败:`, err.message);
            hasError = true;
          }
        }
      );
    });
    
    if (hasError) {
      db.run('ROLLBACK');
      return res.status(500).json({ error: "保存排序失败，已回滚更改" });
    }
    
    db.run('COMMIT', function(err) {
      if (err) {
        console.error('提交事务失败:', err.message);
        db.run('ROLLBACK');
        return res.status(500).json({ error: "保存排序失败，提交事务出错" });
      }
      
      res.json({ 
        success: true,
        message: "导航模式排序已保存"
      });
    });
  });
});

// API路由 - 提醒周期
app.get('/api/reminder-cycles', (req, res) => {
  db.all('SELECT * FROM ReminderCycles ORDER BY displayOrder', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/reminder-cycles', (req, res) => {
  const { name, days, displayOrder } = req.body;
  
  if (!name || days === undefined) {
    return res.status(400).json({ error: "名称和天数是必填项" });
  }
  
  const sql = `INSERT INTO ReminderCycles (name, days, displayOrder) VALUES (?, ?, ?)`;
  
  db.run(sql, [name, days, displayOrder || 999], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({ 
      id: this.lastID,
      name,
      days,
      success: true
    });
  });
});

app.put('/api/reminder-cycles/:id', (req, res) => {
  const id = req.params.id;
  const { name, days, displayOrder } = req.body;
  
  if (!name || days === undefined) {
    return res.status(400).json({ error: "名称和天数是必填项" });
  }
  
  const sql = `UPDATE ReminderCycles SET 
    name = ?, 
    days = ?,
    displayOrder = ? 
    WHERE id = ?`;
  
  db.run(sql, [name, days, displayOrder || 999, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: "提醒周期不存在" });
      return;
    }
    
    res.json({ 
      id: id,
      success: true 
    });
  });
});

app.delete('/api/reminder-cycles/:id', (req, res) => {
  const id = req.params.id;
  
  db.run(`DELETE FROM ReminderCycles WHERE id = ?`, id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: "提醒周期不存在" });
      return;
    }
    
    res.json({ success: true });
  });
}); 