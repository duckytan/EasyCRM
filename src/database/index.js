const { createConnection, getConnection, closeConnection } = require('./connection');
const { initializeDatabase } = require('./setup');

async function setupDatabase() {
  const db = createConnection();
  await initializeDatabase(db);
  return db;
}

module.exports = {
  setupDatabase,
  getConnection,
  closeConnection,
};
