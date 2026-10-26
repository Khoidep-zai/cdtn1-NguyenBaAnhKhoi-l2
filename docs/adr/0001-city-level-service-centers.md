# Tạo trung tâm bảo hành cấp thành phố, để phân cấp quận ở giai đoạn sau

**Trạng thái:** Đã chấp nhận

Vì cần có tài khoản quản lý và nhân viên cho TP. Hồ Chí Minh, Hà Nội, Nha Trang, Huế và Cần Thơ mà chưa triển khai phân cấp địa bàn, hệ thống thêm mỗi thành phố một bản ghi trung tâm độc lập trong `service_center`, giữ nguyên các trung tâm quận hiện có và không tạo quan hệ cha-con ở đợt này. API danh sách trung tâm đọc từ PostgreSQL để bộ lọc và màn quản lý tài khoản nhận được các bản ghi mới; việc quản lý nhân viên trực thuộc nhiều trung tâm sẽ cần một quyết định và thay đổi RBAC riêng.
