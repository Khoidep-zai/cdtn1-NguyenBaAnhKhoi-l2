const readline = require('readline');
const { query, closePool } = require('../src/backend/config/db');
const { hashPassword } = require('../src/backend/services/authService');

function ask(rl, prompt, hidden = false) {
  return new Promise((resolve) => {
    if (hidden) rl._writeToOutput = () => {};
    rl.question(prompt, (answer) => {
      if (hidden) { rl._writeToOutput = readline.Interface.prototype._writeToOutput; process.stdout.write('\n'); }
      resolve(answer.trim());
    });
  });
}

async function main() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error('Lệnh bootstrap cần chạy trong terminal tương tác.');
  if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET) < 32) throw new Error('Hãy cấu hình JWT_SECRET tối thiểu 32 byte trong .env trước.');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const exists = await query("SELECT 1 FROM app_user WHERE role='QUAN_LY_HE_THONG' LIMIT 1");
    if (exists.rowCount) throw new Error('Đã có tài khoản quản lý hệ thống; bootstrap bị từ chối.');
    const username = (await ask(rl, 'Tên đăng nhập quản lý hệ thống (3-80 ký tự): ')).toLowerCase();
    const fullName = await ask(rl, 'Họ và tên: ');
    const password = await ask(rl, 'Mật khẩu (12-128 ký tự): ', true);
    const confirm = await ask(rl, 'Nhập lại mật khẩu: ', true);
    if (!/^[a-z0-9._-]{3,80}$/.test(username)) throw new Error('Tên đăng nhập không hợp lệ.');
    if (fullName.length < 2 || fullName.length > 120) throw new Error('Họ tên không hợp lệ.');
    if (password !== confirm) throw new Error('Hai mật khẩu không trùng nhau.');
    const passwordHash = await hashPassword(password);
    const created = await query(
      `INSERT INTO app_user(username,password_hash,full_name,role,center_id)
       VALUES($1,$2,$3,'QUAN_LY_HE_THONG',NULL) RETURNING user_id`,
      [username, passwordHash, fullName]);
    console.log(`Đã tạo tài khoản quản lý hệ thống #${created.rows[0].user_id}. Đăng nhập bằng thông tin vừa nhập.`);
  } finally { rl.close(); await closePool(); }
}

main().catch((error) => { console.error(`Bootstrap thất bại: ${error.message}`); process.exitCode = 1; });
