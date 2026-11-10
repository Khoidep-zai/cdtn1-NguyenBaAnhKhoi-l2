const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { che, ganRequestId } = require('../src/backend/utils/logger');

test('redacts sensitive fields and does not disclose error messages or stacks', () => {
  const result = che({ password: 'secret-value', nested: { phone: '0901234567' }, err: new Error('secret-value') });
  assert.equal(result.password, '***');
  assert.equal(result.nested.phone, '***');
  assert.ok(!JSON.stringify(result).includes('secret-value'));
});

test('request logs omit query strings', () => {
  const response = new EventEmitter();
  response.setHeader = () => {};
  response.statusCode = 200;
  const request = { headers: {}, method: 'GET', originalUrl: '/api/customers?phone=0901234567' };
  let output = '';
  const write = process.stdout.write;
  process.stdout.write = (chunk) => { output += chunk; return true; };
  try { ganRequestId(request, response, () => {}); response.emit('finish'); }
  finally { process.stdout.write = write; }
  assert.ok(!output.includes('0901234567'));
  assert.equal(JSON.parse(output).duong_dan, '/api/customers');
});
