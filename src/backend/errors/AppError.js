/**
 * AppError.js — Lớp lỗi nghiệp vụ của ứng dụng (Application Business Error)
 *
 * Theo chuẩn Buổi 7 Track SE:
 * - Lớp Service chỉ ném lỗi nghiệp vụ có MÃ (code), KHÔNG biết mã HTTP (400, 404, 409...).
 * - Lớp Controller / Routes sẽ ánh xạ từ mã lỗi nghiệp vụ sang mã HTTP tương ứng.
 * - Nhờ vậy một quy tắc nghiệp vụ có thể tái sử dụng cho REST API, CLI, cron job và Unit Test.
 */
class AppError extends Error {
  constructor(code, message, chiTiet = undefined) {
    super(message);
    this.name = 'AppError';
    this.code = code; // Ví dụ: 'PHIEU_DANG_MO', 'KHACH_KHONG_TON_TAI', 'DU_LIEU_KHONG_HOP_LE'
    if (chiTiet !== undefined) {
      this.chiTiet = chiTiet; // Chi tiết danh sách trường lỗi nếu có
    }
  }
}

/**
 * LoiNghiepVu — Vi phạm quy tắc nghiệp vụ (QT-01..QT-09) theo chuẩn Buổi 11
 */
class LoiNghiepVu extends AppError {
  constructor(code, message, httpStatus = 409, chiTiet = undefined) {
    super(code, message, chiTiet);
    this.name = 'LoiNghiepVu';
    this.httpStatus = httpStatus;
  }
}

/**
 * LoiTruyCapDuLieu — Lỗi tầng dữ liệu/CSDL theo chuẩn Buổi 11
 */
class LoiTruyCapDuLieu extends Error {
  constructor(message = 'Lỗi truy cập dữ liệu', cause = undefined) {
    super(message, cause ? { cause } : undefined);
    this.name = 'LoiTruyCapDuLieu';
    this.cause = cause;
  }
}

module.exports = { AppError, LoiNghiepVu, LoiTruyCapDuLieu };

