const { verifySession, publicUser } = require('../services/authService');
const { query } = require('../config/db');

function readCookie(req, name) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index < 0 || part.slice(0, index).trim() !== name) continue;
    try { return decodeURIComponent(part.slice(index + 1).trim()); } catch { return null; }
  }
  return null;
}

async function authenticate(req, res, next) {
  try {
    const payload = verifySession(readCookie(req, 'mekong_session'));
    if (!payload) return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Vui lòng đăng nhập lại.' });
    const result = await query(
      `SELECT u.user_id, u.username, u.full_name, u.phone, u.role, u.center_id, u.is_active,
              c.center_name
         FROM app_user u LEFT JOIN service_center c ON c.center_id = u.center_id
        WHERE u.user_id = $1 AND u.is_active = TRUE`, [Number(payload.sub)]);
    if (!result.rows[0]) return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Tài khoản không còn hoạt động.' });
    req.user = publicUser(result.rows[0]);
    next();
  } catch (error) { next(error); }
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Vui lòng đăng nhập.' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'FORBIDDEN', message: 'Tài khoản không có quyền thực hiện thao tác này.' });
    next();
  };
}

module.exports = { authenticate, requireRoles, readCookie };
