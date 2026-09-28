const TicketService = require('../services/ticketService');

class TicketController {
  // US1: Tạo phiếu mới
  static create(req, res) {
    try {
      const ticket = TicketService.createTicket(req.body);
      return res.status(201).json({
        success: true,
        message: 'Tạo phiếu bảo hành thành công.',
        data: ticket,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // US5: Xem danh sách và lọc
  static list(req, res) {
    try {
      const result = TicketService.getTickets(req.query);
      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
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
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // US3: Phân loại phiếu
  static classify(req, res) {
    try {
      const ticket = TicketService.classifyTicket(req.params.id, req.body);
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
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // US4: Cập nhật trạng thái
  static updateStatus(req, res) {
    try {
      const ticket = TicketService.updateStatus(req.params.id, req.body);
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
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = TicketController;
