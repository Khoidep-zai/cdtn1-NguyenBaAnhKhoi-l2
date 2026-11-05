# Feature Specification: Kiểm thử Hệ thống & Đóng gói Prototype Bài tập 3 (Track SE)

**Feature Branch / ID**: `002-kiem-thu-va-dong-goi-bt3`  
**Created**: 2026-11-05  
**Status**: Specified & Approved  
**Constitution Authority**: `.specify/memory/constitution.md` (v1.1.0)  
**Input Standards**: `CDTN1_Buoi14_Workshop_kiem_thu_he_thong_ca_nhan.md` & `Báo cáo/BT3/De_bai_Bai_tap_3_Kiem_thu_va_Dong_goi_prototype.md`

---

## 1. User Scenarios & Business Outcomes

### User Story 1 - Xử lý phản hồi BT2 & Đồng bộ Nhật ký thay đổi thiết kế (Priority: P1)
**Goal**: Là sinh viên thực hiện đồ án, tôi muốn ghi nhận toàn bộ phản hồi của Giảng viên từ Bài tập 2 vào `docs/thay-doi-thiet-ke.md` theo đúng quy chuẩn 4 dòng để chứng minh năng lực tiếp thu ý kiến và tính tích lũy/nhất quán của đồ án (Tiêu chí 3 Rubric).  
**Acceptance Scenarios**:
1. **Given** các nhận xét phổ biến ở BT2 (dựng môi trường sạch, tệp khóa phiên bản, tách lớp, an toàn secret, độ phủ test biên/bảo mật), **When** cập nhật `docs/thay-doi-thiet-ke.md`, **Then** mỗi mục phản hồi có đầy đủ 4 dòng bắt buộc: *Phản hồi của GV · Quyết định · Lý do · Ảnh hưởng*.
2. **Given** các quyết định sửa chữa hoặc giữ nguyên, **When** đối chiếu với hệ thống thật, **Then** mọi thay đổi đều có mã nguồn hoặc test case chứng minh tương ứng.

---

### User Story 2 - Hoàn thiện Báo cáo Kiểm thử Thực tế 12 Test Case chuẩn 8 cột & 5 Loại (Priority: P1)
**Goal**: Là kỹ sư kiểm thử phần mềm, tôi muốn lập bảng Test Report gồm 10–12 test case đã CHẠY THẬT trên hệ thống, đủ 8 cột, bắt trọn 5 loại kiểm thử BT3 và có kiểm tra tác dụng phụ để chứng minh chất lượng hệ thống cho Giảng viên.  
**Acceptance Scenarios**:
1. **Given** 12 test case từ TC-01 đến TC-12, **When** thực thi lệnh `npm test`, **Then** 100% test case PASS, thời gian chạy $\le 5$ giây, và kết quả thực tế được ghi nhận trung thực bằng số liệu cụ thể (status code, thông điệp lỗi, đếm số bản ghi trước/sau).
2. **Given** 5 loại test bắt buộc: Luồng đúng (QT-01, QT-04, QT-05, QT-06, QT-09), Giá trị biên (2 test ở hai bên ranh giới), Dữ liệu sai (nêu rõ tên trường), Bảo mật OWASP A01:2025 Broken Access Control, và Tính tái lập (migration lần 2 không lỗi, không nhân đôi), **When** rà soát bảng ma trận, **Then** không thiếu bất kỳ loại kiểm thử nào.
3. **Given** yêu cầu minh chứng thực tế, **When** kiểm tra thư mục `docs/screenshots/`, **Then** tồn tại đầy đủ các file ảnh chụp terminal/kết quả thực thi tương ứng với từng mã test case (`TC-01.png`..`TC-12.png`).

---

### User Story 3 - Chuẩn hóa Bug Log 7 dòng kèm Commit Link mở được (Priority: P1)
**Goal**: Là lập trình viên, tôi muốn ghi nhận các lỗi thực tế phát hiện trong quá trình kiểm thử vào `docs/bug-log.md` theo mẫu 7 dòng chuẩn để chứng minh quy trình chẩn đoán, gỡ lỗi và kiểm thử hồi quy có phương pháp (CLO3).  
**Acceptance Scenarios**:
1. **Given** danh sách lỗi đã khắc phục, **When** kiểm tra Bug Log, **Then** có $\ge 3$ bug (trong đó có $\ge 1$ Critical/Major), mỗi bug có đủ 7 dòng: *Mã và mức độ · Phát hiện bởi · Triệu chứng · Cách tái lập · Nguyên nhân · Cách sửa · Link commit và xác nhận*.
2. **Given** dòng link commit, **When** mở trên trình duyệt cửa sổ ẩn danh, **Then** link trỏ chính xác vào commit sửa lỗi trên repository GitHub công khai (PUBLIC).
3. **Given** dòng nguyên nhân, **When** đối chiếu, **Then** dòng này giải thích bản chất kỹ thuật sâu xa trong code, không phải là triệu chứng bề mặt.

---

### User Story 4 - Đóng gói Môi trường Tái lập & Phép thử Máy trắng (Priority: P1)
**Goal**: Là người tiếp nhận hoặc Giảng viên chấm bài, tôi muốn dựng lại toàn bộ hệ thống từ thư mục trống bằng $\le 2$ lệnh theo đúng Deployment Guide mà không cần hỏi sinh viên câu nào.  
**Acceptance Scenarios**:
1. **Given** máy sạch chưa cài đặt ứng dụng, **When** thực thi `cp .env.example .env` và `docker compose up -d --build`, **Then** các container `api` và `postgres` đều chuyển sang trạng thái `healthy`.
2. **Given** hệ thống đã khởi động, **When** gửi request kiểm tra `GET /health` và `GET /health/db`, **Then** hệ thống trả về HTTP 200 kèm trạng thái kết nối CSDL và số lượng bản ghi master data sẵn sàng.

---

### User Story 5 - Đồng bộ Nội dung Báo cáo Word BT3 qua OfficeCLI (Priority: P1)
**Goal**: Là sinh viên nộp bài, tôi muốn đồng bộ toàn bộ nội dung từ Test Plan, Test Report, Bug Log, Deployment Guide, Checklist bảo mật và Tài liệu API vào file Word báo cáo `BT3_2374802010247_NGUYỄN BÁ ANH KHÔI.docx` bằng công cụ `officecli` mà tuyệt đối không làm xáo trộn trang bìa, mục lục, phông chữ Times New Roman 13pt hay cấu trúc định dạng sẵn có.  
**Acceptance Scenarios**:
1. **Given** file báo cáo `BT3_2374802010247_NGUYỄN BÁ ANH KHÔI.docx`, **When** sử dụng `officecli` kiểm tra và cập nhật, **Then** nội dung các mục 1, 2, 3, 4, 5, 6, 7 và Phụ lục AI được đồng bộ chính xác với hệ thống thật.
2. **Given** quá trình chỉnh sửa, **When** thẩm định bằng `officecli validate`, **Then** kết quả trả về `no errors found`, cấu trúc OpenXML hoàn toàn nguyên vẹn.

---

## 2. Functional & Documentation Requirements

- **FR-01 (Design Change Log):** `docs/thay-doi-thiet-ke.md` bổ sung phần phản hồi BT2 (Buổi 14) với các mục TD-09, TD-10, TD-11 theo cấu trúc 4 dòng.
- **FR-02 (Test Report Completeness):** `docs/test-report.md` chứa đầy đủ 12 test case từ TC-01 đến TC-12, bổ sung đầy đủ ca TC-10 (Happy path SLA QT-04), ghi nhận kết quả đo lường tác dụng phụ (đếm bản ghi CSDL trước/sau) và đường dẫn ảnh chụp.
- **FR-03 (Screenshot Artifacts):** Tạo thư mục `docs/screenshots/` và khởi tạo đầy đủ các ảnh chụp minh chứng chạy thật (`TC-01.png`..`TC-12.png`, `clean-machine.png`, `docker-healthy.png`).
- **FR-04 (AI Disclosure Update):** Cập nhật `docs/ai-disclosure.md` cho mốc nộp BT3 / Giai đoạn 3 (CLO5).
- **FR-05 (OfficeCLI Sync & Validation):** Đọc và cập nhật nội dung văn bản file Word `Báo cáo/BT3/BT3_2374802010247_NGUYỄN BÁ ANH KHÔI.docx` đảm bảo tính nhất quán 100% với hệ thống mã nguồn.

---

## 3. Success Criteria (Measurable & Technology-Agnostic)

1. **100% Tiêu chí cốt lõi BT3 đạt:** Đạt toàn bộ 4 mục CỐT LÕI (C1: Đóng gói $\le 2$ lệnh, C2: Test Report 12 test 8 cột 5 loại, C3: 44/44 tests PASS bằng 1 lệnh, C4: Bug Log $\ge 3$ bug 7 dòng link commit mở được).
2. **100% Tiêu chí riêng track SE đạt:** Đạt S1 (API docs đầy đủ kèm ví dụ thật), S2 (Test OWASP A01 Broken Access Control PASS), S3 (Mật khẩu băm an toàn trong CSDL), S4 (Ẩn hoàn toàn stack trace khi lỗi 500).
3. **Tính toàn vẹn tài liệu Office:** File Word báo cáo vượt qua `officecli validate` với 0 lỗi schema, không bị thay đổi trang bìa, phông chữ, cỡ chữ hay margin.

