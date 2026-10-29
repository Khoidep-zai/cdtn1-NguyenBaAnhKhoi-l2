const express = require('express');
const router = express.Router();
const TicketController = require('../controllers/ticketController');
const { validateCreateTicket, validateUpdateStatus } = require('../middlewares/validateTicket');
const { checkCreateCenter, checkTicketCenter } = require('../middlewares/ticketAccess');
const { requireRoles } = require('../middlewares/authenticate');
const handoverPhoto = require('../controllers/handoverPhotoController');

// US1, US6: Tạo phiếu mới có validation
router.post('/', requireRoles('NHAN_VIEN', 'QUAN_LY_CHI_NHANH', 'QUAN_LY_HE_THONG'), checkCreateCenter, validateCreateTicket, TicketController.create);

// US5: Xem và lọc danh sách phiếu
router.get('/', TicketController.list);

// US7: Xem chi tiết phiếu kèm timeline lịch sử
router.get('/:id', checkTicketCenter, TicketController.getDetail);

// US3: Phân loại sự cố phiếu
router.patch('/:id/classify', checkTicketCenter, requireRoles('QUAN_LY_CHI_NHANH', 'QUAN_LY_HE_THONG'), TicketController.classify);

router.patch('/:id/warranty-exception', checkTicketCenter, requireRoles('QUAN_LY_CHI_NHANH', 'QUAN_LY_HE_THONG'), TicketController.approveWarrantyException);
router.patch('/:id/service-consent', checkTicketCenter, requireRoles('NHAN_VIEN', 'QUAN_LY_CHI_NHANH', 'QUAN_LY_HE_THONG'), TicketController.recordServiceConsent);
router.get('/:id/handover-photo', checkTicketCenter, handoverPhoto.get);
router.put('/:id/handover-photo', checkTicketCenter, requireRoles('NHAN_VIEN', 'QUAN_LY_CHI_NHANH', 'QUAN_LY_HE_THONG'),
  express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '8mb' }), handoverPhoto.save);

// US4: Cập nhật trạng thái phiếu và ghi nhận log
router.patch('/:id/status', checkTicketCenter, validateUpdateStatus, TicketController.updateStatus);

module.exports = router;
