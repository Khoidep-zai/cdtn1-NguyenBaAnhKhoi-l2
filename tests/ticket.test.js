const test = require('node:test');
const assert = require('node:assert');
const app = require('../src/index');
const TicketService = require('../src/backend/services/ticketService');
const { calculateDueDate } = require('../src/backend/utils/slaHelper');

test('Integration Test: Phân hệ tiếp nhận và phân loại bảo hành (L2)', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/tickets`;
  const customerUrl = `http://localhost:${port}/api/customers`;
  const catalogUrl = `http://localhost:${port}/api`;

  t.beforeEach(() => {
    TicketService.resetStore();
  });

  t.after(() => {
    server.close();
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

    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidPayload),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.ok(body.errors.length > 0);
  });

  await t.test('US1: Tạo phiếu bảo hành mới thành công', async () => {
    const validPayload = {
      customer_name: 'Nguyễn Văn A',
      customer_phone: '0987654321',
      product_name: 'iPhone 15 Pro Max',
      serial_imei: 'IMEI356789012345678',
      issue_category_id: '1',
      store_id: 'STORE_01',
      center_id: 1,
      issue_description: 'Màn hình bị sọc xanh sau khi rơi nhẹ',
      priority: 'CAO',
    };

    const res = await fetch(baseUrl, {
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

    // 2. Chuyển trạng thái sang DA_PHAN_CONG
    const updateRes = await fetch(`${baseUrl}/${ticket.id}/status`, {
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
    const detailRes = await fetch(`${baseUrl}/${ticket.id}`);
    assert.strictEqual(detailRes.status, 200);
    const detailBody = await detailRes.json();
    assert.ok(detailBody.data.status === 'DA_PHAN_CONG' || detailBody.data.status === 'PENDING_ASSIGNMENT');
    assert.strictEqual(detailBody.data.status_history.length, 2);
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

    const res = await fetch(`${baseUrl}?center_id=1&status=MOI`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.total >= 1);
  });

  await t.test('FR1 / US1: Tra cứu hồ sơ khách hàng theo SĐT (QT-01)', async () => {
    // Tra cứu số điện thoại có sẵn kèm tiền tố +84 (kiểm tra normalizePhone)
    const res = await fetch(`${customerUrl}?phone=+84901234567`);
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

  await t.test('Master Data: Trả về đầy đủ 6 trung tâm và 6 nhóm sự cố từ Dataset', async () => {
    const catRes = await fetch(`${catalogUrl}/categories`);
    assert.strictEqual(catRes.status, 200);
    const catBody = await catRes.json();
    assert.strictEqual(catBody.total, 6);

    const centerRes = await fetch(`${catalogUrl}/centers`);
    assert.strictEqual(centerRes.status, 200);
    const centerBody = await centerRes.json();
    assert.strictEqual(centerBody.total, 6);
  });
});
