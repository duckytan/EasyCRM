const express = require('express');
const cors = require('cors');
const path = require('path');
const { PUBLIC_DIR } = require('./config');
const { registerAllRoutes } = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

function createApp(db) {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(PUBLIC_DIR));

  app.get('/', (_req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
  });

  registerAllRoutes(app, db);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp,
};
