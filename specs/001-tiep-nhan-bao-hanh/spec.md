# Feature Specification: Tiếp nhận và Phân loại Yêu cầu Bảo hành (L2)

**Feature Branch**: `001-tiep-nhan-bao-hanh`  
**Created**: 2026-11-04  
**Status**: Specified & Approved  
**Constitution Authority**: `.specify/memory/constitution.md`

---

## 1. User Scenarios & Testing

### User Story 1 - Tra cứu Hồ sơ Khách hàng & Thiết bị theo SĐT (Priority: P1)
**Goal**: Là nhân viên tiếp nhận quầy, tôi muốn tra cứu khách hàng bằng số điện thoại để nhanh chóng tải lại thông tin và lịch sử thiết bị mà không cần nhập thủ công lại từ đầu, đồng thời ngăn chặn trùng lặp khách hàng (QT-01).  
**Independent Test**: Nhập số điện thoại `0901234567` (hoặc `+84901234567`) qua API `GET /api/customers?phone=...`, trả về thông tin khách hàng và danh sách thiết bị kèm thời hạn bảo hành trong < 500ms.  
**Acceptance Scenarios**:
1. **Given** SĐT hợp lệ đã tồn tại trong CSDL, **When** nhân viên nhập SĐT và bấm tra cứu, **Then** hiển thị hồ sơ khách hàng và danh sách thiết bị đã mua.
2. **Given** SĐT chưa tồn tại, **When** nhân viên tra cứu, **Then** hệ thống báo khách hàng mới và cho phép tạo hồ sơ mới.
3. **Given** SĐT sai định dạng (chứa chữ, < 10 chữ số), **When** tra cứu, **Then** hệ thống trả về mã lỗi HTTP 400 Bad Request kèm thông điệp lỗi rõ ràng.

---

### User Story 2 - Khởi tạo Phiếu Tiếp nhận Bảo hành Điện tử (Priority: P1)
**Goal**: Là nhân viên tiếp nhận, tôi muốn khởi tạo phiếu bảo hành điện tử để số hóa hồ sơ, ghi nhận chính xác nhóm sự cố và mô tả lỗi kỹ thuật thay cho phiếu giấy thủ công.  
**Independent Test**: Gửi payload hợp lệ đến `POST /api/tickets`, hệ thống trả về HTTP 201 Created kèm mã phiếu dạng `BH-xxxxxx/yyyy` và ghi log ban đầu.  
**Acceptance Scenarios**:
1. **Given** khách hàng và thiết bị hợp lệ, nhóm sự cố từ 6 nhóm chuẩn (MÀN HÌNH, PIN, SẠC, PHẦN MỀM, NƯỚC VÀO, KHÁC), mô tả lỗi >= 10 ký tự, **When** gửi request tạo phiếu, **Then** phiếu được tạo ở trạng thái `MOI`, sinh mã phiếu chuẩn `BH-xxxxxx/yyyy`, tự động tính `due_date` SLA (QT-04) và chèn bản ghi vào `ticket_status_log`.
2. **Given** mô tả lỗi rỗng hoặc dưới 10 ký tự, **When** gửi request tạo phiếu, **Then** hệ thống trả về HTTP 400 Bad Request và nêu rõ trường `moTaLoi` không hợp lệ.
3. **Given** thiết bị đã có một phiếu bảo hành khác đang mở (`MOI`, `DA_PHAN_CONG`, `DANG_XU_LY`), **When** tạo phiếu mới, **Then** từ chối với lỗi HTTP 409 Conflict (QT-09).

---

### User Story 3 - Cập nhật Trạng thái Phiếu Một Chiều (Priority: P1)
**Goal**: Là nhân viên tiếp nhận hoặc quản lý, tôi muốn cập nhật trạng thái phiếu tiếp nhận để chuyển giao công việc cho kỹ thuật viên và theo dõi tiến độ xử lý một cách minh bạch (QT-06).  
**Independent Test**: Gửi `PATCH /api/tickets/:id/status`, chuyển từ `MOI` sang `DA_PHAN_CONG` thành công (HTTP 200) và cập nhật `ticket_status_log`. Cố gắng chuyển ngược bị chặn với HTTP 400.  
**Acceptance Scenarios**:
1. **Given** phiếu đang ở trạng thái `MOI`, **When** gửi lệnh chuyển sang `DA_PHAN_CONG`, **Then** trạng thái được cập nhật và ghi vết vào `ticket_status_log`.
2. **Given** phiếu đang ở trạng thái `DA_PHAN_CONG`, **When** người dùng cố gắng quay ngược về `MOI`, **Then** hệ thống từ chối với HTTP 400 và báo lỗi vi phạm vòng đời một chiều.

---

### User Story 4 - Tự động Tính hạn Hoàn tất SLA Trừ Chủ Nhật (Priority: P2)
**Goal**: Là hệ thống, tôi muốn tự động tính `due_date` dựa trên mức ưu tiên (CAO: 24h, TRUNG_BÌNH: 72h, THẤP: 120h) và loại trừ ngày Chủ Nhật (QT-04) để đảm bảo cam kết trả máy chính xác.  
**Independent Test**: Tạo phiếu vào Thứ Bảy 10:00 mức CAO (24h làm việc), `due_date` tính ra là Thứ Hai 10:00 (cộng thêm 24h nghỉ Chủ Nhật).  
**Acceptance Scenarios**:
1. **Given** mức CAO (24h), tạo vào Thứ Bảy 10:00, **When** tính hạn hoàn tất, **Then** `due_date` là Thứ Hai 10:00.
2. **Given** mức TRUNG_BÌNH (72h), tạo vào Thứ Tư 08:00, khoảng thời gian cắt qua Chủ Nhật, **When** tính hạn, **Then** `due_date` được cộng thêm chính xác 24h.

---

### User Story 5 - Xác minh Điều kiện Bảo hành & Phê duyệt Ngoại lệ (Priority: P2)
**Goal**: Là nhân viên tiếp nhận, tôi muốn xác minh điều kiện bảo hành của thiết bị theo ngày mua (QT-05) và ghi nhận ngoại lệ nếu không có hóa đơn/hết hạn.  
**Independent Test**: Thiết bị còn hạn bảo hành thì `is_warranty = true`. Thiết bị hết hạn/không đối soát được thì `is_warranty = false` và chặn phân công kỹ thuật viên cho đến khi có phê duyệt ngoại lệ của quản lý hoặc thỏa thuận sửa tính phí.  

---

## 2. Requirements & Business Invariants

- **QT-01**: Số điện thoại là duy nhất (`UNIQUE phone`), chuẩn hóa định dạng trước khi query/lưu.
- **QT-04**: SLA theo mức ưu tiên: CAO (24h), TRUNG_BÌNH (72h), THẤP (120h). Nghỉ làm việc Chủ Nhật (cộng dồn 24h).
- **QT-05**: Ràng buộc bảo hành: $(Ngày\_tiếp\_nhận - Ngày\_mua) \le warranty\_months$. Phiếu chưa xác minh cần phê duyệt ngoại lệ hoặc thỏa thuận sửa tính phí.
- **QT-06**: Vòng đời trạng thái một chiều: `MOI` -> `DA_PHAN_CONG` -> `DANG_XU_LY` -> `HOAN_TAT` -> `DA_BAN_GIAO` (hoặc `DA_HUY`). Ghi nhật ký vào `ticket_status_log`.
- **QT-07**: Định dạng mã phiếu `BH-xxxxxx/yyyy`.
- **QT-09**: Một thiết bị chỉ có tối đa 1 phiếu đang mở.
