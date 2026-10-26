const crypto = require('crypto');
const { promisify } = require('util');
const config = require('../config');

const scrypt = promisify(crypto.scrypt);
const ROLES = Object.freeze(['NHAN_VIEN', 'QUAN_LY_CHI_NHANH', 'QUAN_LY_HE_THONG']);
const ROLE_LABELS = Object.freeze({
  NHAN_VIEN: 'Nhân viên tiếp nhận',
  QUAN_LY_CHI_NHANH: 'Quản lý chi nhánh',
  QUAN_LY_HE_THONG: 'Quản lý hệ thống',
});
const TOKEN_TTL_SECONDS = 8 * 60 * 60;
const MIN_PASSWORD_LENGTH = config.nodeEnv === 'production' ? 12 : 6;

function base64url(value) { return Buffer.from(value).toString('base64url'); }

function getJwtSecret() {
  if (!config.jwtSecret || Buffer.byteLength(config.jwtSecret) < 32) {
    const error = new Error('JWT_SECRET must be configured with at least 32 bytes.');
    error.statusCode = 503;
    error.code = 'AUTH_NOT_CONFIGURED';
    throw error;
  }
  return config.jwtSecret;
}

async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH || password.length > 128) {
    throw new Error(`Mật khẩu phải dài từ ${MIN_PASSWORD_LENGTH} đến 128 ký tự.`);
  }
  const salt = crypto.randomBytes(16);
  const derived = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

async function verifyPassword(password, stored) {
  if (typeof password !== 'string' || typeof stored !== 'string') return false;
  const [scheme, n, r, p, saltText, hashText] = stored.split('$');
  if (scheme !== 'scrypt' || !saltText || !hashText) return false;
  try {
    const expected = Buffer.from(hashText, 'base64url');
    const actual = await scrypt(password, Buffer.from(saltText, 'base64url'), expected.length, {
      N: Number(n), r: Number(r), p: Number(p),
    });
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch { return false; }
}

function signSession(userId, now = Math.floor(Date.now() / 1000)) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({ sub: String(userId), iat: now, exp: now + TOKEN_TTL_SECONDS }));
  const content = `${header}.${payload}`;
  const signature = crypto.createHmac('sha256', getJwtSecret()).update(content).digest('base64url');
  return `${content}.${signature}`;
}

function verifySession(token, now = Math.floor(Date.now() / 1000)) {
  if (typeof token !== 'string') return null;
  const pieces = token.split('.');
  if (pieces.length !== 3) return null;
  const [headerPart, payloadPart, signature] = pieces;
  let header; let payload;
  try {
    header = JSON.parse(Buffer.from(headerPart, 'base64url').toString('utf8'));
    payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));
  } catch { return null; }
  if (header.alg !== 'HS256' || typeof payload.sub !== 'string' || !/^\d+$/.test(payload.sub)) return null;
  if (!Number.isInteger(payload.exp) || payload.exp <= now) return null;
  try {
    const expected = crypto.createHmac('sha256', getJwtSecret()).update(`${headerPart}.${payloadPart}`).digest();
    const actual = Buffer.from(signature, 'base64url');
    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
  } catch { return null; }
  return payload;
}

function publicUser(row) {
  return {
    id: row.user_id,
    username: row.username,
    name: row.full_name,
    phone: row.phone || '',
    role: row.role,
    roleLabel: ROLE_LABELS[row.role],
    branchId: row.center_id,
    branchName: row.center_name || (row.center_id ? `Chi nhánh ${String(row.center_id).padStart(2, '0')}` : 'Toàn hệ thống'),
    isActive: row.is_active,
    avatar: row.full_name.split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase(),
    canViewAllCenters: row.role === 'QUAN_LY_HE_THONG',
    canManageStaff: row.role !== 'NHAN_VIEN',
    canManageAllAccounts: row.role === 'QUAN_LY_HE_THONG',
    canOverrideSla: row.role !== 'NHAN_VIEN',
    canReassignTechnician: row.role !== 'NHAN_VIEN',
  };
}

module.exports = { ROLES, ROLE_LABELS, TOKEN_TTL_SECONDS, MIN_PASSWORD_LENGTH, hashPassword, verifyPassword, signSession, verifySession, publicUser };
