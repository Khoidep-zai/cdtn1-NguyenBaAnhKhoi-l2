# Quickstart validation

1. Dùng bản sao dự án và Docker Compose với project name, cổng và volume riêng; không xóa volume đang dùng.
2. Sao chép cấu hình mẫu và dựng theo `docs/deployment-guide.md`.
3. Kiểm tra trạng thái dịch vụ, `/health`, `/health/db`, dữ liệu mẫu và đăng nhập.
4. Chạy test bằng lệnh hướng dẫn, chạy lại seed và so sánh số bản ghi.
5. Kiểm tra phân quyền, lỗi và bảy mục bảo mật; lưu kết quả thật và ghi rõ trường hợp không thể xác minh.
