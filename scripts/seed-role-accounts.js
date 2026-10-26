const crypto = require('crypto');
const { pool, closePool } = require('../src/backend/config/db');
const config = require('../src/backend/config');
const { hashPassword } = require('../src/backend/services/authService');

const ACCOUNTS = [
  { username: 'system.admin', fullName: 'Quản lý hệ thống Mekong', role: 'QUAN_LY_HE_THONG', centerId: null },
  { username: 'manager.ninhkieu', fullName: 'Quản lý chi nhánh Ninh Kiều', role: 'QUAN_LY_CHI_NHANH', centerId: 4 },
  { username: 'staff.ninhkieu', fullName: 'Nhân viên tiếp nhận Ninh Kiều', role: 'NHAN_VIEN', centerId: 4 },
];

async function main() {
  if (config.nodeEnv === 'production') throw new Error('Seed tài khoản mẫu chỉ được chạy trong môi trường development/test.');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const usernames = ACCOUNTS.map((account) => account.username);
    const existing = await client.query('SELECT username FROM app_user WHERE username = ANY($1::text[])', [usernames]);
    if (existing.rowCount) {
      throw new Error(`Tài khoản đã tồn tại (${existing.rows.map((row) => row.username).join(', ')}); không thay mật khẩu hoặc dữ liệu hiện có.`);
    }
    const center = await client.query('SELECT center_id FROM service_center WHERE center_id=4');
    if (!center.rowCount) throw new Error('Không có chi nhánh 4; hãy chạy npm run db:migrate trước.');

    const credentials = [];
    for (const account of ACCOUNTS) {
      const password = crypto.randomBytes(18).toString('base64url');
      const passwordHash = await hashPassword(password);
      const inserted = await client.query(
        `INSERT INTO app_user(username,password_hash,full_name,role,center_id)
         VALUES($1,$2,$3,$4,$5) RETURNING user_id`,
        [account.username, passwordHash, account.fullName, account.role, account.centerId]);
      credentials.push({ ...account, userId: inserted.rows[0].user_id, password });
    }

    await client.query('COMMIT');
    console.log('Tạo 3 tài khoản development thành công. Lưu thông tin đăng nhập sau, mật khẩu không thể đọc lại từ DB:');
    for (const account of credentials) {
      console.log(`${account.role}\t${account.username}\t${account.password}\t${account.centerId ?? 'Toàn hệ thống'}`);
    }
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await closePool();
  }
}

main().catch((error) => { console.error(`Tạo tài khoản mẫu thất bại: ${error.message}`); process.exitCode = 1; });
