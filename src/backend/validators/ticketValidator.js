const { AppError } = require('../errors/AppError');
const { isValidVietnamesePhone } = require('../utils/phoneHelper');
const config = require('../config');

const UU_TIEN_HOP_LE = new Set([
  'CAO',
  'TRUNG_BINH',
  'THAP',
  'HIGH',
  'MEDIUM',
  'LOW',
  'URGENT',
]);
const RE_SERIAL = /^[A-Za-z0-9-]{6,40}$/;
const RE_NGAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Tầng 1 của kiểm tra dữ liệu: định dạng và kiểu dữ liệu (Data Validation)
 * Hỗ trợ linh hoạt cả snake_case (Mekong CRM API) và camelCase (Standard payload).
 */
function validateReceive(body = {}) {
  const errors = [];
  const fields = [];

  const customerName = body.customer_name || body.customerName;
  if (!customerName || typeof customerName !== 'string' || customerName.trim() === '') {
    errors.push('customer_name là bắt buộc và không được để trống.');
    fields.push({ truong: 'customer_name', ly_do: 'thiếu trường bắt buộc' });
  }

  const phone = body.customer_phone || body.customerPhone;
  if (!phone || !isValidVietnamesePhone(String(phone).trim())) {
    errors.push('customer_phone không hợp lệ (phải là số điện thoại Việt Nam gồm 10 chữ số).');
    fields.push({ truong: 'customer_phone', ly_do: 'phải là số điện thoại VN 10 chữ số' });
  }

  const productName = body.product_name || body.productName;
  if (!productName || typeof productName !== 'string' || productName.trim() === '') {
    errors.push('product_name là bắt buộc.');
    fields.push({ truong: 'product_name', ly_do: 'thiếu trường bắt buộc' });
  }

  const rawSerial = body.serial_imei || body.serial_no || body.serialNo || body.serial;
  const serial = typeof rawSerial === 'string' ? rawSerial.trim() : '';
  if (!serial) {
    errors.push('serial_imei hoặc serialNo là bắt buộc.');
    fields.push({ truong: 'serialNo', ly_do: 'thiếu trường bắt buộc' });
  } else if (!RE_SERIAL.test(serial)) {
    errors.push('serial_imei chỉ gồm chữ, số và dấu gạch ngang, dài từ 6 đến 40 ký tự.');
    fields.push({ truong: 'serialNo', ly_do: 'ký tự không hợp lệ hoặc sai độ dài 6-40' });
  }

  const cat = body.issue_category_id || body.category_id || body.categoryId;
  if (!cat) {
    errors.push('issue_category_id là bắt buộc.');
    fields.push({ truong: 'categoryId', ly_do: 'thiếu trường bắt buộc' });
  }

  const store = body.store_id || body.center_id || body.centerId;
  if (!store) {
    errors.push('store_id hoặc center_id là bắt buộc.');
    fields.push({ truong: 'centerId', ly_do: 'thiếu trường bắt buộc' });
  }

  const desc = body.issue_description || body.issue_desc || body.issueDesc;
  if (typeof desc !== 'string' || desc.trim().length < 10) {
    errors.push('issue_description phải có ít nhất 10 ký tự.');
    fields.push({ truong: 'issue_description', ly_do: 'phải có ít nhất 10 ký tự' });
  }

  if (body.priority) {
    const pUpper = String(body.priority).toUpperCase();
    if (!UU_TIEN_HOP_LE.has(pUpper)) {
      errors.push(`priority phải là một trong các giá trị: CAO, TRUNG_BINH, THAP.`);
      fields.push({ truong: 'priority', ly_do: 'giá trị mức ưu tiên không hợp lệ' });
    }
  }

  const soldAt = body.sold_at || body.soldAt || body.purchase_date;
  if (soldAt) {
    const sDate = String(soldAt).trim();
    if (!RE_NGAY.test(sDate) || Number.isNaN(Date.parse(sDate))) {
      errors.push('sold_at / ngày mua phải theo định dạng YYYY-MM-DD.');
      fields.push({ truong: 'soldAt', ly_do: 'phải theo định dạng YYYY-MM-DD' });
    }
  }

  if (errors.length > 0) {
    const err = new AppError('DU_LIEU_KHONG_HOP_LE', `Dữ liệu vào không hợp lệ: ${errors.join('; ')}`);
    err.statusCode = 400;
    err.chiTiet = { errors, cac_truong: fields };
    throw err;
  }

  return {
    customer_name: customerName.trim(),
    customer_phone: String(phone).trim(),
    product_name: productName.trim(),
    serial_imei: serial,
    serial_no: serial,
    issue_category_id: String(cat),
    category_id: Number(cat) || 1,
    store_id: String(store),
    center_id: Number(String(store).replace(/\D/g, '')) || 1,
    issue_description: desc.trim(),
    priority: body.priority ? String(body.priority).toUpperCase() : 'TRUNG_BINH',
    sold_at: soldAt ? String(soldAt).trim() : null,
  };
}

const TRANG_THAI_HOP_LE = new Set(Object.keys(config.ticketStatuses));

function validateStatus(body = {}) {
  const errors = [];
  const fields = [];

  const rawStatus = body.status ? String(body.status).toUpperCase() : '';
  if (!rawStatus) {
    errors.push('status là bắt buộc.');
    fields.push({ truong: 'status', ly_do: 'thiếu trường bắt buộc' });
  } else if (!TRANG_THAI_HOP_LE.has(rawStatus)) {
    errors.push(`status không hợp lệ. Cho phép: ${[...TRANG_THAI_HOP_LE].join(', ')}.`);
    fields.push({ truong: 'status', ly_do: 'trạng thái ngoài tập hợp cho phép' });
  }

  const updatedBy = body.updated_by || body.updatedBy;
  if (!updatedBy || typeof updatedBy !== 'string' || updatedBy.trim() === '') {
    errors.push('updated_by là bắt buộc để ghi nhận người thực hiện thay đổi.');
    fields.push({ truong: 'updated_by', ly_do: 'thiếu trường bắt buộc' });
  }

  if (errors.length > 0) {
    const err = new AppError('DU_LIEU_KHONG_HOP_LE', `Cập nhật trạng thái không hợp lệ: ${errors.join('; ')}`);
    err.statusCode = 400;
    err.chiTiet = { errors, cac_truong: fields };
    throw err;
  }

  return {
    status: rawStatus,
    updated_by: updatedBy.trim(),
    note: typeof body.note === 'string' ? body.note : null,
  };
}

module.exports = {
  validateReceive,
  validateStatus,
  UU_TIEN_HOP_LE,
  TRANG_THAI_HOP_LE,
};
