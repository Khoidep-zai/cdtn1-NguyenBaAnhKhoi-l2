# Tasks: Tiếp nhận và Phân loại Yêu cầu Bảo hành (L2)

**Input**: `specs/001-tiep-nhan-bao-hanh/spec.md`, `specs/001-tiep-nhan-bao-hanh/plan.md`  
**Constitution**: `.specify/memory/constitution.md`

---

## Phase 1: Setup & Environment Configuration

- [x] T001 Khởi tạo cấu trúc thư mục 4 tầng phân lớp: `src/backend/{controllers,services,repositories,middlewares,db}`, `src/frontend`, `tests`
- [x] T002 Cấu hình môi trường `.env` và file mẫu `.env.example`
- [x] T003 Thiết lập test runner `node:test` trong `package.json` với script `npm test`

---

## Phase 2: Foundational Architecture & Security Infrastructure

- [x] T004 Thiết kế DDL PostgreSQL schema 3NF trong `src/backend/db/schema.sql` và script di trú `src/backend/db/migrate.js`
- [x] T005 [P] Hiện thực xác thực phiên đăng nhập Cookie HttpOnly, hàm băm Scrypt và JWT HS256 trong `src/backend/services/authService.js`
- [x] T006 [P] Hiện thực middleware phân quyền RBAC 3 vai trò (`NHAN_VIEN`, `QUAN_LY_CHI_NHANH`, `QUAN_LY_HE_THONG`) trong `src/backend/middlewares/authenticate.js`
- [x] T007 [P] Dựng Repository interface trừu tượng và InMemory Ticket Repository cho môi trường runtime và test

---

## Phase 3: User Story 1 - Tra cứu Hồ sơ Khách hàng & Thiết bị (QT-01)

- [x] T008 [P] [US1] Viết unit test và contract test tra cứu khách hàng theo SĐT (QT-01) trong `tests/ticket.test.js`
- [x] T009 [US1] Hiện thực chuẩn hóa số điện thoại trong `src/backend/services/PhoneHelper.js`
- [x] T010 [US1] Hiện thực logic tra cứu không tạo trùng hồ sơ khách hàng trong `src/backend/services/CustomerService.js`
- [x] T011 [US1] Hiện thực endpoint `GET /api/customers?phone=...` trong `src/backend/controllers/CustomerController.js`

---

## Phase 4: User Story 2 - Khởi tạo Phiếu Tiếp nhận Bảo hành (QT-04, QT-07, QT-09)

- [x] T012 [P] [US2] Viết unit test cho việc khởi tạo phiếu bảo hành và kiểm tra dữ liệu bắt buộc trong `tests/ticket.service.test.js`
- [x] T013 [US2] Hiện thực thuật toán cấp phát mã phiếu dạng `BH-xxxxxx/yyyy` (QT-07)
- [x] T014 [US2] Hiện thực kiểm tra ràng buộc 1 phiếu mở duy nhất trên mỗi thiết bị (QT-09) trong `TicketService.js`
- [x] T015 [US2] Hiện thực validation mô tả lỗi tối thiểu 10 ký tự trong `src/backend/validators/ticketValidator.js`
- [x] T016 [US2] Hiện thực endpoint `POST /api/tickets` trong `src/backend/controllers/TicketController.js`

---

## Phase 5: User Story 3 - Cập nhật Trạng thái Phiếu Một Chiều (QT-06)

- [x] T017 [P] [US3] Viết test kiểm tra chuyển đổi trạng thái một chiều và chặn quay ngược trong `tests/ticket.service.test.js`
- [x] T018 [US3] Hiện thực cỗ máy trạng thái (State Machine) một chiều trong `TicketService.js`
- [x] T019 [US3] Hiện thực tự động ghi nhật ký chuyển đổi vào bảng `ticket_status_log`
- [x] T020 [US3] Hiện thực endpoint `PATCH /api/tickets/:id/status` trong `TicketController.js`

---

## Phase 6: User Story 4 & 5 - Thuật toán SLA Engine & Ngoại lệ Bảo hành (QT-04, QT-05)

- [x] T021 [P] [US4] Viết test biên tính hạn SLA cắt ngang ngày Chủ Nhật trong `tests/ticket.service.test.js`
- [x] T022 [US4] Hiện thực thuật toán SLA trừ Chủ Nhật (+24h) theo mức ưu tiên trong `src/backend/services/SLACalculator.js`
- [x] T023 [P] [US5] Viết test kiểm tra điều kiện còn/hết hạn bảo hành và phê duyệt ngoại lệ (QT-05)
- [x] T024 [US5] Hiện thực endpoint phê duyệt ngoại lệ `PATCH /api/tickets/:id/warranty-exception`

---

## Phase 7: Polish & Comprehensive Verification Gate

- [x] T025 [P] Chạy toàn bộ test suite (34/34 tests pass) bằng lệnh `npm test`
- [x] T026 [P] Rà soát an toàn bảo mật OWASP Top 10:2025 (chống SQL Injection, chặn lộ stack trace)
- [x] T027 Đồng bộ đồ thị tri thức kiến trúc với CodeGraph (`codegraph sync`)

