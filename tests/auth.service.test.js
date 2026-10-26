const test = require('node:test');
const assert = require('node:assert/strict');
const config = require('../src/backend/config');
const { hashPassword, verifyPassword, signSession, verifySession, publicUser, MIN_PASSWORD_LENGTH } = require('../src/backend/services/authService');

test('hashPassword stores a salted scrypt digest and verifies only the matching password', async () => {
  const hash = await hashPassword('Correct-Horse-Battery-42');
  assert.match(hash, /^scrypt\$16384\$8\$1\$/);
  assert.notEqual(hash, await hashPassword('Correct-Horse-Battery-42'));
  assert.equal(await verifyPassword('Correct-Horse-Battery-42', hash), true);
  assert.equal(await verifyPassword('incorrect-password', hash), false);
});

test('password requirements reject weak or oversized secrets', async () => {
  await assert.rejects(hashPassword('x'.repeat(MIN_PASSWORD_LENGTH - 1)), new RegExp(`${MIN_PASSWORD_LENGTH} đến 128`));
  await assert.rejects(hashPassword('x'.repeat(129)), new RegExp(`${MIN_PASSWORD_LENGTH} đến 128`));
});

test('non-production policy accepts the six-character branch account password', async (t) => {
  if (config.nodeEnv === 'production') return t.skip('Production intentionally requires 12 characters.');
  const hash = await hashPassword('123456');
  assert.equal(await verifyPassword('123456', hash), true);
});

test('signed session is valid until expiry and rejects tampering', () => {
  const previous = config.jwtSecret;
  config.jwtSecret = 'local-test-secret-with-at-least-32-bytes';
  try {
    const token = signSession(42, 1000);
    assert.deepEqual(verifySession(token, 1001), { sub: '42', iat: 1000, exp: 1000 + 8 * 60 * 60 });
    assert.equal(verifySession(token, 1000 + 8 * 60 * 60), null);
    assert.equal(verifySession(`${token.slice(0, -1)}x`, 1001), null);
  } finally { config.jwtSecret = previous; }
});

test('public user omits private authentication data and exposes role scope', () => {
  const user = publicUser({ user_id: 9, username: 'staff01', full_name: 'Nguyễn An', phone: '0900000000', role: 'NHAN_VIEN', center_id: 2, center_name: 'Hồ Chí Minh', is_active: true, password_hash: 'secret' });
  assert.equal(user.canViewAllCenters, false);
  assert.equal(user.canManageStaff, false);
  assert.equal(user.branchId, 2);
  assert.equal(Object.hasOwn(user, 'password_hash'), false);
});
