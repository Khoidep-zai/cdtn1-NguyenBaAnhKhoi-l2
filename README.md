# Tiếp nhận và phân loại yêu cầu bảo hành

Sinh viên:  
Nguyễn Bá Anh Khôi - 237480200247 - Track SE

Học phần:  
Chuyên đề Tốt nghiệp 1, HK1 2026-2027

Luồng nghiệp vụ:  
L2 – Tiếp nhận và phân loại yêu cầu bảo hành

## 1. Mục tiêu
Hệ thống hỗ trợ nhân viên tiếp nhận tạo phiếu bảo hành từ thông tin khách hàng, kiểm tra tính hợp lệ và phân loại sơ bộ sự cố kỹ thuật. Giải pháp giúp chuẩn hóa quy trình tiếp nhận dịch vụ khách hàng, ghi nhận vết trạng thái rõ ràng và sẵn sàng chuyển tiếp dữ liệu sang phân hệ phân công kỹ thuật viên xử lý.

## 2. Yêu cầu môi trường
- Node.js 20 LTS (hoặc: Node.js 24 LTS)
- PostgreSQL 16
- Biến môi trường: xem .env.example

## 3. Hướng dẫn chạy
(BT2 yêu cầu ≤ 4 bước)
1. cp .env.example .env và điền giá trị
2. npm install
3. npm run db:migrate
4. npm run dev → mở http://localhost:3000/health

## 4. Cấu trúc thư mục
- `docs/`: Chứa tài liệu đặc tả yêu cầu (SRS, Phiếu phạm vi, AI Disclosure, Deployment guide).
- `src/`: Chứa toàn bộ mã nguồn ứng dụng (cấu hình, routing, controller, service, validation middleware).
- `tests/`: Chứa các bộ kiểm thử tự động (Smoke test và Integration test).
- `data/`: Chứa tài liệu và tập dữ liệu mẫu phục vụ phát triển.

## 5. Kiểm thử
npm test → hiển thị số test PASS (6/6 tests passed)

## 6. Trạng thái hiện tại
- [x] Khởi tạo project, smoke test chạy được (buổi 2)
- [ ] Module tiếp nhận yêu cầu (buổi 8–10)
- [ ] Module phân công kỹ thuật viên (buổi 10–12)