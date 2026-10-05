/**
 * customerRepository.js — Cài đặt Repository lưu trữ In-Memory cho Customer
 *
 * Thuộc: REPOSITORY Pattern — Layer 4 (Data Access & Persistence)
 * Service/Controller gọi qua giao diện này, không trực tiếp vào dataLoader.
 */

const dataLoader = require('../data/dataLoader');
const { normalizePhone } = require('../utils/phoneHelper');

class CustomerRepository {
  constructor() {
    this._customers = [];
    this._initialized = false;
  }

  /**
   * Khởi tạo dữ liệu từ dataset
   * @private
   */
  _ensureInit() {
    if (!this._initialized) {
      this._customers = dataLoader.customers ? [...dataLoader.customers] : [];
      this._initialized = true;
    }
  }

  /**
   * Tìm khách hàng theo số điện thoại (QT-01, US1, FR1)
   * @param {string} phone
   * @returns {object|null}
   */
  findByPhone(phone) {
    this._ensureInit();
    const normalized = normalizePhone(phone);
    return this._customers.find(
      (c) => normalizePhone(c.phone) === normalized
    ) || null;
  }

  /**
   * Tìm khách hàng theo ID
   * @param {number|string} customerId
   * @returns {object|null}
   */
  findById(customerId) {
    this._ensureInit();
    return this._customers.find(
      (c) => String(c.customer_id) === String(customerId)
    ) || null;
  }

  /**
   * Tạo mới hồ sơ khách hàng (QT-01: kiểm tra SĐT trùng trước khi gọi)
   * @param {object} customerData - { full_name, phone, email, address }
   * @returns {object}
   */
  save(customerData) {
    this._ensureInit();
    const newCustomer = {
      customer_id: this._customers.length + 90000 + 1,
      full_name: customerData.full_name,
      phone: normalizePhone(customerData.phone),
      email: customerData.email || null,
      address: customerData.address || null,
      created_at: new Date().toISOString(),
    };
    this._customers.push(newCustomer);
    return newCustomer;
  }

  /**
   * Reset kho — chỉ dùng trong bộ kiểm thử
   */
  reset() {
    this._customers = [];
    this._initialized = false;
  }
}

// Singleton instance
const customerRepository = new CustomerRepository();
module.exports = customerRepository;
