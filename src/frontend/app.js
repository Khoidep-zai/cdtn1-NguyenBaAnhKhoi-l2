// Tab Switching Logic
function switchTab(screenId, element) {
  const screens = document.querySelectorAll('.screen');
  const pills = document.querySelectorAll('.nav-pill');
  
  if (element) {
    pills.forEach(p => p.classList.remove('active'));
    element.classList.add('active');
  }
  
  if (screenId === 'all') {
    screens.forEach(s => s.style.display = 'block');
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

function goToDetail(code) {
  document.getElementById('detailTicketCode').innerText = code;
  const detailPill = document.querySelectorAll('.nav-pill')[2];
  switchTab('screen-detail', detailPill);
}

// Live Filter for tickets table
function filterTable() {
  const searchVal = document.getElementById('searchInput').value.toLowerCase().trim();
  const statusVal = document.getElementById('statusFilter').value;
  const rows = document.querySelectorAll('#ticketsTable tbody tr');
  
  rows.forEach(row => {
    const text = row.innerText.toLowerCase();
    const status = row.getAttribute('data-status');
    
    const matchSearch = searchVal === '' || text.includes(searchVal);
    const matchStatus = statusVal === 'ALL' || status === statusVal;
    
    if (matchSearch && matchStatus) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

function resetFilter() {
  document.getElementById('searchInput').value = '';
  document.getElementById('statusFilter').value = 'ALL';
  filterTable();
  showToast('Đã đặt lại bộ lọc danh sách');
}

// Simulate customer lookup
function simulateLookup() {
  const phone = document.getElementById('custPhoneInput').value.trim();
  if (phone === '0901234567') {
    document.getElementById('custNameInput').value = 'Trần Văn A';
    document.getElementById('custAddressInput').value = '123 Đường 30/4, Quận Ninh Kiều, TP. Cần Thơ';
    document.getElementById('deviceImeiInput').value = '356891238910';
    document.getElementById('deviceNameInput').value = 'iPhone 14 Pro Max 256GB Deep Purple';
    showToast('Đã tìm thấy thông tin khách hàng: Trần Văn A (QT-01)');
  } else {
    showToast('Khách hàng mới! Vui lòng nhập thông tin để tạo hồ sơ.');
    document.getElementById('custNameInput').disabled = false;
    document.getElementById('custNameInput').value = '';
    document.getElementById('custAddressInput').disabled = false;
    document.getElementById('custAddressInput').value = '';
    document.getElementById('custNameInput').focus();
  }
}

// Dynamic SLA prediction according to QT-04
function updateSlaPrediction() {
  const priority = document.getElementById('prioritySelect').value;
  const slaText = document.getElementById('slaPreviewText');
  if (priority === 'CAO') {
    slaText.innerText = '09/09/2026 14:30 (Sau 24 giờ)';
    slaText.style.color = '#F87171';
  } else if (priority === 'TRUNG_BINH') {
    slaText.innerText = '11/09/2026 14:30 (Sau 72 giờ)';
    slaText.style.color = '#FBBF24';
  } else {
    slaText.innerText = '13/09/2026 14:30 (Sau 120 giờ)';
    slaText.style.color = '#34D399';
  }
}

// Create Ticket Simulation
function submitTicket() {
  const phone = document.getElementById('custPhoneInput').value;
  const name = document.getElementById('custNameInput').value;
  const imei = document.getElementById('deviceImeiInput').value;
  
  if (!phone || !name || !imei) {
    alert('Vui lòng điền đủ các trường bắt buộc!');
    return;
  }
  
  showToast('Tạo phiếu bảo hành BH-000232/26 thành công!');
  setTimeout(() => {
    goToDetail('BH-000232/26');
  }, 600);
}

// Status transition simulation
function updateTicketStatus() {
  const nextStatus = document.getElementById('nextStatusSelect').value;
  const note = document.getElementById('transitionNoteText').value;
  const statusBadge = document.getElementById('detailStatusBadge');
  const rowStatusBadge = document.getElementById('row-status-badge');
  
  if (nextStatus === 'DA_PHAN_CONG') {
    statusBadge.className = 'badge badge-assigned';
    statusBadge.innerText = 'Trạng thái: ĐÃ PHÂN CÔNG';
    if (rowStatusBadge) {
      rowStatusBadge.className = 'badge badge-assigned';
      rowStatusBadge.innerText = 'ĐÃ PHÂN CÔNG';
    }
  } else if (nextStatus === 'DA_HUY') {
    statusBadge.className = 'badge badge-priority-high';
    statusBadge.innerText = 'Trạng thái: ĐÃ HỦY';
    if (rowStatusBadge) {
      rowStatusBadge.className = 'badge badge-priority-high';
      rowStatusBadge.innerText = 'ĐÃ HỦY';
    }
  }
  
  // Add to timeline
  const timeline = document.getElementById('activityTimeline');
  const now = new Date();
  const timeStr = '08/09/2026 14:45';
  
  const item = document.createElement('div');
  item.className = 'timeline-item';
  item.innerHTML = `
    <div class="timeline-time">${timeStr}</div>
    <div class="timeline-text">Chuyển trạng thái → <span class="badge ${nextStatus === 'DA_PHAN_CONG' ? 'badge-assigned' : 'badge-priority-high'}" style="font-size: 11px; padding: 2px 8px;">${nextStatus}</span></div>
    <div class="timeline-author">Thực hiện bởi: <strong>Nguyễn Bá Anh Khôi</strong> (Receptionist)</div>
    <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Ghi chú: ${note || 'Không có ghi chú'}</div>
  `;
  timeline.prepend(item);
  
  showToast('Đã cập nhật trạng thái phiếu thành công!');
}

function printReceipt() {
  showToast('Đang kết nối máy in biên nhận tiếp nhận bảo hành...');
}

function showToast(msg) {
  const toast = document.getElementById('toastMessage');
  document.getElementById('toastText').innerText = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Initialize view
document.addEventListener('DOMContentLoaded', () => {
  switchTab('screen-list', document.querySelectorAll('.nav-pill')[0]);
});
