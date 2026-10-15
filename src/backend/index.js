const express = require('express');
const path = require('path');
const config = require('./config');
const ticketRoutes = require('./routes/ticketRoutes');
const customerRoutes = require('./routes/customerRoutes');
const catalogRoutes = require('./routes/catalogRoutes');

const { logger, ganRequestId } = require('./utils/logger');

const app = express();
const PORT = config.port;

// Giới hạn kích thước thân yêu cầu chống DoS cạn bộ nhớ (chuẩn bảo mật mekong-se-baohanh)
app.use(express.json({ limit: '256kb' }));
app.use(ganRequestId);

// Phục vụ giao diện tĩnh Frontend (wireframes / SPA)
app.use(express.static(path.join(__dirname, '../frontend')));

// Endpoint Smoke Test
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Endpoint kiểm tra trạng thái kết nối cơ sở dữ liệu PostgreSQL
app.get('/health/db', async (req, res) => {
  const { testConnection } = require('./config/db');
  const dbStatus = await testConnection();
  if (dbStatus.connected) {
    return res.status(200).json({ status: 'ok', database: dbStatus, requestId: req.requestId });
  }
  return res.status(503).json({ status: 'error', database: dbStatus, requestId: req.requestId });
});

// Phân hệ quản lý tiếp nhận bảo hành (L2)
app.use('/api/tickets', ticketRoutes);

// Phân hệ tra cứu và đăng ký khách hàng (FR1 / US1 / QT-01)
app.use('/api/customers', customerRoutes);

// Phân hệ danh mục dữ liệu master data (Categories, Centers, Products)
app.use('/api', catalogRoutes);

// Fallback trang chủ trả về Frontend index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Middleware xử lý lỗi hệ thống cuối cùng: KHÔNG để lộ vết ngăn xếp (stack trace) ra client
app.use((err, req, res, _next) => {
  logger.error('Lỗi không lường trước', {
    requestId: req.requestId,
    loai: err.name,
    thong_diep: err.message,
  });
  res.status(err.statusCode || 500).json({
    success: false,
    error: 'LOI_HE_THONG',
    message: 'Đã xảy ra lỗi không mong đợi. Vui lòng thử lại sau.',
    requestId: req.requestId,
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Mekong Mobile CRM Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
