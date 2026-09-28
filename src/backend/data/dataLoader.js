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

      // 4. Nạp khách hàng mẫu từ customers_raw.csv (nạp 5.000 dòng đầu để tối ưu tốc độ và bộ nhớ)
      const custFile = path.join(this.datasetDir, 'customers_raw.csv');
      const rawCustomers = readCsv(custFile, 10000);
      rawCustomers.forEach(cust => {
        const normPhone = normalizePhone(cust.so_dien_thoai);
        if (normPhone && normPhone.length === 10) {
          const customerObj = {
            customer_id: Number(cust.record_id),
            full_name: cust.ho_ten,
            phone: normPhone,
            raw_phone: cust.so_dien_thoai,
            email: cust.email,
            address: cust.dia_chi,
            created_at: cust.ngay_tao,
          };
          if (!this.customers.has(normPhone)) {
            this.customers.set(normPhone, customerObj);
          }
          this.customersById.set(customerObj.customer_id, customerObj);
        }
      });

      // 5. Thêm một số khách hàng mẫu cố định để kiểm thử (US1, QT-01)
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

      // 6. Nạp một số phiếu bảo hành từ tickets_history.csv
      const ticketsFile = path.join(this.datasetDir, 'tickets_history.csv');
      const rawTickets = readCsv(ticketsFile, 100);
      this.tickets = rawTickets.map(t => ({
        id: t.ticket_code || `BH-00000${t.ticket_id}/2026`,
        ticket_id: Number(t.ticket_id),
        ticket_code: t.ticket_code,
        customer_id: Number(t.customer_id),
        customer_name: this.customersById.get(Number(t.customer_id))?.full_name || 'Khách hàng',
        customer_phone: this.customersById.get(Number(t.customer_id))?.phone || '0900000000',
        serial_no: t.serial_no,
        serial_imei: t.serial_no,
        product_id: Number(t.product_id),
        product_name: this.products.find(p => p.product_id === Number(t.product_id))?.product_name || 'Thiết bị điện thoại',
        center_id: Number(t.center_id),
        store_id: `STORE_0${t.center_id}`,
        issue_description: t.issue_desc,
        issue_category_id: t.category_id,
        category_id: Number(t.category_id),
        priority: t.priority,
        status: t.status,
        received_at: t.received_at,
        due_date: t.due_date,
        closed_at: t.closed_at || null,
        is_warranty: t.is_warranty === 'true',
        created_at: t.received_at,
        updated_at: t.received_at,
      }));

      this.isLoaded = true;
      console.log(`[DataLoader] Đã nạp thành công: ${this.serviceCenters.length} trung tâm, ${this.issueCategories.length} nhóm sự cố, ${this.products.length} sản phẩm, ${this.customers.size} khách hàng.`);
    } catch (err) {
      console.error('[DataLoader] Lỗi khi nạp dataset:', err.message);
    }
  }

  findCustomerByPhone(phone) {
    const norm = normalizePhone(phone);
    return this.customers.get(norm) || null;
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
