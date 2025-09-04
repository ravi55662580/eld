const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const removeUnusedServerFiles = () => {
  const serverFiles = [
    'minimal-server.js',
    'simple-server.js', 
    'test-server.js',
    'working-server.js'
  ];
  
  const srcDir = path.join(__dirname, '..');
  
  serverFiles.forEach(file => {
    const filePath = path.join(srcDir, file);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        logger.info(`Removed unused server file: ${file}`);
      } catch (error) {
        logger.warn(`Failed to remove ${file}:`, { error: error.message });
      }
    }
  });
};

const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    logger.info(`Created directory: ${dirPath}`);
  }
};

const createReportsDirectory = () => {
  const reportsDir = path.join(__dirname, '../../reports');
  ensureDirectoryExists(reportsDir);
};

const createLogsDirectory = () => {
  const logsDir = path.join(__dirname, '../../logs');
  ensureDirectoryExists(logsDir);
};

module.exports = {
  removeUnusedServerFiles,
  ensureDirectoryExists,
  createReportsDirectory,
  createLogsDirectory
};
