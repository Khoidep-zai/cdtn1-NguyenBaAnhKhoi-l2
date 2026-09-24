const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Endpoint Smoke Test
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
