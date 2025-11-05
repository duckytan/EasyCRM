const fs = require('fs');
const path = require('path');
const { BACKUP_DIR, DATABASE_FILE } = require('../config');
const { closeConnection, setupDatabase } = require('../database');

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function registerMaintenanceRoutes(app, db) {
  app.delete('/api/data/delete-all', (_req, res) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      db.run('DELETE FROM Visits', [], function visitsHandler(err) {
        if (err) {
          console.error('删除所有回访记录失败:', err.message);
          db.run('ROLLBACK');
          res.status(500).json({ error: err.message });
          return;
        }

        db.run('DELETE FROM Products', [], function productsHandler(err2) {
          if (err2) {
            console.error('删除所有产品记录失败:', err2.message);
            db.run('ROLLBACK');
            res.status(500).json({ error: err2.message });
            return;
          }

          db.run('DELETE FROM Customers', [], function customersHandler(err3) {
            if (err3) {
              console.error('删除所有客户失败:', err3.message);
              db.run('ROLLBACK');
              res.status(500).json({ error: err3.message });
              return;
            }

            db.run('COMMIT', (commitErr) => {
              if (commitErr) {
                console.error('提交事务失败:', commitErr.message);
                db.run('ROLLBACK');
                res.status(500).json({ error: commitErr.message });
                return;
              }

              console.log('所有客户、产品和回访数据已被成功删除');
              res.json({
                success: true,
                message: '所有客户、产品和回访数据已被成功删除',
              });
            });
          });
        });
      });
    });
  });

  app.post('/api/backup', async (_req, res) => {
    try {
      ensureBackupDir();
      const backupFileName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
      const backupPath = path.join(BACKUP_DIR, backupFileName);

      db.serialize(() => {
        db.run('BEGIN IMMEDIATE', (beginErr) => {
          if (beginErr) {
            console.error('备份时获取锁失败:', beginErr);
            res.status(500).json({ error: beginErr.message });
            return;
          }

          fs.copyFile(DATABASE_FILE, backupPath, (copyErr) => {
            if (copyErr) {
              console.error('备份失败:', copyErr);
              db.run('ROLLBACK');
              res.status(500).json({ error: copyErr.message });
              return;
            }

            db.run('COMMIT', (commitErr) => {
              if (commitErr) {
                console.error('备份提交失败:', commitErr);
                res.status(500).json({ error: commitErr.message });
                return;
              }

              res.json({ success: true, fileName: backupFileName });
            });
          });
        });
      });
    } catch (error) {
      console.error('备份过程出错:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/restore', async (req, res) => {
    try {
      ensureBackupDir();
      const { fileName } = req.body || {};

      let backupPath;
      if (!fileName) {
        const backupFiles = fs
          .readdirSync(BACKUP_DIR)
          .filter((file) => file.startsWith('backup_') && file.endsWith('.db'))
          .sort(
            (a, b) =>
              fs.statSync(path.join(BACKUP_DIR, b)).mtime.getTime() -
              fs.statSync(path.join(BACKUP_DIR, a)).mtime.getTime(),
          );

        if (backupFiles.length === 0) {
          res.status(404).json({ error: '没有找到任何备份' });
          return;
        }

        backupPath = path.join(BACKUP_DIR, backupFiles[0]);
      } else {
        backupPath = path.join(BACKUP_DIR, fileName);
        if (!fs.existsSync(backupPath)) {
          res.status(404).json({ error: '备份文件不存在' });
          return;
        }
      }

      closeConnection();

      fs.copyFile(backupPath, DATABASE_FILE, async (copyErr) => {
        if (copyErr) {
          console.error('恢复备份失败:', copyErr);
          res.status(500).json({ error: copyErr.message });
          return;
        }

        try {
          await setupDatabase();
          res.json({ success: true });
        } catch (initErr) {
          console.error('恢复后重建数据库连接失败:', initErr);
          res.status(500).json({ error: initErr.message });
        }
      });
    } catch (error) {
      console.error('恢复过程出错:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/clear-data', (_req, res) => {
    try {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        const tables = ['Visits', 'Products', 'Customers'];

        tables.forEach((table) => {
          db.run(`DELETE FROM ${table}`, (err) => {
            if (err) {
              console.error(`清空${table}表失败:`, err);
            }
          });
        });

        db.run('DELETE FROM sqlite_sequence WHERE name IN (?, ?, ?)', tables, (err) => {
          if (err) {
            console.error('重置自增ID失败:', err);
            db.run('ROLLBACK');
            res.status(500).json({ error: err.message });
            return;
          }

          db.run('COMMIT', (commitErr) => {
            if (commitErr) {
              console.error('提交事务失败:', commitErr);
              db.run('ROLLBACK');
              res.status(500).json({ error: commitErr.message });
              return;
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

  app.get('/api/check-update', (_req, res) => {
    res.json({
      hasUpdate: false,
      currentVersion: '1.0.0',
      latestVersion: '1.0.0',
    });
  });
}

module.exports = {
  registerMaintenanceRoutes,
};
