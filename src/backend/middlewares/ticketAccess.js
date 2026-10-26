const TicketService = require('../services/ticketService');

function checkCreateCenter(req, res, next) {
  if (req.user.role === 'QUAN_LY_HE_THONG') return next();
  const requestedCenter = Number(req.body?.center_id || req.body?.centerId || req.body?.store_id?.replace(/\D/g, '') || 0);
  if (requestedCenter !== Number(req.user.branchId)) {
    return res.status(403).json({ error: 'CENTER_FORBIDDEN', message: 'Chỉ được tạo phiếu tại chi nhánh được gán cho tài khoản.' });
  }
  next();
}

function checkTicketCenter(req, res, next) {
  if (req.user.role === 'QUAN_LY_HE_THONG') return next();
  const ticket = TicketService.getTicketById(req.params.id);
  if (!ticket) return next(); // Controller trả 404 thống nhất.
  if (Number(ticket.center_id) !== Number(req.user.branchId)) {
    return res.status(403).json({ error: 'CENTER_FORBIDDEN', message: 'Phiếu thuộc chi nhánh khác.' });
  }
  next();
}

module.exports = { checkCreateCenter, checkTicketCenter };
