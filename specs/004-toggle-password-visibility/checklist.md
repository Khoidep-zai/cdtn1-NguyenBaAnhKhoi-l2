# Requirements Quality Checklist: Giao diện Đăng nhập An toàn, Docker Containerization & Triển khai Netlify

**Purpose**: Thẩm định chất lượng đặc tả và thực thi tính năng bảo mật giao diện, khởi chạy Docker và triển khai Netlify  
**Created**: 2026-11-11  
**Feature**: [spec.md](spec.md) | [plan.md](plan.md) | [tasks.md](tasks.md)

---

## 1. Bảo mật Giao diện & Tiêu chuẩn Xác thực (Security & Authentication)

- [x] CHK001 Gỡ bỏ hoàn toàn mọi thông tin mật khẩu văn bản rõ hoặc tài khoản nhạy cảm hiển thị trên giao diện người dùng.
- [x] CHK002 Biểu tượng con mắt sử dụng thẻ `<button type="button">` để không kích hoạt submit ngoài ý muốn khi nhấn Enter.
- [x] CHK003 Biểu tượng con mắt có đầy đủ nhãn tiếp cận (`aria-label`, `title`) và lật trạng thái icon tương ứng khi hiển thị/ẩn.
- [x] CHK004 Mật khẩu tự động chuyển về dạng ẩn (`type="password"`) khi mở lại modal hoặc hoàn tất đăng nhập.

## 2. Tiêu chuẩn Đóng gói Docker (Buổi 11 SE Invariant TP4)

- [x] CHK005 `docker-compose.yml` khởi chạy đầy đủ CSDL PostgreSQL 16 Alpine, migration nạp dữ liệu và web API.
- [x] CHK006 Cơ chế `healthcheck` và `depends_on: service_healthy` đảm bảo API không bị lỗi kết nối DB khi khởi động.
- [x] CHK007 `README.md` hướng dẫn duy nhất phương thức chạy bằng Docker thông qua 2 lệnh chuẩn máy trắng.

## 3. Tiêu chuẩn Triển khai Netlify & Cloud (Deployment & Headers)

- [x] CHK008 `netlify.toml` định tuyến chính xác các request `/api/*` và `/health` về Express serverless function mà không làm thay đổi path signature.
- [x] CHK009 Khóa phiên bản Node.js 20 thông qua `.nvmrc` và `NODE_VERSION = "20"` trong cấu hình build Netlify.
- [x] CHK010 Thiết lập đầy đủ tiêu đề HTTP an toàn (HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff).
- [x] CHK011 Bộ test tự động toàn hệ thống vượt qua 100% (55 pass, 0 fail).

