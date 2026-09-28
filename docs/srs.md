# ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) RÚT GỌN
## Luồng L2: Tiếp nhận và phân loại yêu cầu bảo hành

- **Học phần:** Chuyên đề Tốt nghiệp 1 (CDTN1)
- **Sinh viên thực hiện:** Nguyễn Bá Anh Khôi
- **MSSV:** 2374802010247
- **Track:** Kỹ thuật phần mềm (Software Engineering - SE)
- **Hệ thống:** Mekong Mobile CRM

---

### 1. Giới thiệu và phạm vi

**Bối cảnh doanh nghiệp:** 
Mekong Mobile là chuỗi bán lẻ điện thoại và dịch vụ sửa chữa với 24 cửa hàng và 6 trung tâm bảo hành. Hiện tại, quy trình tiếp nhận bảo hành đang dùng phiếu giấy, gây thất thoát dữ liệu, trùng lặp thông tin khách hàng, thiếu tính đồng nhất trong phân loại lỗi và khó theo dõi tiến độ sửa chữa. Công ty đang hướng tới xây dựng hệ thống Smart CRM nhằm số hóa quy trình quản lý bảo hành.

**Luồng nghiệp vụ lựa chọn:**
Tiếp nhận và phân loại yêu cầu bảo hành (Mã luồng: L2). Luồng này tập trung vào số hóa quy trình tiếp nhận thiết bị lỗi từ khách hàng, kiểm tra tính hợp lệ, phân loại sự cố kỹ thuật và khởi tạo phiếu bảo hành.

**Danh mục các chức năng chủ ý KHÔNG làm (WON'T - MoSCoW):**
- Không làm chức năng phân công kỹ thuật viên tự động (thuộc luồng L4).
- Không quản lý kho linh kiện thay thế (thuộc luồng L5).
- Không xử lý thanh toán chi phí bảo hành.
- Không gửi tin nhắn (SMS/Email) chăm sóc khách hàng tự động.

**Bảng thuật ngữ nghiệp vụ chuẩn hóa:**
| Thuật ngữ | Định nghĩa | Tên kỹ thuật gợi ý |
| :--- | :--- | :--- |
| **Khách hàng** | Cá nhân đã mua ít nhất một sản phẩm hoặc sử dụng dịch vụ của Mekong Mobile. | `customer` |
| **Thiết bị** | Một máy cụ thể mà khách hàng sở hữu, xác định bằng số serial hoặc IMEI. | `device` |
| **Phiếu bảo hành** | Yêu cầu bảo hành được ghi nhận, có mã duy nhất và vòng đời trạng thái. | `ticket` |
| **Trạng thái phiếu** | Vị trí hiện tại của phiếu: Mới → Đã phân công → Đang xử lý → Chờ linh kiện → Hoàn tất → Đã đóng. | `ticket_status` |
| **Hạn cam kết** | Thời điểm chậm nhất phải hoàn tất phiếu, tính từ lúc tiếp nhận theo mức ưu tiên (SLA). | `due_date` |
| **Nhóm sự cố** | Phân loại nguyên nhân bảo hành: màn hình, pin, sạc, phần mềm, nước vào, khác. | `issue_category` |
| **Mức ưu tiên** | Mức khẩn của phiếu: Cao, Trung bình, Thấp. Quyết định hạn cam kết. | `priority` |

---

### 2. Các bên liên quan và vai trò

1. **Nhân viên tiếp nhận (Receptionist):** 
   - *Phạm vi quyền hạn:* Được quyền tìm kiếm hồ sơ khách hàng, tạo phiếu bảo hành mới, cập nhật trạng thái phiếu (các bước đầu), phân loại nhóm sự cố. 
   - *Trách nhiệm:* Tiếp nhận khách hàng, kiểm tra tính hợp lệ của thiết bị và đảm bảo ghi nhận đúng mô tả lỗi từ khách hàng để tạo phiếu bảo hành.
2. **Quản lý trung tâm (Center Manager):**
   - *Phạm vi quyền hạn:* Xem toàn bộ phiếu bảo hành thuộc trung tâm quản lý, phê duyệt các phiếu chưa xác minh bảo hành.
   - *Trách nhiệm:* Theo dõi tiến độ các phiếu bảo hành, đảm bảo các phiếu không bị quá hạn cam kết.

---

### 3. Yêu cầu chức năng (Functional Requirements)

| Mã FR | Nội dung yêu cầu chức năng | Dạng kiểm chứng |
| :--- | :--- | :--- |
| **FR1** | Hệ thống cho phép tìm kiếm hồ sơ khách hàng theo SĐT để kiểm tra. | Nhập SĐT hợp lệ trả về thông tin khách hàng. Nhập SĐT chưa tồn tại thì hiển thị tùy chọn thêm mới. |
| **FR2** | Hệ thống cho phép tạo mới phiếu bảo hành kèm theo thiết bị và phân loại sự cố. | Nút "Tạo phiếu" gọi API thành công tạo bản ghi trong bảng `ticket`, trả về mã phiếu dạng `BH-xxxxxx/yyyy`. |
| **FR3** | Hệ thống tự động tính toán và gán Hạn cam kết (SLA) theo mức ưu tiên. | Khi tạo phiếu với mức "CAO", `due_date` được tính là sau 24h làm việc kể từ thời điểm tạo. |
| **FR4** | Hệ thống ghi nhận mọi thay đổi trạng thái của phiếu vào nhật ký (log). | Mỗi lần chuyển trạng thái, số lượng bản ghi trong `ticket_status_log` của phiếu đó tăng thêm 1. |
| **FR5** | Hệ thống cung cấp bộ lọc tra cứu danh sách phiếu bảo hành cho nhân viên. | Người dùng chọn trạng thái "MỚI", hệ thống trả về danh sách chỉ chứa các phiếu có `status` = 'MỚI'. |

**Danh sách User Story chuẩn INVEST:**
- **US1 [MUST]:** Là nhân viên tiếp nhận, tôi muốn tìm kiếm khách hàng bằng số điện thoại để không phải nhập lại thông tin nếu khách đã từng mua hàng.
- **US2 [MUST]:** Là nhân viên tiếp nhận, tôi muốn tạo phiếu bảo hành mới gồm thiết bị, loại sự cố và mức ưu tiên để hệ thống lưu trữ thay cho phiếu giấy.
- **US3 [MUST]:** Là hệ thống, tôi muốn tự động sinh Hạn cam kết dựa vào mức ưu tiên của phiếu để kỹ thuật viên biết khi nào phải hoàn thành.
- **US4 [MUST]:** Là nhân viên tiếp nhận, tôi muốn cập nhật trạng thái phiếu từ "MỚI" sang "ĐÃ PHÂN CÔNG" để chuyển giao công việc cho bộ phận kỹ thuật.
- **US5 [SHOULD]:** Là hệ thống, tôi muốn tự động ghi nhận vào lịch sử mỗi khi phiếu đổi trạng thái để truy vết được ai đã đổi trạng thái vào lúc nào.
- **US6 [COULD]:** Là quản lý trung tâm, tôi muốn xem danh sách phiếu bảo hành của trung tâm mình (có phân trang và lọc) để theo dõi tiến độ tổng thể.

---

### 4. Yêu cầu phi chức năng (Non-Functional Requirements)

- **NFR1 (Hiệu năng):** Thời gian phản hồi của API tra cứu khách hàng theo SĐT (GET `/api/customers`) phải dưới **500ms** đối với cơ sở dữ liệu chứa 65.000 bản ghi khách hàng (đo trên 95% số lượng request).
- **NFR2 (Tính khả dụng):** Tính năng khởi tạo phiếu bảo hành phải đạt tỷ lệ uptime **99.9%** (chỉ cho phép tối đa khoảng 43 phút gián đoạn mỗi tháng).
- **NFR3 (Toàn vẹn dữ liệu):** Thao tác cập nhật trạng thái phiếu và ghi nhận lịch sử trạng thái phải được thực thi trong một Database Transaction duy nhất, đảm bảo tỷ lệ mồ côi dữ liệu (dữ liệu không đồng bộ giữa 2 bảng) là **0%**.

---

### 5. Ràng buộc và quy tắc nghiệp vụ

- **QT-01:** Số điện thoại khách hàng là duy nhất trong hệ thống. Khi nhập một số đã tồn tại, hệ thống phải hiển thị hồ sơ có sẵn thay vì tạo hồ sơ mới.
- **QT-04:** Hạn cam kết được sinh tự động từ thời điểm tiếp nhận theo mức ưu tiên: CAO = 24 giờ, TRUNG_BINH = 72 giờ, THAP = 120 giờ. Chỉ tính ngày làm việc (thứ Hai đến thứ Bảy).
- **QT-05:** Thiết bị được coi là còn bảo hành nếu (ngày tiếp nhận - ngày mua) ≤ số tháng bảo hành của sản phẩm. Nếu không có ngày mua, phiếu phải được đánh dấu "chưa xác minh bảo hành" và cần quản lý phê duyệt.
- **QT-06:** Phiếu chỉ được chuyển trạng thái theo đúng vòng đời: MỚI → ĐÃ PHÂN CÔNG → ĐANG XỬ LÝ (hoặc ĐÃ HỦY). Không được quay lại trạng thái trước. Mọi lần chuyển trạng thái đều phải ghi vào `ticket_status_log`.

---

### 6. Bảng truy vết yêu cầu (Traceability Matrix)

| Yêu cầu chức năng (FR) | User Story tương ứng | Use Case tương ứng | Mức độ MoSCoW |
| :--- | :--- | :--- | :--- |
| FR1: Tìm kiếm hồ sơ | US1 | UC1: Tìm kiếm KH | MUST |
| FR2: Tạo mới phiếu | US2 | UC2: Khởi tạo phiếu | MUST |
| FR3: Tính toán SLA | US3 | UC2: Khởi tạo phiếu | MUST |
| FR4: Ghi nhận log | US4, US5 | UC3: Cập nhật trạng thái | MUST / SHOULD |
| FR5: Tra cứu phiếu | US6 | UC4: Xem danh sách | COULD |
