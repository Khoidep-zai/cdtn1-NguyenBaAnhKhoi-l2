const TicketService = require('../services/ticketService');

// Bảng ánh xạ MÃ NGHIỆP VỤ (Service) -> MÃ HTTP (Controller / Routes)
const HTTP_BY_CODE = {
  DU_LIEU_KHONG_HOP_LE: 400,
  KHACH_KHONG_TON_TAI: 404,
  PHIEU_DANG_MO: 409,
  UU_TIEN_KHONG_HOP_LE: 400,
  TRANG_THAI_KHONG_HOP_LE: 400,
  KTV_KHONG_KHA_DUNG: 404,
  KTV_QUA_TAI: 422,
};

function handleControllerError(res, error) {
  if (error.code && HTTP_BY_CODE[error.code]) {
    return res.status(HTTP_BY_CODE[error.code]).json({
      success: false,
      error: error.code,
      message: error.message,
      chi_tiet: error.chiTiet,
    });
  }
  const status = error.statusCode || 500;
  return res.status(status).json({ success: false, message: error.message });
}

class TicketController {
  // US1: Tạo phiếu mới
  static create(req, res) {
    try {
      const ticket = TicketService.createTicket({ ...req.body, created_by: req.user.username });
      return res.status(201).json({
        success: true,
        message: 'Tạo phiếu bảo hành thành công.',
        data: ticket,
      });
    } catch (error) {
      return handleControllerError(res, error);
    }
  }

  // US5: Xem danh sách và lọc
  static list(req, res) {
    try {
      const filters = req.user && req.user.role !== 'QUAN_LY_HE_THONG'
        ? { ...req.query, center_id: req.user.branchId }
        : req.query;
      const result = TicketService.getTickets(filters);
      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      return handleControllerError(res, error);
    }
  }

  // US7: Xem chi tiết kèm lịch sử trạng thái
  static getDetail(req, res) {
    try {
      const ticket = TicketService.getTicketById(req.params.id);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy phiếu bảo hành với mã ${req.params.id}.`,
        });
      }
      return res.status(200).json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      return handleControllerError(res, error);
    }
  }

  // US3: Phân loại phiếu
  static classify(req, res) {
    try {
      const ticket = TicketService.classifyTicket(req.params.id, { ...req.body, updated_by: req.user.username });
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy phiếu bảo hành với mã ${req.params.id}.`,
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Phân loại sự cố phiếu bảo hành thành công.',
        data: ticket,
      });
    } catch (error) {
      return handleControllerError(res, error);
    }
  }

  // US4: Cập nhật trạng thái
  static updateStatus(req, res) {
    try {
      const ticket = TicketService.updateStatus(req.params.id, { ...req.body, updated_by: req.user.username });
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy phiếu bảo hành với mã ${req.params.id}.`,
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Cập nhật trạng thái phiếu thành công.',
        data: ticket,
      });
    } catch (error) {
      return handleControllerError(res, error);
    }
  }
}

module.exports = TicketController;

