# Tasks: Giao diện Đăng nhập An toàn, Docker Containerization & Triển khai Netlify

**Input**: Design documents from `specs/004-toggle-password-visibility/`  
**Prerequisites**: `spec.md`, `plan.md`, `.specify/memory/constitution.md`

## Phase 1: Bảo mật Giao diện & Trải nghiệm Người dùng (US1, US2, US3)

- [x] T001 [US1] Tích hợp nút toggle con mắt (`btn-toggle-password`) vào ô nhập mật khẩu tại `src/frontend/index.html`.
- [x] T002 [US1] Bổ sung logic JavaScript `togglePasswordVisibility()` chuyển đổi `type="password"` $\leftrightarrow$ `type="text"` và đổi icon Eye/Eye-off trong `src/frontend/app.js`.
- [x] T003 [US1] Thêm định dạng CSS `.btn-toggle-password` và padding `.has-toggle` trong `src/frontend/style.css`.
- [x] T004 [US2] Gỡ bỏ hoàn toàn khối tài khoản demo lộ mật khẩu `.demo-accounts-box` khỏi `src/frontend/index.html` để chống rò rỉ credential trên UI.
- [x] T005 [US2] Dọn dẹp hàm `fillLogin` trong `src/frontend/app.js`.
- [x] T006 [US3] Tích hợp nút toggle con mắt cho trường nhập mật khẩu tạm trong modal Quản lý tài khoản (`newUserPassword`).

---

## Phase 2: Chuẩn hóa Khởi chạy Duy nhất bằng Docker

- [x] T007 Kiểm tra và xác nhận cấu hình `docker-compose.yml` (multi-tier: `postgres` -> `migrate` -> `api`).
- [x] T008 Kiểm tra và xác nhận `Dockerfile` multi-stage build với non-root user `app` và healthcheck probe.
- [x] T009 Viết lại tài liệu `README.md` chỉ dẫn DUY NHẤT phương thức chạy bằng Docker (`docker compose up -d --build`).

---

## Phase 3: Tối ưu hóa Triển khai Netlify & Neon Cloud

- [x] T010 Khóa phiên bản Node.js runtime cho Netlify bằng tệp `.nvmrc` (chứa `20`).
- [x] T011 Tối ưu hóa tệp `netlify.toml` với build command, Node 20 env, function bundling, API rewrite và OWASP security headers.
- [x] T012 Bổ sung mục hướng dẫn triển khai Netlify chi tiết trong `README.md`.
- [x] T013 Xác nhận bộ kiểm thử tự động toàn hệ thống chạy pass 100% (`npm test`).

