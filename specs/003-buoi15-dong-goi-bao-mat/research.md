# Research

- **Decision**: Dùng Compose và volume cô lập để kiểm thử máy sạch. **Rationale**: tránh xóa dữ liệu người dùng; giữ luồng hai lệnh. **Alternative**: xóa volume hiện tại, không an toàn.
- **Decision**: Giữ phạm vi chi nhánh hiện hành. **Rationale**: hiến pháp và SRS quy định quyền theo chi nhánh; ví dụ quyền sở hữu trong bài là minh họa. **Alternative**: thay đổi toàn bộ quyền sang người tạo phiếu, không có yêu cầu nghiệp vụ.
- **Decision**: Kiểm tra ứng dụng trên HTTP localhost và mô tả TLS ở triển khai thật. **Rationale**: phù hợp phạm vi học phần. **Alternative**: dựng hạ tầng chứng chỉ thật, ngoài phạm vi.
- **Existing gaps**: Compose mở cổng database và chưa chứng minh tự nạp dữ liệu; image không có tests. Cookie Secure khi production có thể ảnh hưởng HTTP localhost. Logger cần kiểm chứng rò query và nội dung lỗi. Tài liệu triển khai có các khẳng định chưa khớp hiện trạng.
