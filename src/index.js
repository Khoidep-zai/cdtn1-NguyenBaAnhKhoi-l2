const config = require('./backend/config');
if (require.main === module) config.validateStartup();
const app = require('./backend/index');
const { testConnection } = require('./backend/config/db');

const PORT = config.port || 3000;

if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`Mekong Mobile CRM Server running on http://localhost:${PORT}`);
    const dbStatus = await testConnection();
    if (dbStatus.connected) {
      console.log('✔ PostgreSQL: Đã kết nối cơ sở dữ liệu.');
    } else {
      console.warn('⚠ PostgreSQL: Chưa thể kết nối. Các chức năng cần CSDL chưa sẵn sàng.');
    }
  });
}

module.exports = app;
