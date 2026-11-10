const { test } = require('node:test');
const assert = require('node:assert/strict');
const loader = require('../src/backend/data/dataLoader');
const catalog = require('../src/backend/controllers/catalogController');
const tickets = require('../src/backend/controllers/ticketController');
const service = require('../src/backend/services/ticketService');

test('unexpected ticket failures do not reveal internal error details', () => {
  const original = service.getTickets;
  service.getTickets = () => { throw new Error('private connection string'); };
  let body;
  const res = { status(code) { this.statusCode = code; return this; }, json(value) { body = value; return this; } };
  try { tickets.list({ query: {} }, res); } finally { service.getTickets = original; }
  assert.equal(res.statusCode, 500);
  assert.ok(!JSON.stringify(body).includes('private connection string'));
});

test('unexpected catalog failures do not reveal internal error details', () => {
  const original = loader.getIssueCategories;
  loader.getIssueCategories = () => { throw new Error('secret database connection'); };
  let body;
  const res = { status(code) { this.statusCode = code; return this; }, json(value) { body = value; return this; } };
  try { catalog.getCategories({}, res); } finally { loader.getIssueCategories = original; }
  assert.equal(res.statusCode, 500);
  assert.ok(!JSON.stringify(body).includes('secret database connection'));
});
