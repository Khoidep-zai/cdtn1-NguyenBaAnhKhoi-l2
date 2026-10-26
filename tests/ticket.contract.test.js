/**
 * tests/ticket.contract.test.js — Kiểm thử hợp đồng dữ liệu ranh giới (Buổi 9 SE)
 *
 * Kiểm tra 3 cam kết của hợp đồng:
 * 1. HÌNH DẠNG (SHAPE): Đầy đủ các trường bắt buộc, due_date chuẩn ISO 8601 kèm múi giờ.
 * 2. Ý NGHĨA (MEANING): Che số điện thoại bảo mật thông tin (QT-15), technician = null khi chưa phân công.
 * 3. HÀNH VI KHI SAI (ERROR BEHAVIOR): Ném đúng mã lỗi nghiệp vụ khi không tìm thấy hoặc thiếu dữ liệu.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  maskPhoneNumber,
  formatTicketContract,
  validateTicketContract,
} = require('../src/backend/contracts/ticket.contract');
const { AppError } = require('../src/backend/errors/AppError');

describe('Hợp đồng dữ liệu ranh giới Ticket (Buổi 9 SE - D1 & D3)', () => {
  const sampleTicket = {
    ticket_code: 'BH-100234/2026',
    customer_name: 'Nguyễn Văn An',
    customer_address: 'Quận 1, TP. Hồ Chí Minh',
    customer_phone: '0901234567',
    product_name: 'iPhone 15 Pro Max',
    serial_imei: 'F2LLK900PM',
    category_id: 1,
    category_name: 'Màn hình cảm ứng',
    status: 'MOI',
    priority: 'CAO',
    due_date: new Date('2026-10-25T14:30:00.000Z'),
    technician_name: null,
    center_id: 2,
    status_logs: [
      {
        old_status: null,
        new_status: 'MOI',
        created_at: '2026-10-20T08:00:00.000Z',
        action_by: 'Lễ tân quầy 01',
      },
    ],
  };

  it('CT-01 [Hình dạng]: Đối tượng chuẩn hóa phải có đầy đủ trường và due_date chuẩn ISO 8601', () => {
    const contracted = formatTicketContract(sampleTicket);

    assert.equal(contracted.ticket_code, 'BH-100234/2026');
    assert.equal(contracted.customer_name, 'Nguyễn Văn An');
    assert.equal(contracted.customer_address, 'Quận 1, TP. Hồ Chí Minh');
    assert.equal(contracted.product_name, 'iPhone 15 Pro Max');
    assert.equal(contracted.serial_imei, 'F2LLK900PM');
    assert.equal(contracted.status, 'MOI');

    // due_date phải là chuỗi ISO 8601 hợp lệ
    assert.ok(typeof contracted.due_date === 'string');
    assert.ok(contracted.due_date.includes('T'));
    assert.ok(!isNaN(new Date(contracted.due_date).getTime()));
  });

  it('CT-02 [Ý nghĩa & Bảo mật]: Số điện thoại phải được che theo quy tắc QT-15, KTV = null khi chưa phân công', () => {
    const contracted = formatTicketContract(sampleTicket);

    // QT-15: Che phần giữa của SĐT
    assert.equal(contracted.customer_phone_masked, '090****567');
    assert.equal(maskPhoneNumber('0988777666'), '098****666');

    // Chưa phân công KTV -> null
    assert.equal(contracted.technician, null);
    assert.equal(contracted.status_logs.length, 1);
  });

  it('CT-03 [Xác thực hợp đồng]: validateTicketContract phát hiện thiếu trường bắt buộc', () => {
    const validResult = validateTicketContract(formatTicketContract(sampleTicket));
    assert.equal(validResult.isValid, true);
    assert.equal(validResult.errors.length, 0);

    const invalidTicket = {
      ticket_code: '',
      customer_name: '',
      due_date: 'invalid-date-string',
    };
    const invalidResult = validateTicketContract(invalidTicket);
    assert.equal(invalidResult.isValid, false);
    assert.ok(invalidResult.errors.length >= 3);
  });

  it('CT-04 [Hành vi khi sai]: Phiếu rỗng thì ném lỗi KHONG_TIM_THAY_PHIEU theo đúng hợp đồng', () => {
    assert.throws(
      () => formatTicketContract(null),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.code, 'KHONG_TIM_THAY_PHIEU');
        return true;
      }
    );
  });
});
