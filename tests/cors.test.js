const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createCors } = require('../src/backend/middlewares/cors');

function invoke(origin, method = 'GET') {
  const headers = {};
  const res = { setHeader: (key, value) => { headers[key] = value; }, end() { this.ended = true; } };
  let next = false;
  createCors(['https://trusted.example'])({ headers: { origin }, method }, res, () => { next = true; });
  return { headers, res, next };
}

test('CORS allows configured origins and credentials', () => {
  const { headers, next } = invoke('https://trusted.example');
  assert.equal(headers['Access-Control-Allow-Origin'], 'https://trusted.example');
  assert.equal(headers['Access-Control-Allow-Credentials'], 'true');
  assert.equal(next, true);
});

test('CORS denies untrusted origins and handles allowed preflight', () => {
  const denied = invoke('https://untrusted.example');
  assert.equal(denied.headers['Access-Control-Allow-Origin'], undefined);
  const preflight = invoke('https://trusted.example', 'OPTIONS');
  assert.equal(preflight.res.statusCode, 204);
  assert.equal(preflight.res.ended, true);
});
