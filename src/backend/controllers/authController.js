const { query } = require('../config/db');
const { ROLES, hashPassword, verifyPassword, signSession, publicUser, TOKEN_TTL_SECONDS, MIN_PASSWORD_LENGTH } = require('../services/authService');

const COOKIE_NAME = 'mekong_session';
const COOKIE_BASE = `Path=/; HttpOnly; SameSite=Strict; Max-Age=${TOKEN_TTL_SECONDS}`;
const USER_SELECT = `SELECT u.user_id, u.username, u.full_name, u.phone, u.role, u.center_id, u.is_active, c.center_name
  FROM app_user u LEFT JOIN service_center c ON c.center_id = u.center_id`;

function setSessionCookie(res, token) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(token)}; ${COOKIE_BASE}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
}
function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
}
function validUsername(value) { return typeof value === 'string' && /^[a-z0-9._-]{3,80}$/i.test(value.trim()); }
function validName(value) { return typeof value === 'string' && value.trim().length >= 2 && value.trim().length <= 120; }

async function login(req, res, next) {
  try {
    const username = typeof req.body.username === 'string' ? req.body.username.trim().toLowerCase() : '';
    const password = req.body.password;
    if (!validUsername(username) || typeof password !== 'string' || password.length > 128) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
    }
    const result = await query(`${USER_SELECT.replace('u.is_active, c.center_name', 'u.is_active, u.password_hash, c.center_name')} WHERE LOWER(u.username) = $1 AND u.is_active = TRUE`, [username]);
    const user = result.rows[0];
    if (!user || !(await verifyPassword(password, user?.password_hash))) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
    }
    setSessionCookie(res, signSession(user.user_id));
    return res.json({ data: publicUser(user) });
  } catch (error) { next(error); }
}

function logout(_req, res) { clearSessionCookie(res); return res.status(204).end(); }
function me(req, res) { return res.json({ data: req.user }); }

async function updateProfile(req, res, next) {
  try {
    const { full_name, phone } = req.body || {};
    if (!validName(full_name) || (phone != null && (typeof phone !== 'string' || phone.length > 20))) {
      return res.status(400).json({ error: 'INVALID_PROFILE', message: 'Họ tên hoặc số điện thoại không hợp lệ.' });
    }
    const result = await query(
      `UPDATE app_user SET full_name=$1, phone=$2, updated_at=NOW() WHERE user_id=$3
       RETURNING user_id, username, full_name, phone, role, center_id, is_active`,
      [full_name.trim(), (phone || '').trim() || null, req.user.id]);
    return res.json({ data: publicUser(result.rows[0]) });
  } catch (error) { next(error); }
}

async function listUsers(req, res, next) {
  try {
    const result = req.user.role === 'QUAN_LY_HE_THONG'
      ? await query(`${USER_SELECT} ORDER BY u.center_id NULLS FIRST, u.role, u.username`)
      : await query(`${USER_SELECT} WHERE u.center_id=$1 AND u.role='NHAN_VIEN' ORDER BY u.username`, [req.user.branchId]);
    return res.json({ data: result.rows.map(publicUser) });
  } catch (error) { next(error); }
}

async function createUser(req, res, next) {
  try {
    const { username, password, full_name, phone = '', role, center_id } = req.body || {};
    if (typeof phone !== 'string') return res.status(400).json({ error: 'INVALID_ACCOUNT', message: 'Số điện thoại không hợp lệ.' });
    if (!validUsername(username) || !validName(full_name) || typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH || password.length > 128) {
      return res.status(400).json({ error: 'INVALID_ACCOUNT', message: `Tài khoản, họ tên hoặc mật khẩu không hợp lệ; mật khẩu cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự.` });
    }
    const effectiveRole = req.user.role === 'QUAN_LY_CHI_NHANH' ? 'NHAN_VIEN' : role;
    if (!ROLES.includes(effectiveRole)) return res.status(400).json({ error: 'INVALID_ROLE', message: 'Vai trò không hợp lệ.' });
    const effectiveCenter = req.user.role === 'QUAN_LY_CHI_NHANH' ? req.user.branchId : (effectiveRole === 'QUAN_LY_HE_THONG' ? null : Number(center_id));
    if (effectiveRole !== 'QUAN_LY_HE_THONG' && (!Number.isInteger(effectiveCenter) || effectiveCenter < 1)) {
      return res.status(400).json({ error: 'INVALID_CENTER', message: 'Tài khoản cần được gán chi nhánh hợp lệ.' });
    }
    const passwordHash = await hashPassword(password);
    const result = await query(
      `INSERT INTO app_user(username,password_hash,full_name,phone,role,center_id)
       VALUES(LOWER($1),$2,$3,$4,$5,$6)
       RETURNING user_id,username,full_name,phone,role,center_id,is_active`,
      [username.trim(), passwordHash, full_name.trim(), phone.trim() || null, effectiveRole, effectiveCenter]);
    return res.status(201).json({ data: publicUser(result.rows[0]) });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'USERNAME_EXISTS', message: 'Tên đăng nhập đã tồn tại.' });
    next(error);
  }
}

async function updateManagedUser(req, res, next) {
  try {
    const userId = Number(req.params.id);
    if (!Number.isSafeInteger(userId) || userId < 1) return res.status(400).json({ error: 'INVALID_USER_ID', message: 'Mã tài khoản không hợp lệ.' });
    const current = await query(`SELECT user_id, role, center_id, is_active FROM app_user WHERE user_id=$1`, [userId]);
    if (!current.rows[0]) return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'Không tìm thấy tài khoản.' });
    const target = current.rows[0];
    if (req.user.role === 'QUAN_LY_CHI_NHANH' && (Number(target.center_id) !== req.user.branchId || target.role !== 'NHAN_VIEN')) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Quản lý chi nhánh chỉ được quản lý nhân viên thuộc chi nhánh mình.' });
    }
    const { full_name, phone, is_active, role, center_id, password } = req.body || {};
    if (phone !== undefined && (typeof phone !== 'string' || phone.length > 20)) return res.status(400).json({ error: 'INVALID_PROFILE', message: 'Số điện thoại không hợp lệ.' });
    if (full_name !== undefined && !validName(full_name)) return res.status(400).json({ error: 'INVALID_PROFILE', message: 'Họ tên không hợp lệ.' });
    if (password !== undefined && (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH || password.length > 128)) {
      return res.status(400).json({ error: 'INVALID_PASSWORD', message: `Mật khẩu cần dài từ ${MIN_PASSWORD_LENGTH} đến 128 ký tự.` });
    }
    if (req.user.role === 'QUAN_LY_CHI_NHANH' && role !== undefined && role !== 'NHAN_VIEN') return res.status(403).json({ error: 'FORBIDDEN', message: 'Quản lý chi nhánh không được nâng vai trò tài khoản.' });
    const nextRole = req.user.role === 'QUAN_LY_CHI_NHANH' ? target.role : (role || target.role);
    if (!ROLES.includes(nextRole)) return res.status(400).json({ error: 'INVALID_ROLE', message: 'Vai trò không hợp lệ.' });
    const nextCenter = req.user.role === 'QUAN_LY_CHI_NHANH' ? req.user.branchId : (nextRole === 'QUAN_LY_HE_THONG' ? null : Number(center_id ?? target.center_id));
    if (nextRole !== 'QUAN_LY_HE_THONG' && (!Number.isInteger(nextCenter) || nextCenter < 1)) return res.status(400).json({ error: 'INVALID_CENTER', message: 'Tài khoản cần chi nhánh hợp lệ.' });
    const removesActiveSystemManager = target.role === 'QUAN_LY_HE_THONG' && target.is_active
      && (nextRole !== 'QUAN_LY_HE_THONG' || is_active === false);
    if (removesActiveSystemManager) {
      const activeManagers = await query(`SELECT COUNT(*)::int AS count FROM app_user WHERE role='QUAN_LY_HE_THONG' AND is_active=TRUE`);
      if (activeManagers.rows[0].count <= 1) {
        return res.status(409).json({ error: 'LAST_SYSTEM_MANAGER', message: 'Không thể vô hiệu hóa hoặc hạ quyền quản lý hệ thống cuối cùng.' });
      }
    }
    const passwordHash = password ? await hashPassword(password) : null;
    const result = await query(
      `UPDATE app_user SET full_name=COALESCE($1,full_name), phone=CASE WHEN $2 THEN $3 ELSE phone END,
       role=$4, center_id=$5, is_active=COALESCE($6,is_active), password_hash=COALESCE($7,password_hash), updated_at=NOW()
       WHERE user_id=$8 RETURNING user_id,username,full_name,phone,role,center_id,is_active`,
      [full_name?.trim() || null, phone !== undefined, phone === undefined ? null : (phone.trim() || null), nextRole, nextCenter,
       typeof is_active === 'boolean' ? is_active : null, passwordHash, userId]);
    return res.json({ data: publicUser(result.rows[0]) });
  } catch (error) { next(error); }
}

module.exports = { login, logout, me, updateProfile, listUsers, createUser, updateManagedUser, setSessionCookie, clearSessionCookie };
