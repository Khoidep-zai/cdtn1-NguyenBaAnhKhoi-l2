/**
 * Tiện ích làm sạch và chuẩn hóa số điện thoại theo chuẩn Việt Nam (QT-01)
 * Xử lý các định dạng nhiễu từ customers_raw.csv:
 * - '0901234567' -> '0901234567'
 * - '+84901234567' -> '0901234567'
 * - '84901234567' -> '0901234567'
 * - '090.123.4567' / '090 123 4567' -> '0901234567'
 */

function normalizePhone(rawPhone) {
  if (!rawPhone || typeof rawPhone !== 'string') return '';
  
  // Loại bỏ toàn bộ khoảng trắng, dấu chấm, gạch ngang, ngoặc đơn
  let cleaned = rawPhone.replace(/[\s.\-()]/g, '');

  // Chuẩn hóa đầu số quốc tế +84 hoặc 84 về đầu 0
  if (cleaned.startsWith('+84')) {
    cleaned = '0' + cleaned.substring(3);
  } else if (cleaned.startsWith('84') && cleaned.length >= 11) {
    cleaned = '0' + cleaned.substring(2);
  }

  return cleaned;
}

/**
 * Kiểm tra xem số điện thoại có hợp lệ (đầu số di động Việt Nam 10 chữ số)
 */
function isValidVietnamesePhone(phone) {
  const normalized = normalizePhone(phone);
  const regex = /^(03|05|07|08|09)\d{8}$/;
  return regex.test(normalized);
}

module.exports = {
  normalizePhone,
  isValidVietnamesePhone,
};
