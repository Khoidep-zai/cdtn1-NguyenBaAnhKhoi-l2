# Tasks: Kiểm thử Hệ thống & Đóng gói Prototype Bài tập 3 (Track SE)

**Input**: `specs/002-kiem-thu-va-dong-goi-bt3/spec.md`, `specs/002-kiem-thu-va-dong-goi-bt3/plan.md`  
**Constitution**: `.specify/memory/constitution.md` (v1.1.0)

---

## Phase 1: Phản hồi BT2 & Nhật ký Thay đổi Thiết kế (TD-09..TD-11)

- [x] T001 Cập nhật `docs/thay-doi-thiet-ke.md` bổ sung phần phản hồi BT2 (Buổi 14) với 3 quyết định TD-09, TD-10, TD-11 chuẩn 4 dòng bắt buộc (Phản hồi · Quyết định · Lý do · Ảnh hưởng).

---

## Phase 2: Chuẩn hóa Báo cáo Kiểm thử Thực tế 12 Test Cases (TC-01..TC-12)

- [x] T002 Cập nhật `docs/test-report.md` bổ sung đầy đủ ca kiểm thử TC-10 (Happy path SLA ngày thường không cắt qua Chủ Nhật), hoàn thiện bảng ma trận 12 test cases đủ 8 cột, đo lường tác dụng phụ và liên kết ảnh chụp `docs/screenshots/TC-xx.png`.
- [x] T003 Cập nhật `docs/ai-disclosure.md` cho mốc nộp Bài tập 3 (Tag v1.0), hoàn thiện bảng kê khai 4 cột cho toàn bộ giai đoạn 3.

---

## Phase 3: Khởi tạo Minh chứng Ảnh chụp Thực tế (Screenshots Artifacts)

- [x] T004 Khởi tạo thư mục `docs/screenshots/` và tạo đầy đủ 12 file ảnh minh chứng kết quả chạy test thật `TC-01.png` đến `TC-12.png` cùng ảnh kiểm thử máy trắng `whitebox-test.png` và container `docker-healthy.png`.
- [x] T005 Chạy lệnh kiểm thử tự động `npm test` trong `cdtn1-NguyenBaAnhKhoi-l2` xác nhận 44/44 tests PASS 100%.

---

## Phase 4: Rà soát & Đồng bộ Báo cáo Word BT3 qua OfficeCLI

- [x] T006 Sử dụng `officecli view` kiểm tra cấu trúc outline, text và bảng biểu trong `Báo cáo/BT3/BT3_2374802010247_NGUYỄN BÁ ANH KHÔI.docx`.
- [x] T007 Đồng bộ nội dung các mục trong file Word báo cáo BT3 qua `officecli` đảm bảo khớp 100% với mã nguồn và tài liệu kỹ thuật mà tuyệt đối không thay đổi trang bìa, phông chữ, cỡ chữ hay lề trang.
- [x] T008 Thực thi `officecli validate` trên file Word xác nhận `no errors found` theo chuẩn OpenXML.

---

## Phase 5: Hoàn tất & Hội tụ Hệ thống (Convergence)

- [x] T009 Kiểm tra đối chiếu toàn bộ các tiêu chí C1..C9 và S1..S4 trong đề bài BT3.
- [x] T010 Đồng bộ bộ nhớ kiến trúc với CodeGraph (`codegraph sync`).
