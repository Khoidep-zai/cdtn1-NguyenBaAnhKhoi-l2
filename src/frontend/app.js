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
let selectedWarrantyStatus = null;
let currentTheme = 'dark';
let currentLanguage = 'vi';
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
  1: 'TTBH Quận 10',
  2: 'TTBH Quận Tân Bình',
  3: 'TTBH TP. Thủ Đức',
  4: 'TTBH Ninh Kiều',
  5: 'TTBH Cái Răng',
  6: 'TTBH Cầu Giấy',
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
    canReassignTechnician: false,
    canManageStaff: false,
    canManageAllAccounts: false
  },
  QUAN_LY_CHI_NHANH: {
    role: 'QUAN_LY_CHI_NHANH',
    name: 'Võ Thành Long',
    username: 'quanly01',
    roleLabel: 'Quản lý chi nhánh',
    avatar: 'TL',
    badgeClass: 'role-manager',
    badgeIcon: '🛡️',
    branchId: 1,
    branchName: 'Chi nhánh 01 (Cần Thơ)',
    canViewAllCenters: false,
    canOverrideSla: true,
    canReassignTechnician: true,
    canManageStaff: true,
    canManageAllAccounts: false
  },
  QUAN_LY_HE_THONG: {
    role: 'QUAN_LY_HE_THONG',
    name: 'Võ Thành Long',
    username: 'hethong01',
    roleLabel: 'Quản lý hệ thống',
    avatar: 'TL',
    badgeClass: 'role-manager',
    badgeIcon: '🛡️',
    branchId: null,
    branchName: 'Toàn hệ thống (CN 01 - 06)',
    canViewAllCenters: true,
    canOverrideSla: true,
    canReassignTechnician: true,
    canManageStaff: true,
    canManageAllAccounts: true
  }
};

let currentUser = null;

function setAppVisibility(visible) {
  document.querySelectorAll('.navbar, .container').forEach((element) => {
    element.hidden = !visible;
  });
}

function mapAuthenticatedUser(user) {
  const roleMetadata = USER_ROLES[user?.role];
  return roleMetadata && user ? { ...roleMetadata, ...user } : null;
}

async function initAuth() {
  initializePreferences();
  try {
    currentUser = mapAuthenticatedUser(await window.authApi.me());
  } catch (e) { currentUser = null; }
  setAppVisibility(Boolean(currentUser));
  if (currentUser) {
    try { await loadCenters(); } catch (error) { console.warn('Không thể tải danh sách chi nhánh:', error.message); }
    applyUserRoleToUI();
    resetTicketFiltersForLogin();
    await Promise.all([loadTickets(1), initPhoneModels()]);
  }
  else openLoginModal();
}

function applyUserRoleToUI() {
  if (!currentUser) return;
  const avatarEl = document.getElementById('userAvatar');
  const nameEl = document.getElementById('userName');
  const roleTagEl = document.getElementById('userRoleTag');
  const branchTagEl = document.getElementById('userBranchTag');
  const centerFilter = document.getElementById('centerFilter');
  const accountButton = document.getElementById('accountAdminButton');

  if (avatarEl) avatarEl.textContent = currentUser.avatar;
  if (nameEl) nameEl.textContent = currentUser.name;
  if (roleTagEl) {
    roleTagEl.className = `role-tag ${currentUser.badgeClass}`;
    roleTagEl.innerHTML = `<span class="role-dot"></span><span>${escapeHtml(currentUser.roleLabel)}</span>`;
  }
  if (branchTagEl) branchTagEl.textContent = currentUser.branchName;
  if (accountButton) accountButton.hidden = !currentUser.canManageStaff;

  // Thiết lập quyền lọc chi nhánh theo Role
  if (centerFilter) {
    if (!currentUser.canViewAllCenters) {
      centerFilter.value = String(currentUser.branchId || 1);
      centerFilter.disabled = true;
    } else {
      centerFilter.disabled = false;
      if (centerFilter.value === '1' && !localStorage.getItem('mekong_crm_manual_center')) {
        centerFilter.value = 'ALL';
      }
    }
  }
}

function updateThemeToggleUI() {
  const sun = document.getElementById('themeIconSun');
  const moon = document.getElementById('themeIconMoon');
  const btn = document.getElementById('themeToggle');
  if (sun && moon) {
    sun.style.display = currentTheme === 'dark' ? 'block' : 'none';
    moon.style.display = currentTheme === 'dark' ? 'none' : 'block';
  } else if (btn) {
    btn.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
  }
  if (btn) {
    btn.title = currentTheme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối';
  }
}

function initializePreferences() {
  try {
    currentTheme = localStorage.getItem('mekong_crm_theme') === 'light' ? 'light' : 'dark';
    currentLanguage = localStorage.getItem('mekong_crm_language') === 'en' ? 'en' : 'vi';
  } catch (e) { currentTheme = 'dark'; currentLanguage = 'vi'; }
  document.body.dataset.theme = currentTheme;
  document.documentElement.lang = currentLanguage;
  updateThemeToggleUI();
  const languageButton = document.getElementById('languageToggle');
  const languageLabel = document.getElementById('languageLabel');
  if (languageLabel) languageLabel.textContent = currentLanguage === 'vi' ? 'EN' : 'VI';
  else if (languageButton) languageButton.textContent = currentLanguage === 'vi' ? 'EN' : 'VI';
}

function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.body.dataset.theme = currentTheme;
  try { localStorage.setItem('mekong_crm_theme', currentTheme); } catch (e) { console.debug('Không lưu được theme vào localStorage:', e); }
  updateThemeToggleUI();
}

function toggleLanguage() {
  currentLanguage = currentLanguage === 'vi' ? 'en' : 'vi';
  document.documentElement.lang = currentLanguage;
  const button = document.getElementById('languageToggle');
  const label = document.getElementById('languageLabel');
  if (label) label.textContent = currentLanguage === 'vi' ? 'EN' : 'VI';
  else if (button) button.textContent = currentLanguage === 'vi' ? 'EN' : 'VI';
  const pairs = {
    'Danh sách phiếu bảo hành tiếp nhận': 'Warranty ticket list', 'Tạo phiếu mới': 'Create ticket',
    'Khởi tạo phiếu tiếp nhận bảo hành mới': 'Create a warranty intake ticket', '← Quay lại danh sách': '← Back to list',
    'Tra cứu': 'Search', 'Số điện thoại khách hàng': 'Customer phone number', 'Họ tên khách hàng': 'Customer name',
    'Địa chỉ liên hệ': 'Contact address', 'Chọn thiết bị & Model': 'Select device & model',
    'Số serial/IMEI thiết bị': 'Device serial/IMEI', 'Mô tả sự cố': 'Issue description',
    'Nhóm sự cố kỹ thuật': 'Technical issue category', 'Mức ưu tiên tiếp nhận': 'Intake priority',
    'Hồ sơ cá nhân': 'My profile', 'Lưu hồ sơ': 'Save profile', 'Đổi tài khoản': 'Sign out',
    'Khách hàng': 'Customer', 'Mã phiếu': 'Ticket ID', 'Số điện thoại': 'Phone number',
    'Thiết bị & Serial': 'Device & serial', 'Nhóm lỗi': 'Issue category', 'Mức ưu tiên': 'Priority',
    'Trạng thái': 'Status', 'Hạn cam kết (SLA)': 'SLA deadline', 'Hành động': 'Actions',
    'Tất cả trạng thái': 'All statuses', 'Tất cả chi nhánh (6 trung tâm)': 'All branches (6 centers)',
    '25 dòng/trang': '25 rows/page', '50 dòng/trang': '50 rows/page', '100 dòng/trang': '100 rows/page',
    'Đặt lại': 'Reset', 'Chi tiết →': 'Details →', '← Quay lại': '← Back', 'Hủy': 'Cancel',
    'Họ và tên': 'Full name', 'Vai trò': 'Role', 'Lưu hồ sơ': 'Save profile',
    'Tên đăng nhập': 'Username', 'Mật khẩu tạm': 'Temporary password',
    'Tạo tài khoản': 'Create account', 'Tối thiểu 6 ký tự ở môi trường dev; 12 ký tự ở production.': 'At least 6 characters in development and 12 in production.',
    'Thông tin của tài khoản đang đăng nhập': 'Information for the signed-in account',
    'Quản lý tài khoản': 'Manage accounts', 'Tài khoản': 'Account', 'Chi nhánh': 'Branch',
    'Thao tác': 'Actions', 'Đang hoạt động': 'Active', 'Ngưng hoạt động': 'Inactive',
    'Nhân viên tiếp nhận': 'Reception staff', 'Quản lý chi nhánh': 'Branch manager', 'Quản lý hệ thống': 'System manager',
    'Tạo phiếu bảo hành thành công.': 'Warranty ticket created successfully.',
    'Thiết bị & model': 'Device & model', 'Số Serial/IMEI': 'Serial/IMEI',
    'Thông báo tình trạng bảo hành': 'Warranty status', 'Thiết bị còn bảo hành': 'Device is under warranty',
    'Chưa có dữ liệu': 'No data available', 'Không tìm thấy phiếu bảo hành': 'Warranty ticket not found'
  };
  const textWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = textWalker.nextNode(); node; node = textWalker.nextNode()) {
    const parent = node.parentElement;
    if (!parent || parent.closest('script,style')) continue;
    const original = parent.dataset.viText || node.nodeValue.trim();
    if (!parent.dataset.viText && pairs[original]) parent.dataset.viText = original;
    if (parent.dataset.viText) node.nodeValue = node.nodeValue.replace(node.nodeValue.trim(), currentLanguage === 'en' ? (pairs[parent.dataset.viText] || parent.dataset.viText) : parent.dataset.viText);
  }
  [['searchInput','Tra cứu theo mã phiếu (BH-...), SĐT, tên khách, số Serial/IMEI, sự cố...','Search by ticket, phone, customer, serial/IMEI or issue...'],
   ['custPhoneInput','Nhập số điện thoại khách hàng (VD: 0909123456)...','Enter customer phone number (e.g. 0909123456)...'],
   ['custNameInput','Nhập họ và tên khách hàng...','Enter customer full name...'],
   ['custAddressInput','Nhập địa chỉ liên hệ của khách hàng...','Enter customer contact address...']].forEach(([id, vi, en]) => {
    const input = document.getElementById(id); if (input) input.placeholder = currentLanguage === 'en' ? en : vi;
  });
}

const dialogPreviousFocus = new WeakMap();

function showDialog(modal, focusTarget) {
  if (!modal) return;
  if (modal.style.display !== 'flex') dialogPreviousFocus.set(modal, document.activeElement);
  modal.style.display = 'flex';
  focusTarget?.focus();
}

function hideDialog(modal) {
  if (!modal) return;
  modal.style.display = 'none';
  const previousFocus = dialogPreviousFocus.get(modal);
  dialogPreviousFocus.delete(modal);
  if (previousFocus instanceof HTMLElement && previousFocus.isConnected && previousFocus.getClientRects().length) {
    previousFocus.focus();
  } else if (currentUser) {
    document.getElementById('searchInput')?.focus();
  }
}

function getOpenDialog() {
  return ['loginModal', 'userManagementModal', 'profileModal']
    .map(id => document.getElementById(id))
    .find(modal => modal?.style.display === 'flex');
}

document.addEventListener('keydown', event => {
  // Phím tắt bàn phím nghiệp vụ quầy bảo hành (Alt+N: Tạo phiếu nhanh; /: Tra cứu nhanh)
  if (event.altKey && (event.key === 'n' || event.key === 'N')) {
    event.preventDefault();
    goToCreate();
    return;
  }

  if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      event.preventDefault();
      if (document.getElementById('screen-list')?.style.display === 'none') {
        goToList();
      }
      searchInput.focus();
      searchInput.select();
    }
    return;
  }

  const modal = getOpenDialog();
  if (!modal) {
    if (event.key === 'Escape') {
      const createScreen = document.getElementById('screen-create');
      const detailScreen = document.getElementById('screen-detail');
      if (createScreen && createScreen.style.display !== 'none') {
        goToList();
      } else if (detailScreen && detailScreen.style.display !== 'none') {
        goToList();
      }
    }
    return;
  }

  if (event.key === 'Escape') {
    if (modal.id === 'loginModal' && !currentUser) return;
    event.preventDefault();
    if (modal.id === 'profileModal') closeProfileModal();
    else if (modal.id === 'userManagementModal') closeUserManagement();
    else closeLoginModal();
    return;
  }

  if (event.key !== 'Tab') return;
  const focusable = Array.from(modal.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )).filter(element => !element.hidden && element.getClientRects().length);
  if (!focusable.length) {
    event.preventDefault();
    modal.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!modal.contains(document.activeElement)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  } else if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

function openProfileModal() {
  if (!currentUser) return;
  document.getElementById('profileNameInput').value = currentUser.name || '';
  document.getElementById('profilePhoneInput').value = currentUser.phone || '';
  document.getElementById('profileUsername').textContent = currentUser.username;
  document.getElementById('profileRole').textContent = currentUser.roleLabel;
  showDialog(document.getElementById('profileModal'), document.getElementById('profileNameInput'));
}

function closeProfileModal() {
  hideDialog(document.getElementById('profileModal'));
}

async function saveProfile(event) {
  event.preventDefault();
  if (!currentUser) return;
  try {
    const updated = await window.authApi.updateProfile({
      full_name: document.getElementById('profileNameInput').value.trim(),
      phone: document.getElementById('profilePhoneInput').value.trim(),
    });
    currentUser = mapAuthenticatedUser(updated);
    applyUserRoleToUI(); closeProfileModal(); showToast('Đã lưu hồ sơ cá nhân.');
  } catch (error) { showToast(error.message || 'Không thể lưu hồ sơ.'); }
}

function openLoginModal() {
  const modal = document.getElementById('loginModal');
  const errorMsg = document.getElementById('loginErrorMsg');
  if (errorMsg) errorMsg.style.display = 'none';
  showDialog(modal, document.getElementById('loginUsernameInput'));
  const closeButton = document.getElementById('loginCloseButton');
  if (closeButton) closeButton.hidden = !currentUser;
  const logoutButton = document.getElementById('loginLogoutButton');
  if (logoutButton) logoutButton.hidden = !currentUser;
  const title = document.getElementById('loginTitle');
  if (title) title.textContent = currentUser ? 'TÀI KHOẢN' : 'ĐĂNG NHẬP HỆ THỐNG CRM';
}

function closeLoginModal() {
  if (!currentUser) return;
  hideDialog(document.getElementById('loginModal'));
}

async function handleManualLogin(event) {
  event.preventDefault();
  const username = (document.getElementById('loginUsernameInput').value || '').trim().toLowerCase();
  const password = document.getElementById('loginPasswordInput').value || '';
  const errorMsg = document.getElementById('loginErrorMsg');
  try {
    currentUser = mapAuthenticatedUser(await window.authApi.login(username, password));
    if (!currentUser) throw new Error('Tài khoản không có vai trò hợp lệ.');
  } catch (error) {
    if (errorMsg) {
      errorMsg.textContent = error.message || 'Tên đăng nhập hoặc mật khẩu không đúng.';
      errorMsg.style.display = 'block';
    }
    return;
  }

  try { await loadCenters(); } catch (error) { console.warn('Không thể tải danh sách chi nhánh:', error.message); }
  setAppVisibility(true);
  applyUserRoleToUI();
  resetTicketFiltersForLogin();
  closeLoginModal();
  document.getElementById('loginPasswordInput').value = '';
  showToast(`Đã đăng nhập: ${currentUser.roleLabel}`);
  await Promise.all([loadTickets(1), initPhoneModels()]);
}

async function logoutDemo() {
  try { await window.authApi.logout(); } catch (e) { console.debug('Lỗi đăng xuất API:', e); }
  currentUser = null;
  setAppVisibility(false);
  openLoginModal();
}

const ROLE_LABELS = { NHAN_VIEN: 'Nhân viên tiếp nhận', QUAN_LY_CHI_NHANH: 'Quản lý chi nhánh', QUAN_LY_HE_THONG: 'Quản lý hệ thống' };
let CENTER_OPTIONS = [
  { center_id: 1, center_name: 'TTBH Quận 10' },
  { center_id: 2, center_name: 'TTBH Quận Tân Bình' },
  { center_id: 3, center_name: 'TTBH TP. Thủ Đức' },
  { center_id: 4, center_name: 'TTBH Ninh Kiều' },
  { center_id: 5, center_name: 'TTBH Cái Răng' },
  { center_id: 6, center_name: 'TTBH Cầu Giấy' },
];

async function loadCenters() {
  const response = await fetch('/api/centers');
  const payload = await response.json();
  if (!response.ok || !Array.isArray(payload.data)) throw new Error('Danh sách chi nhánh không hợp lệ.');

  CENTER_OPTIONS = payload.data.map((center) => ({ center_id: Number(center.center_id), center_name: center.center_name }));
  Object.keys(CENTER_MAP).forEach((id) => delete CENTER_MAP[id]);
  CENTER_OPTIONS.forEach((center) => { CENTER_MAP[center.center_id] = center.center_name; });

  const centerFilter = document.getElementById('centerFilter');
  if (centerFilter) {
    const selected = centerFilter.value;
    centerFilter.replaceChildren(new Option(`Tất cả chi nhánh (${CENTER_OPTIONS.length} trung tâm)`, 'ALL'));
    CENTER_OPTIONS.forEach((center) => centerFilter.add(new Option(center.center_name, String(center.center_id))));
    centerFilter.value = [...centerFilter.options].some((option) => option.value === selected) ? selected : 'ALL';
  }

  const createCenter = document.getElementById('newUserCenter');
  if (createCenter) {
    const selected = createCenter.value;
    createCenter.replaceChildren(...CENTER_OPTIONS.map((center) => new Option(center.center_name, String(center.center_id))));
    if ([...createCenter.options].some((option) => option.value === selected)) createCenter.value = selected;
  }
}

async function openUserManagement() {
  if (!currentUser?.canManageStaff) return;
  const systemManager = currentUser.role === 'QUAN_LY_HE_THONG';
  document.getElementById('userManagementScope').textContent = systemManager
    ? 'Quản lý tài khoản trên toàn hệ thống.'
    : `Chỉ quản lý nhân viên tại ${currentUser.branchName}.`;
  document.getElementById('newUserRoleField').hidden = !systemManager;
  document.getElementById('newUserCenterField').hidden = !systemManager;
  if (!systemManager) document.getElementById('newUserCenter').value = String(currentUser.branchId);
  document.getElementById('userManagementMessage').textContent = '';
  showDialog(document.getElementById('userManagementModal'), document.getElementById('newUserUsername'));
  await loadManagedUsers();
}

function closeUserManagement() {
  hideDialog(document.getElementById('userManagementModal'));
}

async function loadManagedUsers() {
  const body = document.getElementById('managedUsersBody');
  body.innerHTML = '<tr><td colspan="6">Đang tải tài khoản…</td></tr>';
  try {
    const users = await window.authApi.listUsers();
    body.innerHTML = users.map((user) => {
      const roleOptions = Object.entries(ROLE_LABELS).map(([key, label]) => `<option value="${key}" ${user.role === key ? 'selected' : ''}>${label}</option>`).join('');
      const centerOptions = CENTER_OPTIONS.map((center) => `<option value="${center.center_id}" ${Number(user.branchId) === center.center_id ? 'selected' : ''}>${String(center.center_id).padStart(2, '0')} · ${escapeHtml(center.center_name)}</option>`).join('');
      return `<tr data-user-id="${Number(user.id)}">
        <td class="col-username">${escapeHtml(user.username)}</td>
        <td><input data-field="full_name" value="${escapeHtml(user.name)}" maxlength="120" aria-label="Họ tên ${escapeHtml(user.username)}"></td>
        <td><select data-field="role" ${currentUser.role !== 'QUAN_LY_HE_THONG' ? 'disabled' : ''}>${roleOptions}</select></td>
        <td><select data-field="center_id" ${currentUser.role !== 'QUAN_LY_HE_THONG' || user.role === 'QUAN_LY_HE_THONG' ? 'disabled' : ''}>${centerOptions}</select></td>
        <td><span class="status-indicator ${user.isActive ? 'status-active' : 'status-locked'}">${user.isActive ? 'Đang hoạt động' : 'Đã khóa'}</span></td>
        <td class="col-actions"><div class="managed-user-actions"><button type="button" class="btn btn-secondary btn-user-save" data-action="save">Lưu</button><button type="button" class="btn btn-secondary btn-user-toggle ${user.isActive ? 'is-locked' : 'is-active'}" data-action="toggle">${user.isActive ? 'Khóa' : 'Mở khóa'}</button></div></td>
      </tr>`;
    }).join('') || '<tr><td colspan="6">Chưa có tài khoản phù hợp.</td></tr>';
  } catch (error) {
    body.innerHTML = `<tr><td colspan="6">${escapeHtml(error.message || 'Không thể tải danh sách tài khoản.')}</td></tr>`;
  }
}

async function createManagedUser(event) {
  event.preventDefault();
  const form = document.getElementById('createUserForm');
  const message = document.getElementById('userManagementMessage');
  const systemManager = currentUser?.role === 'QUAN_LY_HE_THONG';
  try {
    await window.authApi.createUser({
      username: document.getElementById('newUserUsername').value.trim(),
      full_name: document.getElementById('newUserName').value.trim(),
      password: document.getElementById('newUserPassword').value,
      phone: document.getElementById('newUserPhone').value.trim(),
      role: systemManager ? document.getElementById('newUserRole').value : 'NHAN_VIEN',
      center_id: systemManager ? Number(document.getElementById('newUserCenter').value) : currentUser.branchId,
    });
    form.reset();
    if (!systemManager) document.getElementById('newUserCenter').value = String(currentUser.branchId);
    message.textContent = 'Đã tạo tài khoản.';
    await loadManagedUsers();
  } catch (error) { message.textContent = error.message || 'Không thể tạo tài khoản.'; }
}

async function handleManagedUserAction(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const row = button.closest('tr[data-user-id]');
  if (!row) return;
  const userId = Number(row.dataset.userId);
  try {
    if (button.dataset.action === 'save') {
      await window.authApi.updateUser(userId, {
        full_name: row.querySelector('[data-field="full_name"]').value.trim(),
        role: row.querySelector('[data-field="role"]').value,
        center_id: Number(row.querySelector('[data-field="center_id"]').value),
      });
    } else {
      const users = await window.authApi.listUsers();
      const target = users.find((user) => Number(user.id) === userId);
      if (!target) return;
      await window.authApi.updateUser(userId, { is_active: !target.isActive });
    }
    document.getElementById('userManagementMessage').textContent = 'Đã cập nhật tài khoản.';
    await loadManagedUsers();
  } catch (error) { document.getElementById('userManagementMessage').textContent = error.message || 'Không thể cập nhật tài khoản.'; }
}

function switchTab(screenId) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach(s => {
    if (s.id === screenId) {
      s.style.display = 'block';
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
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
  const lookupFeedback = document.getElementById('customerLookupFeedback');

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
  if (lookupFeedback) { lookupFeedback.hidden = true; lookupFeedback.textContent = ''; lookupFeedback.className = 'lookup-feedback'; }

  selectedPriority = 'TRUNG_BINH';
  selectedWarrantyStatus = null;
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
  if (statsPill) statsPill.innerText = `Dataset ${total.toLocaleString()} phiếu · ${CENTER_OPTIONS.length} Chi nhánh · 6 Nhóm lỗi`;

  updateKpiDashboard(tickets, total);
  renderTicketsTable(tickets, total);
  updatePaginationControls(total);
}

function updateKpiDashboard(tickets, total) {
  const kpiTotalEl = document.getElementById('kpiTotalTickets');
  const kpiNewEl = document.getElementById('kpiNewTickets');
  const kpiProcessingEl = document.getElementById('kpiProcessingTickets');
  const kpiUrgentEl = document.getElementById('kpiUrgentTickets');

  if (!kpiTotalEl) return;

  const sampleList = window.OFFLINE_TICKETS_SAMPLE || [];
  const source = (sampleList.length > (tickets || []).length) ? sampleList : (tickets || []);

  kpiTotalEl.textContent = (total || source.length || 0).toLocaleString();

  let newCount = 0;
  let processingCount = 0;
  let urgentCount = 0;

  source.forEach(t => {
    const st = t.status || 'MOI';
    const prio = t.priority || 'TRUNG_BINH';
    if (st === 'MOI') newCount++;
    if (st === 'DA_PHAN_CONG' || st === 'DANG_XU_LY' || st === 'CHO_LINH_KIEN') processingCount++;
    if (prio === 'CAO') urgentCount++;
  });

  if (kpiNewEl) kpiNewEl.textContent = newCount.toLocaleString();
  if (kpiProcessingEl) kpiProcessingEl.textContent = processingCount.toLocaleString();
  if (kpiUrgentEl) kpiUrgentEl.textContent = urgentCount.toLocaleString();
}

function renderTicketsTable(tickets, total) {
  const tbody = document.getElementById('ticketsTableBody');
  if (!tickets || tickets.length === 0) {
    const searchVal = document.getElementById('searchInput') ? document.getElementById('searchInput').value.trim() : '';
    const statusVal = document.getElementById('statusFilter') ? document.getElementById('statusFilter').value : 'ALL';
    const centerVal = document.getElementById('centerFilter') ? document.getElementById('centerFilter').value : 'ALL';
    const isFiltered = Boolean(searchVal || (statusVal && statusVal !== 'ALL')
      || (currentUser?.role === 'QUAN_LY_HE_THONG' && centerVal && centerVal !== 'ALL'));

    // Trạng thái 2: Rỗng - phân biệt do bộ lọc hay CSDL chưa có dữ liệu (Buổi 9 A3)
    if (window.dataState) {
      window.dataState.renderEmpty(tbody, {
        isFiltered,
        isScoped: currentUser?.role !== 'QUAN_LY_HE_THONG',
        onClearFilter: resetFilter,
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
        <td class="col-nowrap action-column" style="text-align: right;">
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
  if (tableEl) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    tableEl.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest' });
  }
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

function resetTicketFiltersForLogin() {
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  const centerFilter = document.getElementById('centerFilter');
  if (searchInput) searchInput.value = '';
  if (statusFilter) statusFilter.value = 'ALL';
  if (centerFilter) {
    centerFilter.value = currentUser?.canViewAllCenters
      ? 'ALL'
      : String(currentUser?.branchId || 'ALL');
  }
  try { localStorage.removeItem('mekong_crm_manual_center'); } catch (e) { console.debug('Không xóa được manual center:', e); }
  currentPage = 1;
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
  const input = document.getElementById('deviceNameInput');
  if (!dropdown) return;

  const currentInput = input?.value.trim() || '';
  filterDevices(currentInput);

  dropdown.style.display = 'flex';
  if (wrapper) wrapper.classList.add('open');
  input?.setAttribute('aria-expanded', 'true');
}

function closeDeviceDropdown() {
  const dropdown = document.getElementById('deviceDropdown');
  const wrapper = document.getElementById('deviceCombobox');
  const input = document.getElementById('deviceNameInput');
  if (dropdown) dropdown.style.display = 'none';
  if (wrapper) wrapper.classList.remove('open');
  input?.setAttribute('aria-expanded', 'false');
  input?.removeAttribute('aria-activedescendant');
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
  if (event?.currentTarget) {
    event.currentTarget.classList.add('active');
  }

  const input = document.getElementById('deviceNameInput');
  const query = input?.value.trim() || '';
  filterDevices(query);
  input?.focus({ preventScroll: true });
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
    document.getElementById('deviceNameInput')?.removeAttribute('aria-activedescendant');
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
           id="device-option-${index}"
           role="option"
           aria-selected="${index === highlightedDeviceIndex}"
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
  syncDeviceHighlight();
}

function syncDeviceHighlight(scrollIntoView = false) {
  const input = document.getElementById('deviceNameInput');
  const items = document.querySelectorAll('#deviceList [role="option"]');
  let activeOption = null;
  items.forEach((item, index) => {
    const active = index === highlightedDeviceIndex;
    item.classList.toggle('active', active);
    item.setAttribute('aria-selected', String(active));
    if (active) activeOption = item;
  });
  if (activeOption) {
    input?.setAttribute('aria-activedescendant', activeOption.id);
    if (scrollIntoView) activeOption.scrollIntoView({ block: 'nearest' });
  } else {
    input?.removeAttribute('aria-activedescendant');
  }
}

function setHighlightedIndex(idx) {
  highlightedDeviceIndex = idx;
  syncDeviceHighlight();
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
  syncDeviceHighlight(true);
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
  const alertBox = document.getElementById('warrantyAlertBox');
  const alertText = document.getElementById('warrantyAlertText');
  if (!alertBox || !alertText) return;

  const serialInput = document.getElementById('deviceImeiInput');
  const serial = serialInput ? serialInput.value.trim() : '';
  if (!serial) {
    selectedWarrantyStatus = null;
    alertBox.style.display = 'none';
    alertText.textContent = '';
    return;
  }

  alertBox.style.display = 'flex';
  selectedWarrantyStatus = product && typeof product.is_warranty === 'boolean' ? product.is_warranty : null;
  if (product && typeof product.is_warranty === 'boolean') {
    if (product.is_warranty) {
      alertBox.className = 'warranty-alert-box valid';
      alertText.textContent = `Thiết bị ${serial} còn hạn theo hồ sơ bảo hành đã tra cứu.`;
    } else {
      alertBox.className = 'warranty-alert-box';
      alertText.textContent = `Thiết bị ${serial} đã hết hạn theo hồ sơ bảo hành đã tra cứu.`;
    }
  } else {
    alertBox.className = 'warranty-alert-box';
    alertText.textContent = `Chưa xác minh bảo hành cho thiết bị ${serial}. Cần đối soát dữ liệu bán hàng trước khi cam kết.`;
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
  const feedback = document.getElementById('customerLookupFeedback');
  const showLookupFeedback = (message, type) => {
    if (!feedback) return;
    feedback.textContent = message;
    feedback.className = `lookup-feedback ${type || ''}`;
    feedback.hidden = false;
  };
  if (feedback) { feedback.hidden = true; feedback.textContent = ''; }

  // 1. Gọi API Backend tra cứu qua ticketsApi (Buổi 9 SE)
  if (window.ticketsApi) {
    try {
      const body = await window.ticketsApi.traCuuKhachHang(cleanPhone);
      if (body && body.found && body.data) {
        const cust = body.data;
        showLookupFeedback(`Đã tìm thấy khách hàng: ${cust.full_name}.`, 'success');

        // Điền họ tên khách hàng
        const nameInput = document.getElementById('custNameInput');
        if (nameInput) nameInput.value = cust.full_name || '';

        // Điền địa chỉ khách hàng
        const addrInput = document.getElementById('custAddressInput');
        if (addrInput) addrInput.value = cust.address || 'Việt Nam';

        // Điền thông tin thiết bị và lịch sử gắn liền với khách hàng
        if (cust.devices && cust.devices.length > 0) {
          const dev = cust.devices[0];
          selectedWarrantyStatus = typeof dev.is_warranty === 'boolean' ? dev.is_warranty : null;

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
              alertText.textContent = selectedWarrantyStatus === true
                ? `Thiết bị ${s} (${p}) còn hạn theo hồ sơ bảo hành đã tra cứu (QT-05).`
                : `Chưa xác minh bảo hành cho thiết bị ${s} (${p}) (QT-05).`;
            }
          }

          showToast(`Đã tìm thấy hồ sơ: ${cust.full_name} (${dev.product_name})`);
        } else {
          selectedWarrantyStatus = null;
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
      if (e?.status !== 404 && !window.__FORCE_OFFLINE__) {
        showLookupFeedback('Không thể kết nối hệ thống để tra cứu. Vui lòng thử lại.', 'error');
        showToast('Không thể kết nối hệ thống để tra cứu.');
        return;
      }
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
      selectedWarrantyStatus = typeof foundSample.is_warranty === 'boolean' ? foundSample.is_warranty : null;
      if (foundSample.is_warranty === false) {
        alertBox.className = 'warranty-alert-box';
        alertText.innerHTML = `⚠ Thiết bị ${escapeHtml(foundSample.serial_no)} (${escapeHtml(foundSample.product_name)}) đã hết hạn bảo hành (QT-01).`;
      } else {
        alertBox.className = 'warranty-alert-box valid';
        alertText.textContent = selectedWarrantyStatus === true
          ? `Thiết bị ${foundSample.serial_no} (${foundSample.product_name}) còn hạn theo hồ sơ bảo hành đã tra cứu (QT-05).`
          : `Chưa xác minh bảo hành cho thiết bị ${foundSample.serial_no} (${foundSample.product_name}) (QT-05).`;
      }
    }
    showToast(`Đã tìm thấy thông tin khách hàng: ${foundSample.customer_name}`);
    showLookupFeedback(`Đã tìm thấy khách hàng: ${foundSample.customer_name}.`, 'success');
    return;
  }

  // 3. Khách hàng mới chưa có trong hệ thống
  selectedWarrantyStatus = null;
  showLookupFeedback('Số điện thoại chưa có trên hệ thống. Nhập họ tên và thông tin khách hàng để tiếp tục tạo phiếu.', 'not-found');
  showToast('Số điện thoại chưa có trên hệ thống.');
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
    customer_address: document.getElementById('custAddressInput').value.trim(),
    product_name: deviceName,
    serial_no: serial,
    serial_imei: serial,
    issue_category_id: catId,
    category_id: catId,
    issue_description: issueDesc,
    priority: selectedPriority,
    is_warranty: selectedWarrantyStatus === true,
    warranty_verified: selectedWarrantyStatus !== null,
    store_id: `STORE_${String(currentUser?.branchId || 1).padStart(2, '0')}`,
    center_id: Number(currentUser?.branchId || 1),
  };

  let newTicketCode = null;

  // Gửi API Backend qua ticketsApi (Buổi 9 & 10 SE)
  if (!window.ticketsApi) {
    alert('Không thể tạo phiếu vì chưa kết nối API máy chủ. Vui lòng tải lại ứng dụng sau khi backend hoạt động.');
    return;
  }
  try {
    const data = await window.ticketsApi.tiepNhan(payload);
    newTicketCode = data && (data.ticket_code || data.id);
    if (!newTicketCode) throw new Error('Máy chủ chưa trả về mã phiếu.');
  } catch (err) {
    console.warn('Lỗi khi gửi API tạo phiếu bảo hành:', err);
    const msg = err.message || 'Lỗi khi gửi yêu cầu tiếp nhận bảo hành tới máy chủ';
    alert(`Không thể tạo phiếu bảo hành: ${msg}`);
    return;
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

    const custAddress = document.getElementById('detailCustAddress');
    if (custAddress) custAddress.innerText = ticket.customer_address || '—';

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
      const isVerified = typeof ticket.is_warranty === 'boolean' && ticket.warranty_verified !== false;
      const isW = ticket.is_warranty === true;
      warrantyStatus.innerText = !isVerified ? 'Chưa xác minh bảo hành' : (isW ? 'Còn bảo hành chính hãng' : 'Hết hạn bảo hành');
      warrantyStatus.style.color = !isVerified ? '#FBBF24' : (isW ? '#34D399' : '#F87171');
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
  } else {
    const emptyFields = [
      'detailCustName', 'detailCustPhone', 'detailCustAddress', 'detailDeviceModel', 'detailDeviceSerial',
      'detailWarrantyStatus', 'detailCategoryName', 'detailPriorityBadge', 'detailDueDate', 'detailIssueDesc',
    ];
    emptyFields.forEach((id) => {
      const element = document.getElementById(id);
      if (element) element.textContent = '—';
    });
    const timeline = document.getElementById('activityTimeline');
    if (timeline) timeline.textContent = 'Không có lịch sử cho phiếu này.';
    showToast(`Không tìm thấy phiếu bảo hành ${ticketIdentifier}.`);
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
      await window.ticketsApi.chuyenTrangThai(ticketCode, nextStatus, note, currentUser?.username || 'nhanvien01');
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

  showToast('Không thể cập nhật phiếu vì chưa kết nối API máy chủ.');
}

function printReceipt() {
  const detail = document.getElementById('screen-detail');
  if (!detail || !document.getElementById('detailTicketCode')?.textContent.trim()) {
    showToast('Chưa có phiếu để in biên nhận.');
    return;
  }
  detail.classList.add('printing-receipt');
  window.print();
  detail.classList.remove('printing-receipt');
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
  await initAuth();
  switchTab('screen-list');
  const serialInput = document.getElementById('deviceImeiInput');
  if (serialInput) serialInput.addEventListener('input', () => checkWarrantyStatus(null));
  document.getElementById('managedUsersBody')?.addEventListener('click', handleManagedUserAction);
});
