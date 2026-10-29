/**
 * TicketService.js — Lớp nghiệp vụ cốt lõi
 *
 * Chứa TOÀN BỘ quy tắc nghiệp vụ (QT-01 đến QT-06).
 * KHÔNG biết công nghệ lưu trữ (SQL, in-memory, hay bất kỳ DB nào).
 * Giao tiếp với tầng dữ liệu duy nhất qua giao diện Repository.
 *
 * Thuộc: LAYERED Pattern — Layer 3 (Business Service Layer)
 */

const config = require('../config');
const { calculateDueDate } = require('../utils/slaHelper');
const { AppError } = require('../errors/AppError');
// Phụ thuộc vào GIAO DIỆN Repository, không phụ thuộc vào cài đặt cụ thể
const ticketRepo = require('../repositories/ticketRepository');
const handoverPhotos = require('../repositories/handoverPhotoStore');

// -------------------------------------------------------------------------
// Danh sách chuyển trạng thái hợp lệ (QT-06 — Vòng đời một chiều)
// -------------------------------------------------------------------------
const VALID_TRANSITIONS = {
  MOI:          ['DA_PHAN_CONG', 'DA_HUY'],
  DA_PHAN_CONG: ['DANG_XU_LY', 'DA_HUY'],
  DANG_XU_LY:  ['CHO_LINH_KIEN', 'HOAN_TAT', 'DA_HUY'],
  CHO_LINH_KIEN: ['DANG_XU_LY', 'HOAN_TAT', 'DA_HUY'],
  HOAN_TAT:    ['DA_BAN_GIAO'],
  DA_BAN_GIAO: [],
  DA_HUY:      [],
};

class TicketService {
  /**
   * QT-05: Kiểm tra thiết bị còn hạn bảo hành hay không
   * Còn bảo hành nếu (now <= expiry), trong đó expiry = soldAt + warrantyMonths
   * @param {string|Date} soldAt - Ngày mua / bán thiết bị
   * @param {number} warrantyMonths - Số tháng bảo hành chính hãng
   * @param {Date} now - Thời điểm đối soát
   * @returns {boolean}
   */
  static isUnderWarranty(soldAt, warrantyMonths = 12, now = new Date()) {
    if (!soldAt) return false;
    if (!Number.isFinite(Number(warrantyMonths)) || Number(warrantyMonths) <= 0) return false;
    const expiry = new Date(soldAt);
    if (Number.isNaN(expiry.getTime())) return false;
    expiry.setMonth(expiry.getMonth() + Number(warrantyMonths));
    expiry.setUTCHours(23, 59, 59, 999);
    return new Date(now) <= expiry;
  }

  /**
   * Tạo phiếu bảo hành mới (US2 / FR2 / QT-04 / QT-05 / QT-06 / QT-09 / NFR3)
   * Toàn bộ quy tắc nghiệp vụ được thi hành TẠI ĐÂY, không ở Controller.
   */
  static createTicket(data) {
    const serial = data.serial_no || data.serial_imei;

    // QT-09: Một số Serial/IMEI không có hai phiếu đang mở cùng lúc
    if (serial) {
      const existing = ticketRepo.findBySerial(serial);
      const openOne = existing.find(
        (t) => !['HOAN_TAT', 'DA_BAN_GIAO', 'DA_HUY', 'DA_DONG'].includes((t.status || '').toUpperCase())
      );
      if (openOne) {
        throw new AppError(
          'PHIEU_DANG_MO',
          `Thiết bị ${serial} đã có phiếu ${openOne.ticket_code || openOne.id} đang xử lý.`
        );
      }
    }

    const counter = ticketRepo.nextCounter();
    const currentYear = new Date().getFullYear();
    const codeSeq = String(counter).padStart(6, '0');
    const ticketCode = `BH-${codeSeq}/${currentYear}`;
    const ticketId = data.id || `TKT-${counter}`;

    const now = new Date();
    const nowIso = now.toISOString();

    // QT-06: Chuẩn hóa Priority về 3 giá trị xác định
    const rawPriority = data.priority ? String(data.priority).toUpperCase() : 'TRUNG_BINH';
    let normalizedPriority = 'TRUNG_BINH';
    if (rawPriority === 'CAO' || rawPriority === 'HIGH' || rawPriority === 'URGENT') {
      normalizedPriority = 'CAO';
    } else if (rawPriority === 'THAP' || rawPriority === 'LOW') {
      normalizedPriority = 'THAP';
    }

    // QT-04: Tự động tính hạn cam kết, loại trừ ngày Chủ Nhật (SLA Engine)
    const dueDateObj = calculateDueDate(now, normalizedPriority);
    const dueDateIso = dueDateObj.toISOString();

    // QT-05: Kiểm tra điều kiện bảo hành nếu có thông tin ngày mua
    let isWarranty = data.is_warranty === true;
    let warrantyVerified = typeof data.is_warranty === 'boolean' && data.warranty_verified !== false;
    if (data.sold_at || data.purchase_date) {
      const soldDate = data.sold_at || data.purchase_date;
      const wMonths = Number(data.warranty_months) || 12;
      isWarranty = TicketService.isUnderWarranty(soldDate, wMonths, now);
      warrantyVerified = true;
    }

    const newTicket = {
      id: ticketId,
      ticket_id: counter,
      ticket_code: ticketCode,
      customer_id: data.customer_id || 1024,
      customer_name: (data.customer_name !== undefined ? String(data.customer_name || '').trim() : (data.customer?.full_name ? String(data.customer.full_name).trim() : '')) || '(không rõ)',
      customer_phone: data.customer_phone || '0901234567',
      customer_address: data.customer_address || data.customerAddress || '',
      product_id: data.product_id || 1,
      product_name: data.product_name || 'Thiết bị điện thoại',
      serial_no: data.serial_no || data.serial_imei || 'IMEI0000000',
      serial_imei: data.serial_imei || data.serial_no || 'IMEI0000000',
      category_id: Number(data.category_id || data.issue_category_id || 1),
      issue_category_id: data.issue_category_id || data.category_id || '1',
      center_id: Number(data.center_id || (data.store_id ? data.store_id.replace(/\D/g, '') : 1) || 1),
      store_id: data.store_id || `STORE_0${data.center_id || 1}`,
      issue_desc: data.issue_description || data.issue_desc || '',
      issue_description: data.issue_description || data.issue_desc || '',
      priority: normalizedPriority,
      // QT-06: Khởi tạo trạng thái ban đầu là MOI
      status: config.ticketStatuses.MOI,
      is_warranty: isWarranty,
      warranty_verified: warrantyVerified,
      received_at: nowIso,
      due_date: dueDateIso,
      closed_at: null,
      created_at: nowIso,
      updated_at: nowIso,
    };

    // Lưu qua Repository (không biết đây là in-memory hay PostgreSQL)
    ticketRepo.save(newTicket);

    // NFR3: Ghi nhận bản ghi lịch sử trạng thái đầu tiên (QT-06 Audit Trail)
    ticketRepo.addStatusLog({
      ticket_id: ticketId,
      from_status: null,
      old_status: null,
      to_status: newTicket.status,
      new_status: newTicket.status,
      changed_by: data.created_by || 'Nhân viên tiếp nhận (NV_KHOI)',
      updated_by: data.created_by || 'Nhân viên tiếp nhận (NV_KHOI)',
      note: 'Khởi tạo phiếu tiếp nhận bảo hành mới tại quầy',
      changed_at: nowIso,
    });

    return newTicket;
  }

  /**
   * Lấy danh sách phiếu có bộ lọc và phân trang (FR6 / US6 / FR7 / US7)
   */
  static getTickets({ status, store_id, center_id, q, page, limit = 50, offset = 0 } = {}) {
    const pageNum = page !== undefined ? Number(page) : Math.floor(offset / limit) + 1;
    return ticketRepo.findAll({ status, center_id, store_id, q }, pageNum, limit);
  }

  /**
   * Xem chi tiết một phiếu kèm lịch sử trạng thái (FR5 / US5)
   */
  static getTicketById(ticketId) {
    const ticket = ticketRepo.findById(ticketId);
    if (!ticket) return null;

    const history = ticketRepo.getStatusLogs(ticket.id);
    return { ...ticket, status_history: history };
  }

  static approveWarrantyException(ticketId, username, note) {
    const ticket = ticketRepo.findById(ticketId);
    if (!ticket) return null;
    if (ticket.status !== 'MOI' || (ticket.is_warranty && ticket.warranty_verified !== false) || ticket.warranty_exception_approved) {
      const err = new AppError('PHE_DUYET_KHONG_HOP_LE', 'Chỉ có thể phê duyệt ngoại lệ bảo hành cho phiếu mới chưa được phê duyệt.');
      err.statusCode = 409;
      throw err;
    }
    const updated = ticketRepo.update(ticketId, { warranty_exception_approved: true });
    ticketRepo.addStatusLog({ ticket_id: ticket.id, from_status: ticket.status, to_status: ticket.status,
      changed_by: username, note: `Phê duyệt ngoại lệ bảo hành: ${note}` });
    return updated;
  }

  static recordServiceConsent(ticketId, username, note) {
    const ticket = ticketRepo.findById(ticketId);
    if (!ticket) return null;
    if (ticket.status !== 'MOI' || (ticket.is_warranty && ticket.warranty_verified !== false) || ticket.service_consent) {
      const err = new AppError('XAC_NHAN_KHONG_HOP_LE', 'Chỉ ghi nhận đồng ý sửa dịch vụ cho phiếu mới chưa có xác nhận.');
      err.statusCode = 409;
      throw err;
    }
    const updated = ticketRepo.update(ticketId, { service_consent: true, service_consent_by: username, service_consent_at: new Date().toISOString() });
    ticketRepo.addStatusLog({ ticket_id: ticket.id, from_status: ticket.status, to_status: ticket.status,
      changed_by: username, note: `Khách đồng ý sửa dịch vụ tính phí: ${note}` });
    return updated;
  }

  /**
   * Phân loại phiếu và cập nhật thông tin sự cố (FR2 / US3)
   */
  static classifyTicket(ticketId, { issue_category_id, category_id, priority, note, updated_by }) {
    const ticket = ticketRepo.findById(ticketId);
    if (!ticket) return null;

    const cat = category_id || issue_category_id;
    const updates = {};

    if (cat) {
      updates.category_id = Number(cat);
      updates.issue_category_id = String(cat);
    }

    if (priority) {
      const pUpper = priority.toUpperCase();
      updates.priority =
        pUpper === 'HIGH' || pUpper === 'CAO' ? 'CAO'
          : pUpper === 'LOW' || pUpper === 'THAP' ? 'THAP'
          : 'TRUNG_BINH';
      // QT-04: Tính lại SLA khi đổi mức ưu tiên
      updates.due_date = calculateDueDate(ticket.received_at, updates.priority).toISOString();
    }

    const updatedTicket = ticketRepo.update(ticketId, updates);

    ticketRepo.addStatusLog({
      ticket_id: ticket.id,
      from_status: ticket.status,
      old_status: ticket.status,
      to_status: ticket.status,
      new_status: ticket.status,
      changed_by: updated_by || 'Nhân viên tiếp nhận',
      updated_by: updated_by || 'Nhân viên tiếp nhận',
      note: note || `Cập nhật phân loại sự cố: ${cat || ''}`,
    });

    return updatedTicket;
  }

  /**
   * Cập nhật trạng thái phiếu và ghi nhật ký (FR3 / US3 / QT-06 / NFR3)
   * QT-06: Kiểm tra vòng đời trạng thái một chiều tại ĐÂY (tầng nghiệp vụ)
   */
  static updateStatus(ticketId, { status, updated_by, note }) {
    const ticket = ticketRepo.findById(ticketId);
    if (!ticket) return null;

    const oldStatus = ticket.status.toUpperCase();
    const targetStatus = (config.ticketStatuses[status.toUpperCase()] || status).toUpperCase();

    // QT-06: Xác thực chuyển trạng thái một chiều — NGHIỆP VỤ NẰM Ở ĐÂY
    const allowed = VALID_TRANSITIONS[oldStatus] || [];
    if (!allowed.includes(targetStatus)) {
      const err = new AppError(
        'TRANG_THAI_KHONG_HOP_LE',
        `Quy tắc vòng đời trạng thái là một chiều: không thể chuyển từ ${oldStatus} sang ${targetStatus}.`
      );
      err.statusCode = 400;
      throw err;
    }

    if (targetStatus === 'DA_PHAN_CONG' && (!ticket.is_warranty || ticket.warranty_verified === false) && !ticket.warranty_exception_approved && !ticket.service_consent) {
      const err = new AppError('CHUA_PHE_DUYET_BAO_HANH', 'Cần quản lý phê duyệt ngoại lệ hoặc ghi nhận khách đồng ý sửa dịch vụ trước khi phân công.');
      err.statusCode = 409;
      throw err;
    }
    if (targetStatus === 'DA_BAN_GIAO' && !handoverPhotos.has(ticket)) {
      const err = new AppError('THIEU_ANH_BAN_GIAO', 'Vui lòng thêm ảnh xác nhận trước khi bàn giao thiết bị.');
      err.statusCode = 409;
      throw err;
    }

    const updates = { status: targetStatus };
    if (targetStatus === 'HOAN_TAT' || targetStatus === 'DA_DONG') {
      updates.closed_at = new Date().toISOString();
    }

    const updatedTicket = ticketRepo.update(ticketId, updates);

    // NFR3: Ghi nhật ký trong cùng giao dịch (prototype: gọi tuần tự)
    ticketRepo.addStatusLog({
      ticket_id: ticket.id,
      from_status: oldStatus,
      old_status: oldStatus,
      to_status: targetStatus,
      new_status: targetStatus,
      changed_by: updated_by || 'Nhân viên tiếp nhận',
      updated_by: updated_by || 'Nhân viên tiếp nhận',
      note: note || `Chuyển trạng thái từ ${oldStatus} sang ${targetStatus}`,
    });

    return updatedTicket;
  }

  /**
   * Reset store — chỉ dùng trong bộ kiểm thử
   */
  static resetStore() {
    ticketRepo.reset();
  }
}

module.exports = TicketService;
