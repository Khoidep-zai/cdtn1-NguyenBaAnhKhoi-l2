const { query } = require('../config/db');
const { normalizePhone } = require('../utils/phoneHelper');
const dataLoader = require('../data/dataLoader');

module.exports = {
  async findCustomerByPhone(phone) {
    const norm = normalizePhone(phone);
    if (!norm) return null;
    try {
      const res = await query('SELECT * FROM customer WHERE phone=$1', [norm]);
      if (res.rows[0]) return res.rows[0];
    } catch (e) {}
    const memCust = dataLoader.findCustomerByPhone(norm);
    if (memCust) {
      try {
        const inserted = await query(
          `INSERT INTO customer(full_name, phone, email, address)
           VALUES($1, $2, $3, $4)
           ON CONFLICT (phone) DO UPDATE SET full_name = EXCLUDED.full_name, address = EXCLUDED.address
           RETURNING *`,
          [memCust.full_name, norm, memCust.email || '', memCust.address || '']
        );
        return inserted.rows[0];
      } catch (e) {
        return memCust;
      }
    }
    return null;
  },

  async addCustomer(customer) {
    const norm = normalizePhone(customer.phone);
    const res = await query(
      `INSERT INTO customer(full_name, phone, email, address) VALUES($1, $2, $3, $4) RETURNING *`,
      [customer.full_name, norm, customer.email || '', customer.address || '']
    );
    try { dataLoader.addCustomer(res.rows[0]); } catch (e) {}
    return res.rows[0];
  },

  async getCustomerDevices(customerId) {
    try {
      const res = await query(
        `SELECT t.ticket_id, t.ticket_code, t.status, t.received_at, t.due_date, t.is_warranty,
                t.issue_desc, t.priority, d.serial_no, d.serial_no AS serial_imei,
                d.device_name AS product_name, d.purchase_date, d.warranty_months
         FROM ticket t LEFT JOIN device d ON t.device_id=d.device_id
         WHERE t.customer_id=$1 ORDER BY t.received_at DESC`,
        [customerId]
      );
      if (res.rows && res.rows.length > 0) return res.rows;
    } catch (e) {}
    return dataLoader.getCustomerDevices(customerId);
  },
};
