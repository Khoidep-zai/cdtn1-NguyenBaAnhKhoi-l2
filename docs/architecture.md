# THIẾT KẾ KIẾN TRÚC HỆ THỐNG
## Luồng L2: Tiếp nhận và phân loại yêu cầu bảo hành

### 1. Sơ đồ kiến trúc (Layered Architecture)
Sơ đồ kiến trúc đã được thiết kế trong file `architecture.drawio`. Kiến trúc phân lớp (Layered Architecture) được lựa chọn với 4 lớp cơ bản: Presentation Layer, Controller Layer, Service Layer, và Data Access Layer.

### 2. Lập luận kiến trúc

1. **Vì NFR1 (Hiệu năng API dưới 500ms) yêu cầu tốc độ phản hồi nhanh đối với cơ sở dữ liệu lớn**, tôi chọn **kiến trúc Monolithic phân lớp với Controller và Service tách biệt**, đánh đổi là **khả năng mở rộng độc lập từng module (như Microservices) sẽ bị hạn chế và code base sẽ phình to trong tương lai**.

2. **Vì NFR2 (Khả dụng 99.9%) yêu cầu hệ thống hoạt động ổn định và ít lỗi rủi ro ở production**, tôi chọn **việc tách biệt hoàn toàn Data Access Layer (sử dụng Prisma ORM) khỏi Service Layer**, đánh đổi là **tăng thời gian phát triển ban đầu và thêm độ trễ nhỏ (overhead) khi thực thi các câu truy vấn qua ORM thay vì SQL thuần**.

3. **Vì NFR3 (Toàn vẹn dữ liệu) yêu cầu đảm bảo tính ACID khi cập nhật trạng thái phiếu và log**, tôi chọn **sử dụng cơ sở dữ liệu quan hệ PostgreSQL tích hợp Database Transaction tại tầng Service**, đánh đổi là **khó khăn trong việc phân tán dữ liệu (sharding) theo chiều ngang khi dữ liệu phình to so với NoSQL**.
