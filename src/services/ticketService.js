const config = require('../config');

// Bộ nhớ lưu trữ dữ liệu mô phỏng trong quá trình phát triển (hoán đổi với Prisma ORM sau)
let tickets = [];
let statusLogs = [];
let ticketCounter = 1000;

class TicketService {
  /**
   * Tạo phiếu bảo hành mới (US1)
   */
  static createTicket(data) {
    ticketCounter += 1;
    const ticketId = `TKT-${ticketCounter}`;
    const now = new Date().toISOString();

    const newTicket = {
      id: ticketId,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      product_name: data.product_name,
      serial_imei: data.serial_imei,
      issue_category_id: data.issue_category_id,
      store_id: data.store_id,
      issue_description: data.issue_description,
      priority: data.priority ? data.priority.toUpperCase() : 'MEDIUM',
      status: config.ticketStatuses.NEW,
      created_at: now,
      updated_at: now,
    };

    tickets.push(newTicket);

    // Ghi nhận bản ghi lịch sử trạng thái đầu tiên (US4)
    statusLogs.push({
      id: statusLogs.length + 1,
      ticket_id: ticketId,
      old_status: null,
      new_status: config.ticketStatuses.NEW,
      updated_by: data.created_by || 'Nhân viên tiếp nhận',
      note: 'Khởi tạo phiếu tiếp nhận bảo hành mới',
      changed_at: now,
    });

    return newTicket;
  }

  /**
   * Xem và lọc danh sách phiếu (US5)
   */
  static getTickets({ status, store_id, limit = 20, offset = 0 } = {}) {
    let result = [...tickets];

    if (status) {
      result = result.filter((t) => t.status === status);
    }
    if (store_id) {
      result = result.filter((t) => t.store_id === store_id);
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
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return null;

    const history = statusLogs.filter((log) => log.ticket_id === ticketId);
    return {
      ...ticket,
      status_history: history,
    };
  }

  /**
   * Phân loại phiếu và cập nhật thông tin sự cố (US3)
   */
  static classifyTicket(ticketId, { issue_category_id, priority, note, updated_by }) {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return null;

    if (issue_category_id) ticket.issue_category_id = issue_category_id;
    if (priority) ticket.priority = priority.toUpperCase();
    ticket.updated_at = new Date().toISOString();

    statusLogs.push({
      id: statusLogs.length + 1,
      ticket_id: ticketId,
      old_status: ticket.status,
      new_status: ticket.status,
      updated_by: updated_by || 'Nhân viên tiếp nhận',
      note: note || `Cập nhật phân loại sự cố: ${issue_category_id}`,
      changed_at: ticket.updated_at,
    });

    return ticket;
  }

  /**
   * Cập nhật trạng thái phiếu và ghi nhận lịch sử (US4)
   */
  static updateStatus(ticketId, { status, updated_by, note }) {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return null;

    const oldStatus = ticket.status;
    ticket.status = status;
    ticket.updated_at = new Date().toISOString();

    statusLogs.push({
      id: statusLogs.length + 1,
      ticket_id: ticketId,
      old_status: oldStatus,
      new_status: status,
      updated_by: updated_by || 'Nhân viên tiếp nhận',
      note: note || `Chuyển trạng thái từ ${oldStatus} sang ${status}`,
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
