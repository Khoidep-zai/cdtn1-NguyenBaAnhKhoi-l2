const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

for (const [label, secret] of [['missing', ''], ['short', 'too-short'], ['short unicode', 'ộ'.repeat(12)]]) {
  test(`startup rejects ${label} JWT_SECRET before listening`, () => {
    const result = spawnSync(process.execPath, ['src/index.js'], {
      env: { ...process.env, JWT_SECRET: secret, PORT: '0' }, encoding: 'utf8', timeout: 4000,
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /JWT_SECRET/);
    assert.doesNotMatch(result.stdout, /Server running/);
  });
}
