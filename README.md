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

## 3. Hướng dẫn khởi chạy hệ thống (Đúng 4 bước theo yêu cầu BT2 & Buổi 10)

Hệ thống được thiết kế theo nguyên tắc "Phép thử thư mục trống" (Clean-slate test): người khác clone repo về có thể chạy ngay mà không cần cấu hình phức tạp.

### 4 bước khởi chạy hệ thống (mỗi bước 1 lệnh):

```bash
# Bước 1: Sao chép tệp cấu hình môi trường mẫu
cp .env.example .env
# (Trên Windows Command Prompt / PowerShell dùng: copy .env.example .env)

# Bước 2: Cài đặt các gói thư viện phụ thuộc
npm install

# Bước 3: Khởi tạo bảng CSDL PostgreSQL và nạp Master Data thực tế
npm run db:migrate

# Bước 4: Khởi động máy chủ ứng dụng (Web + REST API)
npm run dev
# (hoặc: npm start)

Lưu ý khi chạy chạy trên tiếp terminal bên ngoài 
chạy lệnh cd cdtn1-NguyenBaAnhKhoi-l2 để vào thư mục dự án
chạy cd src 
cuối cùng là chạy test và run : npm test hoặc npm run dev 
```

Sau khi chạy Bước 4, mở trình duyệt web truy cập:
👉 **http://localhost:3000** (Giao diện Quầy tiếp nhận bảo hành 3 màn hình kết nối API thật)

### Các Endpoint kiểm tra nhanh hệ thống:
- **Giao diện Web Frontend (3 màn hình):** `http://localhost:3000/`
- **Smoke Test hệ thống:** `http://localhost:3000/health` (Trả về `{"status":"ok"}`)
- **Kiểm tra kết nối CSDL PostgreSQL:** `http://localhost:3000/health/db` (Trả về `{"status":"ok","database":{...}}`)
- **API danh sách phiếu bảo hành:** `http://localhost:3000/api/tickets?page=1&limit=25`
- **API tra cứu khách hàng theo SĐT (QT-01):** `http://localhost:3000/api/customers?phone=0901234567`
- **API danh mục nhóm sự cố kỹ thuật:** `http://localhost:3000/api/categories`
- **API danh mục trung tâm bảo hành:** `http://localhost:3000/api/centers`

> [!TIP]
> **Lưu ý trên Windows PowerShell:** Nếu gặp lỗi hạn chế script execution policy (`PSSecurityException`), bạn có thể dùng `npm.cmd run dev` và `npm.cmd test`, hoặc chạy trực tiếp bằng lệnh `node src/index.js`.


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
- `src/frontend/`: Giao diện 3 màn hình tiếp nhận bảo hành tương tác API thực (`index.html`, `app.js`, `style.css`, `api/client.js`, `api/tickets.api.js`, `components/dataState.js`).
- `tests/`: Bộ kiểm thử tự động gồm 25 tests (100% PASS):
  - `smoke.test.js`: Smoke test kiểm tra endpoint /health và kết nối DB.
  - `ticket.contract.test.js`: Unit test kiểm thử hợp đồng dữ liệu ranh giới (CT-01..CT-04, chuẩn Buổi 9 SE D1 & D3).
  - `ticket.service.test.js`: Unit test lớp Service độc lập với Mock repository (đủ 3 loại test: Luồng đúng, Biên, Dữ liệu sai theo chuẩn Buổi 7).
  - `ticket.validator.test.js`: Unit test tầng kiểm tra dữ liệu đầu vào (TV-01..TV-05).
  - `ticket.test.js`: Integration test toàn bộ quy trình tiếp nhận và lọc dữ liệu qua HTTP thực.

## 5. Kiểm thử
Chạy một lệnh duy nhất:
```bash
npm test
# hoặc: node --test --test-concurrency=1 tests/*.test.js
```
Kết quả kiểm thử: **25/25 tests passed (100% PASS)**

## 6. Trạng thái hiện tại (Buổi 10 / Workshop Sprint 2 — Tích hợp End-to-End & Module mở rộng)
- [x] 1. Module mở rộng theo track SE đã hiện thực: Frontend 3 màn hình (Danh sách, Tiếp nhận, Chi tiết) kết nối API thật qua `tickets.api.js` và `client.js`.
- [x] 2. Luồng chính chạy END-TO-END không lỗi treo: Tra cứu SĐT → Chọn model/serial → Kiểm tra bảo hành → Sinh mã phiếu BH-xxxxxx/2026 → Tự động tính hạn SLA loại trừ CN → Phân loại & Chuyển trạng thái một chiều.
- [x] 3. Đã chạy trên dữ liệu mẫu THẬT: CSDL nạp 67.037 khách hàng, 320 dòng điện thoại, 6 trung tâm, 6 nhóm sự cố, 7.800 phiếu bảo hành từ Dataset thực tế.
- [x] 4. Đã chụp ảnh kết quả toàn luồng và lưu trữ minh chứng vào `docs/` và báo cáo BT2.
- [x] 5. ≥ 5 unit test nghiệp vụ chạy PASS: Đạt 25/25 test tự động hiển thị trực quan số lượng pass trên terminal.
- [x] 6. Đã kiểm thử đầy đủ các trường hợp BIÊN: Biên hạn bảo hành cuối cùng, biên ca trực SLA chuyển giao qua ngày Chủ Nhật (QT-04, QT-05).
- [x] 7. Đã hiện thực trọn vẹn 3 trạng thái giao diện (Đang tải, Rỗng, Lỗi kết nối có nút thử lại) qua module `src/frontend/components/dataState.js`.
- [x] 8. README mục 3 đã điền đủ 4 bước chạy, mỗi bước đúng một lệnh tiêu chuẩn.
- [x] 9. ĐÃ THỬ clone repo vào thư mục mới và chạy theo đúng README (Phép thử thư mục trống PASS).
- [x] 10. Đã commit theo quy ước Conventional Commits; lịch sử commit rõ ràng, minh bạch.

