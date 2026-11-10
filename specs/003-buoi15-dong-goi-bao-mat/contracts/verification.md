# Verification contract

- Các endpoint hiện hành và hợp đồng được mô tả trong `docs/api-contract.md`; không thêm endpoint nghiệp vụ tùy tiện.
- `/health` kiểm tra tiến trình; `/health/db` xác minh kết nối cơ sở dữ liệu. Phản hồi lỗi không tiết lộ nội bộ.
- Phiên thiếu, giả mạo hoặc hết hạn bị từ chối; yêu cầu ngoài phạm vi chi nhánh không thay đổi dữ liệu.
- Nguồn trình duyệt được phép theo cấu hình; nguồn khác không được cấp quyền đọc phản hồi có thông tin xác thực.
