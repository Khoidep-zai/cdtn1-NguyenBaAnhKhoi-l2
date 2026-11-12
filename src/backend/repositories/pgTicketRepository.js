const { AsyncLocalStorage } = require('node:async_hooks');
const { pool } = require('../config/db');
const { AppError } = require('../errors/AppError');
const memRepo = require('./ticketRepository');

const context = new AsyncLocalStorage();
const projection = `SELECT t.*, c.full_name AS customer_name, c.phone AS customer_phone,
 c.address AS customer_address, d.serial_no, d.device_name AS product_name
 FROM ticket t JOIN customer c ON c.customer_id=t.customer_id
 LEFT JOIN device d ON d.device_id=t.device_id`;
const closed = "('HOAN_TAT','DA_BAN_GIAO','DA_DONG','DA_HUY')";

function map(row) {
 if (!row) return null;
 const t = {
   ...row,
   id: `TKT-${row.ticket_id}`,
   serial_imei: row.serial_no,
   issue_description: row.issue_desc,
   issue_category_id: String(row.category_id || ''),
   store_id: `STORE_0${row.center_id}`,
 };
 for (const [key, value] of Object.entries(t)) {
   if (value instanceof Date) t[key] = value.toISOString();
 }
 return t;
}

function query(sql, params) {
 return (context.getStore() || pool).query(sql, params);
}

async function transaction(operation) {
 if (context.getStore()) return operation();
 const client = await pool.connect();
 try {
  await client.query('BEGIN');
  const result = await context.run(client, operation);
  await client.query('COMMIT');
  return result;
 } catch (error) {
  await client.query('ROLLBACK');
  if (error.code === '23505' && error.constraint === 'uq_ticket_open_device') {
    throw new AppError('PHIEU_DANG_MO', 'Thiết bị đã có phiếu đang xử lý.');
  }
  throw error;
 } finally {
   client.release();
 }
}

const repo = {
 query,
 transaction,
 async findById(id) {
  const numId = String(id).replace(/^TKT-/, '');
  if (/^\d+$/.test(numId)) {
    const result = await query(
      `${projection} WHERE t.ticket_id::text=$1 OR t.ticket_code=$2${context.getStore() ? ' FOR UPDATE OF t' : ''}`,
      [numId, String(id)]
    );
    if (result.rows[0]) return map(result.rows[0]);
  } else {
    const result = await query(
      `${projection} WHERE t.ticket_code=$1${context.getStore() ? ' FOR UPDATE OF t' : ''}`,
      [String(id)]
    );
    if (result.rows[0]) return map(result.rows[0]);
  }
  return memRepo.findById(id);
 },
 async findBySerial(serial) {
  // All create paths take the same transaction advisory lock, including absent devices.
  if (context.getStore()) await query('SELECT pg_advisory_xact_lock(hashtextextended(lower(btrim($1)),0))', [serial]);
  const dbTickets = (await query(`${projection} WHERE lower(btrim(d.serial_no))=lower(btrim($1))`, [serial])).rows.map(map);
  if (dbTickets.length > 0) return dbTickets;
  return memRepo.findBySerial(serial);
 },
 async nextCounter() {
  return (await query("SELECT nextval('ticket_ticket_id_seq') AS n")).rows[0].n;
 },
 async save(t) {
  let device = (await query('SELECT device_id FROM device WHERE lower(btrim(serial_no))=lower(btrim($1))', [t.serial_no])).rows[0];
  if (!device) {
    device = (await query(
      'INSERT INTO device(customer_id,serial_no,device_name) VALUES($1,$2,$3) RETURNING device_id',
      [t.customer_id, t.serial_no, t.product_name]
    )).rows[0];
  }
  await query(
    `INSERT INTO ticket(ticket_id,ticket_code,customer_id,device_id,center_id,category_id,issue_desc,priority,status,
    received_at,due_date,closed_at,is_warranty,warranty_verified,created_at,updated_at,product_id)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
    [
      t.ticket_id, t.ticket_code, t.customer_id, device.device_id, t.center_id, t.category_id,
      t.issue_desc, t.priority, t.status, t.received_at, t.due_date, t.closed_at,
      t.is_warranty, t.warranty_verified, t.created_at, t.updated_at, t.product_id,
    ]
  );
  // Also keep in in-memory repo for fast local lookups
  try { memRepo.save(t); } catch (e) {}
  return t;
 },
 async update(id, updates) {
  const ticket = await repo.findById(id);
  if (!ticket) return null;
  const allowed = [
    'status', 'category_id', 'priority', 'due_date', 'closed_at',
    'warranty_exception_approved', 'service_consent', 'service_consent_by', 'service_consent_at',
  ];
  const entries = Object.entries(updates).filter(([key]) => allowed.includes(key));
  const numId = String(ticket.ticket_id || id).replace(/^TKT-/, '');
  const isNum = /^\d+$/.test(numId);
  const check = isNum ? (await query('SELECT 1 FROM ticket WHERE ticket_id=$1', [numId])).rows.length > 0 : false;
  if (check) {
    if (entries.length) {
      await query(
        `UPDATE ticket SET ${entries.map(([key], i) => `${key}=$${i + 2}`).join(',')},updated_at=now() WHERE ticket_id=$1`,
        [numId, ...entries.map(([, v]) => v)]
      );
    }
    return repo.findById(ticket.ticket_id || id);
  } else {
    return memRepo.update(id, updates);
  }
 },
 async addStatusLog(log) {
  const numId = String(log.ticket_id).replace(/^TKT-/, '');
  const isNum = /^\d+$/.test(numId);
  const check = isNum ? (await query('SELECT 1 FROM ticket WHERE ticket_id=$1', [numId])).rows.length > 0 : false;
  if (check) {
    return (await query(
      'INSERT INTO ticket_status_log(ticket_id,from_status,to_status,changed_by,note,changed_at) VALUES($1,$2,$3,$4,$5,COALESCE($6::timestamptz,now())) RETURNING *',
      [numId, log.from_status, log.to_status, log.changed_by, log.note, log.changed_at || null]
    )).rows[0];
  } else {
    return memRepo.addStatusLog(log);
  }
 },
 async getStatusLogs(id) {
  const numId = String(id).replace(/^TKT-/, '');
  if (/^\d+$/.test(numId)) {
    const dbLogs = (await query(
      'SELECT *,from_status AS old_status,to_status AS new_status,changed_by AS updated_by FROM ticket_status_log WHERE ticket_id=$1 ORDER BY changed_at,log_id',
      [numId]
    )).rows;
    if (dbLogs.length > 0) return dbLogs;
  }
  return memRepo.getStatusLogs(id);
 },
 async findAll(filters = {}, page = 1, limit = 50) {
  const params = [];
  const clauses = [];
  const add = (sql, value) => {
    params.push(value);
    clauses.push(sql.replace('?', `$${params.length}`));
  };
  if (filters.center_id && filters.center_id !== 'ALL') add('t.center_id=?', Number(filters.center_id));
  else if (filters.store_id && filters.store_id !== 'ALL') add('t.center_id=?', Number(String(filters.store_id).replace(/\D/g, '')));
  const scope = clauses.length ? ' WHERE ' + clauses.join(' AND ') : '';
  const summary = (await query(`SELECT count(*)::int AS total,count(*) FILTER(WHERE status='MOI')::int AS new,
   count(*) FILTER(WHERE status IN ('DA_PHAN_CONG','DANG_XU_LY','CHO_LINH_KIEN'))::int AS processing,
   count(*) FILTER(WHERE status NOT IN ${closed} AND (priority='CAO' OR due_date<now()))::int AS urgent FROM ticket t${scope}`, params)).rows[0];
  if (filters.status && filters.status !== 'ALL') add('t.status=?', String(filters.status).toUpperCase());
  if (filters.overdue === true || filters.overdue === 'true') clauses.push(`t.status NOT IN ${closed} AND t.due_date<now()`);
  const normalize = (v) => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().trim();
  const alphabet = 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ';
  const ascii = 'a'.repeat(17) + 'e'.repeat(11) + 'i'.repeat(5) + 'o'.repeat(17) + 'u'.repeat(11) + 'y'.repeat(5) + 'd';
  for (const term of normalize(filters.q).split(/\s+/).filter(Boolean)) {
   add(`strpos(translate(lower(concat_ws(' ',t.ticket_code,'TKT-'||t.ticket_id,c.full_name,c.phone,d.serial_no,d.device_name,t.issue_desc)),'${alphabet}','${ascii}'),?)>0`, term);
  }
  const where = clauses.length ? ' WHERE ' + clauses.join(' AND ') : '';
  const from = ' FROM ticket t JOIN customer c ON c.customer_id=t.customer_id LEFT JOIN device d ON d.device_id=t.device_id';
  const total = (await query('SELECT count(*)::int AS n' + from + where, params)).rows[0].n;
  const pageNum = Math.max(1, Math.floor(Number(page) || 1));
  const limitNum = limit === 'all' ? Math.max(total, 1) : Math.min(10000, Math.max(1, Math.floor(Number(limit) || 50)));
  const offset = (pageNum - 1) * limitNum;
  const data = (await query(projection + where + ` ORDER BY t.created_at DESC,t.ticket_id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limitNum, offset])).rows.map(map);

  if (total === 0) {
    const memRes = memRepo.findAll(filters, page, limit);
    if (memRes && memRes.total > 0) {
      return memRes;
    }
  }

  return { data, total, summary, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) || 1, offset };
 },
};

module.exports = repo;
