const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const BACKUP_DIR = path.join(ROOT_DIR, 'backups');

const PORT = parseInt(process.env.PORT, 10) || 3001;
const DATABASE_FILE = process.env.DB_PATH || path.join(DATA_DIR, 'database.db');

module.exports = {
  ROOT_DIR,
  PUBLIC_DIR,
  DATA_DIR,
  BACKUP_DIR,
  PORT,
  DATABASE_FILE,
};
