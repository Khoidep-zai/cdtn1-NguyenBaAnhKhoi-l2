const test = require('node:test');
const assert = require('node:assert/strict');
process.env.JWT_SECRET ||= 'integration-test-secret-32-bytes-minimum';
const app = require('../src/index');
const { query } = require('../src/backend/config/db');
const { hashPassword } = require('../src/backend/services/authService');

test('Auth API: session, profile, and branch-scoped account permissions', async (t) => {
  const server = app.listen(0);
  const baseUrl = `http://localhost:${server.address().port}/api`;
  const suffix = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const names = [`qa_sys_${suffix}`, `qa_mgr_${suffix}`, `qa_staff_${suffix}`, `qa_other_${suffix}`];
  const createdName = `qa_created_${suffix}`;
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await query('DELETE FROM app_user WHERE username = ANY($1::text[])', [[...names, createdName]]);
  });

  const password = 'Integration-Test-Password-2026!';
  const branchStaffPassword = '123456';
  const passwordHash = await hashPassword(password);
  await query(
    `INSERT INTO app_user(username,password_hash,full_name,role,center_id) VALUES
      ($1,$5,'QA System Manager','QUAN_LY_HE_THONG',NULL),
      ($2,$5,'QA Branch Manager','QUAN_LY_CHI_NHANH',1),
      ($3,$5,'QA Branch Staff','NHAN_VIEN',1),
      ($4,$5,'QA Other Staff','NHAN_VIEN',2)`,
    [...names, passwordHash]);

  async function login(username, loginPassword = password) {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: loginPassword }),
    });
    assert.equal(response.status, 200);
    return response.headers.get('set-cookie').split(';')[0];
  }
  function request(path, cookie, options = {}) {
    return fetch(`${baseUrl}${path}`, {
      ...options,
      headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...options.headers },
    });
  }

  await t.test('Rejects unauthenticated access and verifies password login', async () => {
    assert.equal((await request('/tickets')).status, 401);
    const bad = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: names[0], password: 'incorrect-password' }),
    });
    assert.equal(bad.status, 401);
    const cookie = await login(names[0]);
    assert.match(cookie, /^mekong_session=/);
    const me = await request('/auth/me', cookie);
    assert.equal((await me.json()).data.role, 'QUAN_LY_HE_THONG');
  });

  await t.test('Branch manager sees only branch staff and cannot escalate their role or scope', async () => {
    const cookie = await login(names[1]);
    const listed = await request('/auth/users', cookie);
    assert.equal(listed.status, 200);
    const listedUsers = (await listed.json()).data;
    assert.ok(listedUsers.some((user) => user.username === names[2]));
    assert.equal(listedUsers.some((user) => user.username === names[3]), false);

    const created = await request('/auth/users', cookie, {
      method: 'POST', body: JSON.stringify({
        username: createdName, password: branchStaffPassword, full_name: 'Created Staff',
        role: 'QUAN_LY_HE_THONG', center_id: 2,
      }),
    });
    assert.equal(created.status, 201);
    const createdUser = (await created.json()).data;
    assert.equal(createdUser.role, 'NHAN_VIEN');
    assert.equal(createdUser.branchId, 1);
    const createdCookie = await login(createdName, branchStaffPassword);
    assert.match(createdCookie, /^mekong_session=/);

    const ticketPayload = {
      customer_name: 'QA Branch Customer', customer_phone: '0901234567', customer_address: 'Địa chỉ QA chi nhánh',
      product_name: 'QA Test Device', serial_imei: `QA-${suffix.replaceAll('_', '-')}`,
      issue_category_id: '1', store_id: 'STORE_01', center_id: 1,
      issue_description: 'Kiểm thử tạo phiếu tại đúng chi nhánh.', priority: 'TRUNG_BINH',
    };
    const createdTicket = await request('/tickets', createdCookie, {
      method: 'POST', body: JSON.stringify(ticketPayload),
    });
    assert.equal(createdTicket.status, 201);
    const ticketData = (await createdTicket.json()).data;
    assert.equal(ticketData.center_id, 1);
    assert.equal(ticketData.customer_address, 'Địa chỉ QA chi nhánh');

    const wrongBranchTicket = await request('/tickets', createdCookie, {
      method: 'POST', body: JSON.stringify({
        ...ticketPayload, serial_imei: `QA-OTHER-${suffix.replaceAll('_', '-')}`, store_id: 'STORE_02', center_id: 2,
      }),
    });
    assert.equal(wrongBranchTicket.status, 403);

    const otherId = await query('SELECT user_id FROM app_user WHERE username=$1', [names[3]]);
    const denied = await request(`/auth/users/${otherId.rows[0].user_id}`, cookie, {
      method: 'PATCH', body: JSON.stringify({ full_name: 'Unauthorized Change' }),
    });
    assert.equal(denied.status, 403);
  });

  await t.test('Profile update is self-service and system manager can administer accounts', async () => {
    const branchCookie = await login(names[1]);
    const profile = await request('/auth/profile', branchCookie, {
      method: 'PATCH', body: JSON.stringify({ full_name: 'QA Manager Updated', phone: '0901234567' }),
    });
    assert.equal(profile.status, 200);
    assert.equal((await profile.json()).data.name, 'QA Manager Updated');

    const systemCookie = await login(names[0]);
    const list = await request('/auth/users', systemCookie);
    assert.equal(list.status, 200);
    assert.ok((await list.json()).data.some((user) => user.username === names[3]));
    assert.equal((await request('/auth/users', await login(names[2]))).status, 403);
  });
});
