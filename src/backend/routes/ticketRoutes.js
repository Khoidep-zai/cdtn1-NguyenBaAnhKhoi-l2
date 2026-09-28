const express = require('express');
const router = express.Router();
const TicketController = require('../controllers/ticketController');
const { validateCreateTicket, validateUpdateStatus } = require('../middlewares/validateTicket');

// US1, US6: Tạo phiếu mới có validation
router.post('/', validateCreateTicket, TicketController.create);

// US5: Xem và lọc danh sách phiếu
router.get('/', TicketController.list);

// US7: Xem chi tiết phiếu kèm timeline lịch sử
router.get('/:id', TicketController.getDetail);

// US3: Phân loại sự cố phiếu
router.patch('/:id/classify', TicketController.classify);

// US4: Cập nhật trạng thái phiếu và ghi nhận log
router.patch('/:id/status', validateUpdateStatus, TicketController.updateStatus);

module.exports = router;
