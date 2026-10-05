/**
 * ITicketRepository — Giao diện Repository trừu tượng
 * Lớp Service chỉ phụ thuộc vào giao diện này, không biết cài đặt cụ thể.
 * Nguyên tắc: Bước 3 trong kiến trúc phân lớp (Layer 3 → Layer 4)
 *
 * Mọi lớp Repository cụ thể (PgTicketRepository, MemTicketRepository...)
 * đều phải cài đặt đầy đủ các phương thức định nghĩa tại đây.
 */
class ITicketRepository {
  /**
   * Tìm phiếu theo ID
   * @param {string|number} ticketId
   * @returns {object|null}
   */
  findById(ticketId) { throw new Error('Not implemented'); }

  /**
   * Lấy danh sách phiếu với bộ lọc và phân trang
   * @param {object} filters - { status, center_id, overdue }
   * @param {number} page
   * @param {number} limit
   * @returns {{ data: object[], total: number }}
   */
  findAll(filters, page, limit) { throw new Error('Not implemented'); }

  /**
   * Lưu phiếu mới vào kho dữ liệu
   * @param {object} ticket
   * @returns {object} phiếu đã lưu (có id)
   */
  save(ticket) { throw new Error('Not implemented'); }

  /**
   * Cập nhật phiếu đã có
   * @param {string|number} ticketId
   * @param {object} updates
   * @returns {object|null}
   */
  update(ticketId, updates) { throw new Error('Not implemented'); }

  /**
   * Thêm bản ghi lịch sử trạng thái (QT-06 Audit Trail)
   * @param {object} logEntry - { ticket_id, from_status, to_status, changed_by, note }
   * @returns {object}
   */
  addStatusLog(logEntry) { throw new Error('Not implemented'); }

  /**
   * Lấy toàn bộ lịch sử trạng thái của một phiếu
   * @param {string|number} ticketId
   * @returns {object[]}
   */
  getStatusLogs(ticketId) { throw new Error('Not implemented'); }
}

module.exports = ITicketRepository;
