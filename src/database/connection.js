const sqlite3 = require('sqlite3').verbose();
const { ensureDirectoryExists } = require('../utils/fs');
const { DATABASE_FILE } = require('../config');

let databaseInstance = null;

function createConnection() {
  if (databaseInstance) {
    return databaseInstance;
  }

  ensureDirectoryExists(DATABASE_FILE);

  databaseInstance = new sqlite3.Database(DATABASE_FILE, (err) => {
    if (err) {
      console.error('数据库连接失败:', err.message);
      throw err;
    }
  });

  return databaseInstance;
}

function getConnection() {
  return databaseInstance || createConnection();
}

function closeConnection() {
  if (!databaseInstance) {
    return;
  }

  databaseInstance.close((err) => {
    if (err) {
      console.error('关闭数据库失败:', err.message);
    }
  });

  databaseInstance = null;
}

module.exports = {
  createConnection,
  getConnection,
  closeConnection,
};
