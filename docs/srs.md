# ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)
## Luồng L2: Tiếp nhận và phân loại yêu cầu bảo hành

- **Học phần:** Chuyên đề Tốt nghiệp 1 (CDTN1)
- **Sinh viên thực hiện:** Nguyễn Bá Anh Khôi
- **MSSV:** 237480200247
- **Track:** Kỹ thuật phần mềm (Software Engineering - SE)
- **Hệ thống:** Mekong Mobile CRM & Warranty Management

---

### 1. Giới thiệu tổng quan
Tài liệu này đặc tả yêu cầu phần mềm cho phân hệ **Tiếp nhận và phân loại yêu cầu bảo hành (L2)** thuộc hệ thống quản lý dịch vụ khách hàng Mekong Mobile. Mục tiêu cốt lõi là số hóa quy trình tiếp nhận thiết bị lỗi từ khách hàng, kiểm tra tính hợp lệ, phân loại sự cố kỹ thuật và khởi tạo phiếu bảo hành sẵn sàng cho khâu phân công kỹ thuật viên.

### 2. Các tác nhân hệ thống (Actors)
1. **Nhân viên tiếp nhận (Receptionist / Front-desk Staff):** Tiếp nhận khách hàng, tra cứu thông tin sản phẩm, lập phiếu bảo hành, phân loại lỗi ban đầu và bàn giao thiết bị.
2. **Hệ thống (System):** Thực hiện kiểm tra tính hợp lệ dữ liệu (validation), tự động sinh mã phiếu, ghi vết lịch sử trạng thái và phát sinh thông báo.
3. **Kỹ thuật viên (Technician) / Quản lý dịch vụ (Manager):** Xem danh sách phiếu chờ xử lý để thực hiện tiếp nhận phân công ở giai đoạn tiếp theo.

---

### 3. Danh sách User Stories & Tiêu chí nghiệm thu (Acceptance Criteria)

#### US1: Tạo phiếu bảo hành mới
- **Mô tả:** Là nhân viên tiếp nhận, tôi muốn tạo phiếu bảo hành mới để ghi nhận đầy đủ thông tin yêu cầu của khách hàng.
- **Tiêu chí nghiệm thu:**
  - Có đầy đủ thông tin khách hàng (tên, SĐT), thông tin thiết bị (tên máy, IMEI/Serial), mô tả lỗi từ khách hàng.
  - Hệ thống tự động gán mã phiếu (`ticket_id`), ngày tạo (`created_at`) và trạng thái mặc định ban đầu là `NEW`.

#### US2: Tra cứu thông tin khách hàng và lịch sử bảo hành
- **Mô tả:** Là nhân viên tiếp nhận, tôi muốn tra cứu thông tin khách hàng và sản phẩm qua SĐT/Serial/IMEI để kiểm tra điều kiện bảo hành trước khi tiếp nhận.
- **Tiêu chí nghiệm thu:**
  - Tìm kiếm nhanh theo số điện thoại hoặc mã IMEI/Serial.
  - Hiển thị thông tin mua hàng, ngày kích hoạt bảo hành và các lần bảo hành trước đó (nếu có).

#### US3: Phân loại sự cố kỹ thuật
- **Mô tả:** Là nhân viên tiếp nhận, tôi muốn phân loại phiếu theo loại sự cố (phần cứng, phần mềm, nguồn, màn hình, v.v.) để phiếu được đưa vào đúng luồng xử lý.
- **Tiêu chí nghiệm thu:**
  - Cho phép chọn danh mục sự cố từ danh mục chuẩn (`issue_categories`).
  - Ghi nhận mức độ ưu tiên (`priority`: Thấp, Trung bình, Cao, Khẩn cấp).

#### US4: Cập nhật trạng thái phiếu và ghi nhận lịch sử trạng thái
- **Mô tả:** Là nhân viên tiếp nhận, tôi muốn cập nhật trạng thái phiếu (ví dụ: `NEW` → `PENDING_ASSIGNMENT`) và ghi lại lịch sử trạng thái để theo dõi vòng đời phiếu.
- **Tiêu chí nghiệm thu:**
  - Mỗi lần đổi trạng thái phải lưu một bản ghi vào bảng lịch sử `ticket_status_log`.
  - Lưu rõ người thay đổi, thời gian thay đổi và ghi chú (nếu có).

#### US5: Xem và lọc danh sách phiếu bảo hành
- **Mô tả:** Là nhân viên tiếp nhận, tôi muốn xem danh sách phiếu theo trạng thái / ngày tạo / cửa hàng để quản lý công việc hàng ngày.
- **Tiêu chí nghiệm thu:**
  - Phân trang danh sách phiếu (pagination).
  - Lọc theo trạng thái (`status`), theo mã cửa hàng tiếp nhận (`store_id`), theo khoảng thời gian (`created_date`).

#### US6: Kiểm tra dữ liệu bắt buộc (Data Validation)
- **Mô tả:** Là hệ thống, tôi muốn kiểm tra dữ liệu bắt buộc (NOT NULL / validation) khi tạo hoặc cập nhật phiếu để đảm bảo dữ liệu hợp lệ trước khi lưu.
- **Tiêu chí nghiệm thu:**
  - Báo lỗi rõ ràng mã lỗi 400 và thông báo chi tiết nếu thiếu: SĐT khách, thông tin thiết bị, danh mục lỗi, cửa hàng tiếp nhận.
  - SĐT phải đúng định dạng số điện thoại Việt Nam (10 chữ số).

#### US7: Xem chi tiết phiếu bảo hành
- **Mô tả:** Là nhân viên tiếp nhận, tôi muốn xem chi tiết một phiếu bảo hành (bao gồm lịch sử trạng thái) để hỗ trợ khách hàng khi cần.
- **Tiêu chí nghiệm thu:**
  - Hiển thị đầy đủ thông tin chi tiết của phiếu, thông tin khách hàng, thiết bị và toàn bộ dòng thời gian (timeline) chuyển đổi trạng thái.

---

### 4. Yêu cầu phi chức năng (Non-Functional Requirements)
1. **Hiệu năng:** Thời gian phản hồi API tra cứu và tạo phiếu ≤ 500ms đối với dữ liệu mẫu tiêu chuẩn.
2. **Toàn vẹn dữ liệu:** Mọi thao tác cập nhật trạng thái phiếu phải nằm trong một transaction đảm bảo tính ACID cùng với bản ghi log trạng thái.
3. **Bảo mật:** Biến môi trường cấu hình không chứa mật khẩu trực tiếp trong mã nguồn, kiểm soát truy cập qua API key / JWT.
