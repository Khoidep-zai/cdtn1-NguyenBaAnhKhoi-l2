const test = require('node:test');
const assert = require('node:assert/strict');
const { validateReceive, validateStatus } = require('../src/backend/validators/ticketValidator');

const hopLe = {
  customer_name: 'Nguyễn Văn A',
  customer_phone: '0901234567',
  product_name: 'iPhone 15 Pro',
  serial_imei: 'SN-10293',
  issue_category_id: 1,
  center_id: 2,
  store_id: 'STORE_02',
  issue_description: 'Màn hình không lên nguồn',
  priority: 'CAO',
  sold_at: '2026-06-01',
};

test('TV-01: Dữ liệu hợp lệ thì trả về đối tượng đã chuẩn hóa', () => {
  const ra = validateReceive({ ...hopLe, serial_imei: '  SN-10293  ' });
  assert.equal(ra.serial_imei, 'SN-10293');
  assert.equal(ra.customer_name, 'Nguyễn Văn A');
  assert.equal(ra.priority, 'CAO');
});

test('TV-02: Thiếu trường bắt buộc thì ném lỗi NÊU RÕ tên trường', () => {
  try {
    validateReceive({ customer_name: 'A' });
    assert.fail('Phải ném lỗi');
  } catch (e) {
    assert.equal(e.code, 'DU_LIEU_KHONG_HOP_LE');
    const cacTruong = e.chiTiet.cac_truong.map((x) => x.truong);
    assert.ok(cacTruong.includes('customer_phone'));
    assert.ok(cacTruong.includes('serialNo'));
  }
});

test('TV-03: Serial có ký tự lạ (SQL injection payload) thì bị từ chối', () => {
  assert.throws(
    () => validateReceive({ ...hopLe, serial_imei: "SN' OR 1=1 --" }),
    { code: 'DU_LIEU_KHONG_HOP_LE' }
  );
});

test('TV-04: Ngày bán sai định dạng thì bị từ chối', () => {
  assert.throws(
    () => validateReceive({ ...hopLe, sold_at: '01/06/2026' }),
    { code: 'DU_LIEU_KHONG_HOP_LE' }
  );
});

test('TV-05: Trạng thái ngoài tập cho phép thì bị từ chối', () => {
  assert.throws(
    () => validateStatus({ status: 'XONG_ROI', updated_by: 'NV_KHOI' }),
    { code: 'DU_LIEU_KHONG_HOP_LE' }
  );
  const ra = validateStatus({ status: 'DANG_XU_LY', updated_by: 'NV_KHOI', note: 'Ghi chú' });
  assert.equal(ra.status, 'DANG_XU_LY');
  assert.equal(ra.updated_by, 'NV_KHOI');
});
