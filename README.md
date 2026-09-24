# Nhân viên tiếp nhận tạo phiếu bảo hành từ thông tin khách hàng cung cấp, phân loại theo loại sự cố/lỗi, ghi nhận dữ liệu bắt buộc, cập nhật trạng thái ban đầu của phiếu và lưu vào hệ thống để sẵn sàng chuyển sang bước phân công kỹ thuật viên.

Sinh viên: Nguyễn Bá Anh Khôi - 237480200247 - Track SE  
Học phần: Chuyên đề Tốt nghiệp 1, HK1 2026-2027  
Luồng nghiệp vụ: L2 – Tiếp nhận và phân loại yêu cầu bảo hành  

---

## 1. Mục tiêu
Hệ thống hỗ trợ nhân viên tiếp nhận tạo phiếu bảo hành từ thông tin khách hàng cung cấp, tra cứu và phân loại theo loại sự cố/lỗi, ghi nhận các dữ liệu bắt buộc và cập nhật trạng thái ban đầu của phiếu. Qua đó giúp chuẩn hóa quy trình tiếp nhận dịch vụ và sẵn sàng chuyển tiếp sang bước phân công kỹ thuật viên xử lý.

Chi tiết đặc tả yêu cầu xem tại:
- [Phiếu phạm vi bài toán cá nhân](docs/phieu-pham-vi.md)
- [Đặc tả yêu cầu phần mềm (SRS)](docs/srs.md)
- [Bản kê khai sử dụng AI (AI Disclosure)](docs/ai-disclosure.md)

## 2. Yêu cầu môi trường
- Node.js 20 LTS (hoặc Node.js 24 LTS)
- Cơ sở dữ liệu: PostgreSQL 16 (hoặc SQLite cho giai đoạn đầu)
- Docker & Docker Compose (cho đóng gói container BT3)
- Biến môi trường: xem `.env.example`

## 3. Hướng dẫn chạy (≤ 4 bước)
1. Sao chép biến môi trường: `cp .env.example .env` và điền cấu hình
2. Cài đặt thư viện: `npm install`
3. Chạy kiểm thử tự động: `npm test`
4. Khởi chạy ứng dụng: `npm run dev` → kiểm tra tại `http://localhost:3000/health`

## 4. Cấu trúc thư mục
- `docs/`: Chứa các tài liệu thiết kế (Phiếu phạm vi, SRS, AI Disclosure, Deployment guide, ERD).
- `src/`: Mã nguồn ứng dụng gồm cấu hình, routing, controller, service, validation middleware.
  - `src/config/`: Cấu hình hệ thống và hằng số trạng thái phiếu.
  - `src/middlewares/`: Middleware kiểm tra dữ liệu bắt buộc (US6).
  - `src/controllers/`: Bộ điều khiển xử lý HTTP request/response.
  - `src/services/`: Nghiệp vụ quản lý phiếu, phân loại lỗi và ghi lịch sử trạng thái.
  - `src/routes/`: Khai báo các router API cho phiếu bảo hành.
- `tests/`: Bộ kiểm thử tự động (Smoke test và Integration test các User Story).
- `data/`: Dữ liệu mẫu (sample dataset) của case study Mekong Mobile.

## 5. Kiểm thử
Chạy lệnh: `npm test`  
Kết quả: `tests 6 | pass 6 | fail 0` (Bao gồm smoke test `/health` và các kịch bản US1, US4, US5, US6, US7).

## 6. Danh sách API Endpoints chính
- `GET /health`: Kiểm tra trạng thái hoạt động của dịch vụ (Smoke test).
- `POST /api/tickets`: Tạo phiếu bảo hành mới (US1, US6).
- `GET /api/tickets`: Xem và lọc danh sách phiếu theo trạng thái, cửa hàng (US5).
- `GET /api/tickets/:id`: Xem chi tiết phiếu kèm dòng thời gian lịch sử trạng thái (US7).
- `PATCH /api/tickets/:id/classify`: Phân loại sự cố và mức độ ưu tiên (US3).
- `PATCH /api/tickets/:id/status`: Cập nhật trạng thái phiếu và ghi nhận vết lịch sử (US4).

## 7. Trạng thái hiện tại
- [x] Khởi tạo dự án, dựng khung thư mục chuẩn và smoke test (Buổi 2)
- [x] Tài liệu SRS, AI Disclosure, Phiếu phạm vi hoàn chỉnh (Buổi 2)
- [x] Module tiếp nhận, phân loại và kiểm tra hợp lệ dữ liệu (Buổi 8–10)
- [ ] Module phân công kỹ thuật viên và tích hợp cơ sở dữ liệu PostgreSQL (Buổi 10–12)