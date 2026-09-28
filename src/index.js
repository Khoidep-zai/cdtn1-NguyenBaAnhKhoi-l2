const app = require('./backend/index');
const config = require('./backend/config');

const PORT = config.port || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Mekong Mobile CRM Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
