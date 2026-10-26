const express = require('express');
const path = require('path');
const config = require('./config');
const ticketRoutes = require('./routes/ticketRoutes');
const customerRoutes = require('./routes/customerRoutes');
const catalogRoutes = require('./routes/catalogRoutes');
const authRoutes = require('./routes/authRoutes');
const { authenticate } = require('./middlewares/authenticate');

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
app.use('/api/auth', authRoutes);
app.use('/api/tickets', authenticate, ticketRoutes);

// Phân hệ tra cứu và đăng ký khách hàng (FR1 / US1 / QT-01)
app.use('/api/customers', authenticate, customerRoutes);

// Phân hệ danh mục dữ liệu master data (Categories, Centers, Products)
app.use('/api', authenticate, catalogRoutes);

// Fallback trang chủ trả về Frontend index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const { AppError, LoiNghiepVu, LoiTruyCapDuLieu } = require('./errors/AppError');

// Middleware xử lý lỗi duy nhất xuyên lớp (Chuẩn Buổi 11 SE - Slide 24 & Tài liệu tự học A3)
app.use((err, req, res, _next) => {
  if (err instanceof AppError || err instanceof LoiNghiepVu || err.name === 'AppError' || err.name === 'LoiNghiepVu') {
    logger.info('Vi phạm quy tắc nghiệp vụ', {
      requestId: req.requestId,
      ma: err.code || err.ma,
      thong_diep: err.message,
    });
    const status = err.httpStatus || err.statusCode || (err.code === 'PHIEU_DANG_MO' ? 409 : err.code === 'KHACH_KHONG_TON_TAI' ? 404 : 400);
    return res.status(status).json({
      success: false,
      error: err.code || err.ma,
      message: err.message,
      chi_tiet: err.chiTiet,
      requestId: req.requestId,
    });
  }

  // Lỗi hạ tầng CSDL hoặc lỗi hệ thống không lường trước (log MỘT lần tại middleware)
  const isDbError = err instanceof LoiTruyCapDuLieu || err.name === 'LoiTruyCapDuLieu' || err.code === 'ECONNREFUSED';
  const status = isDbError ? 503 : (err.statusCode || 500);

  logger.error('Lỗi hệ thống', {
    requestId: req.requestId,
    loai: err.name,
    thong_diep: err.message,
    err,
  });

  // Tuyệt đối KHÔNG trả err.stack, câu SQL hay tên bảng cho client (che giấu chi tiết kỹ thuật)
  res.status(status).json({
    success: false,
    error: isDbError ? 'LOI_CSDL' : 'LOI_HE_THONG',
    message: `Hệ thống đang gặp sự cố. Vui lòng thử lại. Mã tra cứu: ${req.requestId}`,
    requestId: req.requestId,
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Mekong Mobile CRM Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
