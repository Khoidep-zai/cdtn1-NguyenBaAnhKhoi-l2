/**
 * src/frontend/api/tickets.api.js — Các hàm gọi API nghiệp vụ bảo hành (Buổi 9 SE)
 *
 * Mỗi nghiệp vụ là MỘT hàm có tên rõ ràng.
 * Mọi component/page chỉ gọi hàm qua đây, KHÔNG bao giờ gọi fetch/axios trực tiếp.
 */

const ticketsApi = {
  /**
   * Lấy danh sách phiếu bảo hành có phân trang, lọc và tìm kiếm
   */
  danhSach({ page = 1, limit = 25, q = '', status = '', center_id = '' } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (q) params.set('q', q);
    if (status && status !== 'ALL') params.set('status', status);
    if (center_id && center_id !== 'ALL') params.set('center_id', center_id);

    return (window.apiClient || apiClient).get(`/api/tickets?${params.toString()}`, { unwrapData: false });
  },

  /**
   * Lấy chi tiết phiếu bảo hành theo ID hoặc mã phiếu (BH-xxxxxx/yyyy)
   */
  chiTiet(idOrCode) {
    return (window.apiClient || apiClient).get(`/api/tickets/${encodeURIComponent(idOrCode)}`);
  },

  /**
   * Tiếp nhận tạo phiếu bảo hành mới (QT-01..QT-09)
   */
  tiepNhan(payload) {
    return (window.apiClient || apiClient).post('/api/tickets', payload);
  },

  /**
   * Cập nhật trạng thái phiếu bảo hành (Vòng đời một chiều QT-06)
   */
  chuyenTrangThai(ticketId, status, note = '', updatedBy = '') {
    return (window.apiClient || apiClient).patch(`/api/tickets/${encodeURIComponent(ticketId)}/status`, {
      status,
      note,
      updated_by: updatedBy,
    });
  },

  pheDuyetNgoaiLe(ticketId, note) {
    return (window.apiClient || apiClient).patch(`/api/tickets/${encodeURIComponent(ticketId)}/warranty-exception`, { note });
  },

  ghiNhanDongYSuaDichVu(ticketId, note) {
    return (window.apiClient || apiClient).patch(`/api/tickets/${encodeURIComponent(ticketId)}/service-consent`, { note });
  },

  /**
   * Phân loại sự cố kỹ thuật và gán mức ưu tiên (QT-02, QT-04 SLA)
   */
  phanLoai(ticketId, { issue_category_id, priority, notes } = {}) {
    return (window.apiClient || apiClient).patch(`/api/tickets/${encodeURIComponent(ticketId)}/classify`, {
      issue_category_id,
      priority,
      notes,
    });
  },

  /**
   * Tra cứu khách hàng theo số điện thoại (QT-01)
   */
  traCuuKhachHang(phone) {
    const q = new URLSearchParams({ phone: phone.trim() });
    return (window.apiClient || apiClient).get(`/api/customers?${q.toString()}`);
  },

  dangKyKhachHang(data) {
    return (window.apiClient || apiClient).post('/api/customers', data);
  },

  /**
   * Lấy danh mục sản phẩm điện thoại (Master Data)
   */
  layDanhSachDienThoai() {
    return (window.apiClient || apiClient).get('/api/products?phonesOnly=true&limit=all');
  },

  /**
   * Lấy danh mục trung tâm bảo hành (Master Data)
   */
  layDanhMucTrungTam() {
    return (window.apiClient || apiClient).get('/api/centers');
  },

  /**
   * Lấy danh mục nhóm sự cố kỹ thuật (Master Data)
   */
  layDanhMucSuCo() {
    return (window.apiClient || apiClient).get('/api/categories');
  },

  /**
   * Kiểm tra tình trạng kết nối backend & DB
   */
  kiemTraSucKhoe() {
    return (window.apiClient || apiClient).get('/health/db');
  },
};

// Xuất khẩu cho môi trường trình duyệt và Node.js
if (typeof window !== 'undefined') {
  window.ticketsApi = ticketsApi;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ticketsApi };
}
