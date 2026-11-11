# Feature Specification: Toggle Password Visibility (Hiển thị / Ẩn mật khẩu)

**Feature Branch**: `004-toggle-password-visibility`  
**Created**: 2026-11-11  
**Status**: In Progress  
**Input**: User description: "thêm con mắt click vào để xem mật khẩu đã nhập"

---

## 1. User Scenarios & Testing *(mandatory)*

### User Story 1 - Xem và ẩn mật khẩu trong Modal Đăng nhập (Priority: P1)

Là nhân viên hoặc quản lý hệ thống, khi đăng nhập vào hệ thống Mekong Mobile CRM, tôi muốn nhấp vào biểu tượng con mắt ở ô nhập mật khẩu để kiểm tra lại mật khẩu mình vừa gõ có đúng chính tả/ký tự hoa thường hay không, tránh việc gõ sai dẫn đến bị khóa tài khoản do cơ chế chống brute-force.

**Why this priority**: Trực tiếp giải quyết vấn đề người dùng gặp phải khi đăng nhập, giảm thiểu lỗi gõ nhầm mật khẩu và nguy cơ chạm ngưỡng rate limit.

**Independent Test**: Mở modal đăng nhập, gõ mật khẩu (VD: `MekongDemo@2026`), nhấp vào biểu tượng con mắt: các dấu chấm tròn `••••••` chuyển thành văn bản rõ `MekongDemo@2026`. Nhấp lại lần nữa: văn bản chuyển về dạng ẩn `••••••`.

**Acceptance Scenarios**:
1. **Given** ô mật khẩu đang ở trạng thái mặc định (`type="password"`), **When** người dùng nhấp vào nút con mắt (hoặc nhấn Enter/Space khi focus), **Then** ô mật khẩu chuyển sang `type="text"`, biểu tượng con mắt đổi sang trạng thái mở mắt / gạch chéo, thuộc tính `aria-label` cập nhật thành "Ẩn mật khẩu".
2. **Given** ô mật khẩu đang hiển thị rõ (`type="text"`), **When** người dùng nhấp lại vào nút con mắt, **Then** ô mật khẩu chuyển về `type="password"`, biểu tượng con mắt chuyển về trạng thái gạch chéo, thuộc tính `aria-label` cập nhật thành "Hiện mật khẩu".

---

### User Story 2 - Khả năng tiếp cận & Trải nghiệm phím (Accessibility & Keyboard) (Priority: P2)

Là người dùng thao tác bằng bàn phím, tôi muốn có thể dùng phím Tab di chuyển tới nút con mắt và dùng phím Space/Enter để bật/tắt hiển thị mật khẩu mà không làm mất giá trị đã gõ trong ô input.

**Why this priority**: Đảm bảo tiêu chuẩn tiếp cận Web A11y / WCAG và không phá vỡ hành vi submit form khi nhấn Enter bên trong ô input.

**Independent Test**: Nhập mật khẩu, nhấn phím Tab tới nút toggle, nhấn Spacebar để lật trạng thái, sau đó nhấn Enter trong ô mật khẩu để submit form bình thường.

**Acceptance Scenarios**:
1. **Given** focus đang ở nút con mắt, **When** người dùng nhấn Space hoặc Enter, **Then** trạng thái ẩn/hiện mật khẩu thay đổi mà không submit form (`type="button"`).
2. **Given** giá trị mật khẩu đang hiển thị, **When** form được submit thành công hoặc đóng modal, **Then** trạng thái ô mật khẩu tự động đặt lại về dạng `type="password"` để bảo mật.

---

### User Story 3 - Áp dụng đồng bộ cho Modal Tạo tài khoản Quản trị (Priority: P3)

Là Quản lý chi nhánh hoặc Quản lý hệ thống khi tạo tài khoản nhân sự mới trong form Quản lý tài khoản, tôi cũng có biểu tượng con mắt tại ô "Mật khẩu tạm" để kiểm tra mật khẩu cấp phát trước khi bấm "Tạo tài khoản".

**Why this priority**: Mang lại tính nhất quán UX cho toàn bộ các trường nhập mật khẩu trong hệ thống.

**Acceptance Scenarios**:
1. **Given** đang mở modal Quản lý tài khoản, **When** nhập mật khẩu tạm và bấm biểu tượng con mắt, **Then** mật khẩu tạm được hiển thị rõ ràng để người quản trị ghi lại bàn giao cho nhân viên.

---

## 2. Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống PHẢI trang bị một nút toggle (biểu tượng con mắt) nằm ở góc phải bên trong ô nhập mật khẩu của modal Đăng nhập (`loginPasswordInput`).
- **FR-002**: Nút toggle PHẢI là `<button type="button">` để ngăn chặn hành vi submit form ngoài ý muốn khi nhấn phím Enter.
- **FR-003**: Khi nhấp nút, thuộc tính `type` của thẻ input PHẢI được chuyển đổi qua lại giữa `password` và `text`.
- **FR-004**: Icon SVG PHẢI phản ánh trạng thái hiện tại: Eye-off (con mắt gạch chéo) khi đang ẩn mật khẩu, và Eye (con mắt mở) khi đang hiện mật khẩu.
- **FR-005**: Nút PHẢI có thuộc tính trợ năng đầy đủ (`aria-label`, `title`, focus indicator) theo chuẩn WCAG 2.1 AA.
- **FR-006**: Đệm lề (`padding-right`) của ô input PHẢI được mở rộng tối thiểu `42px` để văn bản mật khẩu dài không bị chữ đè lên biểu tượng con mắt.
- **FR-007**: Hệ thống PHẢI áp dụng nút toggle tương tự cho ô nhập mật khẩu tạm (`newUserPassword`) trong form Quản lý tài khoản.

---

## 3. Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% người dùng có thể nhấp vào con mắt để xem lại mật khẩu đã nhập với độ trễ phản hồi tức thì (< 16ms, thuần client-side).
- **SC-002**: Không xảy ra xung đột layout, vỡ giao diện trên cả màn hình desktop lẫn thiết bị di động.
- **SC-003**: Điểm kiểm thử tự động toàn hệ thống tiếp tục đạt 100% PASS (55/55 passed).

