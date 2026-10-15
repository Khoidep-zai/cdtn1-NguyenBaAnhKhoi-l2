# Tiếp nhận và phân loại yêu cầu bảo hành (Mekong Mobile CRM)

Sinh viên:  
Nguyễn Bá Anh Khôi - 2374802010247 - Track SE

Học phần:  
Chuyên đề Tốt nghiệp 1 (CDTN1), HK1 2026-2027 — Khoa CNTT, Trường Đại học Văn Lang

Luồng nghiệp vụ:  
L2 – Tiếp nhận và phân loại yêu cầu bảo hành (Warranty Reception & Issue Categorization)

---

## 1. Mục tiêu hệ thống
Hệ thống hỗ trợ nhân viên quầy tiếp nhận tra cứu hồ sơ khách hàng theo SĐT (QT-01), tạo phiếu bảo hành điện tử (BH-xxxxxx/yyyy - QT-07), tự động tính hạn cam kết SLA loại trừ ngày Chủ Nhật (QT-04) và phân loại sơ bộ sự cố kỹ thuật theo quy tắc vòng đời một chiều (QT-06), ngăn chặn tạo phiếu trùng lặp trên cùng Serial/IMEI (QT-09). Giải pháp giúp số hóa hoàn toàn quy trình quầy tiếp nhận, triệt tiêu 20% trùng lặp khách hàng và giảm thiểu tối đa tỷ lệ trễ hạn SLA.

## 2. Yêu cầu môi trường
- Node.js 20 LTS (hoặc 22/24 LTS), npm 10+
- PostgreSQL 15, 16 hoặc 18 (Cổng mặc định: 5432 hoặc 5433)
- Biến môi trường: xem file `.env.example` (`DATABASE_URL`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `PORT`)

## 3. Hướng dẫn chạy (≤ 4 bước theo yêu cầu BT2 & Buổi 8)
1. `cp .env.example .env` (hoặc cấu hình các biến kết nối DB trong `.env`)
2. `npm install`
3. `npm run db:migrate` (tạo bảng schema 3NF và nạp master data: 6 trung tâm, 6 nhóm sự cố, 320 sản phẩm, 67.037 khách hàng, 7.800 phiếu)
4. `npm run dev` → mở trình duyệt tại http://localhost:3000 (kiểm tra `/health` hoặc `/health/db`)

## 4. Cấu trúc thư mục mã nguồn (Chuẩn 4 tầng phân lớp)
- `docs/`: Bộ tài liệu đặc tả và kiểm chứng chất lượng theo chuẩn ĐH Văn Lang:
  - `thay-doi-thiet-ke.md`: Nhật ký điều chỉnh thiết kế theo phản hồi BT1 (chuẩn 4 dòng bắt buộc: phản hồi — quyết định — lý do — ảnh hưởng với mã `TD-01`..`TD-06`).
  - `bug-log.md`: Nhật ký phát hiện và xử lý lỗi thực tế (`BUG-01`..`BUG-04`).
  - `checklist-bao-mat.md`: Bảng tự đánh giá 7 mục bảo mật bắt buộc + 4 mục nâng cao.
  - `test-plan.md` & `test-report.md`: Kế hoạch và báo cáo kiểm thử chi tiết 21 test case.
  - `toi-uu.md`: Nhật ký tối ưu với đủ 3 số liệu (trước, sau, cách đo: `TU-01`..`TU-03`).
  - `ket-qua-chay-buoi-8.md`: Minh chứng kết quả chạy API thực tế và log terminal.
  - `srs.md`, `architecture.md`, `api-contract.md`, `deployment-guide.md`, `ai-disclosure.md`.
- `src/backend/`:
  - `controllers/`: Lớp điều phối HTTP request/response (`ticketController.js`, `customerController.js`, `catalogController.js`).
  - `services/`: Lớp nghiệp vụ cốt lõi chứa quy tắc QT-01 đến QT-09 độc lập giao thức HTTP (`ticketService.js`).
  - `repositories/`: Lớp truy xuất dữ liệu theo Repository Pattern (`ITicketRepository.js`, `ticketRepository.js`, `customerRepository.js`).
  - `validators/`: Lớp kiểm tra định dạng và dữ liệu đầu vào thuần túy (`ticketValidator.js`).
  - `middlewares/`: Middleware kiểm tra dữ liệu đầu vào (`validateTicket.js`).
  - `errors/`: Lớp lỗi nghiệp vụ ứng dụng (`AppError.js`).
  - `utils/`: Tiện ích SLA Engine (`slaHelper.js`), chuẩn hóa SĐT (`phoneHelper.js`), structured logging & requestId (`logger.js`).
  - `db/`: Schema DDL PostgreSQL (`schema.sql`) và migration script (`migrate.js`).
- `src/frontend/`: Giao diện 3 màn hình tiếp nhận bảo hành tương tác API thực (`index.html`, `app.js`, `style.css`).
- `tests/`: Bộ kiểm thử tự động gồm 21 tests (100% PASS):
  - `smoke.test.js`: Smoke test kiểm tra endpoint /health và kết nối DB.
  - `ticket.service.test.js`: Unit test lớp Service độc lập với Mock repository (đủ 3 loại test: Luồng đúng, Biên, Dữ liệu sai theo chuẩn Buổi 7).
  - `ticket.validator.test.js`: Unit test tầng kiểm tra dữ liệu đầu vào (TV-01..TV-05).
  - `ticket.test.js`: Integration test toàn bộ quy trình tiếp nhận và lọc dữ liệu qua HTTP thực.

## 5. Kiểm thử
Chạy một lệnh duy nhất:
```bash
npm test
# hoặc: node --test --test-concurrency=1 tests/*.test.js
```
Kết quả kiểm thử: **21/21 tests passed (100% PASS)**

## 6. Trạng thái hiện tại (Buổi 8 / Workshop Sprint 1)
- [x] Đã đọc hết phản hồi BT1 và ghi lại quyết định điều chỉnh thiết kế vào `docs/thay-doi-thiet-ke.md` (TD-01..TD-06).
- [x] Cấu trúc mã nguồn dựng theo đúng sơ đồ kiến trúc 4 tầng phân lớp (`src/backend/{controllers, services, repositories, validators, utils, db}`).
- [x] Khởi tạo project, smoke test chạy được, kết nối CSDL PostgreSQL thành công (`/health`, `/health/db`).
- [x] CSDL đã tạo bảng theo DDL 3NF, nạp đầy đủ dữ liệu mẫu (6 trung tâm, 6 nhóm sự cố, 320 sản phẩm, 67.037 KH, 7.800 phiếu).
- [x] Module cốt lõi tiếp nhận & phân loại bảo hành chạy được, đáp ứng đầy đủ quy tắc QT-01, QT-04 (SLA Engine), QT-05, QT-06 (Vòng đời một chiều), QT-09 (Chống trùng Serial).
- [x] Đã bổ sung lớp ghi log có cấu trúc có che giấu secret/PII và gán RequestId truy vết sự cố (`src/backend/utils/logger.js`).
- [x] Bộ kiểm thử 3 loại chuẩn Buổi 7 đạt **21/21 test PASS (100%)**.
- [x] Đã lưu minh chứng kết quả chạy và ảnh chụp màn hình vào `docs/ket-qua-chay-buoi-8.md`.
- [x] Đầy đủ các tài liệu chất lượng: `bug-log.md`, `checklist-bao-mat.md`, `test-plan.md`, `test-report.md`, `toi-uu.md`.
- [ ] Module phân công kỹ thuật viên (Bài tập 3 / Sprint 2).
