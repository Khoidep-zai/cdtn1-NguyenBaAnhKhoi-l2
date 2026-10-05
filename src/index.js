const app = require('./backend/index');
const config = require('./backend/config');
const { testConnection } = require('./backend/config/db');

const PORT = config.port || 3000;

if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`Mekong Mobile CRM Server running on http://localhost:${PORT}`);
    const dbStatus = await testConnection();
    if (dbStatus.connected) {
      console.log(`✔ PostgreSQL 18: Đã kết nối cơ sở dữ liệu [${dbStatus.database}] tại port ${config.db.port}`);
    } else {
      console.warn(`⚠ PostgreSQL: Chưa thể kết nối (${dbStatus.error}). Hệ thống fallback sử dụng dữ liệu nạp sẵn.`);
    }
  });
}

module.exports = app;
