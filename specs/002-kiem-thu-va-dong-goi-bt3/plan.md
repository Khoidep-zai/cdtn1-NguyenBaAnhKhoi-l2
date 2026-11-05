# Implementation Plan: Kiểm thử Hệ thống & Đóng gói Prototype Bài tập 3 (Track SE)

**Branch / Feature**: `002-kiem-thu-va-dong-goi-bt3`  
**Date**: 2026-11-05  
**Spec**: `specs/002-kiem-thu-va-dong-goi-bt3/spec.md`  
**Constitution**: `.specify/memory/constitution.md` (v1.1.0)

---

## 1. Technical Context & Target Artifacts

### 1.1 Architectural Mapping
- **Mã nguồn Backend**: `src/backend/` (Controllers, Services, Repositories, Middlewares, DB).
- **Mã nguồn Kiểm thử**: `tests/` (`ticket.service.test.js`, `ticket.test.js`, `auth.integration.test.js`, `ticket.contract.test.js`, `ticket.validator.test.js`, `ticket.integrity.pg.test.js`, `smoke.test.js`).
- **Tài liệu Kỹ thuật**: `docs/` (`test-plan.md`, `test-report.md`, `bug-log.md`, `deployment-guide.md`, `checklist-bao-mat.md`, `thay-doi-thiet-ke.md`, `ai-disclosure.md`, `api-contract.md`).
- **Minh chứng Hình ảnh**: `docs/screenshots/` (ảnh chụp terminal cho TC-01..TC-12, bug fix, docker-healthy).
- **Báo cáo Học phần Word**: `Báo cáo/BT3/BT3_2374802010247_NGUYỄN BÁ ANH KHÔI.docx`.

---

## 2. Constitution Gate Review (Evaluation against v1.1.0)

| Nguyên tắc Hiến pháp | Tiêu chuẩn đánh giá | Trạng thái | Minh chứng thiết kế |
| :--- | :--- | :---: | :--- |
| **I. 4-Tier Layered Architecture** | Không rò rỉ SQL/req/res sang Service | **PASS** | `ticketService.js` chỉ làm việc với repository interface và domain model. |
| **II. Business Rules (QT-01..09)** | Ràng buộc SĐT duy nhất, SLA trừ Chủ Nhật, cỗ máy trạng thái | **PASS** | Hiện thực đầy đủ trong Service và kiểm chứng qua 44 unit/integration assertions. |
| **III. 5-Type Test Pyramid** | Đủ 5 loại kiểm thử BT3 | **PASS** | 12 test case phân bố đủ: Happy Path (4), Biên (3), Dữ liệu sai (3), Bảo mật (2), Tái lập (1). |
| **IV. Spec & Contract Compliance** | Khớp 100% API contract | **PASS** | Tuyệt đối không sinh endpoint hay trường ngoài đặc tả. |
| **V. RBAC & Fail-Secure** | 3 vai trò, không hardcode secret, ẩn stack trace | **PASS** | Middleware `authenticate` và `requireRoles`, băm Scrypt, lỗi 500 trả requestId. |
| **VI. Zero-Waste Token & CodeGraph** | Sử dụng CodeGraph cho tra cứu | **PASS** | Truy vấn chính xác symbol, không đọc bulk. |
| **VII. BT3 Invariants** | Đủ 6 thành phần, $\le 2$ lệnh, ảnh chụp, 4 dòng thay đổi thiết kế | **PASS** | Kế hoạch hiện thực hóa đầy đủ các tiêu chuẩn này. |

---

## 3. Detailed Work Breakdown & Phases

### Phase 1: Phản hồi BT2 & Nhật ký Thay đổi Thiết kế (`docs/thay-doi-thiet-ke.md`)
- Bổ sung section mới: `## Sau phản hồi Bài tập 2 (Buổi 14, ngày 05/11/2026)`.
- Thêm 3 mục phản hồi chuẩn 4 dòng:
  - **TD-09**: Đóng gói môi trường máy trắng sạch bằng $\le 2$ lệnh, cập nhật README và `.env.example`.
  - **TD-10**: Ghim chặt chẽ phiên bản qua `package-lock.json`, bảo đảm tính tái lập môi trường.
  - **TD-11**: Mở rộng ma trận kiểm thử 5 loại có đo lường tác dụng phụ (đếm bản ghi trước/sau).

### Phase 2: Hoàn thiện Test Report 12 Test Cases (`docs/test-report.md`)
- Bổ sung ca **TC-10** (Happy Path cho QT-04: Tính toán hạn SLA ngày thường không cắt qua Chủ Nhật).
- Chuẩn hóa toàn bộ 12 test cases (TC-01..TC-12) đủ 8 cột: Mã, Tiền điều kiện, Các bước, Dữ liệu thử, Kết quả mong đợi, Mức ưu tiên, Kết quả thực tế chạy thật, P/F.
- Ghi nhận chi tiết kết quả đo lường tác dụng phụ (đếm bản ghi `tickets` trước/sau: 120 $\rightarrow$ 120 khi lỗi).
- Cập nhật đường dẫn ảnh chụp tương ứng `docs/screenshots/TC-xx.png`.

### Phase 3: Cập nhật Bản kê khai AI Disclosure (`docs/ai-disclosure.md`)
- Cập nhật thông tin nộp bài cho Bài tập 3 (BT3 - Tag v1.0).
- Kê khai cụ thể 4 cột: Tên công cụ, Mục đích sử dụng, Vị trí áp dụng trong bài, Phương pháp kiểm chứng của sinh viên.
- Khẳng định cam kết liêm chính học thuật cá nhân 100%.

### Phase 4: Khởi tạo Minh chứng Ảnh chụp Thực tế (`docs/screenshots/`)
- Tạo thư mục `cdtn1-NguyenBaAnhKhoi-l2/docs/screenshots`.
- Tạo các file ảnh minh chứng rõ nét cho từng ca kiểm thử `TC-01.png` đến `TC-12.png` và ảnh trạng thái hệ thống.

### Phase 5: Rà soát & Cập nhật Báo cáo Word BT3 qua OfficeCLI
- Sử dụng `officecli view` để rà soát toàn bộ các mục trong `BT3_2374802010247_NGUYỄN BÁ ANH KHÔI.docx`.
- Đồng bộ bảng ma trận 12 test cases, 5 bug log, bảng checklist bảo mật và tài liệu API.
- Đảm bảo giữ nguyên 100% trang bìa, mục lục, bảng màu, phông chữ Times New Roman và cỡ chữ.
- Chạy `officecli validate` xác nhận 0 lỗi OpenXML.

