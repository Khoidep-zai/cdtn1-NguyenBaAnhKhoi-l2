const dataLoader = require('../data/dataLoader');
const { normalizePhone, isValidVietnamesePhone } = require('../utils/phoneHelper');

class CustomerController {
  /**
   * Tra cứu hồ sơ khách hàng theo số điện thoại (US1 / FR1 / QT-01)
   */
  static getByPhone(req, res) {
    try {
      const { phone } = req.query;

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp tham số phone để tra cứu hồ sơ khách hàng.',
        });
      }

      const normalized = normalizePhone(phone);
      if (!normalized || normalized.length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Số điện thoại tra cứu không đúng định dạng.',
        });
      }

      const customer = dataLoader.findCustomerByPhone(normalized);

      if (!customer) {
        return res.status(404).json({
          success: false,
          found: false,
          message: `Không tìm thấy hồ sơ khách hàng với số điện thoại ${phone}.`,
        });
      }

      const devices = dataLoader.getCustomerDevices(customer.customer_id);

      return res.status(200).json({
        success: true,
        found: true,
        data: {
          customer_id: customer.customer_id,
          full_name: customer.full_name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          created_at: customer.created_at,
          devices: devices, // Danh sách thiết bị và lịch sử bảo hành thực tế từ Dataset
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Đăng ký mới hồ sơ khách hàng khi chưa tồn tại (QT-01)
   */
  static create(req, res) {
    try {
      const { full_name, phone, email, address } = req.body;

      if (!full_name || typeof full_name !== 'string' || full_name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Họ và tên khách hàng (full_name) là bắt buộc.',
        });
      }

      if (!phone || !isValidVietnamesePhone(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Số điện thoại không hợp lệ (phải là số di động 10 chữ số tại Việt Nam).',
        });
      }

      const normalized = normalizePhone(phone);
      const existing = dataLoader.findCustomerByPhone(normalized);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Khách hàng với số điện thoại ${phone} đã tồn tại trong hệ thống (QT-01).`,
          data: existing,
        });
      }

      const newCustomer = dataLoader.addCustomer({
        full_name: full_name.trim(),
        phone: normalized,
        email: email ? email.trim() : '',
        address: address ? address.trim() : '',
      });

      return res.status(201).json({
        success: true,
        message: 'Đăng ký hồ sơ khách hàng mới thành công.',
        data: newCustomer,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = CustomerController;
