const express = require('express');
const router = express.Router();
const TicketController = require('../controllers/ticketController');
const { validateCreateTicket, validateUpdateStatus } = require('../middlewares/validateTicket');
const { checkCreateCenter, checkTicketCenter } = require('../middlewares/ticketAccess');
const { requireRoles } = require('../middlewares/authenticate');

// US1, US6: Tạo phiếu mới có validation
router.post('/', requireRoles('NHAN_VIEN', 'QUAN_LY_CHI_NHANH', 'QUAN_LY_HE_THONG'), checkCreateCenter, validateCreateTicket, TicketController.create);

// US5: Xem và lọc danh sách phiếu
router.get('/', TicketController.list);

// US7: Xem chi tiết phiếu kèm timeline lịch sử
router.get('/:id', checkTicketCenter, TicketController.getDetail);

// US3: Phân loại sự cố phiếu
router.patch('/:id/classify', checkTicketCenter, requireRoles('QUAN_LY_CHI_NHANH', 'QUAN_LY_HE_THONG'), TicketController.classify);

// US4: Cập nhật trạng thái phiếu và ghi nhận log
router.patch('/:id/status', checkTicketCenter, validateUpdateStatus, TicketController.updateStatus);

module.exports = router;
