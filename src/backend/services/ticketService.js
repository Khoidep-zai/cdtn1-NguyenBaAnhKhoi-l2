const config = require('../config');
const dataLoader = require('../data/dataLoader');
const { calculateDueDate } = require('../utils/slaHelper');

// Bộ nhớ lưu trữ dữ liệu mô phỏng
let tickets = [];
let statusLogs = [];
let ticketCounter = 1000;

class TicketService {
  /**
   * Khởi tạo dữ liệu từ dataset nếu danh sách đang rỗng
   */
  static initFromDataset() {
    if (tickets.length === 0 && dataLoader.tickets.length > 0) {
      tickets = [...dataLoader.tickets];
      ticketCounter = 1000 + tickets.length;
    }
  }

  /**
   * Tạo phiếu bảo hành mới (US1 / US2 / FR2 / QT-04)
   */
  static createTicket(data) {
    TicketService.initFromDataset();
    ticketCounter += 1;

    const currentYear = new Date().getFullYear();
    const codeSeq = String(ticketCounter).padStart(6, '0');
    const ticketCode = `BH-${codeSeq}/${currentYear}`;
    // Hỗ trợ cả mã TKT- cho test cũ và BH- chuẩn dataset
    const ticketId = data.id || `TKT-${ticketCounter}`;

    const now = new Date();
    const nowIso = now.toISOString();

    // Chuẩn hóa Priority
    const rawPriority = data.priority ? String(data.priority).toUpperCase() : 'TRUNG_BINH';
    let normalizedPriority = 'TRUNG_BINH';
    if (rawPriority === 'CAO' || rawPriority === 'HIGH' || rawPriority === 'URGENT') {
      normalizedPriority = 'CAO';
    } else if (rawPriority === 'THAP' || rawPriority === 'LOW') {
      normalizedPriority = 'THAP';
    }

    // Tự động tính toán hạn cam kết theo quy tắc ngày làm việc QT-04 (loại trừ Chủ Nhật)
    const dueDateObj = calculateDueDate(now, normalizedPriority);
    const dueDateIso = dueDateObj.toISOString();

    // Chuẩn hóa status
    const initialStatus = config.ticketStatuses.MOI;

    const newTicket = {
      id: ticketId,
      ticket_id: ticketCounter,
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
      status: initialStatus,
      is_warranty: data.is_warranty !== undefined ? Boolean(data.is_warranty) : true,
      received_at: nowIso,
      due_date: dueDateIso,
      closed_at: null,
      created_at: nowIso,
      updated_at: nowIso,
    };

    tickets.unshift(newTicket);

    // Ghi nhận bản ghi lịch sử trạng thái đầu tiên (US4 / FR4 / QT-06)
    statusLogs.push({
      log_id: statusLogs.length + 1,
      id: statusLogs.length + 1,
      ticket_id: ticketId,
      from_status: null,
      old_status: null,
      to_status: initialStatus,
      new_status: initialStatus,
      changed_by: data.created_by || 'Nhân viên tiếp nhận (NV_KHOI)',
      updated_by: data.created_by || 'Nhân viên tiếp nhận (NV_KHOI)',
      note: 'Khởi tạo phiếu tiếp nhận bảo hành mới tại quầy',
      changed_at: nowIso,
    });

    return newTicket;
  }

  /**
   * Xem và lọc danh sách phiếu (US5 / FR5 / US6)
   */
  static getTickets({ status, store_id, center_id, q, limit = 50, offset = 0 } = {}) {
    TicketService.initFromDataset();
    let result = [...tickets];

    if (status) {
      const normStatus = (config.ticketStatuses[status.toUpperCase()] || status).toUpperCase();
      result = result.filter((t) => t.status.toUpperCase() === normStatus || t.status.toUpperCase() === status.toUpperCase());
    }

    if (center_id) {
      result = result.filter((t) => Number(t.center_id) === Number(center_id));
    } else if (store_id) {
      result = result.filter((t) => t.store_id === store_id || String(t.center_id) === String(store_id).replace(/\D/g, ''));
    }

    if (q) {
      const query = q.toLowerCase().trim();
      result = result.filter((t) => 
        (t.ticket_code && t.ticket_code.toLowerCase().includes(query)) ||
        (t.id && t.id.toLowerCase().includes(query)) ||
        (t.customer_name && t.customer_name.toLowerCase().includes(query)) ||
        (t.customer_phone && t.customer_phone.includes(query)) ||
        (t.serial_no && t.serial_no.toLowerCase().includes(query))
      );
    }

    const total = result.length;
    const paginated = result.slice(Number(offset), Number(offset) + Number(limit));

    return {
      total,
      limit: Number(limit),
      offset: Number(offset),
      data: paginated,
    };
  }

  /**
   * Xem chi tiết một phiếu bảo hành kèm lịch sử trạng thái (US7)
   */
  static getTicketById(ticketId) {
    TicketService.initFromDataset();
    const ticket = tickets.find((t) => t.id === ticketId || t.ticket_code === ticketId || String(t.ticket_id) === String(ticketId));
    if (!ticket) return null;

    const history = statusLogs.filter((log) => log.ticket_id === ticket.id || log.ticket_id === ticket.ticket_code);
    return {
      ...ticket,
      status_history: history,
    };
  }

  /**
   * Phân loại phiếu và cập nhật thông tin sự cố (US3)
   */
  static classifyTicket(ticketId, { issue_category_id, category_id, priority, note, updated_by }) {
    TicketService.initFromDataset();
    const ticket = tickets.find((t) => t.id === ticketId || t.ticket_code === ticketId || String(t.ticket_id) === String(ticketId));
    if (!ticket) return null;

    const cat = category_id || issue_category_id;
    if (cat) {
      ticket.category_id = Number(cat);
      ticket.issue_category_id = String(cat);
    }

    if (priority) {
      const pUpper = priority.toUpperCase();
      ticket.priority = pUpper === 'HIGH' || pUpper === 'CAO' ? 'CAO' : pUpper === 'LOW' || pUpper === 'THAP' ? 'THAP' : 'TRUNG_BINH';
      // Tính lại SLA
      ticket.due_date = calculateDueDate(ticket.received_at, ticket.priority).toISOString();
    }

    ticket.updated_at = new Date().toISOString();

    statusLogs.push({
      log_id: statusLogs.length + 1,
      id: statusLogs.length + 1,
      ticket_id: ticket.id,
      from_status: ticket.status,
      old_status: ticket.status,
      to_status: ticket.status,
      new_status: ticket.status,
      changed_by: updated_by || 'Nhân viên tiếp nhận',
      updated_by: updated_by || 'Nhân viên tiếp nhận',
      note: note || `Cập nhật phân loại sự cố: ${cat || ''}`,
      changed_at: ticket.updated_at,
    });

    return ticket;
  }

  /**
   * Cập nhật trạng thái phiếu và ghi nhận nhật ký (US4 / FR4 / QT-06)
   */
  static updateStatus(ticketId, { status, updated_by, note }) {
    TicketService.initFromDataset();
    const ticket = tickets.find((t) => t.id === ticketId || t.ticket_code === ticketId || String(t.ticket_id) === String(ticketId));
    if (!ticket) return null;

    const oldStatus = ticket.status;
    const targetStatus = (config.ticketStatuses[status.toUpperCase()] || status).toUpperCase();

    ticket.status = targetStatus;
    ticket.updated_at = new Date().toISOString();

    if (targetStatus === 'HOAN_TAT' || targetStatus === 'DA_DONG' || targetStatus === 'COMPLETED') {
      ticket.closed_at = ticket.updated_at;
    }

    statusLogs.push({
      log_id: statusLogs.length + 1,
      id: statusLogs.length + 1,
      ticket_id: ticket.id,
      from_status: oldStatus,
      old_status: oldStatus,
      to_status: targetStatus,
      new_status: targetStatus,
      changed_by: updated_by || 'Nhân viên tiếp nhận',
      updated_by: updated_by || 'Nhân viên tiếp nhận',
      note: note || `Chuyển trạng thái từ ${oldStatus} sang ${targetStatus}`,
      changed_at: ticket.updated_at,
    });

    return ticket;
  }

  /**
   * Reset store phục vụ testing
   */
  static resetStore() {
    tickets = [];
    statusLogs = [];
    ticketCounter = 1000;
  }
}

module.exports = TicketService;
