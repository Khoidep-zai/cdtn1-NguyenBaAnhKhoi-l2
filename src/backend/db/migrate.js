const fs = require('fs');
const path = require('path');
const { pool, testConnection } = require('../config/db');

function parseCsv(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
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

    console.log('✅ Migration cơ sở dữ liệu hoàn tất thành công 100%!');
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
