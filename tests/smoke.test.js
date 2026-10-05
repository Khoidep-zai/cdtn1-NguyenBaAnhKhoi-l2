const test = require('node:test');
const assert = require('node:assert');
const app = require('../src/index');
const { closePool } = require('../src/backend/config/db');

test.after(async () => {
  await closePool();
});

test('GET /health endpoint smoke test', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const response = await fetch(`http://localhost:${port}/health`);
    assert.strictEqual(response.status, 200);
    const data = await response.json();
    assert.deepStrictEqual(data, { status: 'ok' });
  } finally {
    server.close();
  }
});

test('GET /health/db endpoint checks PostgreSQL connection', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const response = await fetch(`http://localhost:${port}/health/db`);
    const data = await response.json();
    assert.ok(response.status === 200 || response.status === 503);
    assert.ok(data.database);
    if (response.status === 200) {
      assert.strictEqual(data.status, 'ok');
      assert.strictEqual(data.database.connected, true);
      assert.strictEqual(data.database.database, 'cdtn1_warranty_db');
    }
  } finally {
    server.close();
  }
});

