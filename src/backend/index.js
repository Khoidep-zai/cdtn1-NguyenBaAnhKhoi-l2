const express = require('express');
const path = require('path');
const config = require('./config');
const ticketRoutes = require('./routes/ticketRoutes');

const app = express();
const PORT = config.port;

app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Endpoint Smoke Test
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Phân hệ quản lý tiếp nhận bảo hành (L2)
app.use('/api/tickets', ticketRoutes);

// Fallback to frontend index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
