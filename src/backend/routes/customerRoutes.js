const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/customerController');

// GET /api/customers?phone={phone} - Tra cứu hồ sơ khách hàng theo SĐT (US1/FR1)
router.get('/', CustomerController.getByPhone);

// POST /api/customers - Đăng ký hồ sơ khách hàng mới (QT-01)
router.post('/', CustomerController.create);

module.exports = router;
