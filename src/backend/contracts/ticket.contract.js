/**
 * src/backend/contracts/ticket.contract.js — Hợp đồng dữ liệu ranh giới (Buổi 9 SE - D1)
 *
 * HỢP ĐỒNG: một phiếu bảo hành trả ra từ lớp nghiệp vụ (Service) cho lớp trình bày (Controller/UI).
 * 
 * 1. HÌNH DẠNG (SHAPE):
 *    - ticket_code   : string (VD: 'BH-000001/2026'), bắt buộc, duy nhất
 *    - customer_name : string, bắt buộc
 *    - customer_address: string, địa chỉ liên hệ khách hàng (có thể rỗng)
 *    - customer_phone: string, bắt buộc, đã che một phần theo quy chuẩn QT-15 bảo mật PII
 *    - product_name  : string, bắt buộc
 *    - serial_imei   : string, bắt buộc (serial_no)
 *    - issue_name    : string, tên nhóm sự cố kỹ thuật
 *    - status        : string, thuộc tập ['MOI', 'DA_PHAN_CONG', 'DANG_XU_LY', 'CHO_LINH_KIEN', 'HOAN_TAT', 'DA_HUY']
 *    - due_date      : chuỗi ISO 8601 kèm múi giờ, luôn có (tính theo SLA QT-04)
 *    - technician    : string (họ tên KTV) HOẶC null nếu chưa phân công
 *    - notes         : string hoặc null
 *    - status_logs   : mảng danh sách lịch sử trạng thái audit trail
 *
 * 2. Ý NGHĨA (MEANING):
 *    - due_date: Thời hạn tối đa trung tâm phải hoàn tất xử lý cho khách hàng, đã loại trừ ngày Chủ Nhật (QT-04).
 *    - status_logs: Lịch sử audit trail ghi rõ thời điểm và người chuyển trạng thái.
 *
 * 3. HÀNH VI KHI SAI (ERROR BEHAVIOR):
 *    - Không tìm thấy phiếu -> ném AppError('KHONG_TIM_THAY_PHIEU', 'Không tìm thấy phiếu bảo hành yêu cầu') (Controller trả 404).
 *    - Dữ liệu đầu vào thiếu trường bắt buộc -> ném AppError('DU_LIEU_KHONG_HOP_LE', ...) (Controller trả 400).
 *    - Vi phạm quy tắc tạo phiếu trùng Serial -> ném AppError('PHIEU_DANG_MO', ...) (Controller trả 409).
 */

const { AppError } = require('../errors/AppError');

/**
 * Che số điện thoại bảo mật thông tin cá nhân khách hàng (QT-15)
 * Ví dụ: "0901234567" -> "090****567"
 */
function maskPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const clean = phone.trim();
  if (clean.length < 7) return clean;
  const start = clean.slice(0, 3);
  const end = clean.slice(-3);
  return `${start}****${end}`;
}

/**
 * Chuẩn hóa đối tượng phiếu bảo hành theo hợp đồng dữ liệu chuẩn
 */
function formatTicketContract(ticket) {
  if (!ticket) {
    throw new AppError('KHONG_TIM_THAY_PHIEU', 'Không tìm thấy phiếu bảo hành yêu cầu');
  }

  const rawDueDate = ticket.due_date || ticket.han_cam_ket || ticket.dueDate;
  let isoDueDate = '';
  if (rawDueDate) {
    const d = new Date(rawDueDate);
    isoDueDate = !isNaN(d.getTime()) ? d.toISOString() : String(rawDueDate);
  }

  const safeCustomerName = (ticket.customer_name ?? ticket.customerName ?? ticket.customer?.full_name ?? '').trim() || '(không rõ)';

  return {
    ticket_code: ticket.ticket_code || ticket.ticketCode || ticket.id || '',
    ticketCode: ticket.ticket_code || ticket.ticketCode || ticket.id || '',
    customer_name: safeCustomerName,
    tenKhach: safeCustomerName,
    customer_address: ticket.customer_address || ticket.customerAddress || ticket.address || '',
    customer_phone_masked: maskPhoneNumber(ticket.customer_phone || ticket.customerPhone || ''),
    customer_phone_raw: ticket.customer_phone || ticket.customerPhone || '',
    product_name: ticket.product_name || ticket.productName || '',
    serial_imei: ticket.serial_imei || ticket.serial_no || ticket.serialNo || '',
    category_id: ticket.category_id || ticket.issue_category_id || null,
    issue_name: ticket.category_name || ticket.issue_name || ticket.issueName || 'Sự cố kỹ thuật',
    status: ticket.status || 'MOI',
    priority: ticket.priority || 'TRUNG_BINH',
    due_date: isoDueDate,
    technician: ticket.technician_name || ticket.technician || null,
    center_id: ticket.center_id || null,
    status_logs: Array.isArray(ticket.status_logs) ? ticket.status_logs : [],
  };
}

/**
 * toTicketView — Chuẩn hóa view phiếu bảo hành ra ranh giới (chuẩn Buổi 11 SE)
 */
function toTicketView(ticket) {
  return formatTicketContract(ticket);
}

/**
 * Kiểm chứng tính hợp lệ của đối tượng phiếu bảo hành với hợp đồng
 */
function validateTicketContract(ticket) {
  const errors = [];
  if (!ticket.ticket_code) errors.push('Thiếu trường bắt buộc: ticket_code');
  if (!ticket.customer_name) errors.push('Thiếu trường bắt buộc: customer_name');
  if (!ticket.serial_imei) errors.push('Thiếu trường bắt buộc: serial_imei');
  if (!ticket.due_date) errors.push('Thiếu trường bắt buộc: due_date');
  if (ticket.due_date && isNaN(new Date(ticket.due_date).getTime())) {
    errors.push('Trường due_date không đúng định dạng ngày ISO 8601');
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  maskPhoneNumber,
  formatTicketContract,
  validateTicketContract,
  toTicketView,
};
