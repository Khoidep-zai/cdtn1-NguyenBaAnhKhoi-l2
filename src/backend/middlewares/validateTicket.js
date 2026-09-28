const config = require('../config');

/**
 * Middleware kiểm tra dữ liệu bắt buộc khi tạo phiếu bảo hành mới (US6)
 */
function validateCreateTicket(req, res, next) {
  const {
    customer_name,
    customer_phone,
    product_name,
    serial_imei,
    issue_category_id,
    store_id,
    issue_description,
    priority,
  } = req.body;

  const errors = [];

  if (!customer_name || typeof customer_name !== 'string' || customer_name.trim() === '') {
    errors.push('customer_name là bắt buộc và không được để trống.');
  }

  const phoneRegex = /^(0|\+84)[35789][0-9]{8}$/;
  if (!customer_phone || !phoneRegex.test(customer_phone.trim())) {
    errors.push('customer_phone không hợp lệ (phải là số điện thoại Việt Nam gồm 10 chữ số).');
  }

  if (!product_name || typeof product_name !== 'string' || product_name.trim() === '') {
    errors.push('product_name là bắt buộc.');
  }

  if (!serial_imei || typeof serial_imei !== 'string' || serial_imei.trim() === '') {
    errors.push('serial_imei là bắt buộc.');
  }

  if (!issue_category_id) {
    errors.push('issue_category_id là bắt buộc.');
  }

  if (!store_id) {
    errors.push('store_id là bắt buộc.');
  }

  if (!issue_description || typeof issue_description !== 'string' || issue_description.trim() === '') {
    errors.push('issue_description là bắt buộc để mô tả sự cố.');
  }

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
 * Middleware kiểm tra cập nhật trạng thái phiếu (US4)
 */
function validateUpdateStatus(req, res, next) {
  const { status, updated_by, note } = req.body;
  const validStatuses = Object.values(config.ticketStatuses);

  const errors = [];

  if (!status || !validStatuses.includes(status)) {
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
