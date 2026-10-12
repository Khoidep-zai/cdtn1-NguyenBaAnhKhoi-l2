# BẢNG THEO DÕI THAY ĐỔI THIẾT KẾ (SO VỚI BÀI TẬP 1)

Hệ thống: Mekong Mobile CRM — Luồng L2: Tiếp nhận và phân loại yêu cầu bảo hành  
Sinh viên: Nguyễn Bá Anh Khôi — MSSV: 2374802010247 — Track SE

---

### Thay đổi 1: Bổ sung lớp `AppError` và chuẩn hóa mã lỗi nghiệp vụ độc lập giao thức HTTP
- **Thay đổi gì:** Bổ sung lớp `AppError` tại `src/backend/errors/AppError.js` mang thuộc tính `code` (mã nghiệp vụ: `PHIEU_DANG_MO`, `TRANG_THAI_KHONG_HOP_LE`, `DU_LIEU_KHONG_HOP_LE`) thay vì ném lỗi chứa mã HTTP trong tầng Service.
- **Vì sao:** Tuân thủ nguyên tắc thiết kế Buổi 7 về tính độc lập của Lớp Nghiệp vụ (Layer 3 Business Service), đảm bảo Service hoàn toàn không biết mã HTTP, cho phép tái sử dụng hàm cho API, script và bộ kiểm thử tự động.
- **Ảnh hưởng thành phần nào:** `src/backend/errors/AppError.js`, `src/backend/services/ticketService.js`, `src/backend/controllers/ticketController.js`.

---

### Thay đổi 2: Hiện thực quy tắc QT-09 ngăn chặn tạo phiếu trùng trên cùng số Serial/IMEI
- **Thay đổi gì:** Bổ sung phương thức `findBySerial(serialNo)` vào `ITicketRepository` và `ticketRepository`, kiểm tra chặn tạo phiếu mới nếu thiết bị đang có phiếu ở trạng thái chưa đóng (`MOI`, `DA_PHAN_CONG`, `DANG_XU_LY`, `CHO_LINH_KIEN`).
- **Vì sao:** Đảm bảo toàn vẹn nghiệp vụ theo quy tắc QT-09, tránh tình trạng lễ tân quầy tạo trùng lặp nhiều biên nhận bảo hành cho cùng một máy đang sửa chữa.
- **Ảnh hưởng thành phần nào:** `src/backend/repositories/ITicketRepository.js`, `src/backend/repositories/ticketRepository.js`, `src/backend/services/ticketService.js`.

---

### Thay đổi 3: Bổ sung bộ kiểm thử Unit Test cho lớp Service với Mock Repository
- **Thay đổi gì:** Xây dựng file kiểm thử `tests/ticket.service.test.js` kiểm thử trực tiếp `TicketService` độc lập với CSDL PostgreSQL và Express HTTP server, bao gồm đủ 3 loại test: Luồng đúng (TC-01), Giá trị biên (TC-02, TC-02b) và Dữ liệu sai (TC-03, TC-03b).
- **Vì sao:** Đáp ứng đầy đủ tiêu chí C4 (Bộ kiểm thử 3 loại) và tiêu chí S2 (Chất lượng kỹ thuật Track SE) của Đề bài Bài tập 2 và Slide Buổi 7.
- **Ảnh hưởng thành phần nào:** Thư mục `tests/ticket.service.test.js`, cấu hình `package.json`.
