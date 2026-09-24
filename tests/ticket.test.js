const test = require('node:test');
const assert = require('node:assert');
const app = require('../src/index');
const TicketService = require('../src/services/ticketService');

test('Integration Test: Phân hệ tiếp nhận và phân loại bảo hành (L2)', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/tickets`;

  t.beforeEach(() => {
    TicketService.resetStore();
  });

  t.after(() => {
    server.close();
  });

  await t.test('US6: Kiểm tra validation dữ liệu bắt buộc (NOT NULL / Phone format)', async () => {
    // Thiếu tên khách hàng và SĐT sai
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
      issue_category_id: 'CAT_SCREEN',
      store_id: 'STORE_01',
      issue_description: 'Màn hình bị sọc xanh sau khi rơi nhẹ',
      priority: 'HIGH',
    };

    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.id.startsWith('TKT-'));
    assert.strictEqual(body.data.status, 'NEW');
  });

  await t.test('US4 & US7: Cập nhật trạng thái phiếu và tra cứu lịch sử', async () => {
    // 1. Tạo trước 1 phiếu
    const ticket = TicketService.createTicket({
      customer_name: 'Trần Thị B',
      customer_phone: '0912345678',
      product_name: 'Samsung Galaxy S24',
      serial_imei: 'IMEI987654321012345',
      issue_category_id: 'CAT_BATTERY',
      store_id: 'STORE_02',
      issue_description: 'Pin tụt nhanh và máy bị nóng',
      priority: 'MEDIUM',
    });

    // 2. Chuyển trạng thái sang PENDING_ASSIGNMENT
    const updateRes = await fetch(`${baseUrl}/${ticket.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'PENDING_ASSIGNMENT',
        updated_by: 'NV_KHOI_237480200247',
        note: 'Đã hoàn tất tiếp nhận, chuyển bước phân công kỹ thuật viên',
      }),
    });

    assert.strictEqual(updateRes.status, 200);

    // 3. Xem chi tiết phiếu kèm lịch sử
    const detailRes = await fetch(`${baseUrl}/${ticket.id}`);
    assert.strictEqual(detailRes.status, 200);
    const detailBody = await detailRes.json();
    assert.strictEqual(detailBody.data.status, 'PENDING_ASSIGNMENT');
    assert.strictEqual(detailBody.data.status_history.length, 2);
  });

  await t.test('US5: Lọc danh sách phiếu theo cửa hàng và trạng thái', async () => {
    TicketService.createTicket({
      customer_name: 'Khách 1',
      customer_phone: '0901112222',
      product_name: 'iPad Pro',
      serial_imei: 'SERIAL111',
      issue_category_id: 'CAT_OTHER',
      store_id: 'STORE_HCM',
      issue_description: 'Lỗi loa',
    });

    const res = await fetch(`${baseUrl}?store_id=STORE_HCM&status=NEW`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.total, 1);
    assert.strictEqual(body.data[0].store_id, 'STORE_HCM');
  });
});
