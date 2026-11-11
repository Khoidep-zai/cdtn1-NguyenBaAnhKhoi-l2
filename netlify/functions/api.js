const serverless = require('serverless-http');
const config = require('../../src/backend/config');

try {
  config.validateStartup();
} catch (err) {
  console.warn('[Netlify Serverless] Cảnh báo khởi động:', err.message);
}

const app = require('../../src/backend/index');

module.exports.handler = serverless(app);

