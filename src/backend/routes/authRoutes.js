const express = require('express');
const controller = require('../controllers/authController');
const { authenticate, requireRoles } = require('../middlewares/authenticate');

const router = express.Router();
const attempts = new Map();
function limitLoginAttempts(req, res, next) {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const current = attempts.get(key);
  if (!current || now - current.startedAt >= 15 * 60 * 1000) attempts.set(key, { startedAt: now, count: 1 });
  else if (current.count >= 10) return res.status(429).json({ error: 'LOGIN_RATE_LIMIT', message: 'Quá nhiều lần đăng nhập. Vui lòng thử lại sau 15 phút.' });
  else current.count++;
  next();
}

router.post('/login', limitLoginAttempts, controller.login);
router.post('/logout', controller.logout);
router.get('/me', authenticate, controller.me);
router.patch('/profile', authenticate, controller.updateProfile);
router.get('/users', authenticate, requireRoles('QUAN_LY_CHI_NHANH', 'QUAN_LY_HE_THONG'), controller.listUsers);
router.post('/users', authenticate, requireRoles('QUAN_LY_CHI_NHANH', 'QUAN_LY_HE_THONG'), controller.createUser);
router.patch('/users/:id', authenticate, requireRoles('QUAN_LY_CHI_NHANH', 'QUAN_LY_HE_THONG'), controller.updateManagedUser);

module.exports = router;
