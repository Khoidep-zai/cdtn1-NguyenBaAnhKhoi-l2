const { test } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/index');
const db = require('../src/backend/config/db');
test('failed health probe exposes no database error details', async () => {
  const original = db.testConnection;
  db.testConnection = async () => ({ connected: false, error: 'private connection details' });
  const server = app.listen(0);
  try {
    const response = await fetch(`http://localhost:${server.address().port}/health/db`);
    assert.equal(response.status, 503);
    assert.doesNotMatch(await response.text(), /private connection details/);
  } finally { db.testConnection = original; server.closeAllConnections(); await new Promise(r => server.close(r)); }
});
