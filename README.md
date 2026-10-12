# Tiếp nhận và phân loại yêu cầu bảo hành (Mekong Mobile CRM)

Sinh viên:  
Nguyễn Bá Anh Khôi - 2374802010247 - Track SE

Học phần:  
Chuyên đề Tốt nghiệp 1, HK1 2026-2027

Luồng nghiệp vụ:  
L2 – Tiếp nhận và phân loại yêu cầu bảo hành (Warranty Reception & Issue Categorization)

---

## 1. Mục tiêu hệ thống
Hệ thống hỗ trợ nhân viên quầy tiếp nhận tra cứu hồ sơ khách hàng theo SĐT (QT-01), tạo phiếu bảo hành điện tử (BH-xxxxxx/yyyy), tự động tính hạn cam kết SLA (QT-04) và phân loại sơ bộ sự cố kỹ thuật theo quy tắc vòng đời một chiều (QT-06). Giải pháp giúp số hóa hoàn toàn quy trình quầy tiếp nhận, triệt tiêu 20% trùng lặp khách hàng và giảm tỷ lệ trễ hạn SLA.

## 2. Yêu cầu môi trường
- Node.js 20 LTS hoặc 22/24 LTS
- PostgreSQL 15, 16 hoặc 18
- Biến môi trường: xem file `.env.example`

## 3. Hướng dẫn chạy (≤ 4 bước theo yêu cầu BT2)
1. `cp .env.example .env` (hoặc cấu hình các biến kết nối DB trong `.env`)
2. `npm install`
3. `npm run db:migrate` (tạo bảng schema 3NF và nạp master data)
4. `npm run dev` → mở trình duyệt tại http://localhost:3000 (kiểm tra `/health` hoặc `/health/db`)

## 4. Cấu trúc thư mục mã nguồn (Chuẩn 4 tầng phân lớp)
- `docs/`: Tài liệu đặc tả yêu cầu (`srs.md`, `architecture.md`, `api-contract.md`, `thay-doi-thiet-ke.md`, `ai-disclosure.md`).
- `src/backend/`:
  - `controllers/`: Lớp điều phối HTTP request/response (`ticketController.js`, `customerController.js`).
  - `services/`: Lớp nghiệp vụ cốt lõi chứa quy tắc QT-01 đến QT-09 (`ticketService.js`).
  - `repositories/`: Lớp truy xuất dữ liệu theo Repository Pattern (`ITicketRepository.js`, `ticketRepository.js`).
  - `middlewares/`: Kiểm tra dữ liệu đầu vào (`validateTicket.js`).
  - `errors/`: Lớp lỗi nghiệp vụ ứng dụng (`AppError.js`).
  - `utils/`: Tiện ích SLA Engine (`slaHelper.js`) và chuẩn hóa SĐT (`phoneHelper.js`).
  - `db/`: Schema DDL PostgreSQL (`schema.sql`) và migration script (`migrate.js`).
- `src/frontend/`: Giao diện 3 màn hình tiếp nhận bảo hành tương tác API thực (`index.html`, `app.js`, `style.css`).
- `tests/`: Bộ kiểm thử tự động gồm:
  - `smoke.test.js`: Smoke test kiểm tra endpoint /health và kết nối DB.
  - `ticket.service.test.js`: Unit test lớp Service độc lập với Mock repository (đủ 3 loại test: Luồng đúng, Biên, Dữ liệu sai theo chuẩn Buổi 7).
  - `ticket.test.js`: Integration test toàn bộ quy trình tiếp nhận và lọc dữ liệu.

## 5. Kiểm thử
Chạy một lệnh duy nhất:
```bash
npm test
```
Kết quả kiểm thử: **16/16 tests passed (100% PASS)**

## 6. Trạng thái hiện tại
- [x] Khởi tạo project, smoke test chạy được (Buổi 2)
- [x] Module cốt lõi tiếp nhận & phân loại bảo hành, tách lớp đúng, 16 test PASS (Bài tập 2 - Tag v0.2)
- [ ] Module phân công kỹ thuật viên (Bài tập 3 / Luồng mở rộng)
