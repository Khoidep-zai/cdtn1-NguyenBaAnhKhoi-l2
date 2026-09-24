# Nhân viên tiếp nhận tạo phiếu bảo hành từ thông tin khách hàng cung cấp, phân loại theo loại sự cố/lỗi, ghi nhận dữ liệu bắt buộc, cập nhật trạng thái ban đầu của phiếu và lưu vào hệ thống để sẵn sàng chuyển sang bước phân công kỹ thuật viên.

Sinh viên: Nguyễn Bá Anh Khôi - 237480200247 - Track SE  
Học phần: Chuyên đề Tốt nghiệp 1, HK1 2026-2027  
Luồng nghiệp vụ: L2 – Tiếp nhận và phân loại yêu cầu bảo hành  

## 1. Mục tiêu
Hệ thống hỗ trợ nhân viên tiếp nhận tạo phiếu bảo hành từ thông tin khách hàng cung cấp, tra cứu và phân loại theo loại sự cố/lỗi, ghi nhận các dữ liệu bắt buộc và cập nhật trạng thái ban đầu của phiếu. Qua đó giúp chuẩn hóa quy trình tiếp nhận dịch vụ và sẵn sàng chuyển tiếp sang bước phân công kỹ thuật viên xử lý.

## 2. Yêu cầu môi trường
- Node.js 20 LTS
- PostgreSQL 16 (hoặc SQLite giai đoạn đầu)
- Biến môi trường: xem `.env.example`

## 3. Hướng dẫn chạy
(BT2 yêu cầu ≤ 4 bước)
1. `cp .env.example .env` và điền giá trị cấu hình
2. `npm install`
3. `npm run db:migrate` (hoặc `npx prisma db push`)
4. `npm run dev` → mở http://localhost:3000/health

## 4. Cấu trúc thư mục
- `docs/`: Chứa tài liệu thiết kế (Phiếu phạm vi, SRS, kiến trúc, ERD, v.v.).
- `src/`: Mã nguồn ứng dụng (API, routing, services, repositories).
- `tests/`: Kịch bản và mã kiểm thử tự động (Unit test, Integration test).
- `data/`: Dữ liệu mẫu (sample dataset) của case study Mekong Mobile.

## 5. Kiểm thử
`npm test` → hiển thị số test PASS

## 6. Trạng thái hiện tại
- [x] Khởi tạo project, dựng khung thư mục, smoke test chạy được (Buổi 2)
- [ ] Module tiếp nhận và phân loại yêu cầu (Buổi 8–10)
- [ ] Module cập nhật trạng thái và chuyển giao phân công (Buổi 10–12)