const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pool } = require('../src/backend/config/db');

test('PostgreSQL: ràng buộc Serial và một phiếu đang mở trên mỗi thiết bị', async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`CREATE TEMP TABLE device (device_id bigint PRIMARY KEY, serial_no text NOT NULL);
      CREATE TEMP TABLE ticket (ticket_id bigint PRIMARY KEY, device_id bigint, status text NOT NULL)`);
    await client.query(fs.readFileSync(path.join(__dirname, '../src/backend/db/ticket-integrity.sql'), 'utf8'));
    await client.query("INSERT INTO device VALUES (1,'TEST-001')");
    await client.query("INSERT INTO ticket(ticket_id,device_id,status) VALUES (1,1,'MOI')");
    await client.query('SAVEPOINT conflict_test');
    await assert.rejects(client.query("INSERT INTO ticket(ticket_id,device_id,status) VALUES (2,1,'DANG_XU_LY')"), { code: '23505' });
    await client.query('ROLLBACK TO SAVEPOINT conflict_test');
    await client.query("UPDATE ticket SET status='HOAN_TAT' WHERE ticket_id=1");
    await client.query("UPDATE ticket SET status='DA_BAN_GIAO' WHERE ticket_id=1");
    await client.query("INSERT INTO ticket(ticket_id,device_id,status) VALUES (2,1,'MOI')");
    await client.query('SAVEPOINT serial_test');
    await assert.rejects(client.query("INSERT INTO device VALUES (2,' test-001 ')"), { code: '23505' });
    await client.query('ROLLBACK TO SAVEPOINT serial_test');
  } finally {
    await client.query('ROLLBACK');
    client.release();
    await pool.end();
  }
});
