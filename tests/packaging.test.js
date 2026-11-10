const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { Client } = require('pg');

// Run only against an explicitly designated disposable database.
test('migration can be repeated without changing row counts', { skip: process.env.TEST_PACKAGING !== '1' }, async () => {
  assert.equal(process.env.NODE_ENV, 'test', 'TEST_PACKAGING requires NODE_ENV=test and an isolated database');
  const client = new Client({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD });
  await client.connect();
  try {
    const run = (script) => {
      const result = spawnSync(process.execPath, [script], { env: process.env, encoding: 'utf8', timeout: 180000 });
      assert.equal(result.status, 0, `${script} failed: ${result.stderr || result.error}`);
    };
    const counts = async () => (await client.query('SELECT (SELECT count(*) FROM customer) AS customers, (SELECT count(*) FROM ticket) AS tickets, (SELECT count(*) FROM app_user) AS users')).rows[0];
    run('src/backend/db/migrate.js');
    const before = await counts();
    assert.ok(Number(before.customers) > 0 && Number(before.tickets) > 0);
    run('src/backend/db/migrate.js');
    assert.deepEqual(await counts(), before);
  } finally { await client.end(); }
});
