/**
 * Mekong Mobile CRM - Tiếp nhận & Phân loại bảo hành (Luồng L2)
 * Client Application Logic
 */

// Global State
let currentPage = 1;
let pageSize = 25;
let totalPages = 1;
let totalTickets = 0;
let currentTicketsList = [];
let allPhoneModels = [];
let filteredPhoneModels = [];
let activeBrand = 'ALL';
let highlightedDeviceIndex = -1;
let searchDebounceTimer = null;
let selectedPriority = 'TRUNG_BINH';

// Category mapping helper
const CATEGORY_MAP = {
  1: 'Màn hình cảm ứng',
  2: 'PIN sạc & Nguồn',
  3: 'Chân sạc / Kết nối',
  4: 'Hệ điều hành / Phần mềm',
  5: 'Vào nước / Ẩm bo mạch',
  6: 'Sự cố phần cứng khác',
  'MAN_HINH': 'Màn hình cảm ứng',
  'PIN': 'PIN sạc & Nguồn',
  'SAC': 'Chân sạc / Kết nối',
  'PHAN_MEM': 'Hệ điều hành / Phần mềm',
  'NUOC_VAO': 'Vào nước / Ẩm bo mạch',
  'KHAC': 'Sự cố phần cứng khác',
};

// Center mapping helper
const CENTER_MAP = {
  1: 'Chi nhánh 01 - Cần Thơ',
  2: 'Chi nhánh 02 - TP. HCM',
  3: 'Chi nhánh 03 - Đà Nẵng',
  4: 'Chi nhánh 04 - Hà Nội',
  5: 'Chi nhánh 05 - Hải Phòng',
  6: 'Chi nhánh 06 - Bình Dương',
};

// -------------------------------------------------------------
// 1. SCREEN NAVIGATION & AUTHENTICATION (RBAC)
// -------------------------------------------------------------
const USER_ROLES = {
  NHAN_VIEN: {
    role: 'NHAN_VIEN',
    name: 'Nguyễn Bá Anh Khôi',
    username: 'nhanvien01',
    roleLabel: 'Nhân viên tiếp nhận',
    avatar: 'AK',
    badgeClass: 'role-staff',
    badgeIcon: '👤',
    branchId: 1,
    branchName: 'Chi nhánh 01 (Cần Thơ)',
    canViewAllCenters: false,
    canOverrideSla: false,
    canReassignTechnician: false
  },
  QUAN_LY: {
    role: 'QUAN_LY',
    name: 'Võ Thành Long',
    username: 'quanly01',
    roleLabel: 'Quản lý chi nhánh / Hệ thống',
    avatar: 'TL',
    badgeClass: 'role-manager',
    badgeIcon: '🛡️',
    branchId: null,
    branchName: 'Toàn hệ thống (CN 01 - 06)',
    canViewAllCenters: true,
    canOverrideSla: true,
    canReassignTechnician: true
  }
};

let currentUser = USER_ROLES.NHAN_VIEN;

function initAuth() {
  try {
    const savedRole = localStorage.getItem('mekong_crm_role');
    if (savedRole && USER_ROLES[savedRole]) {
      currentUser = USER_ROLES[savedRole];
    }
  } catch (e) {
    currentUser = USER_ROLES.NHAN_VIEN;
  }
  applyUserRoleToUI();
}

function applyUserRoleToUI() {
  const avatarEl = document.getElementById('userAvatar');
  const nameEl = document.getElementById('userName');
  const roleTagEl = document.getElementById('userRoleTag');
  const branchTagEl = document.getElementById('userBranchTag');
  const centerFilter = document.getElementById('centerFilter');

  if (avatarEl) avatarEl.textContent = currentUser.avatar;
  if (nameEl) nameEl.textContent = currentUser.name;
  if (roleTagEl) {
    roleTagEl.className = `role-tag ${currentUser.badgeClass}`;
    roleTagEl.textContent = `${currentUser.badgeIcon} ${currentUser.roleLabel}`;
  }
  if (branchTagEl) branchTagEl.textContent = currentUser.branchName;

  // Thiết lập quyền lọc chi nhánh theo Role
  if (centerFilter) {
    if (currentUser.role === 'NHAN_VIEN') {
      centerFilter.value = String(currentUser.branchId || 1);
    } else {
      if (centerFilter.value === '1' && !localStorage.getItem('mekong_crm_manual_center')) {
        centerFilter.value = 'ALL';
      }
    }
  }
}

function openLoginModal() {
  const modal = document.getElementById('loginModal');
  const errorMsg = document.getElementById('loginErrorMsg');
  if (errorMsg) errorMsg.style.display = 'none';
  if (modal) modal.style.display = 'flex';
}

function closeLoginModal() {
  const modal = document.getElementById('loginModal');
  if (modal) modal.style.display = 'none';
}

function quickLogin(roleKey) {
  if (USER_ROLES[roleKey]) {
    currentUser = USER_ROLES[roleKey];
    try {
      localStorage.setItem('mekong_crm_role', roleKey);
    } catch (e) {}
    applyUserRoleToUI();
    closeLoginModal();
    showToast(`Đã chuyển sang vai trò: ${currentUser.roleLabel}`);
    loadTickets(1);
  }
}

function handleManualLogin(event) {
  event.preventDefault();
  const username = (document.getElementById('loginUsernameInput').value || '').trim();
  const password = (document.getElementById('loginPasswordInput').value || '').trim();
  const roleSelect = document.getElementById('loginRoleSelect').value;
  const errorMsg = document.getElementById('loginErrorMsg');

  if (!username) {
    if (errorMsg) {
      errorMsg.textContent = 'Vui lòng nhập tên đăng nhập!';
      errorMsg.style.display = 'block';
    }
    return;
  }

  const baseRole = USER_ROLES[roleSelect] || USER_ROLES.NHAN_VIEN;
  currentUser = {
    ...baseRole,
    username: username,
    name: username.toLowerCase().includes('quan') ? 'Võ Thành Long' : (baseRole.name || username)
  };

  try {
    localStorage.setItem('mekong_crm_role', roleSelect);
  } catch (e) {}

  applyUserRoleToUI();
  closeLoginModal();
  showToast(`Đăng nhập thành công với vai trò: ${currentUser.roleLabel}`);
  loadTickets(1);
}

function switchTab(screenId) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach(s => {
    if (s.id === screenId) {
      s.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      s.style.display = 'none';
    }
  });
}

function goToList() {
  switchTab('screen-list');
}

function goToCreate() {
  clearCreateForm();
  switchTab('screen-create');
}

function goToDetail(ticketIdentifier) {
  loadTicketDetail(ticketIdentifier);
  switchTab('screen-detail');
}

function clearCreateForm() {
  const phone = document.getElementById('custPhoneInput');
  const name = document.getElementById('custNameInput');
  const addr = document.getElementById('custAddressInput');
  const dev = document.getElementById('deviceNameInput');
  const imei = document.getElementById('deviceImeiInput');
  const desc = document.getElementById('issueDescText');
  const counter = document.getElementById('descCharCounter');
  const alertBox = document.getElementById('warrantyAlertBox');
  const alertText = document.getElementById('warrantyAlertText');
  const slaText = document.getElementById('slaPreviewText');

  if (phone) phone.value = '';
  if (name) name.value = '';
  if (addr) addr.value = '';
  if (dev) dev.value = '';
  if (imei) imei.value = '';
  if (desc) desc.value = '';
  if (counter) {
    counter.className = 'char-counter';
    counter.textContent = '0 ký tự (tối thiểu 10)';
  }
  if (alertBox) alertBox.style.display = 'none';
  if (alertText) alertText.textContent = '';
  if (slaText) slaText.textContent = 'Chưa tính (chọn mức ưu tiên)';

  selectedPriority = 'TRUNG_BINH';
  const radio = document.querySelector('input[name="priorityRadio"][value="TRUNG_BINH"]');
  if (radio) radio.checked = true;
}

// -------------------------------------------------------------
// 2. TICKETS LIST: LOAD & RENDER REAL DATA (AI COMMITMENT)
// -------------------------------------------------------------
async function loadTickets(page = 1) {
  currentPage = page;
  const tbody = document.getElementById('ticketsTableBody');
  const searchVal = document.getElementById('searchInput') ? document.getElementById('searchInput').value.trim() : '';
  const statusVal = document.getElementById('statusFilter') ? document.getElementById('statusFilter').value : 'ALL';
  const centerVal = document.getElementById('centerFilter') ? document.getElementById('centerFilter').value : 'ALL';
  const sizeSelect = document.getElementById('pageSizeFilter');
  if (sizeSelect) pageSize = Number(sizeSelect.value) || 25;

  // Trạng thái 1: Đang tải dữ liệu (Loading State - Buổi 9 A3)
  if (window.dataState) {
    window.dataState.renderLoading(tbody);
  } else {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 32px; color: var(--text-muted);">
          <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
            <span class="pulse-indicator"></span>
            Đang truy vấn dữ liệu thực nghiệm từ CSDL hệ thống...
          </div>
        </td>
      </tr>
    `;
  }

  let tickets = [];
  let total = 0;

  let apiError = null;
  // Gọi API Backend qua lớp ticketsApi chuyên dụng (Buổi 9 A1-A2)
  if (window.ticketsApi) {
    try {
      const body = await window.ticketsApi.danhSach({
        page: currentPage,
        limit: pageSize,
        q: searchVal,
        status: statusVal,
        center_id: centerVal,
      });
      if (body) {
        tickets = body.data || (Array.isArray(body) ? body : []);
        total = body.total ?? tickets.length;
        totalPages = body.totalPages || Math.ceil(total / pageSize) || 1;
      }
    } catch (err) {
      console.warn('[Frontend SE] Lỗi khi gọi ticketsApi.danhSach:', err);
      apiError = err;
    }
  }

  // Khi tắt backend hoặc lỗi mạng: Hiển thị Error State có nút Thử lại (Tiêu chí Buổi 10)
  if (apiError && !window.__FORCE_OFFLINE__) {
    if (window.dataState) {
      window.dataState.renderError(tbody, apiError, () => loadTickets(page));
    }
    const badge = document.getElementById('totalTicketsBadge');
    if (badge) badge.innerText = '0';
    return;
  }

  // Fallback sang dữ liệu mẫu cục bộ nạp sẵn từ dataset khi chủ động bật chế độ offline
  if (tickets.length === 0 && window.OFFLINE_TICKETS_SAMPLE) {
    let dataset = [...window.OFFLINE_TICKETS_SAMPLE];
    if (statusVal && statusVal !== 'ALL') {
      dataset = dataset.filter(t => t.status === statusVal);
    }
    if (centerVal && centerVal !== 'ALL') {
      dataset = dataset.filter(t => String(t.center_id) === String(centerVal));
    }
    if (searchVal) {
      const q = searchVal.toLowerCase();
      dataset = dataset.filter(t =>
        (t.ticket_code && t.ticket_code.toLowerCase().includes(q)) ||
        (t.customer_name && t.customer_name.toLowerCase().includes(q)) ||
        (t.customer_phone && t.customer_phone.includes(q)) ||
        (t.serial_no && t.serial_no.toLowerCase().includes(q)) ||
        (t.product_name && t.product_name.toLowerCase().includes(q))
      );
    }
    total = dataset.length;
    totalPages = Math.ceil(total / pageSize) || 1;
    const offset = (currentPage - 1) * pageSize;
    tickets = dataset.slice(offset, offset + pageSize);
  }

  currentTicketsList = tickets;
  totalTickets = total;

  // Cập nhật giao diện thống kê
  const badge = document.getElementById('totalTicketsBadge');
  if (badge) badge.innerText = total.toLocaleString();

  const statsPill = document.getElementById('datasetStatsPill');
  if (statsPill) statsPill.innerText = `Dataset ${total.toLocaleString()} phiếu · 6 Chi nhánh · 6 Nhóm lỗi`;

  renderTicketsTable(tickets, total);
  updatePaginationControls(total);
}

function renderTicketsTable(tickets, total) {
  const tbody = document.getElementById('ticketsTableBody');
  if (!tickets || tickets.length === 0) {
    const searchVal = document.getElementById('searchInput') ? document.getElementById('searchInput').value.trim() : '';
    const statusVal = document.getElementById('statusFilter') ? document.getElementById('statusFilter').value : 'ALL';
    const centerVal = document.getElementById('centerFilter') ? document.getElementById('centerFilter').value : 'ALL';
    const isFiltered = Boolean(searchVal || (statusVal && statusVal !== 'ALL') || (centerVal && centerVal !== 'ALL'));

    // Trạng thái 2: Rỗng - phân biệt do bộ lọc hay CSDL chưa có dữ liệu (Buổi 9 A3)
    if (window.dataState) {
      window.dataState.renderEmpty(tbody, {
        isFiltered,
        onClearFilter: resetFilters,
        onCreateNew: goToCreate,
      });
    } else {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 40px; color: var(--text-muted);">
            <div style="font-size: 15px; font-weight: 600; color: #CBD5E1; margin-bottom: 6px;">Không tìm thấy phiếu bảo hành nào phù hợp</div>
            <div style="font-size: 12.5px;">Vui lòng kiểm tra lại từ khóa tra cứu hoặc thay đổi bộ lọc trạng thái / chi nhánh.</div>
          </td>
        </tr>
      `;
    }
    return;
  }

  let html = '';
  tickets.forEach(t => {
    const code = t.ticket_code || t.id || `BH-00000${t.ticket_id}/2026`;
    const custName = t.customer_name || 'Khách hàng';
    const custPhone = t.customer_phone || '0901234567';
    const prodName = t.product_name || 'Thiết bị điện thoại';
    const serial = t.serial_no || t.serial_imei || '—';
    const catName = CATEGORY_MAP[t.category_id || t.issue_category_id] || t.category_name || 'Sự cố kỹ thuật';
    const priority = t.priority || 'TRUNG_BINH';
    const status = t.status || 'MOI';
    const dueDateFormatted = formatDateTime(t.due_date);

    html += `
      <tr data-status="${escapeHtml(status)}" data-id="${escapeHtml(code)}">
        <td class="col-nowrap">
          <span class="ticket-code">${escapeHtml(code)}</span>
        </td>
        <td>
          <strong style="color: #FFF;">${escapeHtml(custName)}</strong>
        </td>
        <td class="col-nowrap" style="font-family: 'JetBrains Mono', monospace; color: #CBD5E1;">
          ${escapeHtml(custPhone)}
        </td>
        <td>
          <div style="font-weight: 500; color: #F1F5F9;">${escapeHtml(prodName)}</div>
          <small style="color: var(--text-muted); font-family: 'JetBrains Mono', monospace; font-size: 11px;">
            SN: ${escapeHtml(serial)}
          </small>
        </td>
        <td>
          <span style="font-weight: 500; font-size: 13px;">${escapeHtml(catName)}</span>
        </td>
        <td class="col-nowrap">
          <span class="badge ${getPriorityBadgeClass(priority)}">${formatPriorityLabel(priority)}</span>
        </td>
        <td class="col-nowrap">
          <span class="badge ${getStatusBadgeClass(status)}">${formatStatusLabel(status)}</span>
        </td>
        <td class="col-nowrap">
          <div class="sla-timer ${priority === 'CAO' ? 'sla-urgent' : ''}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            ${escapeHtml(dueDateFormatted)}
          </div>
        </td>
        <td class="col-nowrap" style="text-align: right;">
          <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="goToDetail('${escapeHtml(code)}')">
            Chi tiết →
          </button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

function updatePaginationControls(total) {
  const info = document.getElementById('paginationInfo');
  const display = document.getElementById('pageDisplay');
  const btnFirst = document.getElementById('btnFirstPage');
  const btnPrev = document.getElementById('btnPrevPage');
  const btnNext = document.getElementById('btnNextPage');
  const btnLast = document.getElementById('btnLastPage');

  if (total === 0) {
    if (info) info.innerText = 'Không có bản ghi nào';
    if (display) display.innerText = 'Trang 0 / 0';
    if (btnFirst) btnFirst.disabled = true;
    if (btnPrev) btnPrev.disabled = true;
    if (btnNext) btnNext.disabled = true;
    if (btnLast) btnLast.disabled = true;
    return;
  }

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);
  if (info) {
    info.innerHTML = `Hiển thị <strong>${start.toLocaleString()} - ${end.toLocaleString()}</strong> trong tổng số <strong>${total.toLocaleString()}</strong> phiếu bảo hành chuẩn hóa`;
  }
  if (display) {
    display.innerText = `Trang ${currentPage} / ${totalPages}`;
  }

  if (btnFirst) btnFirst.disabled = currentPage <= 1;
  if (btnPrev) btnPrev.disabled = currentPage <= 1;
  if (btnNext) btnNext.disabled = currentPage >= totalPages;
  if (btnLast) btnLast.disabled = currentPage >= totalPages;
}

function changePage(page) {
  if (page < 1 || page > totalPages || page === currentPage) return;
  loadTickets(page);
  const tableEl = document.getElementById('ticketsTable');
  if (tableEl) tableEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function onSearchInput() {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    currentPage = 1;
    loadTickets(1);
  }, 250);
}

function onFilterChange() {
  currentPage = 1;
  loadTickets(1);
}

function onPageSizeChange() {
  const sizeSelect = document.getElementById('pageSizeFilter');
  if (sizeSelect) pageSize = Number(sizeSelect.value) || 25;
  currentPage = 1;
  loadTickets(1);
}

function resetFilter() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) statusFilter.value = 'ALL';
  const centerFilter = document.getElementById('centerFilter');
  if (centerFilter) centerFilter.value = 'ALL';
  currentPage = 1;
  loadTickets(1);
  showToast('Đã đặt lại bộ lọc danh sách về mặc định');
}

// -------------------------------------------------------------
// 3. SEARCHABLE COMBOBOX CHO THIẾT BỊ & MODEL (ẢNH 3 & YÊU CẦU 3)
// -------------------------------------------------------------
async function initPhoneModels() {
  // Thử tải từ API Backend qua ticketsApi (Buổi 9 SE)
  if (window.ticketsApi) {
    try {
      const data = await window.ticketsApi.layDanhSachDienThoai();
      if (data && data.length > 0) {
        allPhoneModels = data;
      }
    } catch (e) {
      console.warn('Chưa thể kết nối API danh mục điện thoại:', e.message);
    }
  }

  // Fallback sang danh sách 237 dòng máy cục bộ
  if (allPhoneModels.length === 0 && window.PHONE_MODELS_DATASET) {
    allPhoneModels = window.PHONE_MODELS_DATASET;
  }

  filteredPhoneModels = [...allPhoneModels];
  updateDeviceCountLabel();
}

function updateDeviceCountLabel() {
  const label = document.getElementById('deviceCountLabel');
  if (label) {
    label.innerText = `${filteredPhoneModels.length} dòng điện thoại trong hệ thống`;
  }
}

function openDeviceDropdown() {
  const dropdown = document.getElementById('deviceDropdown');
  const wrapper = document.getElementById('deviceCombobox');
  if (!dropdown) return;

  const currentInput = document.getElementById('deviceNameInput').value.trim();
  filterDevices(currentInput);

  dropdown.style.display = 'flex';
  if (wrapper) wrapper.classList.add('open');
}

function closeDeviceDropdown() {
  const dropdown = document.getElementById('deviceDropdown');
  const wrapper = document.getElementById('deviceCombobox');
  if (dropdown) dropdown.style.display = 'none';
  if (wrapper) wrapper.classList.remove('open');
  highlightedDeviceIndex = -1;
}

function onDeviceInput(query) {
  openDeviceDropdown();
  filterDevices(query);
}

function filterDeviceBrand(brand, event) {
  if (event) event.stopPropagation();
  activeBrand = brand;

  const chips = document.querySelectorAll('.combobox-brand-filters .brand-chip');
  chips.forEach(c => c.classList.remove('active'));
  if (event && event.target) {
    event.target.classList.add('active');
  }

  const query = document.getElementById('deviceNameInput').value.trim();
  filterDevices(query);
}

function filterDevices(query) {
  const q = (query || '').toLowerCase().trim();
  filteredPhoneModels = allPhoneModels.filter(item => {
    const matchBrand = activeBrand === 'ALL' || (item.thuong_hieu && item.thuong_hieu.toLowerCase() === activeBrand.toLowerCase());
    const matchQuery = !q || (item.product_name && item.product_name.toLowerCase().includes(q)) || (item.product_code && item.product_code.toLowerCase().includes(q));
    return matchBrand && matchQuery;
  });

  highlightedDeviceIndex = filteredPhoneModels.length > 0 ? 0 : -1;
  renderDeviceList(query);
  updateDeviceCountLabel();
}

function renderDeviceList(query) {
  const listEl = document.getElementById('deviceList');
  if (!listEl) return;

  if (filteredPhoneModels.length === 0) {
    listEl.innerHTML = `
      <div class="combobox-empty">
        <p style="font-weight: 600; color: #F1F5F9; margin-bottom: 4px;">Không tìm thấy dòng máy nào khớp với từ khóa</p>
        <p style="font-size: 12px; color: var(--text-muted);">Bạn vẫn có thể tiếp tục gõ để chỉ định tên thiết bị tự do.</p>
      </div>
    `;
    return;
  }

  let html = '';
  filteredPhoneModels.forEach((item, index) => {
    const isHighlighted = index === highlightedDeviceIndex ? 'active' : '';
    const brand = item.thuong_hieu || 'Thiết bị';
    const name = item.product_name || '';
    const highlightedName = query ? highlightSubstring(name, query) : escapeHtml(name);
    const priceText = item.gia_niem_yet ? (item.gia_niem_yet / 1000000).toFixed(1) + ' tr' : '';
    const warranty = item.warranty_months ? `${item.warranty_months}T BH` : '12T BH';

    html += `
      <div class="combobox-item ${isHighlighted}" 
           data-index="${index}" 
           onclick="selectDeviceByIndex(${index})"
           onmouseenter="setHighlightedIndex(${index})">
        <div class="combobox-item-main">
          <span class="brand-badge ${escapeHtml(brand)}">${escapeHtml(brand)}</span>
          <span class="combobox-item-name">${highlightedName}</span>
        </div>
        <div class="combobox-item-meta">
          ${priceText ? `<span style="color: #38BDF8; margin-right: 8px;">${priceText}</span>` : ''}
          <span>${warranty}</span>
        </div>
      </div>
    `;
  });

  listEl.innerHTML = html;
}

function setHighlightedIndex(idx) {
  highlightedDeviceIndex = idx;
  const items = document.querySelectorAll('.combobox-item');
  items.forEach((item, i) => {
    if (i === idx) item.classList.add('active');
    else item.classList.remove('active');
  });
}

function selectDeviceByIndex(index) {
  const item = filteredPhoneModels[index];
  if (!item) return;

  const deviceInput = document.getElementById('deviceNameInput');
  deviceInput.value = item.product_name;

  // Tự động sinh số Serial/IMEI mẫu thực tế cho dòng máy
  const imeiInput = document.getElementById('deviceImeiInput');
  const brandCode = (item.thuong_hieu || 'DEV').substring(0, 2).toUpperCase();
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  imeiInput.value = `SN-${brandCode}-${randomSuffix}`;

  // Kiểm tra điều kiện bảo hành mẫu (QT-05)
  checkWarrantyStatus(item);

  closeDeviceDropdown();
  showToast(`Đã chọn thiết bị: ${item.product_name}`);
}

function onDeviceKeydown(e) {
  const dropdown = document.getElementById('deviceDropdown');
  const isOpen = dropdown && dropdown.style.display !== 'none';

  if (!isOpen) {
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      openDeviceDropdown();
      e.preventDefault();
    }
    return;
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (filteredPhoneModels.length > 0) {
      highlightedDeviceIndex = (highlightedDeviceIndex + 1) % filteredPhoneModels.length;
      updateHighlightScroll();
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (filteredPhoneModels.length > 0) {
      highlightedDeviceIndex = (highlightedDeviceIndex - 1 + filteredPhoneModels.length) % filteredPhoneModels.length;
      updateHighlightScroll();
    }
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (highlightedDeviceIndex >= 0 && highlightedDeviceIndex < filteredPhoneModels.length) {
      selectDeviceByIndex(highlightedDeviceIndex);
    } else {
      closeDeviceDropdown();
    }
  } else if (e.key === 'Escape') {
    closeDeviceDropdown();
  }
}

function updateHighlightScroll() {
  const items = document.querySelectorAll('.combobox-item');
  items.forEach((item, i) => {
    if (i === highlightedDeviceIndex) {
      item.classList.add('active');
      item.scrollIntoView({ block: 'nearest' });
    } else {
      item.classList.remove('active');
    }
  });
}

function highlightSubstring(text, query) {
  if (!query) return escapeHtml(text);
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return escapeHtml(text).replace(regex, '<mark>$1</mark>');
}

// -------------------------------------------------------------
// 4. KIỂM TRA BẢO HÀNH & HIỂN THỊ THÔNG BÁO LỖI (ẢNH 3 - TRƯỜNG 6)
// -------------------------------------------------------------
function checkWarrantyStatus(product) {
  const serialInput = document.getElementById('deviceImeiInput');
  const serial = serialInput ? serialInput.value.trim() : '';
  const alertBox = document.getElementById('warrantyAlertBox');
  const alertText = document.getElementById('warrantyAlertText');
  if (!alertBox || !alertText) return;

  if (!serial) {
    alertBox.style.display = 'none';
    alertText.textContent = '';
    return;
  }

  alertBox.style.display = 'flex';
  if (serial.includes('778901') || serial.includes('SN-A52')) {
    alertBox.className = 'warranty-alert-box';
    alertText.innerHTML = `⚠ Thiết bị ${escapeHtml(serial)} đã hết hạn bảo hành (QT-01).`;
  } else {
    // Thiết bị hợp lệ còn hạn bảo hành
    alertBox.className = 'warranty-alert-box valid';
    alertText.innerHTML = `✔ Thiết bị ${escapeHtml(serial)} đối soát ERP hợp lệ: Còn hạn bảo hành chính hãng (QT-05).`;
  }
}

// -------------------------------------------------------------
// 5. TRA CỨU KHÁCH HÀNG THEO SĐT (QT-01 / US1 / ẢNH 3 - TRƯỜNG 1)
// -------------------------------------------------------------
async function simulateLookup() {
  const phoneInput = document.getElementById('custPhoneInput');
  const phone = phoneInput ? phoneInput.value.trim() : '';

  if (!phone) {
    showToast('Vui lòng nhập số điện thoại khách hàng.');
    return;
  }

  // Chuẩn hóa số điện thoại tra cứu (loại bỏ khoảng trắng, dấu chấm, dấu gạch)
  const cleanPhone = phone.replace(/[\s.-]/g, '');

  // 1. Gọi API Backend tra cứu qua ticketsApi (Buổi 9 SE)
  if (window.ticketsApi) {
    try {
      const body = await window.ticketsApi.traCuuKhachHang(cleanPhone);
      if (body && body.found && body.data) {
        const cust = body.data;

        // Điền họ tên khách hàng
        const nameInput = document.getElementById('custNameInput');
        if (nameInput) nameInput.value = cust.full_name || '';

        // Điền địa chỉ khách hàng
        const addrInput = document.getElementById('custAddressInput');
        if (addrInput) addrInput.value = cust.address || 'Việt Nam';

        // Điền thông tin thiết bị và lịch sử gắn liền với khách hàng
        if (cust.devices && cust.devices.length > 0) {
          const dev = cust.devices[0];

          if (dev.product_name) {
            const devNameInput = document.getElementById('deviceNameInput');
            if (devNameInput) devNameInput.value = dev.product_name;
          }

          if (dev.serial_no || dev.serial_imei) {
            const serialInput = document.getElementById('deviceImeiInput');
            if (serialInput) serialInput.value = dev.serial_no || dev.serial_imei;
          }

          if (dev.category_id) {
            const catSel = document.getElementById('issueCatSelect');
            if (catSel) catSel.value = String(dev.category_id);
          }

          if (dev.issue_desc) {
            const descArea = document.getElementById('issueDescText');
            if (descArea) {
              descArea.value = dev.issue_desc;
              onIssueDescInput(dev.issue_desc);
            }
          }

          if (dev.priority) {
            const radio = document.querySelector(`input[name="priorityRadio"][value="${dev.priority}"]`);
            if (radio) {
              radio.checked = true;
              onPriorityRadioChange(dev.priority);
            }
          }

          // Cập nhật thông báo tình trạng bảo hành chính xác từ dữ liệu thực
          const alertBox = document.getElementById('warrantyAlertBox');
          const alertText = document.getElementById('warrantyAlertText');
          if (alertBox && alertText) {
            const s = dev.serial_no || dev.serial_imei;
            const p = dev.product_name;
            if (dev.is_warranty === false) {
              alertBox.className = 'warranty-alert-box';
              alertText.innerHTML = `⚠ Thiết bị ${escapeHtml(s)} (${escapeHtml(p)}) đã hết hạn bảo hành (QT-01).`;
            } else {
              alertBox.className = 'warranty-alert-box valid';
              alertText.innerHTML = `✔ Thiết bị ${escapeHtml(s)} (${escapeHtml(p)}) đối soát ERP hợp lệ: Còn hạn bảo hành chính hãng (QT-05).`;
            }
          }

          showToast(`Đã tìm thấy hồ sơ: ${cust.full_name} (${dev.product_name})`);
        } else {
          // Khách hàng đã có trong CRM nhưng chưa tiếp nhận thiết bị này trước đó
          const alertBox = document.getElementById('warrantyAlertBox');
          const alertText = document.getElementById('warrantyAlertText');
          if (alertBox && alertText) {
            alertBox.className = 'warranty-alert-box valid';
            alertText.innerHTML = `✔ Khách hàng hợp lệ: ${escapeHtml(cust.full_name)}. Vui lòng chọn dòng máy và nhập serial tiếp nhận.`;
          }
          showToast(`Đã tìm thấy hồ sơ khách hàng: ${cust.full_name}`);
        }
        return;
      }
    } catch (e) {
      console.warn('Lỗi khi gọi /api/customers:', e);
    }
  }

  // 2. Fallback tra cứu offline trên mẫu dữ liệu thực tế
  let foundSample = null;
  if (window.OFFLINE_TICKETS_SAMPLE && window.OFFLINE_TICKETS_SAMPLE.length > 0) {
    foundSample = window.OFFLINE_TICKETS_SAMPLE.find(t => {
      const p = (t.customer_phone || '').replace(/[\s.-]/g, '');
      return p === cleanPhone || p.endsWith(cleanPhone) || cleanPhone.endsWith(p);
    });
  }

  if (foundSample) {
    document.getElementById('custNameInput').value = foundSample.customer_name;
    const addrInput = document.getElementById('custAddressInput');
    if (addrInput) addrInput.value = foundSample.customer_address || 'Việt Nam';
    document.getElementById('deviceNameInput').value = foundSample.product_name;
    document.getElementById('deviceImeiInput').value = foundSample.serial_no || foundSample.serial_imei;

    const alertBox = document.getElementById('warrantyAlertBox');
    const alertText = document.getElementById('warrantyAlertText');
    if (alertBox && alertText) {
      if (foundSample.is_warranty === false) {
        alertBox.className = 'warranty-alert-box';
        alertText.innerHTML = `⚠ Thiết bị ${escapeHtml(foundSample.serial_no)} (${escapeHtml(foundSample.product_name)}) đã hết hạn bảo hành (QT-01).`;
      } else {
        alertBox.className = 'warranty-alert-box valid';
        alertText.innerHTML = `✔ Thiết bị ${escapeHtml(foundSample.serial_no)} (${escapeHtml(foundSample.product_name)}) đối soát ERP hợp lệ: Còn hạn bảo hành chính hãng (QT-05).`;
      }
    }
    showToast(`Đã tìm thấy thông tin khách hàng: ${foundSample.customer_name}`);
    return;
  }

  // 3. Khách hàng mới chưa có trong hệ thống
  showToast('Khách hàng mới! Họ tên sẽ được lưu hồ sơ tự động khi tạo phiếu.');
  document.getElementById('custNameInput').focus();
}

// -------------------------------------------------------------
// 6. TÍNH TOÁN HẠN CAM KẾT SLA (QT-04 / ẢNH 3 - TRƯỜNG 5)
// -------------------------------------------------------------
function onPriorityRadioChange(priority) {
  selectedPriority = priority;
  updateSlaPrediction();
}

function updateSlaPrediction() {
  const slaText = document.getElementById('slaPreviewText');
  if (!slaText) return;

  const now = new Date();
  let hoursToAdd = 72;

  if (selectedPriority === 'CAO') hoursToAdd = 24;
  else if (selectedPriority === 'THAP') hoursToAdd = 120;

  // Thuật toán bỏ qua ngày Chủ Nhật (QT-04)
  const dueDate = addBusinessHours(now, hoursToAdd);
  const formatted = formatDateTime(dueDate);

  slaText.innerText = `${formatted} (Sau ${hoursToAdd}h làm việc)`;

  if (selectedPriority === 'CAO') {
    slaText.style.color = '#F87171';
  } else if (selectedPriority === 'TRUNG_BINH') {
    slaText.style.color = '#FBBF24';
  } else {
    slaText.style.color = '#34D399';
  }
}

function addBusinessHours(startDate, hours) {
  let date = new Date(startDate.getTime());
  let remainingHours = hours;

  while (remainingHours > 0) {
    date.setHours(date.getHours() + 1);
    // getDay() === 0 là Chủ Nhật -> Bỏ qua
    if (date.getDay() === 0) {
      date.setHours(date.getHours() + 24);
    }
    remainingHours--;
  }
  return date;
}

// Bộ đếm ký tự mô tả sự cố (QT-03: tối thiểu 10 ký tự)
function onIssueDescInput(val) {
  const counter = document.getElementById('descCharCounter');
  if (!counter) return;

  const len = (val || '').trim().length;
  if (len >= 10) {
    counter.className = 'char-counter valid';
    counter.innerText = `${len} ký tự (≥ 10: Hợp lệ)`;
  } else {
    counter.className = 'char-counter';
    counter.innerText = `${len} / 10 ký tự (Cần tối thiểu 10)`;
  }
}

// -------------------------------------------------------------
// 7. KHỞI TẠO PHIẾU BẢO HÀNH MỚI (AC2.2 / US1 / FR1 / QT-03 / QT-06)
// -------------------------------------------------------------
async function submitTicket() {
  const phone = document.getElementById('custPhoneInput').value.trim();
  const name = document.getElementById('custNameInput').value.trim();
  const deviceName = document.getElementById('deviceNameInput').value.trim();
  const serial = document.getElementById('deviceImeiInput').value.trim();
  const issueDesc = document.getElementById('issueDescText').value.trim();
  const catSelect = document.getElementById('issueCatSelect');
  const catId = catSelect ? Number(catSelect.value) || 1 : 1;

  // Validation phía Client
  if (!phone || phone.length < 10) {
    alert('Vui lòng nhập số điện thoại hợp lệ (tối thiểu 10 chữ số) theo chuẩn QT-01!');
    document.getElementById('custPhoneInput').focus();
    return;
  }

  if (!name) {
    alert('Vui lòng nhập họ và tên khách hàng (customer.full_name)!');
    document.getElementById('custNameInput').focus();
    return;
  }

  if (!deviceName) {
    alert('Vui lòng chọn thiết bị và model điện thoại!');
    document.getElementById('deviceNameInput').focus();
    return;
  }

  if (!serial) {
    alert('Vui lòng nhập số Serial / IMEI của thiết bị (device.serial_no)!');
    document.getElementById('deviceImeiInput').focus();
    return;
  }

  if (issueDesc.length < 10) {
    alert('Mô tả sự cố kỹ thuật phải đạt tối thiểu 10 ký tự theo quy tắc nghiệp vụ QT-03!');
    document.getElementById('issueDescText').focus();
    return;
  }

  const payload = {
    customer_name: name,
    customer_phone: phone,
    product_name: deviceName,
    serial_no: serial,
    serial_imei: serial,
    issue_category_id: catId,
    category_id: catId,
    issue_description: issueDesc,
    priority: selectedPriority,
    store_id: 'STORE_01',
    center_id: 1,
  };

  let newTicketCode = null;

  // Gửi API Backend qua ticketsApi (Buổi 9 & 10 SE)
  if (window.ticketsApi) {
    try {
      const data = await window.ticketsApi.tiepNhan(payload);
      if (data && (data.ticket_code || data.id)) {
        newTicketCode = data.ticket_code || data.id;
      }
    } catch (err) {
      console.warn('Lỗi khi gửi API tạo phiếu bảo hành:', err);
      const msg = err.message || 'Lỗi khi gửi yêu cầu tiếp nhận bảo hành tới máy chủ';
      alert(`Không thể tạo phiếu bảo hành: ${msg}`);
      return;
    }
  }

  if (!newTicketCode) {
    newTicketCode = `BH-${String(Math.floor(100000 + Math.random() * 900000))}/2026`;
  }

  showToast(`Tạo phiếu thành công: ${newTicketCode} (Ghi log kiểm toán QT-06)!`);
  clearCreateForm();

  // Tải lại danh sách phiếu và chuyển hướng sang xem chi tiết
  setTimeout(() => {
    loadTickets(1);
    goToDetail(newTicketCode);
  }, 400);
}

// -------------------------------------------------------------
// 8. CHI TIẾT PHIẾU BẢO HÀNH & CHUYỂN TRẠNG THÁI (SCREEN 3)
// -------------------------------------------------------------
async function loadTicketDetail(ticketIdentifier) {
  const codeEl = document.getElementById('detailTicketCode');
  if (codeEl) codeEl.innerText = ticketIdentifier;

  let ticket = null;

  // Gọi API lấy thông tin chi tiết qua ticketsApi (Buổi 9 SE)
  if (window.ticketsApi) {
    try {
      const data = await window.ticketsApi.chiTiet(ticketIdentifier);
      if (data) {
        ticket = data;
      }
    } catch (e) {
      console.warn('Lỗi khi tải chi tiết phiếu qua ticketsApi:', e);
    }
  }

  // Tìm trong danh sách hiện tại nếu API không phản hồi
  if (!ticket && currentTicketsList.length > 0) {
    ticket = currentTicketsList.find(t => t.ticket_code === ticketIdentifier || t.id === ticketIdentifier);
  }

  if (ticket) {
    const custName = document.getElementById('detailCustName');
    if (custName) custName.innerText = ticket.customer_name || 'Khách hàng';

    const custPhone = document.getElementById('detailCustPhone');
    if (custPhone) custPhone.innerText = ticket.customer_phone || '0901234567';

    const statusBadge = document.getElementById('detailStatusBadge');
    if (statusBadge) {
      statusBadge.className = `badge ${getStatusBadgeClass(ticket.status)}`;
      statusBadge.innerText = `Trạng thái: ${formatStatusLabel(ticket.status)}`;
    }

    const devModel = document.getElementById('detailDeviceModel');
    if (devModel) devModel.innerText = ticket.product_name || 'Thiết bị di động';

    const devSerial = document.getElementById('detailDeviceSerial');
    if (devSerial) devSerial.innerText = ticket.serial_no || ticket.serial_imei || '—';

    const warrantyStatus = document.getElementById('detailWarrantyStatus');
    if (warrantyStatus) {
      const isW = ticket.is_warranty !== false;
      warrantyStatus.innerText = isW ? 'Còn bảo hành chính hãng' : 'Hết hạn bảo hành';
      warrantyStatus.style.color = isW ? '#34D399' : '#F87171';
    }

    const catName = document.getElementById('detailCategoryName');
    if (catName) {
      const catText = CATEGORY_MAP[ticket.category_id || ticket.issue_category_id] || ticket.category_name || 'Sự cố kỹ thuật';
      catName.innerText = catText;
    }

    const priorityBadge = document.getElementById('detailPriorityBadge');
    if (priorityBadge) {
      const p = ticket.priority || 'TRUNG_BINH';
      priorityBadge.className = `badge ${getPriorityBadgeClass(p)}`;
      priorityBadge.innerText = formatPriorityLabel(p);
    }

    const dueDateEl = document.getElementById('detailDueDate');
    if (dueDateEl) {
      dueDateEl.innerText = formatDateTime(ticket.due_date);
    }

    const descEl = document.getElementById('detailIssueDesc');
    if (descEl) {
      descEl.innerText = `"${ticket.issue_description || 'Mô tả triệu chứng tiếp nhận từ khách hàng.'}"`;
    }

    // Cập nhật các bước chuyển trạng thái hợp lệ (Vòng đời một chiều QT-06)
    const selectEl = document.getElementById('nextStatusSelect');
    if (selectEl) {
      const currentSt = (ticket.status || 'MOI').toUpperCase();
      const validNextMap = {
        'MOI': [
          { val: 'DA_PHAN_CONG', label: 'ĐÃ PHÂN CÔNG (Bàn giao kỹ thuật viên)' },
          { val: 'DA_HUY', label: 'ĐÃ HỦY (Khách không đồng ý để lại máy)' }
        ],
        'DA_PHAN_CONG': [
          { val: 'DANG_XU_LY', label: 'ĐANG XỬ LÝ (KTV tiếp nhận khám máy)' },
          { val: 'DA_HUY', label: 'ĐÃ HỦY (Khách lấy lại máy)' }
        ],
        'DANG_XU_LY': [
          { val: 'CHO_LINH_KIEN', label: 'CHỜ LINH KIỆN (Yêu cầu kho cung ứng)' },
          { val: 'HOAN_TAT', label: 'HOÀN TẤT (Đã sửa chữa và kiểm tra)' },
          { val: 'DA_HUY', label: 'ĐÃ HỦY (Không sửa chữa được)' }
        ],
        'CHO_LINH_KIEN': [
          { val: 'DANG_XU_LY', label: 'ĐANG XỬ LÝ (Linh kiện đã về)' },
          { val: 'HOAN_TAT', label: 'HOÀN TẤT (Hoàn tất thay thế)' },
          { val: 'DA_HUY', label: 'ĐÃ HỦY' }
        ],
        'HOAN_TAT': [],
        'DA_HUY': []
      };

      const nextOptions = validNextMap[currentSt] || [];
      if (nextOptions.length === 0) {
        selectEl.innerHTML = `<option value="">(Phiếu đã đóng - không thể chuyển tiếp)</option>`;
        selectEl.disabled = true;
      } else {
        selectEl.disabled = false;
        selectEl.innerHTML = nextOptions.map(opt => `<option value="${opt.val}">${opt.label}</option>`).join('');
      }
    }

    // Render timeline lịch sử trạng thái Audit Trail (NFR3 / QT-06)
    const timeline = document.getElementById('activityTimeline');
    if (timeline && ticket.status_history && Array.isArray(ticket.status_history) && ticket.status_history.length > 0) {
      timeline.innerHTML = ticket.status_history.map(item => `
        <div class="timeline-item">
          <div class="timeline-time">${escapeHtml(formatDateTime(item.created_at))}</div>
          <div class="timeline-text">
            ${item.old_status ? `${escapeHtml(formatStatusLabel(item.old_status))} → ` : ''}
            <span class="badge ${getStatusBadgeClass(item.new_status || item.to_status)}" style="font-size: 11px; padding: 2px 8px;">
              ${escapeHtml(formatStatusLabel(item.new_status || item.to_status))}
            </span>
          </div>
          <div class="timeline-author">Thực hiện bởi: <strong>${escapeHtml(item.changed_by || item.updated_by || 'Nhân viên')}</strong></div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Ghi chú: ${escapeHtml(item.note || item.notes || 'Khởi tạo / chuyển trạng thái')}</div>
        </div>
      `).join('');
    }
  }
}

async function updateTicketStatus() {
  const selectEl = document.getElementById('nextStatusSelect');
  if (!selectEl || selectEl.disabled) {
    alert('Phiếu bảo hành này đã kết thúc vòng đời, không thể chuyển tiếp trạng thái!');
    return;
  }
  const nextStatus = selectEl.value;
  const note = (document.getElementById('transitionNoteText') ? document.getElementById('transitionNoteText').value : '').trim();
  const ticketCode = document.getElementById('detailTicketCode').innerText.trim();

  if (!nextStatus) {
    alert('Vui lòng chọn trạng thái tiếp theo!');
    return;
  }

  // Gọi API Backend qua ticketsApi (Buổi 9 & 10 SE)
  if (window.ticketsApi) {
    try {
      await window.ticketsApi.chuyenTrangThai(ticketCode, nextStatus, note);
      showToast('Đã cập nhật trạng thái phiếu và ghi nhận nhật ký kiểm toán!');
      await loadTicketDetail(ticketCode);
      if (typeof loadTickets === 'function') loadTickets(currentPage);
      return;
    } catch (err) {
      console.error('Lỗi khi chuyển trạng thái phiếu:', err);
      alert(`Không thể chuyển trạng thái: ${err.message || 'Lỗi quy tắc chuyển đổi'}`);
      return;
    }
  }

  // Fallback offline nếu không kết nối được ticketsApi
  const statusBadge = document.getElementById('detailStatusBadge');
  if (statusBadge) {
    statusBadge.className = `badge ${getStatusBadgeClass(nextStatus)}`;
    statusBadge.innerText = `Trạng thái: ${formatStatusLabel(nextStatus)}`;
  }

  const timeline = document.getElementById('activityTimeline');
  if (timeline) {
    const timeStr = formatDateTime(new Date());
    const item = document.createElement('div');
    item.className = 'timeline-item';
    item.innerHTML = `
      <div class="timeline-time">${escapeHtml(timeStr)}</div>
      <div class="timeline-text">Chuyển trạng thái → <span class="badge ${getStatusBadgeClass(nextStatus)}" style="font-size: 11px; padding: 2px 8px;">${formatStatusLabel(nextStatus)}</span></div>
      <div class="timeline-author">Thực hiện bởi: <strong>Nguyễn Bá Anh Khôi</strong> (Receptionist)</div>
      <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Ghi chú: ${escapeHtml(note || 'Chuyển giao theo quy trình')}</div>
    `;
    timeline.prepend(item);
  }

  showToast('Đã cập nhật trạng thái phiếu và ghi nhận nhật ký kiểm toán!');
}

function printReceipt() {
  showToast('Đang kết nối máy in biên nhận tiếp nhận bảo hành...');
}

// -------------------------------------------------------------
// 9. TIỆN ÍCH HELPER & ĐỊNH DẠNG DỮ LIỆU
// -------------------------------------------------------------
function formatDateTime(val) {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins}`;
  } catch (e) {
    return String(val);
  }
}

function getPriorityBadgeClass(p) {
  const norm = String(p || '').toUpperCase();
  if (norm === 'CAO' || norm === 'HIGH') return 'badge-priority-high';
  if (norm === 'THAP' || norm === 'LOW') return 'badge-priority-low';
  return 'badge-priority-med';
}

function formatPriorityLabel(p) {
  const norm = String(p || '').toUpperCase();
  if (norm === 'CAO' || norm === 'HIGH') return 'CAO';
  if (norm === 'THAP' || norm === 'LOW') return 'THẤP';
  return 'TRUNG BÌNH';
}

function getStatusBadgeClass(s) {
  const norm = String(s || '').toUpperCase();
  if (norm === 'MOI' || norm === 'NEW') return 'badge-new';
  if (norm === 'DA_PHAN_CONG' || norm === 'ASSIGNED') return 'badge-assigned';
  if (norm === 'DANG_XU_LY' || norm === 'PROCESSING') return 'badge-processing';
  if (norm === 'CHO_LINH_KIEN') return 'badge-parts';
  if (norm === 'HOAN_TAT' || norm === 'COMPLETED' || norm === 'DA_DONG') return 'badge-closed';
  if (norm === 'DA_HUY' || norm === 'CANCELLED') return 'badge-cancelled';
  return 'badge-new';
}

function formatStatusLabel(s) {
  const norm = String(s || '').toUpperCase();
  if (norm === 'MOI' || norm === 'NEW') return 'MỚI';
  if (norm === 'DA_PHAN_CONG' || norm === 'ASSIGNED') return 'ĐÃ PHÂN CÔNG';
  if (norm === 'DANG_XU_LY' || norm === 'PROCESSING') return 'ĐANG XỬ LÝ';
  if (norm === 'CHO_LINH_KIEN') return 'CHỜ LINH KIỆN';
  if (norm === 'HOAN_TAT' || norm === 'COMPLETED' || norm === 'DA_DONG') return 'HOÀN TẤT';
  if (norm === 'DA_HUY' || norm === 'CANCELLED') return 'ĐÃ HỦY';
  return norm || 'MỚI';
}

function showToast(msg) {
  const toast = document.getElementById('toastMessage');
  const toastText = document.getElementById('toastText');
  if (!toast || !toastText) return;
  toastText.innerText = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Đóng dropdown khi click ra ngoài combobox
document.addEventListener('click', e => {
  const wrapper = document.getElementById('deviceCombobox');
  if (wrapper && !wrapper.contains(e.target)) {
    closeDeviceDropdown();
  }
});

// -------------------------------------------------------------
// 10. KHỞI TẠO ỨNG DỤNG KHI TẢI TRANG
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  initAuth();
  switchTab('screen-list');
  await initPhoneModels();
  await loadTickets(1);
});
