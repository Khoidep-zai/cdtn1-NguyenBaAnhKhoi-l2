# Hiện trạng hệ thống Mekong Mobile CRM — L2

Ghi nhận theo mã nguồn và lần chạy kiểm thử tại máy phát triển ngày 29/10/2026. Đây là mô tả trạng thái hiện tại, không phải cam kết đã triển khai lưu trữ bền vững.

## Chức năng và dữ liệu

- Đăng nhập qua máy chủ, ba vai trò `NHAN_VIEN`, `QUAN_LY_CHI_NHANH`, `QUAN_LY_HE_THONG`; quyền lọc phiếu phụ thuộc chi nhánh.
- Nạp dataset mô phỏng của học phần: 67.037 hồ sơ khách hàng theo bộ nạp, 320 sản phẩm, 6 trung tâm, 6 nhóm sự cố và 7.800 phiếu lịch sử. Các con số mô tả dữ liệu giả lập, không đại diện hoạt động thực tế.
- Tạo phiếu yêu cầu khách hàng đã có hồ sơ; có thể đăng ký khách mới. Serial chưa có hồ sơ được tiếp nhận với bảo hành chưa xác minh. Không cho tạo phiếu đang mở trùng serial.
- SLA tính theo mức ưu tiên và loại trừ Chủ Nhật; trạng thái chuyển theo vòng đời một chiều. Phiếu chưa xác minh hoặc hết hạn có thể được phân công sau khi ghi nhận khách đồng ý sửa dịch vụ tính phí hoặc quản lý phê duyệt ngoại lệ.
- Ảnh bàn giao JPEG, PNG hoặc WebP tối đa 8 MB; phải có ảnh trước khi chuyển sang `DA_BAN_GIAO`. Ba vai trò có quyền truy cập phiếu trong phạm vi được phép có thể tải ảnh.
- Danh sách có tìm kiếm, bộ lọc và phân trang; các thẻ thống kê tính trong phạm vi chi nhánh, độc lập bộ lọc tìm kiếm. Giao diện có chế độ tiếng Anh nhưng chưa xác nhận toàn bộ thông báo đã được dịch.

## Lưu trữ và giới hạn

PostgreSQL lưu tài khoản và cung cấp một số danh mục; dữ liệu phiếu lúc khởi động nạp từ CSV vào `ticketRepository` trong bộ nhớ. Phiếu, khách hàng, nhật ký và ảnh phát sinh trong phiên chưa được lưu bền vững. Khởi động lại máy chủ sẽ mất các thay đổi này. Không mô tả chức năng này là đã lưu PostgreSQL hoặc CSV tự động.

Ảnh đăng nhập chụp từ ứng dụng đang chạy: [login-screen.jpg](export/login-screen.jpg). Ảnh thể hiện giao diện, không phải bằng chứng lưu trữ bền vững.

## Kiểm thử

Ngày 29/10/2026, `npm test`: 44 tests, 44 pass, 0 fail, 0 skipped trên môi trường đã cấu hình PostgreSQL. Bao gồm kiểm tra trạng thái bàn giao thiếu ảnh, tải ảnh và phạm vi quyền. Chưa chứng minh dữ liệu sau khi khởi động lại; chưa xác nhận phép thử clone sạch cho phiên bản đang sửa.

## Phần tiếp theo

Chuyển các thao tác phiếu, nhật ký, khách hàng và ảnh sang kho bền vững; bảo đảm tạo phiếu/log và chuyển trạng thái/log nhất quán bằng giao dịch; kiểm thử sau khởi động lại và các tình huống ghi đồng thời. Rà soát nốt nội dung tiếng Anh và kiểm thử trên trình duyệt.
