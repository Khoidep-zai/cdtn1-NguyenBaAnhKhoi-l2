# Tasks: Buổi 15 đóng gói và bảo mật SE

## Phase 1: Setup

- [x] T001 Kiểm tra trạng thái Git, ignore và baseline test tại `package.json`, `.gitignore`, `.dockerignore`.
- [x] T002 Ghi quyết định cập nhật hiến pháp vào `docs/thay-doi-thiet-ke.md`.

## Phase 2: Foundational

- [x] T003 Khảo sát schema, migration và seed hiện tại trong `db/schema.sql` và `src/backend/db/migrate.js` trước khi thiết kế dữ liệu mẫu giả, khóa duy nhất và nạp lại an toàn.

## Phase 3: User Story 1 — Dựng lại (P1)

**Goal**: Dựng sạch bằng hai lệnh; **Independent Test**: Compose cô lập, kiểm tra sẵn sàng, đăng nhập và nạp lại không trùng.

- [x] T004 [US1] Tạo kiểm thử tự động khởi tạo và nạp lại dữ liệu trong `tests/packaging.test.js`.
- [x] T005 [US1] Bổ sung luồng khởi tạo và dữ liệu mẫu giả có khóa duy nhất, nạp lại an toàn trong `src/backend/db/migrate.js` hoặc script seed được xác minh.
- [x] T006 [US1] Cấu hình khởi tạo tự động, không công bố PostgreSQL, readiness và cổng ứng dụng trong `docker-compose.yml`.
- [x] T007 [US1] Đưa test và dữ liệu cần thiết vào image, loại trừ bí mật trong `Dockerfile` và `.dockerignore`.
- [ ] T008 [US1] Bổ sung cấu hình mẫu và ghi nhận cookie production/HTTPS, bootstrap tương tác đã được chọn thay cho seed quản trị; kiểm chứng cookie localhost còn chờ trong `.env.example` và `src/backend/controllers/authController.js`.
- [ ] T009 [US1] Kiểm chứng hai lệnh và seed lặp bằng project và volume cô lập theo `specs/003-buoi15-dong-goi-bao-mat/quickstart.md`.

## Phase 4: User Story 2 — Bảo mật (P1)

**Goal**: Kiểm chứng bảy mục và phạm vi chi nhánh; **Independent Test**: test phiên, nguồn, log, input và 403 không tác dụng phụ.

- [x] T010 [P] [US2] Viết test JWT thiếu/sai/hết hạn và cấu hình thiếu trong `tests/auth.service.test.js`.
- [x] T011 [P] [US2] Viết test lọc log, query và lỗi trong `tests/logger.test.js`.
- [x] T012 [P] [US2] Viết test CORS nguồn được phép, bị từ chối và preflight trong `tests/cors.test.js`.
- [x] T013 [US2] Sửa cấu hình khởi động, JWT và cookie nếu test chứng minh sai trong `src/backend/config/index.js` và `src/backend/services/authService.js`.
- [x] T014 [US2] Loại dữ liệu nhạy cảm khỏi nhật ký trong `src/backend/utils/logger.js` và xử lý lỗi `src/backend/index.js`.
- [x] T015 [US2] Thiết lập danh sách nguồn và xử lý CORS trong `src/backend/index.js` và `.env.example`.
- [x] T016 [US2] Kiểm tra injection, XSS, shell, phân quyền và tác dụng phụ bằng `tests/` và ghi kết quả vào `docs/checklist-bao-mat.md`.
- [x] T017 [US2] Kiểm tra lịch sử secret, dependency audit và cấu hình image; ghi bằng chứng trung thực vào `docs/checklist-bao-mat.md`.

## Phase 5: User Story 3 — Tài liệu (P2)

**Goal**: Tài liệu khớp thực tế; **Independent Test**: đối chiếu toàn bộ endpoint và chạy hướng dẫn.

- [x] T018 [US3] Sửa hướng dẫn tiếng Anh 5 mục, HTTPS, dữ liệu mẫu, lệnh và kết quả thật trong `docs/deployment-guide.md`.
- [x] T019 [US3] Đối chiếu tất cả route với tài liệu 7 mục và ví dụ phản hồi thật trong `docs/api-contract.md`.
- [x] T020 [US3] Hoàn thiện checklist 7 mục và checklist SE với kết quả thật hoặc trạng thái chưa kiểm chứng trong `docs/checklist-bao-mat.md`.
- [x] T021 [US3] Ghi hai cảnh báo vận hành đủ điều kiện, ngưỡng, người nhận, hành động trong `docs/deployment-guide.md`.

## Phase 6: Polish

- [x] T022 Chạy toàn bộ `npm test`, xác nhận kết quả và cập nhật `docs/test-report.md` bằng chứng thực tế.
- [ ] T023 Chạy kiểm chứng `specs/003-buoi15-dong-goi-bao-mat/quickstart.md`, ghi hạn chế và minh chứng thật tại `docs/screenshots/`.
- [x] T024 Đồng bộ chỉ mục CodeGraph và rà soát diff theo `specs/003-buoi15-dong-goi-bao-mat/spec.md`.

## Dependencies & Execution Order

Setup → foundational → US1 → US2 → US3 → polish. T010–T012 độc lập có thể chuẩn bị song song sau nền tảng; test trước thay đổi tương ứng. US3 phụ thuộc kết quả thực tế từ US1/US2 để viết bằng chứng.

## Implementation Strategy

US1 là MVP; xác minh riêng trước khi chuyển sang bảo mật, sau đó đối chiếu tài liệu với hệ thống thực tế. Không đánh dấu hoàn thành những phép thử chưa chạy.
