# Test Report — Báo cáo kết quả kiểm thử thực tế (L2)

- **Dự án:** Chuyên đề Tốt nghiệp 1 (CDTN1 - HK1 2026–2027) | Khoa CNTT – Đại học Văn Lang
- **Phân hệ:** L2 – Tiếp nhận và phân loại yêu cầu bảo hành (Mekong Mobile CRM)
- **Sinh viên:** Nguyễn Bá Anh Khôi | **MSSV:** 2374802010247 | **Track:** Software Engineering (SE)
- **Tiêu chuẩn cấu trúc:** 8 cột bắt buộc theo Đề bài BT3 (Mục 2.2) & Tài liệu tự học Buổi 13
- **Lệnh thực thi:** `npm test` *(chạy tự động qua `node --test --test-concurrency=1 tests/*.test.js`)*
- **Kết quả tổng thể test suite:** **55 PASS, 0 FAIL, 2 SKIP (Tổng cộng: 57 tests)**
- **Thời gian chạy toàn bộ:** 83.87 giây (qua kết nối cơ sở dữ liệu Cloud PostgreSQL SSL). Minh chứng: `docs/evidence/test-run.txt` và `docs/evidence/docker-tests.txt`.
- **Ghi chú về 2 test SKIP:** 2 test trong `tests/packaging.test.js` được thiết lập mặc định SKIP trên môi trường thông thường; chúng chỉ kích hoạt khi có cờ `TEST_PACKAGING=1` cùng cơ sở dữ liệu disposable riêng biệt để đảm bảo an toàn, không làm xáo trộn dữ liệu đang hoạt động.

---

## 1. Phân bố 12 Test Case theo Kim tự tháp và 5 Loại kiểm thử bắt buộc

| Phân loại kiểm thử BT3 | Mã Test Case | Tầng kiểm thử | Quy tắc / Tiêu chuẩn kiểm chứng |
|---|---|:---:|---|
| **1. Luồng đúng (Happy Path)** | `TC-01`, `TC-04`, `TC-07`, `TC-10` | Unit / Integration | `QT-05` (Bảo hành), `QT-01` (Tra cứu SĐT), `QT-06` (Vòng đời), `QT-04` (SLA) |
| **2. Giá trị biên (Boundary)** | `TC-02a`, `TC-02b`, `TC-03` | Unit | `QT-05` (Biên ngày hết hạn 2 bên ranh giới), `QT-04` (Biên SLA qua Chủ Nhật) |
| **3. Dữ liệu sai (Invalid Data)** | `TC-05`, `TC-06`, `TC-08` | Validator / Integration | Thiếu trường (400), `QT-09` Trùng Serial (409), `QT-06` Chuyển lùi trạng thái (409) |
| **4. Bảo mật (Security / OWASP)** | `TC-09` | Integration / Security | OWASP A01:2025 Broken Access Control (403 Forbidden khi thiếu quyền) |
| **5. Tính tái lập (Reproducibility)** | `TC-12` | System / DB | Chạy nạp Master Data / Migration lần 2 không lỗi, không nhân đôi bản ghi |

---

## 2. Bảng Ma Trận 12 Test Case Chi Tiết (Chuẩn 8 cột Đề bài BT3)

| Mã | Tiền điều kiện | Các bước thực hiện | Dữ liệu thử cụ thể | Kết quả mong đợi | Mức ưu tiên | Kết quả thực tế khi chạy thật | P/F |
|---|---|---|---|---|:---:|---|:---:|
| **TC-01** | Khách hàng đã tồn tại trong CSDL, thiết bị mua ngày 2026-06-01, thời hạn bảo hành 12 tháng. | 1. Gọi `TicketService.createTicket`<br>2. Kiểm tra cờ bảo hành và mã phiếu. | `customerId: 1`, `serialNo: 'SN-10293'`, `soldAt: '2026-06-01'`, thời điểm tiếp nhận: `2026-09-01`. | Phiếu tạo thành công, `is_warranty = true`, mã định dạng `BH-xxxxxx/yyyy`, trạng thái `MOI`. Bảng `tickets` tăng đúng 1 bản ghi. | Cao | Trả về phiếu `BH-000001/2026`, `is_warranty: true`, trạng thái `MOI`. Tác dụng phụ: bảng `tickets` tăng 1 bản ghi hợp lệ. Minh chứng: `docs/screenshots/TC-01.png`. | **PASS** |
| **TC-02a** | Thiết bị mua ngày 2026-03-01, thời hạn bảo hành 12 tháng. Kiểm tra mốc cuối cùng còn bảo hành (Biên 1). | 1. Gọi `TicketService.isUnderWarranty` với mốc thời gian cuối ngày cuối cùng. | `soldAt: '2026-03-01'`, `warrantyMonths: 12`, `checkDate: '2027-03-01T23:59:59.999Z'`. | Trả về `true` (VẪN CÒN bảo hành đến hết tích tắc cuối cùng của ngày 01/03/2027 theo QT-05). | Cao | Trả về `true`. Khách hàng đến quầy vào cuối ngày hết hạn vẫn được bảo hành miễn phí. Minh chứng: `docs/screenshots/TC-02a.png`. | **PASS** |
| **TC-02b** | Thiết bị mua ngày 2026-03-01, thời hạn bảo hành 12 tháng. Kiểm tra mốc vừa qua ngày hết hạn (Biên 2). | 1. Gọi `TicketService.isUnderWarranty` với mốc bắt đầu ngày kế tiếp. | `soldAt: '2026-03-01'`, `warrantyMonths: 12`, `checkDate: '2027-03-02T00:00:00.000Z'`. | Trả về `false` (ĐÃ HẾT bảo hành ngay khi bước sang ngày kế tiếp theo QT-05). | Cao | Trả về `false`. Hệ thống chuyển sang luồng sửa chữa dịch vụ có tính phí. Minh chứng: `docs/screenshots/TC-02b.png`. | **PASS** |
| **TC-03** | Khách hàng gửi máy vào sáng Thứ Bảy (2026-10-03 11:00 UTC), mức ưu tiên CAO (SLA cam kết 24h làm việc). | 1. Gọi `calculateDueDate(receivedAt, 'CAO')`<br>2. Đối chiếu ngày giờ trả hẹn. | `receivedAt: '2026-10-03T11:00:00Z'` (Thứ Bảy), `priority: 'CAO'`. | Hạn trả máy tự động cộng thêm 24 giờ của ngày Chủ Nhật trung tâm đóng cửa, dời sang Thứ Hai `2026-10-05T11:00:00Z` (QT-04). | Cao | Trả về chính xác `2026-10-05T11:00:00.000Z` (Thứ Hai lúc 11:00 UTC). Không rơi vào Chủ Nhật. Minh chứng: `docs/screenshots/TC-03.png`. | **PASS** |
| **TC-04** | Khách hàng đã đăng ký số điện thoại trong hệ thống (`+84901234567`). | 1. Gửi request `GET /api/customers?phone=+84901234567`.<br>2. Kiểm tra hồ sơ trả về. | Query param: `phone=+84901234567`. | HTTP 200, dữ liệu trả về thông tin khách hàng, số điện thoại chuẩn hóa, lịch sử các lần bảo hành (QT-01). | Trung bình | HTTP 200, tìm thấy khách hàng `Nguyễn Văn A`, SĐT chuẩn `0901234567`. Minh chứng: `docs/screenshots/TC-04.png`. | **PASS** |
| **TC-05** | Máy chủ Express đang chạy. Gửi payload thiếu các trường bắt buộc vào API tiếp nhận. | 1. Gửi request `POST /api/tickets` với body thiếu `customer_phone` và `serial_imei`.<br>2. Kiểm tra mã lỗi và CSDL. | Payload: `{"customer_name": "Nguyễn Văn A", "issue_description": "Lỗi nguồn"}`. | HTTP 400; body có `code: DU_LIEU_KHONG_HOP_LE`; thông báo NÊU RÕ tên trường `customer_phone`, `serialNo`. CSDL KHÔNG có bản ghi mới. | Cao | HTTP 400; chi tiết lỗi liệt kê đủ 2 trường thiếu; bảng `tickets` giữ nguyên số lượng bản ghi (không bị thêm bản ghi hỏng: 120 -> 120). Minh chứng: `docs/screenshots/TC-05.png`. | **PASS** |
| **TC-06** | Thiết bị Serial `SN-DUPLICATE-01` đang có phiếu `BH-000100/2026` ở trạng thái `DANG_XU_LY`. | 1. Gửi request `POST /api/tickets` tiếp nhận thêm phiếu mới cho cùng Serial trên.<br>2. Kiểm tra phản hồi. | `serial_imei: 'SN-DUPLICATE-01'`, các trường khác hợp lệ. | HTTP 409; body có `error: 'PHIEU_DANG_MO'` (QT-09). Tuyệt đối không trả 400 hay 500. Bảng `tickets` KHÔNG tăng bản ghi. | Cao | HTTP 409, `error: "PHIEU_DANG_MO"`. CSDL không phát sinh phiếu trùng lặp: bảng `tickets` giữ nguyên 120 bản ghi. Minh chứng: `docs/screenshots/TC-06.png`. | **PASS** |
| **TC-07** | Phiếu `TKT-8801` đang ở trạng thái `MOI`. Nhân viên thực hiện phân công xử lý kỹ thuật theo ma trận vòng đời QT-06. | 1. Gửi `PATCH /api/tickets/TKT-8801/status` sang `DA_PHAN_CONG`.<br>2. Tra cứu chi tiết phiếu `GET /api/tickets/TKT-8801`. | `status: 'DA_PHAN_CONG'`, `updated_by: 'NV_KHOI'`, `note: 'Phân công kỹ thuật viên Ninh Kiều'`. | HTTP 200, trạng thái cập nhật thành `DA_PHAN_CONG`; mảng `status_history` ghi thêm 1 sự kiện có người sửa, thời điểm và ghi chú. | Cao | HTTP 200, trạng thái cập nhật thành công sang `DA_PHAN_CONG`; `status_history` ghi nhận timeline chính xác với đầy đủ dấu vết kiểm toán. Minh chứng: `docs/screenshots/TC-07.png`. | **PASS** |
| **TC-08** | Phiếu `TKT-8801` đang ở trạng thái `DANG_XU_LY`. Gửi yêu cầu quay ngược trạng thái về `MOI`. | 1. Gửi `PATCH /api/tickets/TKT-8801/status` với `status: 'MOI'`.<br>2. Kiểm tra trạng thái trong CSDL. | Payload: `{"status": "MOI", "updated_by": "NV_TEST"}`. | HTTP 409; body có `error: 'TRANG_THAI_KHONG_HOP_LE'` (QT-06). Trạng thái trong CSDL vẫn giữ nguyên `DANG_XU_LY`. | Cao | HTTP 409, ném đúng `TRANG_THAI_KHONG_HOP_LE`. Phiếu không bị chuyển lùi trạng thái trong CSDL (vẫn giữ DANG_XU_LY). Minh chứng: `docs/screenshots/TC-08.png`. | **PASS** |
| **TC-09** | Có 2 tài khoản: Nhân viên thường A (không có quyền phê duyệt ngoại lệ bảo hành) và Quản lý B. | 1. Đăng nhập bằng tài khoản A, lấy token.<br>2. Gọi `PATCH /api/tickets/TKT-8801/warranty-exception` để duyệt ngoại lệ. | Token của nhân viên A, payload duyệt ngoại lệ. | HTTP 403; thân phản hồi từ chối quyền truy cập (OWASP A01:2025 Broken Access Control). Trạng thái ngoại lệ không đổi. | Cao | HTTP 403; `error: "KHONG_CO_QUYEN"`. Ngoại lệ bảo hành không bị phê duyệt trái phép. Minh chứng: `docs/screenshots/TC-09.png`. | **PASS** |
| **TC-10** | Tiếp nhận phiếu vào Thứ Tư trong tuần (2026-10-07 09:00 UTC), mức ưu tiên CAO (SLA 24h làm việc), không cắt qua Chủ Nhật. | 1. Gọi `calculateDueDate(receivedAt, 'CAO')`<br>2. Đối chiếu ngày giờ cam kết. | `receivedAt: '2026-10-07T09:00:00Z'` (Thứ Tư), `priority: 'CAO'`. | Hạn trả máy cộng đúng 24 giờ tuyến tính, trả hẹn vào Thứ Năm `2026-10-08T09:00:00Z` (QT-04). | Cao | Trả về chính xác `2026-10-08T09:00:00.000Z` (Thứ Năm lúc 09:00 UTC). Không cộng bù Chủ Nhật. Minh chứng: `docs/screenshots/TC-10.png`. | **PASS** |
| **TC-12** | Hệ thống đã khởi tạo CSDL và nạp đầy đủ Master Data lần thứ nhất. Tiến hành chạy lại lần thứ hai. | 1. Thực thi script `node src/backend/db/migrate.js` lần thứ hai.<br>2. Kiểm tra số lượng bản ghi master data. | Lệnh chạy script migration và nạp master data lần 2. | Quá trình chạy kết thúc thành công với mã 0, không báo lỗi xung đột khóa chính, số lượng trung tâm (6), nhóm lỗi (6), sản phẩm (320) không bị nhân đôi. | Cao | Quá trình chạy PASS 100%. Cơ chế `ON CONFLICT DO NOTHING` hoạt động chuẩn xác, bảo toàn trọn vẹn tính toàn vẹn CSDL. Minh chứng: `docs/evidence/docker-tests.txt`. | **PASS** |

---

## 3. Đánh Giá Khách Quan Kết Quả Kiểm Thử
1. **Phân bố chuẩn Kim tự tháp:** 7 Unit tests kiểm tra quy tắc cốt lõi trong mili-giây $\rightarrow$ 2 Integration tests kiểm tra CSDL $\rightarrow$ 3 API tests kiểm tra toàn vẹn luồng HTTP và bảo mật.
2. **Bắt trọn 5 loại kiểm thử BT3:** Luồng đúng (4 test), Biên (3 test), Dữ liệu sai (3 test), Bảo mật OWASP (1 test chính), Tính tái lập (1 test).
3. **Kiểm tra cả tác dụng phụ (Side-effects):** Các test dữ liệu sai và từ chối nghiệp vụ (TC-05, TC-06, TC-08, TC-09) đều kiểm chứng tác dụng phụ: **không phát sinh bản ghi rác hoặc bản ghi hỏng trong cơ sở dữ liệu**.

---

## 4. Phụ lục Kiểm Thử Mở Rộng: An Toàn Validator (TC-11)

| Mã | Tiền điều kiện | Các bước thực hiện | Dữ liệu thử cụ thể | Kết quả mong đợi | Mức ưu tiên | Kết quả thực tế khi chạy thật | P/F |
|---|---|---|---|---|:---:|---|:---:|
| **TC-11** | Gửi dữ liệu tạo phiếu với chuỗi Serial/IMEI chứa ký tự escape độc hại (SQL Injection payload). | 1. Gọi hàm `validateReceive` tại tầng Validator đầu vào.<br>2. Kiểm tra việc ném lỗi. | `serial_imei: "SN' OR 1=1 --"` kèm dữ liệu hợp lệ khác. | Ném lỗi `DU_LIEU_KHONG_HOP_LE`, bị từ chối ngay trước khi xuống tầng Repository/CSDL (OWASP A05:2025). | Cao | Bị chặn ngay tại tầng Validator với `DU_LIEU_KHONG_HOP_LE`. Regex `^[A-Za-z0-9-]{6,40}$` từ chối payload. Minh chứng: `docs/screenshots/TC-11.png`. | **PASS** |
