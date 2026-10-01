# THIẾT KẾ KIẾN TRÚC HỆ THỐNG
## Luồng L2: Tiếp nhận và phân loại yêu cầu bảo hành

---

### 1. Sơ đồ kiến trúc phân lớp (Layered Architecture)

Hệ thống lựa chọn mô hình **kiến trúc phân lớp 4 tầng chuẩn (4-Tier Layered Architecture)**. Kiến trúc này giúp tách biệt rành mạch giữa giao diện hiển thị, tầng điều phối xử lý, tầng nghiệp vụ logic và tầng lưu trữ dữ liệu (xem chi tiết file `architecture.drawio`).

#### Chi tiết trách nhiệm kỹ thuật từng tầng:

- **Tầng 1 — Trình diễn (Presentation Layer):**  
  Xây dựng trên nền tảng Web tiêu chuẩn (HTML5, Modern Vanilla CSS, JavaScript ES6) với giao diện Dark Mode hiện đại, trực quan, hỗ trợ nhân viên tiếp nhận thao tác trên 3 màn hình cốt lõi nhanh chóng và phản hồi tức thì.

- **Tầng 2 — Điều phối & Kiểm tra (Controller & Middleware Layer):**  
  Đảm nhiệm tiếp nhận HTTP Request, định tuyến API (Express Router), kiểm tra tính hợp lệ của dữ liệu đầu vào (ValidateMiddleware kiểm tra SĐT, trường NOT NULL) trước khi chuyển vào tầng nghiệp vụ.

- **Tầng 3 — Nghiệp vụ cốt lõi (Service & Business Logic Layer):**  
  Chứa toàn bộ quy tắc nghiệp vụ:
  - `TicketService` quản lý vòng đời trạng thái phiếu (QT-06)
  - `SLA Engine` tính toán hạn cam kết bỏ qua ngày nghỉ Chủ Nhật (QT-04)
  - `PhoneHelper` chuẩn hóa số điện thoại chống tạo trùng (QT-01)

- **Tầng 4 — Truy xuất & Lưu trữ dữ liệu (Data Access & Persistence Layer):**  
  Sử dụng **Prisma ORM** kết nối với cơ sở dữ liệu quan hệ **PostgreSQL 15**, quản lý Database Transaction đảm bảo tính ACID tuyệt đối cho nghiệp vụ tạo phiếu và ghi log kiểm toán.

- **Vùng ngoại vi (Nằm ngoài phạm vi L2):**  
  Bao gồm các dịch vụ: phân công kỹ thuật viên (L4), quản lý tồn kho linh kiện (L5), cổng thanh toán và hệ thống ERP bán lẻ.

---

### 2. Lập luận kiến trúc (Architecture Rationale)

Các quyết định thiết kế kiến trúc được lập luận chặt chẽ dựa trên yêu cầu phi chức năng định lượng theo khuôn mẫu bắt buộc:

> **Khuôn mẫu:** *"Vì \<Mã NFR\> yêu cầu \<ngưỡng cụ thể\>, tôi chọn \<quyết định kiến trúc\>, đánh đổi là \<chi phí/nhược điểm\>."*

**Lập luận 1 — Hiệu năng tra cứu (NFR1):**  
Vì **NFR1** yêu cầu thời gian phản hồi của API tra cứu khách hàng (`GET /api/customers`) phải dưới **500ms** đối với tập dữ liệu **67.037 bản ghi** (đo ở mức P95), tôi chọn **kiến trúc Monolithic phân lớp tách biệt Controller và Service** kết hợp lập chỉ mục **B-Tree Index** trên trường `phone` của bảng `customer`, đánh đổi là **khả năng mở rộng độc lập từng module (như Microservices) sẽ bị hạn chế và code base sẽ phình to trong tương lai**.

**Lập luận 2 — Tính sẵn sàng & Bảo trì (NFR2):**  
Vì **NFR2** yêu cầu độ sẵn sàng hoạt động đạt tối thiểu **99.9% uptime** trong giờ làm việc (thời gian gián đoạn dưới 43.8 phút/tháng), tôi chọn việc **cô lập hoàn toàn Data Access Layer** (thông qua Prisma ORM) khỏi Service Layer nhằm chuẩn hóa kiểm soát lỗi và cho phép thay thế CSDL không ảnh hưởng tầng trên, đánh đổi là **tăng thời gian phát triển ban đầu và thêm độ trễ nhỏ (overhead) khi thực thi các câu truy vấn qua ORM thay vì SQL thuần**.

**Lập luận 3 — Toàn vẹn dữ liệu kiểm toán (NFR3):**  
Vì **NFR3** yêu cầu đảm bảo tính toàn vẹn dữ liệu tuyệt đối (nguyên lý ACID) với **tỷ lệ mồ côi dữ liệu bằng 0.00%** khi cập nhật trạng thái phiếu và ghi nhật ký, tôi chọn sử dụng **Hệ quản trị cơ sở dữ liệu quan hệ PostgreSQL** tích hợp **Database Transaction** tại tầng Service để thực thi atomic cả `UPDATE ticket` và `INSERT ticket_status_log` trong cùng một transaction, đánh đổi là **khó khăn trong việc phân tán dữ liệu (sharding) theo chiều ngang khi dữ liệu phình to so với NoSQL**.
