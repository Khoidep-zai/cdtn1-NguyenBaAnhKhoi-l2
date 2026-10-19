/**
 * src/frontend/components/dataState.js — Xử lý trọn vẹn 3 trạng thái giao diện (Buổi 9 SE)
 *
 * 1. LOADING: Đang tải dữ liệu (skeleton / spinner)
 * 2. EMPTY: Rỗng (phân biệt rành mạch giữa CSDL chưa có dữ liệu và Bộ lọc không ra kết quả)
 * 3. ERROR: Lỗi kết nối / lỗi nghiệp vụ (có thông điệp cụ thể + nút thử lại)
 */

const dataState = {
  /**
   * Trạng thái đang tải dữ liệu
   */
  renderLoading(container, message = 'Đang truy vấn dữ liệu thực nghiệm từ CSDL hệ thống...') {
    if (!container) return;
    container.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 36px; color: var(--text-muted);">
          <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
            <span class="pulse-indicator"></span>
            <span style="font-size: 13.5px; font-weight: 500;">${message}</span>
          </div>
        </td>
      </tr>
    `;
  },

  /**
   * Trạng thái rỗng (Empty State)
   * @param {HTMLElement} container
   * @param {Object} options - { isFiltered: boolean, onClearFilter: Function, onCreateNew: Function }
   */
  renderEmpty(container, { isFiltered = false, onClearFilter = null, onCreateNew = null } = {}) {
    if (!container) return;

    if (isFiltered) {
      // Trường hợp 1: Rỗng vì bộ lọc/từ khóa tra cứu không khớp
      container.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 44px 20px;">
            <div style="max-width: 420px; margin: 0 auto;">
              <div style="font-size: 32px; margin-bottom: 10px;">🔍</div>
              <div style="font-size: 15px; font-weight: 700; color: #F1F5F9; margin-bottom: 6px;">
                Không có phiếu nào khớp bộ lọc hiện tại
              </div>
              <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
                Vui lòng kiểm tra lại từ khóa tra cứu hoặc nới rộng điều kiện lọc theo chi nhánh/trạng thái.
              </div>
              <button type="button" class="btn btn-secondary" id="btnResetFiltersInline" style="padding: 6px 14px; font-size: 12.5px;">
                Xóa bộ lọc
              </button>
            </div>
          </td>
        </tr>
      `;
      const btn = document.getElementById('btnResetFiltersInline');
      if (btn && onClearFilter) {
        btn.onclick = onClearFilter;
      }
    } else {
      // Trường hợp 2: Rỗng vì hệ thống chưa có dữ liệu nào
      container.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 48px 20px;">
            <div style="max-width: 440px; margin: 0 auto;">
              <div style="font-size: 36px; margin-bottom: 10px;">📋</div>
              <div style="font-size: 15.5px; font-weight: 700; color: #F1F5F9; margin-bottom: 6px;">
                Chưa có phiếu bảo hành nào trong hệ thống
              </div>
              <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 18px;">
                Bắt đầu tiếp nhận thiết bị từ khách hàng tại quầy để tạo phiếu bảo hành điện tử đầu tiên.
              </div>
              <button type="button" class="btn btn-primary" id="btnCreateFirstTicketInline" style="padding: 8px 18px; font-size: 13px;">
                + Tiếp nhận thiết bị mới
              </button>
            </div>
          </td>
        </tr>
      `;
      const btn = document.getElementById('btnCreateFirstTicketInline');
      if (btn && onCreateNew) {
        btn.onclick = onCreateNew;
      }
    }
  },

  /**
   * Trạng thái lỗi (Error State)
   * @param {HTMLElement} container
   * @param {Error|Object} error
   * @param {Function} onRetry
   */
  renderError(container, error, onRetry = null) {
    if (!container) return;
    const msg = error?.message || 'Không thể kết nối tới máy chủ backend. Vui lòng kiểm tra lại.';
    const code = error?.code || 'ERROR';

    container.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 40px 20px;">
          <div style="max-width: 460px; margin: 0 auto; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: var(--radius-md); padding: 22px;">
            <div style="font-size: 28px; margin-bottom: 8px;">⚠️</div>
            <div style="font-size: 14.5px; font-weight: 700; color: #F87171; margin-bottom: 6px;">
              Đã xảy ra lỗi khi tải dữ liệu [${code}]
            </div>
            <div style="font-size: 13px; color: #CBD5E1; margin-bottom: 16px;">
              ${msg}
            </div>
            <button type="button" class="btn btn-secondary" id="btnRetryDataState" style="padding: 6px 16px; font-size: 12.5px; border-color: rgba(239, 68, 68, 0.4);">
              🔄 Thử lại
            </button>
          </div>
        </td>
      </tr>
    `;
    const btn = document.getElementById('btnRetryDataState');
    if (btn && onRetry) {
      btn.onclick = onRetry;
    }
  },
};

// Xuất khẩu
if (typeof window !== 'undefined') {
  window.dataState = dataState;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { dataState };
}
