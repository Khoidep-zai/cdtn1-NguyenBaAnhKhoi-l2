/**
 * src/frontend/api/client.js — Lớp cấu hình HTTP Client duy nhất (Buổi 9 SE)
 * 
 * Nguyên tắc:
 * 1. Một chỗ DUY NHẤT biết về HTTP fetch.
 * 2. Tự động gắn Bearer Token nếu có.
 * 3. Tự động xử lý lỗi 401 (xóa token, chuyển hướng hoặc cảnh báo).
 * 4. Dịch lỗi máy chủ thành ApiError có cấu trúc (status, code, message).
 */

class ApiError extends Error {
  constructor(status, code, message, fields = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status; // Mã HTTP (400, 401, 404, 409, 422, 500)
    this.code = code;     // Mã lỗi nghiệp vụ (DU_LIEU_KHONG_HOP_LE, PHIEU_DANG_MO, etc.)
    this.fields = fields; // Chi tiết trường lỗi (nếu có)
  }
}

const apiClient = {
  getBaseUrl() {
    // Ưu tiên cấu hình từ window (nếu nạp qua config), fallback tương đối cho cùng origin
    if (typeof window !== 'undefined' && window.API_BASE_URL) {
      return window.API_BASE_URL.replace(/\/$/, '');
    }
    return ''; // Cùng domain / relative path
  },

  getToken() {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('mekong_crm_token') || localStorage.getItem('token');
    }
    return null;
  },

  setToken(token) {
    if (typeof localStorage !== 'undefined') {
      if (token) {
        localStorage.setItem('mekong_crm_token', token);
      } else {
        localStorage.removeItem('mekong_crm_token');
        localStorage.removeItem('token');
      }
    }
  },

  async request(path, options = {}) {
    const baseUrl = this.getBaseUrl();
    const token = this.getToken();
    const { unwrapData = true, ...fetchOptions } = options;

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    let res;
    try {
      res = await fetch(`${baseUrl}${path}`, {
        ...fetchOptions,
        credentials: 'same-origin',
        headers,
      });
    } catch (networkErr) {
      throw new ApiError(
        0,
        'NETWORK_ERROR',
        'Không thể kết nối tới máy chủ backend. Vui lòng kiểm tra lại dịch vụ.'
      );
    }

    if (res.status === 204) return null;

    let body = null;
    try {
      body = await res.json();
    } catch (_) {
      // Phản hồi không phải JSON
    }

    // Xử lý mã lỗi 401: Unauthorized (Buổi 9 mục A4)
    if (res.status === 401) {
      console.warn('[ApiClient] 401 Unauthorized.');
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
      }
    }

    if (!res.ok) {
      const code = body?.error || body?.code || `HTTP_${res.status}`;
      const message = body?.message || body?.thong_diep || (
        res.status === 404 ? 'Không tìm thấy dữ liệu yêu cầu.' :
        res.status === 409 ? 'Dữ liệu bị xung đột hoặc đã tồn tại phiếu đang mở.' :
        res.status === 400 ? 'Dữ liệu gửi lên không hợp lệ.' :
        'Hệ thống gặp sự cố khi xử lý yêu cầu.'
      );
      throw new ApiError(res.status, code, message, body?.fields);
    }

    return unwrapData ? (body?.data ?? body) : body;
  },

  get(path, options = {}) {
    return this.request(path, { ...options, method: 'GET' });
  },

  post(path, data, options = {}) {
    return this.request(path, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  patch(path, data, options = {}) {
    return this.request(path, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  put(path, data, options = {}) {
    return this.request(path, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete(path, options = {}) {
    return this.request(path, { ...options, method: 'DELETE' });
  },
};

// Xuất khẩu cho môi trường trình duyệt và Node.js
if (typeof window !== 'undefined') {
  window.ApiError = ApiError;
  window.apiClient = apiClient;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ApiError, apiClient };
}
