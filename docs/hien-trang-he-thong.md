# Báo Cáo Hiện Trạng Hệ Thống — Phân Hệ L2 Mekong Mobile CRM

- **Dự án:** Chuyên đề Tốt nghiệp 1 (CDTN1 - HK1 2026–2027) | Khoa CNTT – Đại học Văn Lang
- **Phân hệ:** L2 – Tiếp nhận và Phân loại yêu cầu bảo hành điện thoại Mekong Mobile
- **Sinh viên thực hiện:** Nguyễn Bá Anh Khôi — **MSSV:** 2374802010247 (Track SE)
- **Cập nhật ngày:** 13/11/2026 (Phiên bản v1.0 Production)

---

## 1. Trạng Thái Tổng Thể Các Phân Hệ

| Phân hệ / Tiêu chí | Trạng thái | Đánh giá kỹ thuật & Mức độ hoàn thiện |
|---|:---:|---|
| **Định danh khách hàng (QT-01)** | ✅ Hoàn thành 100% | Tra cứu theo SĐT chuẩn Việt Nam (10 số), tự động đăng ký mới nếu chưa có |
| **Thuật toán SLA (QT-04)** | ✅ Hoàn thành 100% | Tính hạn hoàn tất theo mức độ CAO (24h), TRUNG BÌNH (72h), THẤP (120h), tự động loại trừ Chủ Nhật |
| **Kiểm tra bảo hành & ngoại lệ (QT-05)** | ✅ Hoàn thành 100% | Kiểm tra đến 23:59:59.999Z của ngày hết hạn; Quản lý chi nhánh có quyền duyệt ngoại lệ |
| **Vòng đời trạng thái (QT-06)** | ✅ Hoàn thành 100% | Chuyển đổi 6 trạng thái một chiều nghiêm ngặt, lưu vết kiểm toán đầy đủ trong `ticket_status_log` |
| **Định danh phiếu & thiết bị (QT-07, QT-09)** | ✅ Hoàn thành 100% | Mã phiếu tự sinh `BH-xxxxxx/yyyy`, kiểm soát 1 Serial/IMEI chỉ có tối đa 1 phiếu đang mở |
| **Lưu trữ CSDL bền vững (Persistence)** | ✅ Hoàn thành 100% | Lưu trữ 100% vào PostgreSQL 16 (Hỗ trợ Dual DB: Docker Container & Neon Serverless Cloud) |
| **Phân quyền người dùng (RBAC)** | ✅ Hoàn thành 100% | 3 vai trò: `QUAN_LY_HE_THONG`, `QUAN_LY_CHI_NHANH`, `NHAN_VIEN` với JWT Cookie bảo mật |
| **Kiểm thử tự động (Testing)** | ✅ Hoàn thành 100% | 57 automated tests (55 passed, 2 skipped, 0 failed) qua 16 test suites |
| **Đóng gói Docker (Buổi 11 & 16 SE)** | ✅ Hoàn thành 100% | Multi-stage build (`node:20-alpine` + `postgres:16-alpine`), tối ưu bộ nhớ, khởi động 2 lệnh |
| **Triển khai Cloud Netlify + Neon** | ✅ Hoàn thành 100% | Live demo tại [https://cdtn1.netlify.app](https://cdtn1.netlify.app) với PgBouncer SSL connection pooling |

---

## 2. Thống Kê Dữ Liệu Thực Tế Trong Cơ Sở Dữ Liệu

- **Trung tâm bảo hành (`service_center`):** 6 trung tâm tại các tỉnh Đồng bằng sông Cửu Long (Cần Thơ, An Giang, Kiên Giang, Tiền Giang, Vĩnh Long, Cà Mau).
- **Danh mục sự cố (`issue_category`):** 6 nhóm sự cố chuẩn hóa (Màn hình, Nguồn, Loa/Mic, Camera, Vỏ/Khung, Phần mềm).
- **Sản phẩm điện thoại (`products`):** 320 dòng máy Mekong Mobile phổ biến.
- **Khách hàng (`customer`):** 67.037 hồ sơ khách hàng đã được import và chuẩn hóa số điện thoại.
- **Phiếu bảo hành lịch sử (`ticket`):** 7.800 phiếu bảo hành thực tế.
- **Tài khoản quản trị (`app_user`):** 3 tài khoản demo sẵn sàng (`system.admin`, `manager.ninhkieu`, `staff.ninhkieu`).

---

## 3. Kiến Trúc Bảo Mật & Phòng Thủ Chiều Sâu (Defense-in-Depth)

1. **Bảo mật xác thực & phân quyền:**
   - Mật khẩu băm an toàn bằng thuật toán `scrypt` với muối ngẫu nhiên (salt) chống Rainbow Table.
   - Phiên đăng nhập được quản lý bằng JWT HS256 lưu trong Cookie bảo vệ với cờ `HttpOnly; SameSite=Strict`.
2. **Bảo vệ chống DoS & injection:**
   - Middleware giới hạn kích thước thân yêu cầu `express.json({ limit: '256kb' })`.
   - Toàn bộ truy vấn SQL được tham số hóa (Parameterized queries `$1, $2, ...`) chống SQL Injection 100%.
   - Input validator kiểm tra nghiêm ngặt định dạng dữ liệu đầu vào trước khi vào tầng logic.
3. **Bảo mật container:**
   - Chạy với người dùng không đặc quyền `USER app`.
   - Cơ sở dữ liệu nội bộ không mở cổng ra ngoài Internet, giao tiếp qua mạng bridge bảo mật của Docker.

---

## 4. Kết Luận
Hệ thống Phân hệ L2 Mekong Mobile CRM đã hoàn thiện toàn diện, đáp ứng 100% các tiêu chí khắt khe của học phần Chuyên đề Tốt nghiệp 1 (Track Software Engineering), đạt độ ổn định và độ tin cậy cao trên cả môi trường cục bộ (Docker) và môi trường điện toán đám mây công cộng (Netlify + Neon).
