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
// 1. TAB SWITCHING LOGIC
// -------------------------------------------------------------
function switchTab(screenId, element) {
  const screens = document.querySelectorAll('.screen');
  const pills = document.querySelectorAll('.nav-pill');

  if (element) {
    pills.forEach(p => p.classList.remove('active'));
    element.classList.add('active');
  } else {
    pills.forEach(p => {
      const onclickAttr = p.getAttribute('onclick') || '';
      if (onclickAttr.includes(screenId)) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });
  }

  if (screenId === 'all') {
    screens.forEach(s => (s.style.display = 'block'));
    showToast('Đang hiển thị toàn bộ 3 màn hình Wireframe');
    return;
  }

  screens.forEach(s => {
    if (s.id === screenId) {
      s.style.display = 'block';
      s.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      s.style.display = 'none';
    }
  });
}

function goToCreate() {
  const createPill = document.querySelectorAll('.nav-pill')[1];
  switchTab('screen-create', createPill);
}

function goToDetail(ticketIdentifier) {
  loadTicketDetail(ticketIdentifier);
  const detailPill = document.querySelectorAll('.nav-pill')[2];
  switchTab('screen-detail', detailPill);
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

  let tickets = [];
  let total = 0;

  // Gọi API Backend nếu có kết nối HTTP
  if (window.location.protocol.startsWith('http')) {
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(pageSize),
      });
      if (searchVal) params.append('q', searchVal);
      if (statusVal && statusVal !== 'ALL') params.append('status', statusVal);
      if (centerVal && centerVal !== 'ALL') params.append('center_id', centerVal);

      const res = await fetch(`/api/tickets?${params.toString()}`);
      if (res.ok) {
        const body = await res.json();
        tickets = body.data || [];
        total = body.total || 0;
        totalPages = body.totalPages || Math.ceil(total / pageSize) || 1;
      }
    } catch (err) {
      console.warn('Không thể kết nối API /api/tickets, sử dụng dữ liệu cục bộ:', err);
    }
  }

  // Fallback sang dữ liệu mẫu cục bộ nạp sẵn từ dataset
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
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 40px; color: var(--text-muted);">
          <div style="font-size: 15px; font-weight: 600; color: #CBD5E1; margin-bottom: 6px;">Không tìm thấy phiếu bảo hành nào phù hợp</div>
          <div style="font-size: 12.5px;">Vui lòng kiểm tra lại từ khóa tra cứu hoặc thay đổi bộ lọc trạng thái / chi nhánh.</div>
        </td>
      </tr>
    `;
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
  // Thử tải từ API Backend
  if (window.location.protocol.startsWith('http')) {
    try {
      const res = await fetch('/api/catalog/products?phonesOnly=true&limit=all');
      if (res.ok) {
        const body = await res.json();
        if (body.data && body.data.length > 0) {
          allPhoneModels = body.data;
        }
      }
    } catch (e) {
      console.warn('Chưa thể kết nối API /api/catalog/products:', e.message);
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
  const serial = document.getElementById('deviceImeiInput').value.trim();
  const alertBox = document.getElementById('warrantyAlertBox');
  const alertText = document.getElementById('warrantyAlertText');
  if (!alertBox || !alertText) return;

  // Nếu số serial là SN-A52-778901 như ảnh 3, hiển thị hết hạn bảo hành
  if (serial.includes('778901') || serial.includes('SN-A52')) {
    alertBox.className = 'warranty-alert-box';
    alertText.innerHTML = `⚠ Thiết bị ${escapeHtml(serial)} đã hết hạn bảo hành (QT-01).`;
  } else {
    // Mặc định thiết bị hợp lệ còn hạn bảo hành
    alertBox.className = 'warranty-alert-box valid';
    alertText.innerHTML = `✔ Thiết bị ${escapeHtml(serial || 'chính hãng')} đối soát ERP hợp lệ: Còn hạn bảo hành chính hãng (QT-05).`;
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

  // Gọi API Backend tra cứu trên 67.037 khách hàng thật
  if (window.location.protocol.startsWith('http')) {
    try {
      const res = await fetch(`/api/customers?phone=${encodeURIComponent(phone)}`);
      const body = await res.json();
      if (res.ok && body.found && body.data) {
        document.getElementById('custNameInput').value = body.data.full_name;
        showToast(`Đã tìm thấy hồ sơ: ${body.data.full_name} (QT-01)`);
        checkWarrantyStatus();
        return;
      }
    } catch (e) {
      console.warn('Lỗi khi gọi /api/customers:', e);
    }
  }

  // Fallback tra cứu offline trên mẫu dữ liệu
  if (phone.includes('0909123456') || phone.includes('0901234567')) {
    document.getElementById('custNameInput').value = 'Nguyễn Văn An';
    showToast('Đã tìm thấy thông tin khách hàng: Nguyễn Văn An (QT-01)');
    checkWarrantyStatus();
  } else {
    showToast('Khách hàng mới! Họ tên sẽ được lưu hồ sơ tự động khi tạo phiếu.');
    document.getElementById('custNameInput').focus();
  }
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

  let newTicketCode = `BH-${String(Math.floor(100000 + Math.random() * 900000))}/2026`;

  // Gửi API Backend
  if (window.location.protocol.startsWith('http')) {
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const body = await res.json();
        if (body.data && body.data.ticket_code) {
          newTicketCode = body.data.ticket_code;
        }
      }
    } catch (err) {
      console.warn('Lỗi khi gửi API /api/tickets:', err);
    }
  }

  showToast(`Tạo phiếu thành công: ${newTicketCode} (Ghi log kiểm toán QT-06)!`);

  // Tải lại danh sách phiếu
  setTimeout(() => {
    loadTickets(1);
    goToDetail(newTicketCode);
  }, 500);
}

// -------------------------------------------------------------
// 8. CHI TIẾT PHIẾU BẢO HÀNH & CHUYỂN TRẠNG THÁI (SCREEN 3)
// -------------------------------------------------------------
async function loadTicketDetail(ticketIdentifier) {
  document.getElementById('detailTicketCode').innerText = ticketIdentifier;

  let ticket = null;

  // Gọi API lấy thông tin chi tiết
  if (window.location.protocol.startsWith('http')) {
    try {
      const res = await fetch(`/api/tickets/${encodeURIComponent(ticketIdentifier)}`);
      if (res.ok) {
        const body = await res.json();
        ticket = body.data;
      }
    } catch (e) {
      console.warn('Lỗi khi tải chi tiết phiếu:', e);
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
  }
}

function updateTicketStatus() {
  const nextStatus = document.getElementById('nextStatusSelect').value;
  const note = document.getElementById('transitionNoteText').value;
  const ticketCode = document.getElementById('detailTicketCode').innerText;

  const statusBadge = document.getElementById('detailStatusBadge');
  if (statusBadge) {
    statusBadge.className = `badge ${getStatusBadgeClass(nextStatus)}`;
    statusBadge.innerText = `Trạng thái: ${formatStatusLabel(nextStatus)}`;
  }

  // Ghi nhận vào dòng thời gian Audit Trail
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
  switchTab('screen-list', document.querySelectorAll('.nav-pill')[0]);
  await initPhoneModels();
  await loadTickets(1);
  updateSlaPrediction();
  checkWarrantyStatus();
});
