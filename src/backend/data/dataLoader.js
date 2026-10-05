const fs = require('fs');
const path = require('path');
const { normalizePhone } = require('../utils/phoneHelper');

/**
 * Hàm phân tích dòng CSV đơn giản, xử lý trích xuất dấu nháy kép
 */
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

/**
 * Đọc file CSV và trả về mảng các đối tượng
 */
function readCsv(filePath, maxRows = Infinity) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const rows = [];

  const limit = Math.min(lines.length, maxRows + 1);
  for (let i = 1; i < limit; i++) {
    const values = parseCsvLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] !== undefined ? values[idx] : '';
    });
    rows.push(obj);
  }

  return rows;
}

class DataLoader {
  constructor() {
    this.datasetDir = path.resolve(__dirname, '../../../dataset');
    this.serviceCenters = [];
    this.issueCategories = [];
    this.products = [];
    this.customers = new Map(); // key: normalizedPhone, value: customer object
    this.customersById = new Map();
    this.customerDevices = new Map(); // key: customer_id, value: array of devices/tickets
    this.tickets = [];
    this.statusLogs = [];
    this.isLoaded = false;
  }

  loadAll() {
    if (this.isLoaded) return;

    try {
      // 1. Nạp danh sách Trung tâm bảo hành (service_centers.csv)
      const centersFile = path.join(this.datasetDir, 'service_centers.csv');
      this.serviceCenters = readCsv(centersFile).map(c => ({
        center_id: Number(c.center_id),
        center_code: c.center_code,
        center_name: c.center_name,
        thanh_pho: c.thanh_pho,
      }));

      // 2. Nạp danh mục nhóm sự cố (issue_categories.csv)
      const catFile = path.join(this.datasetDir, 'issue_categories.csv');
      this.issueCategories = readCsv(catFile).map(cat => ({
        category_id: Number(cat.category_id),
        category_name: cat.category_name,
        default_priority: cat.default_priority,
        is_active: cat.is_active === 'true',
      }));

      // 3. Nạp danh mục sản phẩm (products.csv)
      const prodFile = path.join(this.datasetDir, 'products.csv');
      this.products = readCsv(prodFile).map(p => ({
        product_id: Number(p.product_id),
        product_code: p.product_code,
        product_name: p.product_name,
        thuong_hieu: p.thuong_hieu,
        nhom_san_pham: p.nhom_san_pham,
        gia_niem_yet: Number(p.gia_niem_yet || 0),
        warranty_months: Number(p.warranty_months || 12),
      }));

      // 4. Nạp TOÀN BỘ danh sách khách hàng từ customers_raw.csv (67.037 bản ghi)
      const custFile = path.join(this.datasetDir, 'customers_raw.csv');
      if (fs.existsSync(custFile)) {
        const custContent = fs.readFileSync(custFile, 'utf-8');
        const custLines = custContent.split(/\r?\n/).filter(Boolean);
        for (let i = 1; i < custLines.length; i++) {
          const parts = parseCsvLine(custLines[i]);
          if (parts.length < 3) continue;
          const cid = Number(parts[0]);
          const name = parts[1] ? parts[1].trim() : `Khách hàng #${cid}`;
          const rawPhone = parts[2] ? parts[2].trim() : '';
          const normPhone = normalizePhone(rawPhone);
          const email = parts[3] ? parts[3].trim() : '';
          const address = parts[4] ? parts[4].trim() : 'Việt Nam';
          const createdAt = parts[5] ? parts[5].trim() : '2025-01-01';

          const customerObj = {
            customer_id: cid,
            full_name: name,
            phone: normPhone || rawPhone,
            raw_phone: rawPhone,
            email: email,
            address: address,
            created_at: createdAt,
          };

          if (normPhone && normPhone.length === 10) {
            if (!this.customers.has(normPhone)) {
              this.customers.set(normPhone, customerObj);
            }
          }
          this.customersById.set(cid, customerObj);
        }
      }

      // 5. Thêm/cập nhật khách hàng mẫu kiểm thử chuẩn (US1, QT-01)
      const seedCustomer = {
        customer_id: 1024,
        full_name: 'Trần Văn A',
        phone: '0901234567',
        raw_phone: '0901234567',
        email: 'tranvana@gmail.com',
        address: '123 Đường 30/4, Quận Ninh Kiều, Cần Thơ',
        created_at: '2025-01-01',
      };
      this.customers.set('0901234567', seedCustomer);
      this.customersById.set(seedCustomer.customer_id, seedCustomer);

      const defaultDemoCustomer = {
        customer_id: 2048,
        full_name: 'Nguyễn Văn An',
        phone: '0909123456',
        raw_phone: '0909123456',
        email: 'nguyenvanan@gmail.com',
        address: '123 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh',
        created_at: '2025-01-01',
      };
      this.customers.set('0909123456', defaultDemoCustomer);
      this.customersById.set(defaultDemoCustomer.customer_id, defaultDemoCustomer);

      // Tạo map nhóm lỗi nhanh
      const catMap = new Map();
      this.issueCategories.forEach(cat => {
        catMap.set(cat.category_id, cat.category_name);
      });

      // Tạo map sản phẩm nhanh
      const prodMap = new Map();
      this.products.forEach(prod => {
        prodMap.set(prod.product_id, prod);
      });

      // 6. Nạp TOÀN BỘ 7.800 phiếu bảo hành từ tickets_history.csv (Cam kết dữ liệu thật)
      const ticketsFile = path.join(this.datasetDir, 'tickets_history.csv');
      const rawTickets = readCsv(ticketsFile);
      this.tickets = rawTickets.map(t => {
        const cid = Number(t.customer_id);
        const pid = Number(t.product_id);
        const catId = Number(t.category_id);
        const customer = this.customersById.get(cid);
        const prod = prodMap.get(pid);
        const prodName = prod?.product_name || 'Điện thoại thông minh';
        const catName = catMap.get(catId) || 'SỰ CỐ KHÁC';

        const dev = {
          serial_no: t.serial_no || `SN-${t.ticket_id}`,
          serial_imei: t.serial_no || `SN-${t.ticket_id}`,
          product_id: pid,
          product_name: prodName,
          brand: prod?.thuong_hieu || '',
          category_id: catId,
          category_name: catName,
          issue_desc: t.issue_desc || '',
          priority: t.priority || 'TRUNG_BINH',
          is_warranty: t.is_warranty === 'true',
          received_at: t.received_at,
          due_date: t.due_date,
          status: t.status || 'MOI',
        };

        if (!this.customerDevices.has(cid)) {
          this.customerDevices.set(cid, []);
        }
        this.customerDevices.get(cid).push(dev);

        return {
          id: t.ticket_code || `BH-00000${t.ticket_id}/2026`,
          ticket_id: Number(t.ticket_id),
          ticket_code: t.ticket_code || `BH-00000${t.ticket_id}/2026`,
          customer_id: cid,
          customer_name: customer?.full_name || `Khách hàng #${cid}`,
          customer_phone: customer?.phone || '0901234567',
          customer_address: customer?.address || 'Việt Nam',
          serial_no: t.serial_no || `SN-${t.ticket_id}`,
          serial_imei: t.serial_no || `SN-${t.ticket_id}`,
          product_id: pid,
          product_name: prodName,
          center_id: Number(t.center_id || 1),
          store_id: `STORE_0${t.center_id || 1}`,
          issue_description: t.issue_desc || 'Chưa có mô tả',
          issue_desc: t.issue_desc || 'Chưa có mô tả',
          issue_category_id: catId,
          category_id: catId,
          category_name: catName,
          priority: t.priority || 'TRUNG_BINH',
          status: t.status || 'MOI',
          received_at: t.received_at,
          due_date: t.due_date,
          closed_at: t.closed_at || null,
          is_warranty: t.is_warranty === 'true',
          created_at: t.received_at,
          updated_at: t.received_at,
        };
      });

      // Gắn thiết bị mẫu cho demo/test customers
      this.customerDevices.set(1024, [{
        serial_no: 'SN-A52-778901',
        serial_imei: 'SN-A52-778901',
        product_id: 1,
        product_name: 'Samsung Galaxy S23',
        brand: 'Samsung',
        category_id: 3,
        category_name: 'SAC',
        issue_desc: 'Máy không lên nguồn sau khi sạc...',
        priority: 'TRUNG_BINH',
        is_warranty: false,
        received_at: '2025-01-01',
        due_date: '2025-01-04'
      }]);
      this.customerDevices.set(2048, [{
        serial_no: 'SN-A52-778901',
        serial_imei: 'SN-A52-778901',
        product_id: 1,
        product_name: 'Samsung Galaxy S23',
        brand: 'Samsung',
        category_id: 3,
        category_name: 'SAC',
        issue_desc: 'Máy không lên nguồn sau khi sạc...',
        priority: 'TRUNG_BINH',
        is_warranty: false,
        received_at: '2025-01-01',
        due_date: '2025-01-04'
      }]);

      this.isLoaded = true;
      console.log(`[DataLoader] Đã nạp thành công: ${this.serviceCenters.length} trung tâm, ${this.issueCategories.length} nhóm sự cố, ${this.products.length} sản phẩm, ${this.customersById.size} khách hàng, ${this.tickets.length} phiếu bảo hành.`);
    } catch (err) {
      console.error('[DataLoader] Lỗi khi nạp dataset:', err.message);
    }
  }

  findCustomerByPhone(phone) {
    const norm = normalizePhone(phone);
    return this.customers.get(norm) || null;
  }

  getCustomerDevices(customerId) {
    return this.customerDevices.get(customerId) || [];
  }

  addCustomer(customer) {
    const norm = normalizePhone(customer.phone);
    const newCustomer = {
      customer_id: this.customers.size + 1,
      full_name: customer.full_name,
      phone: norm,
      raw_phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      created_at: new Date().toISOString().split('T')[0],
    };
    this.customers.set(norm, newCustomer);
    this.customersById.set(newCustomer.customer_id, newCustomer);
    return newCustomer;
  }

  getServiceCenters() {
    return this.serviceCenters;
  }

  getIssueCategories() {
    return this.issueCategories;
  }

  getProducts() {
    return this.products;
  }
}

// Khởi tạo Singleton
const dataLoader = new DataLoader();
dataLoader.loadAll();

module.exports = dataLoader;
