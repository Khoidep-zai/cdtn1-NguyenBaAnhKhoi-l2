// Generates examples through real HTTP requests; temporary users are removed in finally.
const fs = require('node:fs');
const crypto = require('node:crypto');
if (process.env.NODE_ENV !== 'test') throw new Error('Run only with NODE_ENV=test');
const app = require('../src/index');
const { pool } = require('../src/backend/config/db');
const { hashPassword } = require('../src/backend/services/authService');

async function main() {
  const suffix = crypto.randomBytes(6).toString('hex');
  const username = `evidence_${suffix}`;
  const childName = `evidence_child_${suffix}`;
  const password = crypto.randomBytes(24).toString('base64url');
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  const records = [];
  let cookie;
  async function call(method, route, body, type) {
    const response = await fetch(base + route, { method, headers: {
      ...(cookie ? { Cookie: cookie } : {}), ...(body ? { 'Content-Type': type || 'application/json' } : {}),
    }, body: body ? (Buffer.isBuffer(body) ? body : JSON.stringify(body)) : undefined });
    if (route === '/api/auth/login' && response.ok) cookie = response.headers.get('set-cookie').split(';')[0];
    const contentType = response.headers.get('content-type') || '';
    const result = contentType.includes('json') ? await response.json() : { bytes: (await response.arrayBuffer()).byteLength, contentType };
    if (!response.ok) throw new Error(`${method} ${route} returned ${response.status}: ${JSON.stringify(result)}`);
    const cleanBody = Buffer.isBuffer(body) ? { binary: type, bytes: body.length } : body ? { ...body } : null;
    if (cleanBody?.password) cleanBody.password = '[REDACTED temporary test password]';
    records.push({ method, path: route, request: cleanBody, status: response.status, response: result });
    return result;
  }
  try {
    await pool.query('INSERT INTO app_user(username,password_hash,full_name,role,center_id) VALUES($1,$2,$3,$4,NULL)',
      [username, await hashPassword(password), 'Evidence temporary user', 'QUAN_LY_HE_THONG']);
    await call('GET', '/health');
    await call('GET', '/health/db');
    await call('POST', '/api/auth/login', { username, password });
    await call('GET', '/api/auth/me');
    await call('PATCH', '/api/auth/profile', { full_name: 'Evidence User', phone: '' });
    // Use the branch manager fixture to avoid including unrelated users in examples.
    const child = await call('POST', '/api/auth/users', { username: childName, password, full_name: 'Evidence Staff', role: 'NHAN_VIEN', center_id: 1 });
    await call('PATCH', `/api/auth/users/${child.data.id}`, { full_name: 'Evidence Updated Staff' });
    await call('GET', '/api/auth/users');
    await call('GET', '/api/categories');
    await call('GET', '/api/centers');
    await call('GET', '/api/products?limit=1');
    const phone = `09${String(Date.now()).slice(-8)}`;
    await call('POST', '/api/customers', { full_name: 'Synthetic Evidence Customer', phone });
    await call('GET', `/api/customers?phone=${phone}`);
    const ticket = await call('POST', '/api/tickets', { customer_name: 'Synthetic Evidence Customer', customer_phone: phone,
      product_name: 'Evidence Device', serial_imei: `EVID-${suffix}`, issue_category_id: '1', store_id: 'STORE_01', center_id: 1,
      issue_description: 'Synthetic device test issue', priority: 'TRUNG_BINH' });
    const path = `/api/tickets/${ticket.data.id}`;
    await call('GET', '/api/tickets?limit=1');
    await call('GET', path);
    await call('PATCH', `${path}/classify`, { issue_category_id: '1', priority: 'CAO' });
    await call('PATCH', `${path}/service-consent`, { note: 'Synthetic customer consents' });
    await call('PATCH', `${path}/warranty-exception`, { note: 'Synthetic manager approval' });
    for (const status of ['DA_PHAN_CONG', 'DANG_XU_LY', 'HOAN_TAT']) await call('PATCH', `${path}/status`, { status, updated_by: username });
    const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3H0AAAAASUVORK5CYII=', 'base64');
    await call('PUT', `${path}/handover-photo`, image, 'image/png');
    await call('GET', `${path}/handover-photo`);
    await call('POST', '/api/auth/logout');
    // Omit unrelated account records; retain the actual temporary fixture response only.
    for (const record of records) if (record.path === '/api/auth/users' && record.method === 'GET') {
      record.response.data = record.response.data.filter(user => user.username.startsWith('evidence_'));
      record.excerpt = 'Unrelated account rows omitted';
    }
    fs.mkdirSync('docs/evidence', { recursive: true });
    fs.writeFileSync('docs/evidence/api-examples.json', JSON.stringify({ capturedAt: new Date().toISOString(), records }, null, 2));
    console.log(`Captured ${records.length} successful HTTP examples; credentials redacted.`);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await pool.query('DELETE FROM app_user WHERE username = ANY($1::text[])', [[username, childName]]);
    await pool.end();
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
