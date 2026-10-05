const { Pool } = require('pg');
const config = require('./index');

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL Error] Lỗi kết nối CSDL bất ngờ:', err.message);
});

/**
 * Kiểm tra kết nối tới cơ sở dữ liệu PostgreSQL
 */
async function testConnection() {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT version(), current_database(), current_user');
    client.release();
    return {
      connected: true,
      database: res.rows[0].current_database,
      user: res.rows[0].current_user,
      version: res.rows[0].version,
    };
  } catch (err) {
    return {
      connected: false,
      error: err.message,
    };
  }
}

/**
 * Hàm truy vấn SQL tiện ích
 */
function query(text, params) {
  return pool.query(text, params);
}

/**
 * Đóng kết nối Pool
 */
async function closePool() {
  if (pool && !pool.ending && !pool.ended) {
    await pool.end();
  }
}

module.exports = {
  pool,
  query,
  testConnection,
  closePool,
};
