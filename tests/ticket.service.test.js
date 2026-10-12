/**
 * ticket.service.test.js — Bộ kiểm thử Đơn vị (Unit Test) cho TicketService
 *
 * Tiêu chí Buổi 7 Track SE & Đề bài BT2 (C4, S2):
 * - Không phụ thuộc CSDL hay Web server (chạy siêu nhanh, độc lập).
 * - Sử dụng Mock Repository / In-memory Repository để cô lập tầng Nghiệp vụ.
 * - Kiểm thử đủ 3 loại bắt buộc:
 *     1. Luồng đúng (Happy Path - TC-01)
 *     2. Giá trị biên (Boundary Value - TC-02)
 *     3. Dữ liệu sai / Quy tắc vi phạm (Error Handling - TC-03)
 */

const test = require('node:test');
const assert = require('node:assert');
const TicketService = require('../src/backend/services/ticketService');
const { calculateDueDate } = require('../src/backend/utils/slaHelper');

test('Unit Test: TicketService - Lớp nghiệp vụ cốt lõi (Buổi 7)', async (t) => {
  t.beforeEach(() => {
    TicketService.resetStore();
  });

  // =========================================================================
  // LOẠI 1: Luồng đúng (Happy Path)
  // Tiếp nhận thiết bị còn hạn bảo hành thì tạo được phiếu thành công
  // =========================================================================
  await t.test('TC-01 [Luồng đúng]: Tiếp nhận thiết bị còn hạn bảo hành thì tạo được phiếu hợp lệ', () => {
    const ticket = TicketService.createTicket({
      customer_id: 101,
      customer_name: 'Nguyễn Văn A',
      customer_phone: '0901234567',
      product_id: 10,
      product_name: 'iPhone 15 Pro Max',
      serial_no: 'SN-IP15-10293',
      center_id: 2,
      category_id: 1,
      priority: 'CAO',
      sold_at: '2026-03-01',
      warranty_months: 12,
      issue_description: 'Màn hình bị sọc xanh sau khi rơi nhẹ',
    });

    assert.ok(ticket);
    assert.ok(ticket.id);
    assert.ok(ticket.ticket_code.startsWith('BH-'));
    assert.strictEqual(ticket.status, 'MOI');
    assert.strictEqual(ticket.is_warranty, true); // Còn bảo hành
    assert.strictEqual(ticket.priority, 'CAO');
    assert.ok(new Date(ticket.due_date).getTime() > Date.now()); // SLA tính đúng
  });

  // =========================================================================
  // LOẠI 2: Giá trị biên (Boundary Values)
  // Kiểm tra ngày cuối cùng còn hạn bảo hành vs ngày đầu tiên hết hạn (QT-05)
  // và biên tính toán SLA qua ngày nghỉ Chủ Nhật (QT-04)
  // =========================================================================
  await t.test('TC-02 [Giá trị biên]: Ngày cuối cùng còn bảo hành và ngày kế tiếp thì hết hạn (QT-05)', () => {
    // Bán ngày 01/03/2026, bảo hành 12 tháng -> hết hạn ngày 01/03/2027
    const soldAt = '2026-03-01';
    const warrantyMonths = 12;

    // Ngày cuối cùng còn bảo hành: 01/03/2027 -> isUnderWarranty = true
    assert.strictEqual(
      TicketService.isUnderWarranty(soldAt, warrantyMonths, new Date('2027-03-01')),
      true,
      'Ngày cuối cùng của hạn bảo hành (01/03/2027) phải được tính là còn bảo hành'
    );

    // Ngày kế tiếp: 02/03/2027 -> isUnderWarranty = false
    assert.strictEqual(
      TicketService.isUnderWarranty(soldAt, warrantyMonths, new Date('2027-03-02')),
      false,
      'Ngày kế tiếp sau hạn bảo hành (02/03/2027) phải được tính là hết bảo hành'
    );
  });

  await t.test('TC-02b [Giá trị biên SLA]: Biên chuyển tiếp ca làm việc qua Chủ Nhật (QT-04)', () => {
    // Tiếp nhận Thứ Bảy 2026-10-03 lúc 11:00 UTC, mức CAO (24h làm việc)
    // Hệ thống bỏ qua trọn vẹn 24h Chủ Nhật (2026-10-04) và kết thúc vào Thứ Hai 2026-10-05 lúc 11:00 UTC
    const saturday = new Date('2026-10-03T11:00:00Z');
    const dueDate = calculateDueDate(saturday, 'CAO');

    assert.strictEqual(dueDate.getUTCDay(), 1, 'Hạn phải rơi vào Thứ Hai');
    assert.strictEqual(dueDate.getUTCHours(), 11, 'Giờ hẹn phải bảo toàn đúng 11:00');
  });

  // =========================================================================
  // LOẠI 3: Dữ liệu sai / Vi phạm quy tắc nghiệp vụ
  // Một số Serial/IMEI đã có phiếu đang xử lý thì bị từ chối với PHIEU_DANG_MO (QT-09)
  // và vi phạm quy tắc chuyển trạng thái một chiều (QT-06)
  // =========================================================================
  await t.test('TC-03 [Dữ liệu sai]: Serial đã có phiếu đang mở thì bị từ chối với PHIEU_DANG_MO (QT-09)', () => {
    const serial = 'SN-CONFLICT-9999';

    // 1. Tạo phiếu thứ nhất thành công (trạng thái MOI)
    TicketService.createTicket({
      customer_id: 1,
      serial_no: serial,
      product_name: 'iPhone 14 Pro',
      center_id: 1,
      category_id: 2,
      priority: 'CAO',
      issue_description: 'Pin bị phồng kênh màn hình',
    });

    // 2. Cố tình tạo phiếu thứ hai cho cùng số serial khi phiếu cũ chưa đóng -> Phải ném lỗi PHIEU_DANG_MO
    assert.throws(
      () => {
        TicketService.createTicket({
          customer_id: 2,
          serial_no: serial,
          product_name: 'iPhone 14 Pro',
          center_id: 1,
          category_id: 1,
          priority: 'TRUNG_BINH',
          issue_description: 'Tiếp tục báo lỗi vỡ kính màn hình',
        });
      },
      (err) => {
        assert.strictEqual(err.code, 'PHIEU_DANG_MO');
        assert.ok(err.message.includes(serial));
        return true;
      }
    );
  });

  await t.test('TC-03b [Quy tắc vi phạm]: Vòng đời trạng thái một chiều không cho phép quay ngược (QT-06)', () => {
    const ticket = TicketService.createTicket({
      customer_id: 1,
      serial_no: 'SN-TEST-STATE-01',
      product_name: 'Samsung Galaxy S23',
      center_id: 1,
      category_id: 2,
      priority: 'TRUNG_BINH',
      issue_description: 'Nguồn chập chờn khi cắm sạc',
    });

    // Chuyển từ MOI sang DA_PHAN_CONG (hợp lệ)
    TicketService.updateStatus(ticket.id, {
      status: 'DA_PHAN_CONG',
      updated_by: 'NV_KHOI',
      note: 'Phân công kỹ thuật viên kiểm tra',
    });

    // Cố tình chuyển ngược từ DA_PHAN_CONG về MOI (sai quy tắc một chiều)
    assert.throws(
      () => {
        TicketService.updateStatus(ticket.id, {
          status: 'MOI',
          updated_by: 'NV_KHOI',
          note: 'Cố tình quay lại trạng thái Mới',
        });
      },
      (err) => {
        assert.strictEqual(err.code, 'TRANG_THAI_KHONG_HOP_LE');
        return true;
      }
    );
  });
});
