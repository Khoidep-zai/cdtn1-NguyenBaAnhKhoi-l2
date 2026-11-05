# Nhật ký Gỡ lỗi & Xử lý sự cố (Bug Log)

- **Dự án:** Chuyên đề Tốt nghiệp 1 (CDTN1 - HK1 2026–2027) | Khoa CNTT – Đại học Văn Lang
- **Phân hệ:** L2 – Tiếp nhận và phân loại yêu cầu bảo hành (Mekong Mobile CRM)
- **Sinh viên:** Nguyễn Bá Anh Khôi | **MSSV:** 2374802010247 | **Track:** Software Engineering (SE)
- **Tiêu chuẩn áp dụng:** Mẫu Bug Log 7 dòng chuẩn Đề bài BT3 (Mục 2.3) & Buổi 13 Lý thuyết (Mục 3)
- **Kho lưu trữ:** `https://github.com/Khoidep-zai/cdtn1-NguyenBaAnhKhoi-l2`
- **Tiêu chí phân loại lỗi khách quan:**
  - *Câu hỏi 1:* "Hệ thống không dùng được, dữ liệu bị sai, hoặc có lỗ hổng bảo mật?" $\rightarrow$ **CÓ** $\rightarrow$ **CRITICAL** (bắt buộc sửa 100%).
  - *Câu hỏi 2:* "Một chức năng quan trọng sai hoặc không dùng được, nhưng có cách làm khác?" $\rightarrow$ **CÓ** $\rightarrow$ **MAJOR** (phải sửa hoặc nêu rõ phương án thay thế).
  - *Không rơi vào 2 câu trên:* $\rightarrow$ **MINOR** (ảnh hưởng trải nghiệm/trình bày, nghiệp vụ vẫn đúng).

---

## BUG-001 — Vi phạm kiểm soát chuyển trạng thái vòng đời một chiều (QT-06)

1. **Mã và mức độ:** BUG-001 · CRITICAL — Dữ liệu trạng thái phiếu bảo hành bị sai lệch, phá vỡ tính toàn vẹn vòng đời một chiều của hệ thống bảo hành.
2. **Phát hiện bởi:** TC-08 trong `tests/ticket.service.test.js` (kiểm thử vi phạm quy tắc vòng đời trạng thái một chiều QT-06).
3. **Triệu chứng:** Người dùng hoặc API gửi request có thể cập nhật lùi trạng thái của phiếu (ví dụ: phiếu đang ở trạng thái `DA_PHAN_CONG` hoặc `DANG_XU_LY` bị cập nhật quay ngược về `MOI`).
4. **Cách tái lập:** Gọi `PATCH /api/tickets/TKT-8801/status` với body `{"status": "MOI", "updated_by": "NV_TEST"}` khi phiếu đã ở trạng thái `DANG_XU_LY` — lỗi xuất hiện 5/5 lần, API vẫn trả 200 trước khi sửa.
5. **Nguyên nhân:** Tầng `ticketService.js` ban đầu cập nhật trực tiếp trường `status` vào cơ sở dữ liệu mà không thông qua ma trận kiểm tra tính hợp lệ của bước chuyển trạng thái (`VALID_TRANSITIONS`).
6. **Cách sửa:** Khai báo ma trận chuyển đổi hợp lệ `VALID_TRANSITIONS` trong `src/backend/services/ticketService.js`; kiểm tra nếu trạng thái đích không nằm trong danh sách cho phép của trạng thái hiện tại thì ném ngay lỗi `AppError('TRANG_THAI_KHONG_HOP_LE', 409)`.
7. **Link commit và xác nhận:** [Commit 18dc1dc](https://github.com/Khoidep-zai/cdtn1-NguyenBaAnhKhoi-l2/commit/18dc1dc) · Chạy lại test `TC-08` $\rightarrow$ trả về HTTP 409 `TRANG_THAI_KHONG_HOP_LE` $\rightarrow$ PASS 100%; bổ sung test case hồi quy bảo đảm trạng thái phiếu trong CSDL không bị suy suyển.

---

## BUG-002 — Lệch hạn bảo hành tại điểm biên cuối ngày (QT-05)

1. **Mã và mức độ:** BUG-002 · MAJOR — Tính toán sai quyền lợi bảo hành chính hãng của khách hàng tại ngày hết hạn.
2. **Phát hiện bởi:** TC-02 trong `tests/ticket.service.test.js` (kiểm thử giá trị biên của điều kiện bảo hành QT-05).
3. **Triệu chứng:** Thiết bị mua ngày 01/03/2026 với thời hạn bảo hành 12 tháng bị hệ thống từ chối bảo hành miễn phí khi khách mang máy đến quầy vào buổi chiều ngày 01/03/2027.
4. **Cách tái lập:** Gọi `TicketService.isUnderWarranty('2026-03-01', 12, new Date('2027-03-01T15:00:00Z'))` — kết quả trả về `false` dù ngày 01/03/2027 vẫn là ngày còn hạn bảo hành.
5. **Nguyên nhân:** Đối tượng `Date` khi cộng tháng bảo hành mang mốc giờ mặc định là `00:00:00.000`; do đó bất kỳ thời điểm nào sau 0 giờ sáng của ngày hết hạn đều bị toán tử so sánh `>` xem là đã quá hạn.
6. **Cách sửa:** Cập nhật hàm `isUnderWarranty` trong `src/backend/services/ticketService.js`, thiết lập mốc hết hạn bảo hành đến thời điểm cuối cùng của ngày: `expiry.setUTCHours(23, 59, 59, 999)` trước khi so sánh với thời điểm tiếp nhận máy.
7. **Link commit và xác nhận:** [Commit 5282b6e](https://github.com/Khoidep-zai/cdtn1-NguyenBaAnhKhoi-l2/commit/5282b6e) · Chạy lại test `TC-02` với mốc `2027-03-01T23:59:59.999Z` $\rightarrow$ trả về `true` (PASS); kiểm tra mốc `2027-03-02T00:00:00.000Z` $\rightarrow$ trả về `false` (PASS).

---

## BUG-003 — Tính toán hạn cam kết SLA bỏ sót ngày nghỉ Chủ Nhật (QT-04)

1. **Mã và mức độ:** BUG-003 · MAJOR — Cam kết thời hạn xử lý SLA không thực tế do tính cả ngày trung tâm đóng cửa.
2. **Phát hiện bởi:** TC-03 trong `tests/ticket.service.test.js` (kiểm thử biên tính toán SLA tiếp nhận vào Thứ Bảy).
3. **Triệu chứng:** Khách hàng gửi máy vào lúc 11:00 sáng Thứ Bảy với mức độ ưu tiên CAO (cam kết xử lý trong 24 giờ làm việc), phiếu bảo hành in hẹn trả máy vào lúc 11:00 sáng Chủ Nhật (ngày trung tâm đóng cửa).
4. **Cách tái lập:** Gọi `calculateDueDate(new Date('2026-10-03T11:00:00Z'), 'CAO')` — kết quả trả về ngày Chủ Nhật `2026-10-04T11:00:00Z`.
5. **Nguyên nhân:** Hàm tính toán thời hạn ban đầu trong `slaHelper.js` thực hiện phép cộng thời gian tuyến tính thuần túy (`now.getTime() + hours * 3600 * 1000`) mà không kiểm tra thứ trong tuần.
6. **Cách sửa:** Xây dựng thuật toán bước nhảy theo giờ làm việc trong `src/backend/utils/slaHelper.js`: kiểm tra nếu thời hạn rơi qua ngày Chủ Nhật (`getUTCDay() === 0`) thì tự động cộng bù thêm 24 giờ để dời hạn cam kết sang ngày làm việc Thứ Hai kế tiếp.
7. **Link commit và xác nhận:** [Commit 422ee1d](https://github.com/Khoidep-zai/cdtn1-NguyenBaAnhKhoi-l2/commit/422ee1d) · Chạy lại test `TC-03` $\rightarrow$ hạn cam kết dời chính xác sang Thứ Hai lúc 11:00 UTC $\rightarrow$ PASS 100%.

---

## BUG-004 — Tạo phiếu thất bại với khách hàng thiếu họ tên từ dữ liệu cũ

1. **Mã và mức độ:** BUG-004 · MAJOR — Luồng tiếp nhận bị gián đoạn đối với tập khách hàng nhập từ dataset cũ thiếu trường thông tin.
2. **Phát hiện bởi:** TC-07 trong `tests/ticket.contract.test.js` (kiểm thử dữ liệu khách hàng từ file dataset lịch sử).
3. **Triệu chứng:** Gửi `POST /api/tickets` với mã khách hàng có `full_name = null` khiến API ném lỗi HTTP 500, giao diện hiển thị "Có lỗi xảy ra", không tạo được phiếu.
4. **Cách tái lập:** Gửi request tạo phiếu với `customerId: 1024` (bản ghi khách hàng trong dataset có trường họ tên bị bỏ trống) — lỗi sập 500 xuất hiện 5/5 lần.
5. **Nguyên nhân:** Hàm chuyển đổi ranh giới dữ liệu `toTicketView` thực hiện gọi `khach.full_name.trim()` khi biến `full_name` mang giá trị `null`, gây ra lỗi không thể đọc thuộc tính của null (TypeError).
6. **Cách sửa:** Cập nhật `toTicketView` và `TicketService.createTicket` áp dụng toán tử null-coalescing: `(khach.full_name ?? '').trim() || '(không rõ)'`; bảo đảm thuộc tính `tenKhach` luôn là chuỗi hợp lệ theo hợp đồng dữ liệu.
7. **Link commit và xác nhận:** [Commit 2dedc9e](https://github.com/Khoidep-zai/cdtn1-NguyenBaAnhKhoi-l2/commit/2dedc9e) · Chạy lại test `CT-05` và `TC-04` $\rightarrow$ tạo phiếu thành công với tên `(không rõ)`, trả HTTP 201 $\rightarrow$ PASS.

---

## BUG-005 — Lỗ hổng cho phép nhập ký tự lạ SQL Injection Payload trong số Serial

1. **Mã và mức độ:** BUG-005 · MINOR — Lỗ hổng tiềm ẩn tại tầng kiểm tra dữ liệu đầu vào (Input Validation / OWASP A05:2025).
2. **Phát hiện bởi:** TV-03 trong `tests/ticket.validator.test.js` (kiểm thử kiểm tra định dạng và sanitize đầu vào).
3. **Triệu chứng:** Chuỗi serial chứa các ký tự escape và injection payload dạng `SN' OR 1=1 --` vượt qua được tầng validate nếu chỉ kiểm tra độ dài chuỗi đơn thuần.
4. **Cách tái lập:** Gửi payload có `serial_imei: "SN' OR 1=1 --"` vào hàm `validateReceive` — hàm không ném lỗi mà trả về đối tượng hợp lệ.
5. **Nguyên nhân:** Biểu thức chính quy (Regex) kiểm tra chuỗi serial ban đầu quá lỏng lẻo, chưa giới hạn chặt chẽ tập ký tự cho phép.
6. **Cách sửa:** Cập nhật biểu thức chính quy trong `src/backend/validators/ticketValidator.js` thành `^[A-Za-z0-9-]{6,40}$`, từ chối ngay lập tức mọi chuỗi chứa ký tự đặc biệt hoặc khoảng trắng lạ với mã lỗi `DU_LIEU_KHONG_HOP_LE`.
7. **Link commit và xác nhận:** [Commit 67a106c](https://github.com/Khoidep-zai/cdtn1-NguyenBaAnhKhoi-l2/commit/67a106c) · Chạy lại test `TV-03` $\rightarrow$ ném đúng `DU_LIEU_KHONG_HOP_LE` $\rightarrow$ PASS.
