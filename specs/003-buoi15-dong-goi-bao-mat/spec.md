# Feature Specification: Buổi 15 — đóng gói và bảo mật track SE

**Feature Branch**: `main`  
**Created**: 2026-11-09  
**Status**: Draft  
**Input**: Hai tài liệu Buổi 15; hoàn thiện các yêu cầu chung và track SE cho Mekong Mobile CRM L2.

## Clarifications

### Session 2026-11-09

- Q: Dùng dữ liệu mẫu nào để đóng gói? → A: Giữ bộ dữ liệu gốc hiện tại; đây là dữ liệu mẫu kiểm thử.

### Session 2026-11-10

- Q: Tạo quản trị ban đầu thế nào? → A: Giữ lệnh tương tác, người vận hành tự đặt mật khẩu. Không tự seed quản trị. Đây là ngoại lệ so với tiêu chí hai lệnh cho toàn bộ luồng đăng nhập; phải công bố trong báo cáo.

## User Scenarios & Testing

### User Story 1 - Dựng lại hệ thống (Priority: P1)

Người chấm dựng hệ thống từ bản phát hành trong môi trường sạch và dùng được dữ liệu mẫu.

**Why this priority**: Không dựng được thì không thể kiểm chứng các thành phần khác.

**Independent Test**: Từ bản sao sạch, thực hiện hai lệnh trong hướng dẫn; kiểm tra dịch vụ sẵn sàng, dữ liệu mẫu và chạy test.

**Acceptance Scenarios**:
1. **Given** môi trường sạch có các điều kiện tiên quyết, **When** làm theo hai bước dựng, **Then** ứng dụng và kho dữ liệu sẵn sàng với dữ liệu mẫu; tài khoản đầu tiên được tạo bằng bước bootstrap tương tác bổ sung đã được chủ dự án chọn.
2. **Given** dữ liệu đã được khởi tạo, **When** chạy lại bước nạp dữ liệu, **Then** không phát sinh bản ghi trùng hoặc lỗi.

### User Story 2 - Kiểm chứng bảo mật (Priority: P1)

Người đánh giá kiểm tra quyền truy cập, dữ liệu đầu vào và bảo vệ thông tin nhạy cảm bằng chứng cứ thực tế.

**Why this priority**: Bảo vệ dữ liệu và ngăn truy cập trái phép là điều kiện bàn giao.

**Independent Test**: Thực hiện các kiểm tra xác thực, phân quyền, dữ liệu sai và rà soát bảy mục bảo mật.

**Acceptance Scenarios**:
1. **Given** người dùng không có quyền, **When** truy cập dữ liệu ngoài phạm vi được cấp, **Then** yêu cầu bị từ chối và dữ liệu không thay đổi.
2. **Given** thông tin xác thực không hợp lệ hoặc hết hạn, **When** truy cập chức năng bảo vệ, **Then** truy cập bị từ chối.
3. **Given** một lỗi hệ thống, **When** phản hồi được trả về, **Then** không tiết lộ chi tiết nội bộ hoặc bí mật.

### User Story 3 - Bàn giao tài liệu trung thực (Priority: P2)

Người chấm dùng tài liệu tiếng Anh để vận hành và kiểm tra mọi giao diện thực sự tồn tại.

**Why this priority**: Tài liệu cho phép người khác xác minh độc lập.

**Independent Test**: Đối chiếu hướng dẫn, danh sách giao diện và minh chứng với hệ thống đang chạy.

**Acceptance Scenarios**:
1. **Given** bản bàn giao, **When** đọc hướng dẫn triển khai, **Then** có đủ năm mục, dữ liệu mẫu và kết quả kiểm tra mong đợi.
2. **Given** một giao diện đang tồn tại, **When** đối chiếu tài liệu, **Then** có đủ bảy mục và ví dụ thực tế tương ứng.
3. **Given** một kiểm tra chưa chạy được, **When** xem checklist, **Then** trạng thái chưa hoàn thành và lý do được ghi rõ.

### Edge Cases

- Thiếu cấu hình bắt buộc: dừng an toàn và báo tên cấu hình thiếu, không lộ giá trị bí mật.
- Dịch vụ dữ liệu chưa sẵn sàng hoặc cổng đã sử dụng: hướng dẫn nêu cách xác định và xử lý.
- Dữ liệu đầu vào độc hại hoặc người dùng ngoài phạm vi: không thực thi mã và không thay đổi dữ liệu trái phép.
- Không thể kiểm tra trên máy sạch hoặc thiếu quyền truy cập bên ngoài: ghi nhận là chưa xác minh, không tạo minh chứng giả.

## Requirements

### Functional Requirements

- **FR-001**: Gói bàn giao MUST cho phép dựng lại hệ thống từ bản sao sạch bằng tối đa hai lệnh sau khi lấy mã.
- **FR-002**: Hệ thống MUST tự khởi tạo cấu trúc và dữ liệu mẫu, có kiểm tra sẵn sàng và nạp lại không tạo bản sao trùng.
- **FR-003**: Cấu hình MUST tách khỏi mã; bản mẫu đầy đủ, chạy được và không chứa bí mật thật; bí mật thật không được công bố trong mã, lịch sử, ảnh đóng gói hoặc nhật ký.
- **FR-004**: Hệ thống MUST xác thực, kiểm tra thời hạn và từ chối phiên giả mạo; thông tin phiên không chứa dữ liệu cá nhân không cần thiết.
- **FR-005**: Hệ thống MUST kiểm soát quyền và phạm vi chi nhánh theo quy tắc hiện hành; thử truy cập trái phép không thay đổi dữ liệu.
- **FR-006**: Hệ thống MUST kiểm tra đầu vào, ngăn chèn lệnh và mã giao diện; báo lỗi phù hợp mà không tiết lộ nội bộ.
- **FR-007**: Quy tắc truy cập từ trình duyệt MUST giới hạn nguồn được cấu hình khi dùng thông tin xác thực; cookie phiên có thuộc tính an toàn phù hợp môi trường.
- **FR-008**: Checklist MUST ghi trung thực trạng thái và minh chứng cho cả bảy mục bảo mật, gồm kiểm tra phụ thuộc và rà soát lịch sử bí mật.
- **FR-009**: Hướng dẫn triển khai tiếng Anh MUST có điều kiện tiên quyết, bước dựng, biến môi trường, dữ liệu mẫu, kiểm tra kết quả và hướng dẫn HTTPS khi triển khai thật.
- **FR-010**: Tài liệu API tiếng Anh MUST bao phủ mọi endpoint thực tế với phương thức/đường dẫn, mục đích, quyền, đầu vào, phản hồi thành công, lỗi và hành vi đặc biệt; ví dụ lấy từ lần chạy thật.
- **FR-011**: Ghi nhận kết quả kiểm thử và bằng chứng thực tế, gồm các kiểm tra riêng track SE và các hạn chế chưa kiểm chứng.
- **FR-012**: Mô tả cảnh báo lỗi ứng dụng và phiếu sắp quá hạn với điều kiện, ngưỡng, người nhận và hành động xử lý.

### Key Entities

- **Bản bàn giao**: phiên bản mã, cấu hình mẫu, hướng dẫn và dữ liệu mẫu.
- **Người dùng và phiên**: danh tính, vai trò, phạm vi chi nhánh và thời hạn phiên.
- **Minh chứng**: kiểm tra, trạng thái, kết quả thực tế và vị trí lưu.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Một bản sao sạch dựng được bằng không quá hai lệnh và mọi dịch vụ cần thiết sẵn sàng.
- **SC-002**: Bảy mục bảo mật và toàn bộ checklist track SE có trạng thái kèm minh chứng hoặc lý do chưa hoàn thành.
- **SC-003**: Mỗi endpoint hiện hành có đủ bảy mục tài liệu và ít nhất một ví dụ thực tế.
- **SC-004**: Tất cả kiểm thử áp dụng chạy đạt; kiểm thử phân quyền và nạp lại dữ liệu chứng minh không có tác dụng phụ trái phép.
- **SC-005**: Hướng dẫn có đủ năm mục bắt buộc; người kiểm tra có thể đối chiếu kết quả mong đợi.

## Assumptions

- Chỉ áp dụng yêu cầu chung và track SE; ví dụ DA/AI không phải yêu cầu triển khai.
- Giữ mô hình quyền theo chi nhánh trong SRS; ví dụ minh họa theo chủ sở hữu trong tài liệu không tự thay đổi quy tắc nghiệp vụ.
- Không bắt buộc triển khai công khai hoặc cấu hình chứng chỉ thật; kiểm chứng và minh chứng phụ thuộc quyền truy cập môi trường.
- Không tạo tag, sửa lịch sử Git hay công bố bí mật để giả lập kết quả.
