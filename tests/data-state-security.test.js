const test = require('node:test');
const assert = require('node:assert/strict');
const { dataState } = require('../src/frontend/components/dataState');

test('data state treats server errors and loading messages as text', () => {
  const container = { innerHTML: '' };
  const payload = '<img src=x onerror=alert(1)>';
  global.document = { getElementById: () => null };
  try {
    dataState.renderError(container, { message: payload, code: payload });
    assert.ok(!container.innerHTML.includes(payload));
    assert.ok(container.innerHTML.includes('&lt;img'));
    dataState.renderLoading(container, payload);
    assert.ok(!container.innerHTML.includes(payload));
  } finally {
    delete global.document;
  }
});
