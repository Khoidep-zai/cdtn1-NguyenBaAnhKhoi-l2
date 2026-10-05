const fs = require('fs');
const path = require('path');
const { pool, testConnection } = require('../config/db');
const { normalizePhone } = require('../utils/phoneHelper');

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsv(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] !== undefined ? values[idx] : '';
    });
    rows.push(obj);
  }
  return rows;
}

async function migrate() {
  console.log('--- KHỞI TẠO MIGRATION CƠ SỞ DỮ LIỆU POSTGRESQL 18 ---');
  
  // 1. Kiểm tra kết nối
  const connStatus = await testConnection();
  if (!connStatus.connected) {
    console.error('❌ Không thể kết nối tới PostgreSQL 18:', connStatus.error);
    process.exit(1);
  }
  console.log(`✔ Kết nối thành công tới Database [${connStatus.database}] trên PostgreSQL 18 (User: ${connStatus.user})`);

  try {
    // 2. Chạy DDL Schema
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    await pool.query(schemaSql);
    console.log('✔ Tạo cấu trúc bảng (schema.sql) thành công: service_center, issue_category, customer, device, ticket, ticket_status_log.');

    // 3. Nạp Master Data: Trung tâm bảo hành (service_center)
    const centerRes = await pool.query('SELECT COUNT(*) FROM service_center');
    if (parseInt(centerRes.rows[0].count, 10) === 0) {
      const centersFile = path.resolve(__dirname, '../../../dataset/service_centers.csv');
      const centers = parseCsv(centersFile);
      for (const c of centers) {
        if (c.center_id && c.center_code) {
          await pool.query(
            `INSERT INTO service_center (center_id, center_code, center_name, thanh_pho) 
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (center_id) DO NOTHING`,
            [Number(c.center_id), c.center_code, c.center_name, c.thanh_pho]
          );
        }
      }
      console.log(`✔ Đã nạp ${centers.length} trung tâm bảo hành vào bảng service_center.`);
    } else {
      console.log(`ℹ Bảng service_center đã có ${centerRes.rows[0].count} bản ghi.`);
    }

    // 4. Nạp Master Data: Danh mục nhóm sự cố (issue_category)
    const catRes = await pool.query('SELECT COUNT(*) FROM issue_category');
    if (parseInt(catRes.rows[0].count, 10) === 0) {
      const catFile = path.resolve(__dirname, '../../../dataset/issue_categories.csv');
      const categories = parseCsv(catFile);
      for (const cat of categories) {
        if (cat.category_id && cat.category_name) {
          await pool.query(
            `INSERT INTO issue_category (category_id, category_name, default_priority, is_active) 
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (category_id) DO NOTHING`,
            [Number(cat.category_id), cat.category_name, cat.default_priority, cat.is_active === 'true']
          );
        }
      }
      console.log(`✔ Đã nạp ${categories.length} nhóm sự cố vào bảng issue_category.`);
    } else {
      console.log(`ℹ Bảng issue_category đã có ${catRes.rows[0].count} bản ghi.`);
    }

    // 5. Nạp Khách hàng (customer) từ customers_raw.csv (67.037 bản ghi)
    const custRes = await pool.query('SELECT COUNT(*) FROM customer');
    if (parseInt(custRes.rows[0].count, 10) === 0) {
      console.log('⏳ Đang chuẩn bị và nạp 67.037 khách hàng vào bảng customer...');
      const custFile = path.resolve(__dirname, '../../../dataset/customers_raw.csv');
      const custContent = fs.readFileSync(custFile, 'utf-8');
      const custLines = custContent.split(/\r?\n/).filter(Boolean);
      const seenPhones = new Set();
      const customers = [];

      for (let i = 1; i < custLines.length; i++) {
        const parts = parseCsvLine(custLines[i]);
        const cid = Number(parts[0]);
        const name = parts[1] || `Khách hàng #${cid}`;
        const rawPhone = parts[2] || '';
        let normPhone = normalizePhone(rawPhone);

        if (!normPhone || normPhone.length !== 10 || seenPhones.has(normPhone)) {
          normPhone = '098' + String(cid).padStart(7, '0');
          while (seenPhones.has(normPhone)) {
            normPhone = '097' + String(cid).padStart(7, '0');
          }
        }
        seenPhones.add(normPhone);

        const email = parts[3] || null;
        const address = parts[4] || 'Việt Nam';
        const createdAt = parts[5] || '2025-01-01';

        customers.push([cid, name, normPhone, email, address, createdAt]);
      }

      const batchSize = 1000;
      for (let i = 0; i < customers.length; i += batchSize) {
        const batch = customers.slice(i, i + batchSize);
        const valuePlaceholders = [];
        const params = [];
        let pIdx = 1;

        for (const c of batch) {
          valuePlaceholders.push(`($${pIdx}, $${pIdx+1}, $${pIdx+2}, $${pIdx+3}, $${pIdx+4}, $${pIdx+5})`);
          params.push(c[0], c[1], c[2], c[3], c[4], c[5]);
          pIdx += 6;
        }

        const query = `
          INSERT INTO customer (customer_id, full_name, phone, email, address, created_at)
          VALUES ${valuePlaceholders.join(', ')}
          ON CONFLICT (customer_id) DO UPDATE SET phone = EXCLUDED.phone;
        `;
        await pool.query(query, params);
      }
      console.log(`✔ Đã nạp thành công ${customers.length} khách hàng vào bảng customer.`);
    } else {
      console.log(`ℹ Bảng customer đã có ${custRes.rows[0].count} bản ghi.`);
    }

    // 6. Nạp Thiết bị (device) và Phiếu bảo hành (ticket) từ dataset
    const ticketRes = await pool.query('SELECT COUNT(*) FROM ticket');
    if (parseInt(ticketRes.rows[0].count, 10) === 0) {
      console.log('⏳ Đang chuẩn bị và nạp 7.800 phiếu bảo hành và thiết bị...');
      
      // Products map
      const prodFile = path.resolve(__dirname, '../../../dataset/products.csv');
      const prodLines = fs.readFileSync(prodFile, 'utf-8').split(/\r?\n/).filter(Boolean);
      const prodMap = new Map();
      for (let i = 1; i < prodLines.length; i++) {
        const parts = parseCsvLine(prodLines[i]);
        prodMap.set(Number(parts[0]), parts[2]);
      }

      // Tickets file
      const ticketFile = path.resolve(__dirname, '../../../dataset/tickets_history.csv');
      const ticketLines = fs.readFileSync(ticketFile, 'utf-8').split(/\r?\n/).filter(Boolean);
      const devices = [];
      const tickets = [];
      const logs = [];

      for (let i = 1; i < ticketLines.length; i++) {
        const t = parseCsvLine(ticketLines[i]);
        const ticketId = Number(t[0]);
        const ticketCode = t[1];
        const customerId = Number(t[2]);
        const serialNo = t[3];
        const productId = Number(t[4]);
        const centerId = Number(t[5] || 1);
        const issueDesc = t[6];
        const categoryId = Number(t[7] || 1);
        const priority = t[8] || 'TRUNG_BINH';
        const status = t[9] || 'MOI';
        const receivedAt = t[11];
        const dueDate = t[12];
        const closedAt = t[13] ? t[13] : null;
        const isWarranty = t[14] === 'true';

        const deviceName = prodMap.get(productId) || 'Điện thoại thông minh';
        const purchaseDate = receivedAt ? receivedAt.split(' ')[0] : '2025-01-01';

        const deviceId = ticketId;
        devices.push([deviceId, customerId, serialNo, purchaseDate, 12, deviceName]);

        tickets.push([
          ticketId, ticketCode, customerId, deviceId, centerId, categoryId,
          issueDesc, priority, status, receivedAt, dueDate, closedAt, isWarranty, receivedAt, receivedAt
        ]);

        logs.push([ticketId, null, 'MOI', receivedAt, 'RECEPTIONIST-01', 'Tiếp nhận thiết bị tại quầy']);
        if (status !== 'MOI') {
          logs.push([ticketId, 'MOI', status, closedAt || receivedAt, 'KTV-AUTO', 'Cập nhật trạng thái xử lý']);
        }
      }

      // Batch insert devices
      const batchSize = 1000;
      for (let i = 0; i < devices.length; i += batchSize) {
        const batch = devices.slice(i, i + batchSize);
        const valuePlaceholders = [];
        const params = [];
        let pIdx = 1;

        for (const d of batch) {
          valuePlaceholders.push(`($${pIdx}, $${pIdx+1}, $${pIdx+2}, $${pIdx+3}, $${pIdx+4}, $${pIdx+5})`);
          params.push(d[0], d[1], d[2], d[3], d[4], d[5]);
          pIdx += 6;
        }

        const query = `
          INSERT INTO device (device_id, customer_id, serial_no, purchase_date, warranty_months, device_name)
          VALUES ${valuePlaceholders.join(', ')}
          ON CONFLICT (device_id) DO NOTHING;
        `;
        await pool.query(query, params);
      }
      console.log(`✔ Đã nạp ${devices.length} thiết bị vào bảng device.`);

      // Batch insert tickets
      for (let i = 0; i < tickets.length; i += batchSize) {
        const batch = tickets.slice(i, i + batchSize);
        const valuePlaceholders = [];
        const params = [];
        let pIdx = 1;

        for (const t of batch) {
          valuePlaceholders.push(`($${pIdx}, $${pIdx+1}, $${pIdx+2}, $${pIdx+3}, $${pIdx+4}, $${pIdx+5}, $${pIdx+6}, $${pIdx+7}, $${pIdx+8}, $${pIdx+9}, $${pIdx+10}, $${pIdx+11}, $${pIdx+12}, $${pIdx+13}, $${pIdx+14})`);
          params.push(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8], t[9], t[10], t[11], t[12], t[13], t[14]);
          pIdx += 15;
        }

        const query = `
          INSERT INTO ticket (
            ticket_id, ticket_code, customer_id, device_id, center_id, category_id,
            issue_desc, priority, status, received_at, due_date, closed_at, is_warranty, created_at, updated_at
          )
          VALUES ${valuePlaceholders.join(', ')}
          ON CONFLICT (ticket_id) DO NOTHING;
        `;
        await pool.query(query, params);
      }
      console.log(`✔ Đã nạp ${tickets.length} phiếu bảo hành vào bảng ticket.`);

      // Batch insert logs
      for (let i = 0; i < logs.length; i += batchSize) {
        const batch = logs.slice(i, i + batchSize);
        const valuePlaceholders = [];
        const params = [];
        let pIdx = 1;

        for (const l of batch) {
          valuePlaceholders.push(`($${pIdx}, $${pIdx+1}, $${pIdx+2}, $${pIdx+3}, $${pIdx+4}, $${pIdx+5})`);
          params.push(l[0], l[1], l[2], l[3], l[4], l[5]);
          pIdx += 6;
        }

        const query = `
          INSERT INTO ticket_status_log (ticket_id, from_status, to_status, changed_at, changed_by, note)
          VALUES ${valuePlaceholders.join(', ')};
        `;
        await pool.query(query, params);
      }
      console.log(`✔ Đã nạp ${logs.length} bản ghi lịch sử trạng thái vào bảng ticket_status_log.`);

      // Cập nhật Sequences
      await pool.query(`
        SELECT setval('customer_customer_id_seq', (SELECT MAX(customer_id) FROM customer));
        SELECT setval('device_device_id_seq', (SELECT MAX(device_id) FROM device));
        SELECT setval('ticket_ticket_id_seq', (SELECT MAX(ticket_id) FROM ticket));
      `);
    } else {
      console.log(`ℹ Bảng ticket đã có ${ticketRes.rows[0].count} bản ghi.`);
    }

    console.log('✅ Migration và nạp dữ liệu PostgreSQL 18 hoàn tất 100%! Có thể dùng pgAdmin 4 truy vấn ngay.');
  } catch (err) {
    console.error('❌ Lỗi trong quá trình migration:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  migrate();
}

module.exports = migrate;
