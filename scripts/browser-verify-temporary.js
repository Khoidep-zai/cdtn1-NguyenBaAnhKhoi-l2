const { chromium } = require('playwright');
const { spawnSync } = require('node:child_process');
const crypto = require('node:crypto');
const username = `ui_${crypto.randomBytes(6).toString('hex')}`;
const password = crypto.randomBytes(24).toString('base64url');
const docker = ['compose', '-p', 'cdtn1-buoi15-verify-1110', '--env-file', '.env.example', 'exec', '-T', 'api', 'node', '-e'];
function fixture(action) {
  const code = `const {pool}=require('./src/backend/config/db'); const {hashPassword}=require('./src/backend/services/authService'); let raw='';process.stdin.on('data',c=>raw+=c).on('end',async()=>{const x=JSON.parse(raw);try{if(x.action==='create')await pool.query("INSERT INTO app_user(username,password_hash,full_name,role,center_id) VALUES($1,$2,$3,'QUAN_LY_HE_THONG',NULL)",[x.username,await hashPassword(x.password),'UI temporary user']);else await pool.query('DELETE FROM app_user WHERE username=$1',[x.username]);}finally{await pool.end()}})`;
  const r = spawnSync('docker', [...docker, code], { input: JSON.stringify({ action, username, password }), encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`Fixture ${action} failed: ${r.stderr}`);
}
(async () => {
  let browser; const results = []; fixture('create');
  try {
    browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://127.0.0.1:33015', { waitUntil: 'networkidle' });
    await page.locator('#loginUsernameInput').fill(username);
    await page.locator('#loginPasswordInput').fill('invalid-password');
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await page.waitForTimeout(500);
    results.push({ check: 'Sai mật khẩu bị từ chối', pass: await page.locator('#loginErrorMsg').isVisible() });
    await page.locator('#loginPasswordInput').fill(password);
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await page.waitForTimeout(2500);
    const loggedIn = !(await page.locator('#loginModal').isVisible());
    results.push({ check: 'Đăng nhập tài khoản tạm hợp lệ', pass: loggedIn });
    await page.screenshot({ path: 'docs/evidence/browser-after-login-20261111.png', fullPage: true });
    results.push({ check: 'Danh sách dữ liệu mẫu hiển thị', pass: (await page.locator('#ticketsTableBody tr').count()) > 0 });
    await page.getByRole('button', { name: /Chi tiết/ }).first().click();
    await page.waitForTimeout(400);
    results.push({ check: 'Xem chi tiết phiếu', pass: await page.locator('#screen-detail').isVisible() });
    await page.keyboard.press('Alt+n');
    await page.waitForTimeout(400);
    results.push({ check: 'Mở màn hình tạo phiếu', pass: await page.locator('#screen-create').isVisible() });
    await page.getByRole('button', { name: /Quản lý tài khoản/ }).first().click();
    await page.waitForTimeout(500);
    results.push({ check: 'Mở quản lý tài khoản', pass: await page.locator('#userManagementModal').isVisible() });
    await page.locator('#userManagementModal').getByRole('button', { name: 'Đóng' }).click();
    await page.getByRole('button', { name: /Đổi tài khoản/ }).click();
    await page.locator('#loginLogoutButton').click();
    await page.waitForTimeout(500);
    results.push({ check: 'Đăng xuất và trở về màn hình đăng nhập', pass: await page.locator('#loginModal').isVisible() });
    require('node:fs').writeFileSync('docs/evidence/browser-check-20261111.json', JSON.stringify({ date: new Date().toISOString(), results }, null, 2));
    console.log(JSON.stringify(results));
    if (results.some(r => r.pass === false)) process.exitCode = 1;
  } finally { if (browser) await browser.close(); fixture('delete'); }
})().catch(e => { console.error(e); process.exitCode = 1; });
