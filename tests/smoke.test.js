const test = require('node:test');
const assert = require('node:assert');
const app = require('../src/index');

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
