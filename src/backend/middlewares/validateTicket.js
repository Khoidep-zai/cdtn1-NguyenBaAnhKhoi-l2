const { validateReceive, validateStatus } = require('../validators/ticketValidator');

/**
 * Middleware kiểm tra dữ liệu bắt buộc khi tạo phiếu bảo hành mới (US6 / FR2)
 */
function validateCreateTicket(req, res, next) {
  try {
    const validated = validateReceive(req.body);
    req.validatedBody = validated;
    next();
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: 'Dữ liệu phiếu bảo hành không hợp lệ.',
      errors: (error.chiTiet && error.chiTiet.errors) || [error.message],
      chi_tiet: error.chiTiet,
    });
  }
}

/**
 * Middleware kiểm tra cập nhật trạng thái phiếu (US4 / FR4 / QT-06)
 */
function validateUpdateStatus(req, res, next) {
  try {
    const validated = validateStatus(req.body);
    req.validatedBody = validated;
    next();
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: 'Cập nhật trạng thái không hợp lệ.',
      errors: (error.chiTiet && error.chiTiet.errors) || [error.message],
      chi_tiet: error.chiTiet,
    });
  }
}

module.exports = {
  validateCreateTicket,
  validateUpdateStatus,
};
