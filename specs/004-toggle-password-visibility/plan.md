# Implementation Plan - Feature 004: Giao diện Đăng nhập An toàn, Docker Containerization & Triển khai Netlify

**Feature Branch**: `004-toggle-password-visibility`  
**Spec Reference**: `specs/004-toggle-password-visibility/spec.md`  
**Constitution Reference**: `.specify/memory/constitution.md` (v1.2.0)  
**Created**: 2026-11-11  
**Status**: Ready for Execution

---

## 1. Technical Architecture & Decisions

### 1.1. Zero Credential Disclosure trên Giao diện (OWASP A01 & A07)
- **Vấn đề**: Việc hiển thị hộp danh sách tài khoản demo kèm mật khẩu văn bản rõ (`MekongDemo@2026`) trên giao diện web công khai là lỗ hổng bảo mật nghiêm trọng (Credential Leakage).
- **Giải pháp**:
  - Gỡ bỏ hoàn toàn phần tử `.demo-accounts-box` và đoạn ghi chú mật khẩu khỏi `src/frontend/index.html`.
  - Giữ lại trường nhập tài khoản, mật khẩu và trang bị nút toggle con mắt (`btn-toggle-password`) với biểu tượng Eye/Eye-off SVG Feather để người dùng tự kiểm tra mật khẩu đã gõ.
  - Xóa hàm `fillLogin` trong `src/frontend/app.js` để tránh rò rỉ thông qua script client.

### 1.2. Chuẩn hóa Khởi chạy Duy nhất bằng Docker & Docker Compose
- **Tiêu chuẩn Buổi 11 & BT3 (SE Invariant TP4)**: Khởi chạy và tái lập hệ thống máy trắng bằng tối đa 2 lệnh:
  ```bash
  cp .env.example .env
  docker compose up -d --build
  ```
- Cập nhật `README.md` loại bỏ toàn bộ các bước chạy thủ công bằng Node/npm trên máy thật. Toàn bộ chu trình từ cài đặt dependencies, khởi tạo PostgreSQL 16 Alpine, migration nạp master data/users, và chạy ứng dụng web đều do Docker Compose tự động điều phối qua healthcheck (`condition: service_healthy` và `condition: service_completed_successfully`).

### 1.3. Tối ưu hóa Triển khai Netlify Serverless & Neon PostgreSQL
- **Tập tin cấu hình**: `netlify.toml`
  - Đóng gói hàm serverless tại `netlify/functions/api.js` (sử dụng `serverless-http` bọc ứng dụng Express 5).
  - Tự động đính kèm dữ liệu từ điển mẫu: `included_files = ["dataset/**"]`.
  - Đặt phiên bản Node tương thích: `.nvmrc` chứa `20`, biến môi trường `NODE_VERSION = "20"`.
  - Rewrite toàn bộ request `/api/*` và `/health` về Express serverless function mà không bị mất tiền tố đường dẫn.
  - Trang bị đầy đủ các tiêu đề bảo mật HTTP (Security Headers) theo chuẩn OWASP Top 10 và Buổi 15 CDTN1 (`Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).

---

## 2. File Changes & Impact Matrix

| Tập tin | Loại thay đổi | Mục đích |
| :--- | :--- | :--- |
| `src/frontend/index.html` | Sửa đổi | Gỡ bỏ `.demo-accounts-box`, tích hợp `.btn-toggle-password` (icon con mắt) |
| `src/frontend/app.js` | Sửa đổi | Xóa `fillLogin`, thêm `togglePasswordVisibility`, reset trạng thái khi mở modal |
| `src/frontend/style.css` | Sửa đổi | Thêm style `.btn-toggle-password`, `.input-wrapper input.has-toggle` |
| `README.md` | Sửa đổi | Chuẩn hóa phương thức chạy DUY NHẤT bằng Docker, hướng dẫn deploy Netlify |
| `netlify.toml` | Sửa đổi | Cấu hình build, environment Node 20, redirects API & security headers |
| `.nvmrc` | Tạo mới | Khóa phiên bản Node.js 20 cho Netlify Build Environment |
| `package.json` | Sửa đổi | Bổ sung script `npm run build` phục vụ Netlify Build |
