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
// Phụ thuộc vào GIAO DIỆN Repository, không phụ thuộc vào cài đặt cụ thể
const ticketRepo = require('../repositories/ticketRepository');

// -------------------------------------------------------------------------
// Danh sách chuyển trạng thái hợp lệ (QT-06 — Vòng đời một chiều)
// -------------------------------------------------------------------------
const VALID_TRANSITIONS = {
  MOI:          ['DA_PHAN_CONG', 'DA_HUY'],
  DA_PHAN_CONG: ['DANG_XU_LY', 'DA_HUY'],
  DANG_XU_LY:  ['CHO_LINH_KIEN', 'HOAN_TAT', 'DA_HUY'],
  CHO_LINH_KIEN: ['DANG_XU_LY', 'HOAN_TAT', 'DA_HUY'],
  HOAN_TAT:    [],
  DA_HUY:      [],
};

class TicketService {
  /**
   * Tạo phiếu bảo hành mới (US2 / FR2 / QT-04 / QT-06 / NFR3)
   * Toàn bộ quy tắc nghiệp vụ được thi hành TẠI ĐÂY, không ở Controller.
   */
  static createTicket(data) {
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

    const newTicket = {
      id: ticketId,
      ticket_id: counter,
      ticket_code: ticketCode,
      customer_id: data.customer_id || 1024,
      customer_name: data.customer_name || 'Khách hàng',
      customer_phone: data.customer_phone || '0901234567',
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
      is_warranty: data.is_warranty !== undefined ? Boolean(data.is_warranty) : true,
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
      const err = new Error(
        `Quy tắc vòng đời trạng thái là một chiều: không thể chuyển từ ${oldStatus} sang ${targetStatus}.`
      );
      err.statusCode = 400;
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
