# Nhật ký Gỡ lỗi & Xử lý sự cố (Bug Log)

**Dự án:** Chuyên đề Tốt nghiệp 1 (CDTN1 - HK1 2026–2027) | Khoa CNTT – Đại học Văn Lang  
**Phân hệ:** L2 – Tiếp nhận và phân loại yêu cầu bảo hành (Mekong Mobile CRM)  
**Sinh viên:** Nguyễn Bá Anh Khôi | **MSSV:** 2374802010247 | **Track:** Software Engineering (SE)  
**Tiêu chuẩn áp dụng:** Mẫu Bug Log 7 dòng chuẩn Buổi 11 (Bảng 2.7 slide 15 & Mục D1 Tài liệu tự học)  

---

## BUG-001 · Critical — Vi phạm kiểm soát chuyển trạng thái vòng đời một chiều (QT-06)

| Dòng | Nội dung | Chi tiết kỹ thuật |
|:---|:---|:---|
| **1. Mã và mức độ** | BUG-001 · Critical | Vi phạm tính toàn vẹn vòng đời một chiều của phiếu bảo hành |
| **2. Phát hiện bởi** | TC-03b trong `tests/ticket.service.test.js` | Kiểm thử vi phạm quy tắc vòng đời trạng thái một chiều QT-06 |
| **3. Triệu chứng** | Giao diện cho phép rollback trạng thái | Phiếu đang ở trạng thái `DA_PHAN_CONG` hoặc `DANG_XU_LY` bị request cập nhật quay ngược về `MOI` |
| **4. Cách tái lập** | `PATCH /api/tickets/:id/status` | Gửi payload `{"status": "MOI", "updated_by": "NV_TEST"}` khi phiếu đã ở `DA_PHAN_CONG` |
| **5. Nguyên nhân** | Thiếu ma trận chuyển trạng thái hợp lệ | Tầng Service chỉ cập nhật trực tiếp trường `status` mà chưa thẩm định ma trận chuyển đổi hợp lệ (`VALID_TRANSITIONS`) |
| **6. Cách sửa** | Kiểm tra `VALID_TRANSITIONS` tại Service | Khai báo hằng số ma trận `VALID_TRANSITIONS` trong `src/backend/services/ticketService.js`; ném `AppError('TRANG_THAI_KHONG_HOP_LE')` khi chuyển sai hướng |
| **7. Commit và xác nhận** | Commit `fix(ticket): siết chặt ma trận chuyển trạng thái một chiều QT-06` | Test `TC-03b` chạy FAIL trước khi sửa và PASS 100% sau khi sửa |

---

## BUG-002 · Major — Lệch hạn bảo hành tại điểm biên cuối ngày (QT-05)

| Dòng | Nội dung | Chi tiết kỹ thuật |
|:---|:---|:---|
| **1. Mã và mức độ** | BUG-002 · Major | Tính toán sai quyền lợi bảo hành chính hãng của khách hàng |
| **2. Phát hiện bởi** | TC-02 trong `tests/ticket.service.test.js` | Kiểm thử giá trị biên của điều kiện bảo hành QT-05 |
| **3. Triệu chứng** | Thiết bị mua ngày 01/03/2026 (bảo hành 12 tháng) bị báo hết hạn vào chiều 01/03/2027 | Khách hàng mang máy đến quầy vào ngày cuối cùng bảo hành bị từ chối tiếp nhận miễn phí |
| **4. Cách tái lập** | `TicketService.isUnderWarranty('2026-03-01', 12, new Date('2027-03-01T15:00:00Z'))` | Kết quả trả về `false` dù ngày tiếp nhận vẫn nằm trong hạn bảo hành |
| **5. Nguyên nhân** | Đối tượng `Date` giữ nguyên `00:00:00` | Khi cộng tháng bảo hành, `Date` có mốc 00:00:00; mọi thời điểm sau 0 giờ của ngày cuối cùng đều bị toán tử `>` coi là quá hạn |
| **6. Cách sửa** | Thiết lập mốc hết hạn đến cuối ngày | Thêm `expiry.setUTCHours(23, 59, 59, 999)` trong `TicketService.isUnderWarranty` trước khi so sánh với thời điểm tiếp nhận |
| **7. Commit và xác nhận** | Commit `fix(warranty): gia hạn mốc kết thúc bảo hành đến 23:59:59.999 của ngày cuối` | Test `TC-02` kiểm tra mốc cuối ngày `2027-03-01T23:59:59.999Z` $\rightarrow$ PASS |

---

## BUG-003 · Major — Tính toán hạn cam kết SLA bỏ sót ngày nghỉ Chủ Nhật (QT-04)

| Dòng | Nội dung | Chi tiết kỹ thuật |
|:---|:---|:---|
| **1. Mã và mức độ** | BUG-003 · Major | Cam kết SLA không thực tế do tính cả ngày trung tâm đóng cửa |
| **2. Phát hiện bởi** | TC-02b trong `tests/ticket.service.test.js` | Kiểm thử biên tính toán SLA tiếp nhận vào Thứ Bảy |
| **3. Triệu chứng** | Tiếp nhận máy lúc 11:00 Thứ Bảy với mức ưu tiên CAO (24h) hẹn trả máy lúc 11:00 Chủ Nhật | Trung tâm bảo hành không mở cửa ngày Chủ Nhật, khiến nhân viên vi phạm cam kết SLA |
| **4. Cách tái lập** | `calculateDueDate(new Date('2026-10-03T11:00:00Z'), 'CAO')` | Kết quả trả về Chủ Nhật `2026-10-04T11:00:00Z` |
| **5. Nguyên nhân** | Thuật toán cộng giờ tuyến tính không kiểm tra ngày trong tuần | `slaHelper.js` ban đầu chỉ thực hiện phép tính `now.getTime() + hours * 3600 * 1000` |
| **6. Cách sửa** | Xây dựng SLA Engine bước nhảy theo giờ làm việc | Cài đặt vòng lặp bước nhảy từng ngày trong `src/backend/utils/slaHelper.js`, nếu gặp `getUTCDay() === 0` (Chủ Nhật) thì tự động bù thêm 24 giờ |
| **7. Commit và xác nhận** | Commit `fix(sla): hoàn thiện thuật toán loại trừ trọn vẹn ngày Chủ Nhật theo QT-04` | Test `TC-02b` xác nhận mốc hẹn tự động dời sang Thứ Hai lúc 11:00 UTC $\rightarrow$ PASS |

---

## BUG-004 · Major — Tạo phiếu thất bại với khách hàng thiếu họ tên từ dữ liệu cũ

| Dòng | Nội dung | Chi tiết kỹ thuật |
|:---|:---|:---|
| **1. Mã và mức độ** | BUG-004 · Major | Lỗi sập luồng tiếp nhận đối với tập khách hàng nhập từ dữ liệu cũ |
| **2. Phát hiện bởi** | TC-07 & Kiểm thử tự động `tests/ticket.contract.test.js` (CT-05) | Kiểm thử tiếp nhận bảo hành cho khách hàng nạp từ dataset |
| **3. Triệu chứng** | `POST /api/tickets` trả mã 500; giao diện hiện "Có lỗi xảy ra" | Nhân viên quầy không thể tạo phiếu bảo hành cho nhóm khách hàng này |
| **4. Cách tái lập** | `curl -X POST http://localhost:3000/api/tickets` | Gửi request tạo phiếu với `customerId: 1024`, bản ghi khách hàng có `full_name = null` |
| **5. Nguyên nhân** | Gọi `.trim()` trên biến mang giá trị `null` | Hàm chuyển đổi ranh giới gọi `khach.full_name.trim()` khi `full_name = null`; dataset cũ có bản ghi thiếu họ tên |
| **6. Cách sửa** | Bổ sung giá trị mặc định theo đúng hợp đồng dữ liệu | Cập nhật `toTicketView` và `TicketService.createTicket` dùng `(khach.full_name ?? '').trim() \|\| '(không rõ)'`; đảm bảo trường `tenKhach` luôn có giá trị |
| **7. Commit và xác nhận** | Commit `fix(ticket): bảo toàn hợp đồng dữ liệu khi khách hàng thiếu họ tên (BUG-004)` | Test `TC-04` trong `ticket.service.test.js` và `CT-05` trong `ticket.contract.test.js` FAIL trước, PASS sau |

---

## BUG-005 · Minor — Lỗ hổng cho phép nhập ký tự lạ SQL Injection Payload trong số Serial

| Dòng | Nội dung | Chi tiết kỹ thuật |
|:---|:---|:---|
| **1. Mã và mức độ** | BUG-005 · Minor | Lỗ hổng tiềm ẩn tại tầng kiểm tra dữ liệu đầu vào |
| **2. Phát hiện bởi** | TV-03 trong `tests/ticket.validator.test.js` | Kiểm thử fuzzing tầng Validator đầu vào |
| **3. Triệu chứng** | Chuỗi serial chứa payload `SN' OR 1=1 --` vượt qua tầng validate | Payload không hợp lệ đi sâu vào các lớp bên dưới |
| **4. Cách tái lập** | Gửi payload với `serial_imei: "SN' OR 1=1 --"` vào `validateTicket` | Trả về `isValid: true` thay vì bị chặn lại ngay từ cửa ngõ |
| **5. Nguyên nhân** | Biểu thức Regex kiểm tra chuỗi serial lỏng lẻo | Chưa siết chặt tập ký tự hợp lệ cho mã Serial/IMEI |
| **6. Cách sửa** | Siết chặt định dạng bằng Regex `^[A-Za-z0-9-]{6,40}$` | Cập nhật `src/backend/validators/ticketValidator.js`, từ chối ngay với mã lỗi `DU_LIEU_KHONG_HOP_LE` |
| **7. Commit và xác nhận** | Commit `fix(validator): siết chặt regex kiểm tra serial ngăn chặn ký tự lạ` | Test `TV-03` xác nhận ném đúng lỗi `DU_LIEU_KHONG_HOP_LE` $\rightarrow$ PASS |
