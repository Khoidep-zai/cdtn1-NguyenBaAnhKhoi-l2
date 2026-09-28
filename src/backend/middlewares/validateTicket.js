const config = require('../config');
const { isValidVietnamesePhone } = require('../utils/phoneHelper');

/**
 * Middleware kiểm tra dữ liệu bắt buộc khi tạo phiếu bảo hành mới (US6 / FR2)
 */
function validateCreateTicket(req, res, next) {
  const {
    customer_name,
    customer_phone,
    product_name,
    serial_imei,
    serial_no,
    issue_category_id,
    category_id,
    store_id,
    center_id,
    issue_description,
    issue_desc,
    priority,
  } = req.body;

  const errors = [];

  // Tên khách hàng
  if (!customer_name || typeof customer_name !== 'string' || customer_name.trim() === '') {
    errors.push('customer_name là bắt buộc và không được để trống.');
  }

  // Số điện thoại
  const phone = customer_phone ? String(customer_phone).trim() : '';
  if (!phone || !isValidVietnamesePhone(phone)) {
    errors.push('customer_phone không hợp lệ (phải là số điện thoại Việt Nam gồm 10 chữ số).');
  }

  // Tên sản phẩm / thiết bị
  if (!product_name || typeof product_name !== 'string' || product_name.trim() === '') {
    errors.push('product_name là bắt buộc.');
  }

  // Serial / IMEI
  const serial = serial_imei || serial_no;
  if (!serial || typeof serial !== 'string' || serial.trim() === '') {
    errors.push('serial_imei là bắt buộc.');
  }

  // Nhóm lỗi
  const cat = issue_category_id || category_id;
  if (!cat) {
    errors.push('issue_category_id là bắt buộc.');
  }

  // Điểm tiếp nhận (Center / Store)
  const store = store_id || center_id;
  if (!store) {
    errors.push('store_id hoặc center_id là bắt buộc.');
  }

  // Mô tả lỗi
  const desc = issue_description || issue_desc;
  if (!desc || typeof desc !== 'string' || desc.trim() === '') {
    errors.push('issue_description là bắt buộc để mô tả sự cố.');
  }

  // Mức ưu tiên
  if (priority && !config.priorities.includes(priority.toUpperCase())) {
    errors.push(`priority phải là một trong các giá trị: ${config.priorities.join(', ')}.`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu phiếu bảo hành không hợp lệ.',
      errors,
    });
  }

  next();
}

/**
 * Middleware kiểm tra cập nhật trạng thái phiếu (US4 / FR4 / QT-06)
 */
function validateUpdateStatus(req, res, next) {
  const { status, updated_by } = req.body;
  const validStatuses = Object.keys(config.ticketStatuses);

  const errors = [];

  if (!status || !validStatuses.includes(status.toUpperCase())) {
    errors.push(`status không hợp lệ. Cho phép: ${validStatuses.join(', ')}.`);
  }

  if (!updated_by || typeof updated_by !== 'string' || updated_by.trim() === '') {
    errors.push('updated_by là bắt buộc để ghi nhận người thực hiện thay đổi.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cập nhật trạng thái không hợp lệ.',
      errors,
    });
  }

  next();
}

module.exports = {
  validateCreateTicket,
  validateUpdateStatus,
};
