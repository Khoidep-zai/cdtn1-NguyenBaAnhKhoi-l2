const express = require('express');
const path = require('path');
const config = require('./config');
const ticketRoutes = require('./routes/ticketRoutes');
const customerRoutes = require('./routes/customerRoutes');
const catalogRoutes = require('./routes/catalogRoutes');

const app = express();
const PORT = config.port;

app.use(express.json());

// Phục vụ giao diện tĩnh Frontend (wireframes / SPA)
app.use(express.static(path.join(__dirname, '../frontend')));

// Endpoint Smoke Test
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
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

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Mekong Mobile CRM Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
