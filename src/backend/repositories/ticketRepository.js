/**
 * ticketRepository.js — Cài đặt Repository lưu trữ In-Memory
 *
 * Mục đích: Hiện thực hóa giao diện ITicketRepository cho prototype.
 * Lớp Service chỉ gọi các phương thức trong giao diện ITicketRepository,
 * KHÔNG biết rằng đây là bản in-memory hay PostgreSQL thực.
 *
 * Để nâng lên PostgreSQL thật: Tạo PgTicketRepository.js cài đặt
 * cùng giao diện ITicketRepository với SQL thay vì mảng.
 *
 * Thuộc: REPOSITORY Pattern — Layer 4 (Data Access & Persistence)
 */

const ITicketRepository = require('./ITicketRepository');
const dataLoader = require('../data/dataLoader');

function normalizeSearch(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().trim();
}

class TicketRepository extends ITicketRepository {
  constructor() {
    super();
    // Kho lưu trữ in-memory (prototype)
    this._tickets = [];
    this._statusLogs = [];
    this._counter = 1000;
    this._initialized = false;
  }

  /**
   * Khởi tạo từ dataset nếu chưa có dữ liệu
   * @private
   */
  _ensureInit() {
    if (!this._initialized && dataLoader.tickets && dataLoader.tickets.length > 0) {
      this._tickets = [...dataLoader.tickets];
      this._counter = 1000 + this._tickets.length;
      this._initialized = true;
    }
  }

  /**
   * Tìm phiếu theo ID (hỗ trợ id, ticket_code, ticket_id)
   */
  findById(ticketId) {
    this._ensureInit();
    return this._tickets.find(
      (t) => t.id === ticketId || t.ticket_code === ticketId || String(t.ticket_id) === String(ticketId)
    ) || null;
  }

  /**
   * Tìm danh sách phiếu theo số serial / IMEI (QT-09)
   * @param {string} serialNo
   * @returns {object[]}
   */
  findBySerial(serialNo) {
    this._ensureInit();
    if (!serialNo) return [];
    const sn = String(serialNo).trim().toLowerCase();
    return this._tickets.filter(
      (t) =>
        (t.serial_no && t.serial_no.toLowerCase() === sn) ||
        (t.serial_imei && t.serial_imei.toLowerCase() === sn)
    );
  }

  /**
   * Lấy danh sách phiếu với bộ lọc và phân trang (FR6, FR7, US6, US7)
   */
  findAll(filters = {}, page = 1, limit = 50) {
    this._ensureInit();
    const offset = (page - 1) * limit;
    const { status, center_id, store_id, q, overdue } = filters;

    let result = [...this._tickets];

    if (center_id && center_id !== 'ALL') {
      result = result.filter((t) => Number(t.center_id) === Number(center_id));
    } else if (store_id && store_id !== 'ALL') {
      result = result.filter(
        (t) => t.store_id === store_id || String(t.center_id) === String(store_id).replace(/\D/g, '')
      );
    }

    // Các ô thống kê phản ánh toàn bộ phạm vi chi nhánh, không chỉ trang hoặc bộ lọc tìm kiếm.
    const nowMs = Date.now();
    const summary = { total: result.length, new: 0, processing: 0, urgent: 0 };
    for (const ticket of result) {
      const st = String(ticket.status || '').toUpperCase();
      const active = !['HOAN_TAT', 'DA_BAN_GIAO', 'DA_DONG', 'DA_HUY'].includes(st);
      if (st === 'MOI') summary.new++;
      if (['DA_PHAN_CONG', 'DANG_XU_LY', 'CHO_LINH_KIEN'].includes(st)) summary.processing++;
      if (active && (String(ticket.priority || '').toUpperCase() === 'CAO' || (ticket.due_date && new Date(ticket.due_date).getTime() < nowMs))) summary.urgent++;
    }

    if (status && status !== 'ALL') {
      const normStatus = status.toUpperCase();
      result = result.filter((t) => t.status && t.status.toUpperCase() === normStatus);
    }

    if (overdue === true || overdue === 'true') {
      const now = new Date();
      result = result.filter(
        (t) => !['HOAN_TAT', 'DA_BAN_GIAO', 'DA_DONG', 'DA_HUY'].includes(t.status) && new Date(t.due_date) < now
      );
    }

    if (q) {
      const terms = normalizeSearch(q).split(/\s+/).filter(Boolean);
      result = result.filter(
        (t) => {
          const fields = [t.ticket_code, t.id, t.customer_name, t.customer_phone, t.serial_no, t.product_name, t.issue_description].map(normalizeSearch);
          return terms.every((term) => fields.some((value) => value.includes(term)));
        }
      );
    }

    const total = result.length;
    const limitNum = limit === 'all' ? total : (Number(limit) || 50);
    const pageNum = Math.max(1, Number(page) || 1);
    const offsetNum = (pageNum - 1) * limitNum;
    const data = result.slice(offsetNum, offsetNum + limitNum);

    return { data, total, summary, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) || 1, offset: offsetNum };
  }

  /**
   * Lưu phiếu mới vào kho dữ liệu (FR2, US2)
   */
  save(ticket) {
    this._ensureInit();
    this._tickets.unshift(ticket);
    return ticket;
  }

  /**
   * Cập nhật phiếu đã có (FR3, US3)
   */
  update(ticketId, updates) {
    this._ensureInit();
    const ticket = this.findById(ticketId);
    if (!ticket) return null;
    Object.assign(ticket, updates, { updated_at: new Date().toISOString() });
    return ticket;
  }

  /**
   * Thêm bản ghi lịch sử trạng thái (FR5, US5, QT-06 Audit Trail, NFR3)
   */
  addStatusLog(logEntry) {
    const newLog = {
      log_id: this._statusLogs.length + 1,
      id: this._statusLogs.length + 1,
      ...logEntry,
      changed_at: logEntry.changed_at || new Date().toISOString(),
    };
    this._statusLogs.push(newLog);
    return newLog;
  }

  /**
   * Lấy toàn bộ lịch sử trạng thái của một phiếu theo thứ tự thời gian
   */
  getStatusLogs(ticketId) {
    return this._statusLogs
      .filter((log) => log.ticket_id === ticketId || log.ticket_id === String(ticketId))
      .sort((a, b) => new Date(a.changed_at) - new Date(b.changed_at));
  }

  /**
   * Tăng bộ đếm phiếu (để sinh ticket_code BH-xxxxxx/yyyy)
   */
  nextCounter() {
    this._counter += 1;
    return this._counter;
  }

  /**
   * Reset toàn bộ kho lưu trữ — chỉ dùng trong bộ kiểm thử
   */
  reset() {
    this._tickets = [];
    this._statusLogs = [];
    this._counter = 1000;
    this._initialized = false;
  }
}

// Singleton instance — toàn bộ ứng dụng dùng chung 1 repository
const ticketRepository = new TicketRepository();
module.exports = ticketRepository;
