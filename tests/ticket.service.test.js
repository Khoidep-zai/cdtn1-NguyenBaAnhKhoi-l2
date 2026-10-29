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
    assert.strictEqual(
      TicketService.isUnderWarranty(soldAt, warrantyMonths, new Date('2027-03-01T23:59:59.999Z')),
      true,
      'Thiết bị vẫn còn hạn đến hết ngày cuối cùng'
    );
    assert.strictEqual(
      TicketService.isUnderWarranty(soldAt, warrantyMonths, new Date('2027-03-02T00:00:00Z')),
      false,
      'Thiết bị hết hạn từ ngày tiếp theo'
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

  await t.test('QT-04: Dùng giờ Việt Nam và giữ chính xác phút qua Chủ Nhật', () => {
    // 23:30 thứ Bảy giờ Việt Nam: 30 phút trước Chủ Nhật, sau đó thêm 23h30 thứ Hai.
    assert.equal(calculateDueDate('2026-10-03T16:30:00Z', 'CAO').toISOString(), '2026-10-05T16:30:00.000Z');
    assert.equal(calculateDueDate('2026-10-04T03:15:00Z', 'CAO').toISOString(), '2026-10-05T17:00:00.000Z');
  });

  // =========================================================================
  // LOẠI 3: Dữ liệu sai / Vi phạm quy tắc nghiệp vụ
  // Một số Serial/IMEI đã có phiếu đang xử lý thì bị từ chối với PHIEU_DANG_MO (QT-09)
  // và vi phạm quy tắc chuyển trạng thái một chiều (QT-06)
  // =========================================================================
  await t.test('TC-03 [Dữ liệu sai]: Serial đã có phiếu đang mở thì bị từ chối với PHIEU_DANG_MO (QT-09)', () => {
    const serial = 'SN-CONFLICT-9999';

    // 1. Tạo phiếu thứ nhất thành công (trạng thái MOI)
    const firstTicket = TicketService.createTicket({
      customer_id: 1,
      serial_no: serial,
      product_name: 'iPhone 14 Pro',
      center_id: 1,
      category_id: 2,
      priority: 'CAO',
      issue_description: 'Pin bị phồng kênh màn hình',
    });
    assert.strictEqual(firstTicket.is_warranty, false);
    assert.strictEqual(firstTicket.warranty_verified, false);

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
      is_warranty: true,
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

  await t.test('QT-05: Chặn phân công cho đến khi ngoại lệ được phê duyệt', () => {
    const ticket = TicketService.createTicket({ serial_no: 'TEST-WARRANTY-APPROVAL', issue_description: 'Màn hình không hoạt động' });
    assert.throws(() => TicketService.updateStatus(ticket.id, { status: 'DA_PHAN_CONG' }), { code: 'CHUA_PHE_DUYET_BAO_HANH' });
    TicketService.approveWarrantyException(ticket.id, 'manager', 'Khách đồng ý sửa dịch vụ');
    assert.strictEqual(TicketService.updateStatus(ticket.id, { status: 'DA_PHAN_CONG' }).status, 'DA_PHAN_CONG');
    assert.ok(TicketService.getTicketById(ticket.id).status_history.some(log => log.changed_by === 'manager' && log.note.includes('Phê duyệt')));
  });

  await t.test('QT-05: Khách đồng ý sửa dịch vụ cho phép phân công và có nhật ký', () => {
    const ticket = TicketService.createTicket({ serial_no: 'TEST-SERVICE-CONSENT', issue_description: 'Màn hình không hoạt động' });
    assert.throws(() => TicketService.updateStatus(ticket.id, { status: 'DA_PHAN_CONG' }), { code: 'CHUA_PHE_DUYET_BAO_HANH' });
    TicketService.recordServiceConsent(ticket.id, 'staff', 'Đã giải thích dịch vụ tính phí và khách đồng ý');
    assert.strictEqual(TicketService.updateStatus(ticket.id, { status: 'DA_PHAN_CONG' }).status, 'DA_PHAN_CONG');
    assert.ok(TicketService.getTicketById(ticket.id).status_history.some(log => log.changed_by === 'staff' && log.note.includes('đồng ý')));
  });

  await t.test('QT-06: Hoàn thành rồi bàn giao; không cho nhảy bước hoặc quay ngược', () => {
    const ticket = TicketService.createTicket({ serial_no: 'TEST-HANDOVER-001', is_warranty: true, issue_description: 'Kiểm tra thiết bị' });
    TicketService.updateStatus(ticket.id, { status: 'DA_PHAN_CONG', updated_by: 'staff' });
    assert.throws(() => TicketService.updateStatus(ticket.id, { status: 'DA_BAN_GIAO', updated_by: 'staff' }), { code: 'TRANG_THAI_KHONG_HOP_LE' });
    TicketService.updateStatus(ticket.id, { status: 'DANG_XU_LY', updated_by: 'staff' });
    TicketService.updateStatus(ticket.id, { status: 'HOAN_TAT', updated_by: 'staff' });
    const closedAt = TicketService.getTicketById(ticket.id).closed_at;
    assert.throws(() => TicketService.updateStatus(ticket.id, { status: 'DA_BAN_GIAO', updated_by: 'staff' }), { code: 'THIEU_ANH_BAN_GIAO' });
    require('../src/backend/repositories/handoverPhotoStore').set(ticket, { type: 'image/png', bytes: Buffer.from('test') });
    const delivered = TicketService.updateStatus(ticket.id, { status: 'DA_BAN_GIAO', updated_by: 'staff' });
    assert.equal(delivered.status, 'DA_BAN_GIAO');
    assert.equal(delivered.closed_at, closedAt);
    assert.throws(() => TicketService.updateStatus(ticket.id, { status: 'DANG_XU_LY', updated_by: 'staff' }), { code: 'TRANG_THAI_KHONG_HOP_LE' });
    assert.equal(TicketService.getTicketById(ticket.id).status_history.at(-1).to_status, 'DA_BAN_GIAO');
    assert.ok(TicketService.createTicket({ serial_no: 'TEST-HANDOVER-001' }));
  });

  await t.test('Danh sách tìm tên không dấu và thống kê theo chi nhánh, không theo trang', () => {
    const before = TicketService.getTickets({ center_id: 1, limit: 1 }).summary;
    const ticket = TicketService.createTicket({ customer_name: 'Nguyễn Bá Anh Khôi', customer_phone: '0901234567',
      serial_no: 'SUMMARY-TEST-01', center_id: 1, issue_description: 'Kiểm tra sự cố thiết bị', priority: 'CAO' });
    TicketService.createTicket({ customer_name: 'Khách chi nhánh khác', serial_no: 'SUMMARY-TEST-02',
      center_id: 2, issue_description: 'Kiểm tra sự cố thiết bị', priority: 'CAO' });
    const found = TicketService.getTickets({ center_id: 1, q: 'nguyen ba anh khoi', limit: 1 });
    assert.equal(found.data.some(row => row.id === ticket.id), true);
    assert.equal(TicketService.getTickets({ center_id: 1, q: 'khoi nguyen' }).data.some(row => row.id === ticket.id), true);
    assert.equal(found.summary.total, before.total + 1);
    assert.equal(found.summary.new, before.new + 1);
    assert.equal(found.summary.urgent, before.urgent + 1);
    assert.deepEqual(TicketService.getTickets({ center_id: 1, status: 'DA_HUY', q: 'không tồn tại', limit: 1 }).summary, found.summary);
  });

  // =========================================================================
  // TEST HỒI QUY (Regression Test - Chuẩn Buổi 11 SE)
  // Xác nhận lỗi BUG-004: Khách hàng thiếu họ tên vẫn tạo được phiếu với tenKhach = '(không rõ)'
  // =========================================================================
  await t.test('TC-04 [Hồi quy - BUG-004]: Tạo phiếu thành công khi khách hàng thiếu họ tên (dùng mặc định "(không rõ)")', () => {
    const ticket = TicketService.createTicket({
      customer_id: 1024,
      customer_name: null,
      customer: { id: 1024, full_name: null },
      product_name: 'iPhone 13 Pro',
      serial_no: 'SN-TEST-NULLNAME-99',
      center_id: 1,
      category_id: 1,
      issue_description: 'Máy sạc không vào điện',
    });

    assert.ok(ticket);
    assert.strictEqual(ticket.customer_name, '(không rõ)', 'customer_name phải là "(không rõ)" để giữ hợp đồng ranh giới');
    assert.ok(ticket.ticket_code.startsWith('BH-'), 'Mã phiếu phải có định dạng BH-xxxxxx/yyyy');
  });
});
