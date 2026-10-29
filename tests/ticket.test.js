const test = require('node:test');
const assert = require('node:assert');
process.env.JWT_SECRET ||= 'integration-test-secret-32-bytes-minimum';
const app = require('../src/index');
const TicketService = require('../src/backend/services/ticketService');
const { calculateDueDate } = require('../src/backend/utils/slaHelper');
const { query } = require('../src/backend/config/db');
const { hashPassword } = require('../src/backend/services/authService');

test('Integration Test: Phân hệ tiếp nhận và phân loại bảo hành (L2)', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/tickets`;
  const customerUrl = `http://localhost:${port}/api/customers`;
  const catalogUrl = `http://localhost:${port}/api`;
  const username = `integration_${Date.now()}`;
  const password = 'Integration-Test-Password-2026!';
  let userId = null;
  t.after(async () => {
    server.close();
    if (userId) await query('DELETE FROM app_user WHERE user_id=$1', [userId]);
  });
  const passwordHash = await hashPassword(password);
  const userResult = await query(
    `INSERT INTO app_user(username,password_hash,full_name,role,center_id)
     VALUES($1,$2,'Integration Test','QUAN_LY_HE_THONG',NULL) RETURNING user_id`,
    [username, passwordHash]);
  userId = userResult.rows[0].user_id;
  const loginResponse = await fetch(`http://localhost:${port}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  assert.strictEqual(loginResponse.status, 200, 'Integration fixture must authenticate through the API');
  const sessionCookie = loginResponse.headers.get('set-cookie').split(';')[0];
  const authenticatedFetch = (url, options = {}) => fetch(url, {
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), Cookie: sessionCookie, ...options.headers },
  });

  t.beforeEach(() => {
    TicketService.resetStore();
  });

  await t.test('US6: Kiểm tra validation dữ liệu bắt buộc (NOT NULL / Phone format)', async () => {
    const invalidPayload = {
      customer_name: '',
      customer_phone: '12345',
      product_name: '',
      serial_imei: '',
      issue_category_id: '',
      store_id: '',
      issue_description: '',
    };

    const res = await authenticatedFetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidPayload),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.ok(body.errors.length > 0);
  });

  await t.test('Không tiếp nhận khách chưa đăng ký hoặc mô tả dưới 10 ký tự', async () => {
    const input = { customer_name: 'Khách thử', customer_phone: '0990000123', product_name: 'Thiết bị thử',
      serial_imei: 'TEST-MISSING-CUSTOMER', issue_category_id: '1', center_id: 1, issue_description: 'Đủ mười ký tự' };
    let res = await authenticatedFetch(baseUrl, { method: 'POST', body: JSON.stringify(input) });
    assert.strictEqual(res.status, 404);
    res = await authenticatedFetch(baseUrl, { method: 'POST', body: JSON.stringify({ ...input, customer_phone: '0901234567', issue_description: '123456789' }) });
    assert.strictEqual(res.status, 400);
  });

  await t.test('US1: Tạo phiếu bảo hành mới thành công', async () => {
    const validPayload = {
      customer_name: 'Nguyễn Văn A',
      customer_phone: '0901234567',
      product_name: 'iPhone 15 Pro Max',
      serial_imei: 'IMEI356789012345678',
      issue_category_id: '1',
      store_id: 'STORE_01',
      center_id: 1,
      issue_description: 'Màn hình bị sọc xanh sau khi rơi nhẹ',
      priority: 'CAO',
    };

    const res = await authenticatedFetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.id.startsWith('TKT-') || body.data.id.startsWith('BH-'));
    assert.ok(body.data.status === 'MOI' || body.data.status === 'NEW');
    assert.ok(body.data.due_date); // Đã tự động sinh SLA theo QT-04
    assert.equal(body.data.customer_name, 'Trần Văn A');
  });

  await t.test('US4 & US7: Cập nhật trạng thái phiếu và tra cứu lịch sử', async () => {
    // 1. Tạo trước 1 phiếu
    const ticket = TicketService.createTicket({
      customer_name: 'Trần Thị B',
      customer_phone: '0912345678',
      product_name: 'Samsung Galaxy S24',
      serial_imei: 'IMEI987654321012345',
      issue_category_id: '2',
      center_id: 2,
      issue_description: 'Pin tụt nhanh và máy bị nóng',
      priority: 'TRUNG_BINH',
    });

    // Chỉ người quản lý mới phê duyệt ngoại lệ trước khi phân công.
    const blocked = await authenticatedFetch(`${baseUrl}/${ticket.id}/status`, {
      method: 'PATCH', body: JSON.stringify({ status: 'DA_PHAN_CONG', updated_by: 'test' }),
    });
    assert.strictEqual(blocked.status, 409);
    const approved = await authenticatedFetch(`${baseUrl}/${ticket.id}/warranty-exception`, {
      method: 'PATCH', body: JSON.stringify({ note: 'Khách đồng ý sửa dịch vụ' }),
    });
    assert.strictEqual(approved.status, 200);

    // 2. Chuyển trạng thái sang DA_PHAN_CONG
    const updateRes = await authenticatedFetch(`${baseUrl}/${ticket.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'DA_PHAN_CONG',
        updated_by: 'NV_KHOI_2374802010247',
        note: 'Đã hoàn tất tiếp nhận, chuyển bước phân công kỹ thuật viên',
      }),
    });

    assert.strictEqual(updateRes.status, 200);

    // 3. Xem chi tiết phiếu kèm lịch sử
    const detailRes = await authenticatedFetch(`${baseUrl}/${ticket.id}`);
    assert.strictEqual(detailRes.status, 200);
    const detailBody = await detailRes.json();
    assert.ok(detailBody.data.status === 'DA_PHAN_CONG' || detailBody.data.status === 'PENDING_ASSIGNMENT');
    assert.strictEqual(detailBody.data.status_history.length, 3);
  });

  await t.test('US5: Lọc danh sách phiếu theo trung tâm/cửa hàng và trạng thái', async () => {
    TicketService.createTicket({
      customer_name: 'Khách 1',
      customer_phone: '0901112222',
      product_name: 'iPad Pro',
      serial_imei: 'SERIAL111',
      issue_category_id: '6',
      center_id: 1,
      store_id: 'STORE_HCM',
      issue_description: 'Lỗi loa',
    });

    const res = await authenticatedFetch(`${baseUrl}?center_id=1&status=MOI`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.total >= 1);
  });

  await t.test('Danh sách giữ tổng phân trang và thống kê độc lập với từ khóa', async () => {
    const base = await authenticatedFetch(`${baseUrl}?center_id=1&limit=1`);
    const all = await base.json();
    assert.equal(base.status, 200);
    assert.equal(all.data.length, 1);
    assert.ok(all.total > all.data.length);
    const filtered = await authenticatedFetch(`${baseUrl}?center_id=1&limit=1&q=khongtimthay`);
    const filteredBody = await filtered.json();
    assert.equal(filteredBody.total, 0);
    assert.equal(filteredBody.summary.total, all.summary.total);
    assert.equal(filteredBody.summary.new, all.summary.new);
  });

  await t.test('FR1 / US1: Tra cứu hồ sơ khách hàng theo SĐT (QT-01)', async () => {
    // Tra cứu số điện thoại có sẵn kèm tiền tố +84 (kiểm tra normalizePhone)
    const res = await authenticatedFetch(`${customerUrl}?phone=+84901234567`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.phone, '0901234567');
    assert.strictEqual(body.data.full_name, 'Trần Văn A');
  });

  await t.test('QT-04: Thuật toán tính hạn SLA tự động bỏ qua ngày Chủ Nhật', async () => {
    // Giả sử tiếp nhận vào Thứ Bảy lúc 10:00 sáng với mức ưu tiên CAO (24h làm việc)
    // Thứ Bảy là 2026-10-03 (Sat). Qua Chủ Nhật (2026-10-04) phải bị bỏ qua và dời sang Thứ Hai (2026-10-05 10:00)
    const saturday = new Date('2026-10-03T10:00:00Z');
    const dueDate = calculateDueDate(saturday, 'CAO');
    // Hạn cam kết phải rơi vào Thứ Hai (getDay() === 1)
    assert.strictEqual(dueDate.getUTCDay(), 1);
    assert.strictEqual(dueDate.getUTCHours(), 10);
  });

  await t.test('Master Data: Trả về đầy đủ trung tâm từ PostgreSQL và 6 nhóm sự cố từ Dataset', async () => {
    const catRes = await authenticatedFetch(`${catalogUrl}/categories`);
    assert.strictEqual(catRes.status, 200);
    const catBody = await catRes.json();
    assert.strictEqual(catBody.total, 6);

    const centerRes = await authenticatedFetch(`${catalogUrl}/centers`);
    assert.strictEqual(centerRes.status, 200);
    const centerBody = await centerRes.json();
    assert.ok(centerBody.total >= 6);
  });
});
