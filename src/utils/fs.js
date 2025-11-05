const fs = require('fs');
const path = require('path');

function ensureDirectoryExists(targetPath) {
  const directory = fs.existsSync(targetPath) && fs.lstatSync(targetPath).isDirectory()
    ? targetPath
    : path.dirname(targetPath);

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

module.exports = {
  ensureDirectoryExists,
};
