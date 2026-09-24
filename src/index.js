const express = require('express');
const config = require('./config');
const ticketRoutes = require('./routes/ticketRoutes');

const app = express();
const PORT = config.port;

app.use(express.json());

// Endpoint Smoke Test (Buổi 2)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Phân hệ quản lý tiếp nhận bảo hành (L2)
app.use('/api/tickets', ticketRoutes);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
