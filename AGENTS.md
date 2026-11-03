# BỘ ĐIỀU PHỐI TRUNG TÂM, ĐỊNH TUYẾN SKILL & TỐI ƯU HÓA CODEGRAPH - OFFICECLI
**Dự án:** Chuyên đề Tốt nghiệp 1 (CDTN1 - HK1 2026–2027) | Khoa CNTT – Đại học Văn Lang  
**Phân hệ:** L2 – Tiếp nhận và phân loại yêu cầu bảo hành (Mekong Mobile CRM)  
**Sinh viên:** Nguyễn Bá Anh Khôi | **MSSV:** 2374802010247 | **Track:** Software Engineering (SE)  
**Đường dẫn lưu trữ chuẩn:** `.agent/AGENT_WORKFLOW_AND_ROUTER.md` (hoặc `src/.agent/AGENT_WORKFLOW_AND_ROUTER.md`)  
**Đồng bộ tự động tại gốc:** `AGENTS.md` và `GEMINI.md`  
**Công cụ bắt buộc:** `codegraph` (Đồ thị tri thức kiến trúc / Bộ nhớ dài hạn) & `officecli` (Bộ tự động hóa tài liệu Office)

---

## 1. NGUYÊN TẮC TỐI THƯỢNG VỀ TỐI ƯU HÓA TOKEN & TỐC ĐỘ SUY LUẬN (ZERO-WASTE TOKEN PROTOCOL)

> **CẢNH BÁO NGHIÊM NGẶT DÀNH CHO MỌI AI AGENT TRONG ANTIGRAVITY:**  
> Dự án chứa toàn bộ mã nguồn phân hệ L2, bộ test 3 tầng (16/16 test PASS), tài liệu đặc tả SRS, API Contract, sơ đồ kiến trúc và hàng chục kỹ năng nghiệp vụ chuyên sâu. Để đạt tốc độ phản hồi tức thì và tiết kiệm tối đa Token ($\ge 85-90\%$ giảm thiểu ngữ cảnh dư thừa), AI Agent **TUYỆT ĐỐI TUÂN THỦ 4 QUY TẮC SAU**:

1. **CẤM ĐỌC TOÀN BỘ (`NO BULK READING`):** Tuyệt đối không bao giờ dùng lệnh quét hoặc đọc tất cả các file `SKILL.md` trong thư mục `.agent\` cùng một lúc.
2. **ƯU TIÊN BỘ NHỚ CODEGRAPH TRƯỚC HẾT (`CODEGRAPH-FIRST`):** Trong repository đã có sẵn chỉ mục `.codegraph/`, tuyệt đối không dùng `grep`, `find` hoặc mở đọc hàng loạt file code lớn. Luôn gọi MCP `codegraph_explore` hoặc lệnh `codegraph` để lấy đúng symbol, interface, logic hàm và call path 2 chiều trong 1 lượt gọi duy nhất.
3. **ĐỊNH TUYẾN THEO VAI TRÒ & GIAI ĐOẠN (`ROLE & STAGE ROUTING`):** Bắt buộc phân tích prompt để xác định đúng **1 Vị trí** (`BA`, `BE`, `FE`, `TESTER`, `QC`, `QA`, hoặc `Office`) và chỉ nạp **duy nhất 1 đến 2 file `SKILL.md`** khớp trực tiếp.
4. **TIẾT LỘ TĂNG DẦN & GIẢI PHÓNG NGỮ CẢNH (`PROGRESSIVE DISCLOSURE & PRUNING`):**
   - **Tầng 1 (Router):** Chỉ nạp file điều phối này (đã được cấu hình trong System Rules).
   - **Tầng 2 (Skill Core):** Chỉ mở đúng file `SKILL.md` của vị trí khi bắt tay vào làm việc.
   - **Tầng 3 (References):** Chỉ mở các checklist trong `.agent/_shared/references/` khi tới cổng kiểm chứng (Verification Gate).
   - **Giải phóng ngữ cảnh:** Khi bàn giao giữa các bước (ví dụ: BA xong PRD bàn giao sang BE Dev), chỉ chuyển giao **Artifact đầu ra** (spec/schema/test contract), không giữ lại hướng dẫn của skill cũ trong ngữ cảnh.

---

## 2. CƠ CHẾ TỰ ĐỘNG PHÂN TÍCH PROMPT & ĐIỀU HƯỚNG NGHIỆP VỤ (AUTONOMOUS PROMPT INTENT PARSER)

Khi nhận bất kỳ câu lệnh (Prompt) nào từ người dùng — dù là câu ngắn, câu hỏi mở hay yêu cầu đa nhiệm phức tạp — AI Agent tự động kích hoạt **Quy trình Phân tích & Định tuyến 4 bước**:

```text
Prompt Người Dùng
      │
      ▼
[BƯỚC A: BÓC TÁCH THỰC THỂ & MIỀN NGHIỆP VỤ MEKONG CRM]
  ├─ Nhận diện thực thể nghiệp vụ: Khách hàng (SĐT, QT-01), Phiếu bảo hành (BH-xxxxxx/yyyy, QT-07),
  │  Thiết bị (Serial/IMEI, QT-03, QT-09), Hạn cam kết SLA (QT-04), Phân loại sự cố (QT-06), Trạng thái (MOI..HOAN_TAT).
  └─ Nhận diện công nghệ & định dạng: Node.js, Express 5, PostgreSQL, Repository Pattern, node:test, 
     HTML5/CSS3/JS SPA, Word (.docx), Excel (.xlsx), PowerPoint (.pptx).
      │
      ▼
[BƯỚC B: PHÂN LOẠI Ý ĐỊNH & XÁC ĐỊNH VAI TRÒ CHÍNH (Intent Classification)]
  ├─ Xem hoặc cập nhật quy chuẩn cốt lõi dự án (Hiến pháp) ──► /speckit-constitution (.specify/memory/constitution.md)
  ├─ (Tùy chọn) Làm rõ điểm mơ hồ, biên yêu cầu, ngoại lệ ───► /speckit-clarify (.agents/skills/speckit-clarify/SKILL.md)
  ├─ Lập kế hoạch kiến trúc kỹ thuật (plan, data model, API) ─► /speckit-plan (.agents/skills/speckit-plan/SKILL.md)
  ├─ Phân rã checklist tác vụ theo thứ tự TDD ─────► /speckit-tasks (.agents/skills/speckit-tasks/SKILL.md)
  ├─ Rà soát khớp nối 3 file (spec, plan, tasks) trước khi code► /speckit-analyze (.agents/skills/speckit-analyze/SKILL.md)
  ├─ Thực thi viết code theo từng task và kiểm thử ───────────► /speckit-implement (.agents/skills/speckit-implement/SKILL.md)
  ├─ Phỏng vấn sâu / Đào bới yêu cầu / Làm sắc nét kế hoạch ──► BA (grill-with-docs / interview-me / idea-refine)
  ├─ Chuẩn hóa thuật ngữ & mô hình nghiệp vụ / GLOSSARY / ADR ─► BA (domain-modeling / documentation-and-adrs)
  ├─ Chuyển hội thoại thành đặc tả SRS & User Stories ────────► BA (to-spec / spec-driven-development)
  ├─ Phân rã spec thành vertical slices / tracer bullets ─────► BA (to-tickets / planning-and-task-breakdown)
  ├─ Lập bản đồ điều hướng công việc quy mô lớn (decision tree) ► BA (wayfinder / to-questionnaire)
  ├─ Thiết kế Deep Modules / Ousterhout seams / Tách lớp ──────► BE (codebase-design / api-and-interface-design)
  ├─ Quét mã tìm cơ hội làm sâu module & báo cáo trực quan ────► BE (improve-codebase-architecture / source-driven-development)
  ├─ Hiện thực hóa mã nguồn từ spec & tickets ────────────────► BE (implement-spec / incremental-implementation / implement)
  ├─ Chẩn đoán lỗi khó, bẫy hồi quy & feedback loop đỏ ───────► BE (diagnosing-bugs / debugging-and-error-recovery)
  ├─ Tự động hóa hướng dẫn thao tác môi trường / migration ────► BE (wizard / ci-cd-and-automation / postgres-best-practices)
  ├─ Prototype nhanh kiểm chứng state model / logic / UI ──────► FE (prototype / frontend-design / ui-ux-pro-max)
  ├─ Lập trình giao diện SPA 3 màn hình tiếp nhận ─────────────► FE (frontend-ui-engineering / code-simplification)
  ├─ TDD nâng cao (Red-Green-Refactor, test seams, contracts) ─► TESTER (tdd / test-driven-development)
  ├─ Test API / Postman / E2E Playwright / Webapp ─────────────► TESTER (api-skill / playwright-skill / webapp-testing)
  ├─ Review mã nguồn 2 trục song song (Standards vs Spec) ────► QC (code-review / spec-to-code-compliance)
  ├─ Soát Diff / Bẫy JS / Quét an toàn bảo mật ────────────────► QC (differential-review / sharp-edges / security-and-hardening)
  ├─ Phân loại & chuẩn bị briefs cho issue / PRs (State Machine)► QA (triage / git-workflow-and-versioning)
  ├─ Soạn thảo PR chất lượng cao & thiết lập Pre-commit hook ──► QA (pr / setup-pre-commit / constraint-driven-development)
  ├─ Tổ chức Retrospective sau sprint / Nghiệm thu release ────► QA (retro / shipping-and-launch / doubt-driven-development)
  ├─ Bàn giao ngữ cảnh agent / Tinh gọn hội thoại / Định tuyến ─► _shared (handoff / grill-me / writing-for-agents / ask-matt)
  └─ Báo cáo học phần BT1, BT2, BT3, Slide thuyết trình ───────► Office (officecli / officecli-docx / officecli-pptx / officecli-xlsx)
      │
      ▼
[BƯỚC C: PHÂN GIẢI ĐA Ý ĐỊNH THEO CHUỖI (Multi-Intent Pipeline Decomposition)]
  └─ Nếu Prompt yêu cầu nhiều công đoạn (VD: "bổ sung rule QT-10 rồi code và viết unit test"):
     Tự động phân rã thành Sequential Pipeline: [BA] ──► [BE] ──► [TESTER] ──► [QC]
     Mỗi chặng chỉ nạp đúng 1 skill và bàn giao artifact sạch.
      │
      ▼
[BƯỚC D: KHÓA ĐƯỜNG DẪN SKILL TUYỆT ĐỐI (Deterministic Skill Locking)]
  └─ Mở trực tiếp đúng file SKILL.md tại .agent/<Role>/<Skill>/SKILL.md
```

### Bảng Ma Trận Nhận Diện Ý Định & Định Tuyến Skill Mekong Mobile CRM

| Dấu hiệu từ khóa trong Prompt (Việt / Anh) | Vai trò | File `SKILL.md` DUY NHẤT cần nạp |
| :--- | :---: | :--- |
| Quy chuẩn cốt lõi dự án, Hiến pháp dự án, constitution, /speckit-constitution | **SPEC-KIT** | `.agents/skills/speckit-constitution/SKILL.md` (Luật tối thượng: `.specify/memory/constitution.md`) |
| Làm rõ điểm mơ hồ, hỏi thêm chi tiết, clarify spec, /speckit-clarify | **SPEC-KIT** | `.agents/skills/speckit-clarify/SKILL.md` |
| Lập kế hoạch kiến trúc kỹ thuật, plan, data model, contract, /speckit-plan | **SPEC-KIT** | `.agents/skills/speckit-plan/SKILL.md` |
| Phân rã checklist tác vụ, chia task TDD, /speckit-tasks | **SPEC-KIT** | `.agents/skills/speckit-tasks/SKILL.md` |
| Rà soát khớp nối 3 file (spec - plan - tasks) trước khi code, /speckit-analyze | **SPEC-KIT** | `.agents/skills/speckit-analyze/SKILL.md` |
| Thực thi viết code theo từng task, code TDD, /speckit-implement | **SPEC-KIT** | `.agents/skills/speckit-implement/SKILL.md` |
| Mơ hồ, chưa rõ, phỏng vấn, clarify, hỏi thêm yêu cầu | **BA** | `.agent/BA/interview-me/SKILL.md` |
| Phỏng vấn sâu, thử thách kế hoạch kèm tự động tạo ADR & GLOSSARY | **BA** | `.agent/BA/grill-with-docs/SKILL.md` |
| Chuẩn hóa mô hình nghiệp vụ, thuật ngữ miền (Ubiquitous Language), ADR | **BA** | `.agent/BA/domain-modeling/SKILL.md` |
| Chuyển đổi hội thoại thành đặc tả SRS đầy đủ danh sách User Story | **BA** | `.agent/BA/to-spec/SKILL.md` |
| Phân rã spec thành tracer-bullet vertical slices có dependency edges | **BA** | `.agent/BA/to-tickets/SKILL.md` |
| Lập bản đồ điều hướng công việc phức tạp đa session thành decision tickets | **BA** | `.agent/BA/wayfinder/SKILL.md` |
| Biến các quyết định chưa đủ dữ kiện thành phiếu câu hỏi khảo sát | **BA** | `.agent/BA/to-questionnaire/SKILL.md` |
| Tinh chỉnh ý tưởng, mở rộng tính năng mới, giới hạn phạm vi | **BA** | `.agent/BA/idea-refine/SKILL.md` |
| Viết SRS, đặc tả yêu cầu, cập nhật `docs/srs.md` | **BA** | `.agent/BA/spec-driven-development/SKILL.md` |
| Viết nhật ký thay đổi thiết kế `docs/thay-doi-thiet-ke.md`, ADR | **BA** | `.agent/BA/documentation-and-adrs/SKILL.md` |
| Đồng biên soạn tài liệu kỹ thuật, kiến trúc phân hệ L2 | **BA** | `.agent/BA/doc-coauthoring/SKILL.md` |
| Phân rã công việc Sprint, chia Task WBS, lập kế hoạch buổi học | **BA** | `.agent/BA/planning-and-task-breakdown/SKILL.md` |
| Thiết kế Deep Modules, seams, tăng leverage và locality 4 tầng | **BE** | `.agent/BE/codebase-design/SKILL.md` |
| Quét codebase tìm cơ hội làm sâu module, xuất báo cáo visual HTML | **BE** | `.agent/BE/improve-codebase-architecture/SKILL.md` |
| Hiện thực hóa mã nguồn từ kết quả đặc tả /to-spec và /to-tickets | **BE** | `.agent/BE/implement-spec/SKILL.md` |
| Chẩn đoán lỗi hóc búa và sụt giảm hiệu năng qua feedback loop đỏ | **BE** | `.agent/BE/diagnosing-bugs/SKILL.md` |
| Tạo script wizard tương tác hướng dẫn thao tác môi trường, migration | **BE** | `.agent/BE/wizard/SKILL.md` |
| Thiết kế RESTful API, Route Contract, mã lỗi HTTP/Nghiệp vụ | **BE** | `.agent/BE/api-and-interface-design/SKILL.md` |
| Viết mã Service, Repository, Controller, quy tắc nghiệp vụ QT | **BE** | `.agent/BE/incremental-implementation/SKILL.md` |
| Viết PostgreSQL DDL, schema 3NF, index, migration `migrate.js` | **BE** | `.agent/BE/postgres-best-practices/SKILL.md` |
| Chuẩn hóa code Node.js, 4 tầng phân lớp, refactor sạch | **BE** | `.agent/BE/source-driven-development/SKILL.md` |
| Fix bug backend, lỗi cú pháp, promise unhandled, lỗi kết nối DB | **BE** | `.agent/BE/debugging-and-error-recovery/SKILL.md` |
| Bảo mật dữ liệu, chống SQL Injection, che giấu stack trace 500 | **BE** | `.agent/BE/security-and-hardening/SKILL.md` |
| Giám sát hệ thống, log chuẩn cấu trúc, endpoint `/health`, `/health/db` | **BE** | `.agent/BE/observability-and-instrumentation/SKILL.md` |
| Script tự động hóa npm, cấu hình môi trường `.env`, Docker | **BE** | `.agent/BE/ci-cd-and-automation/SKILL.md` |
| Xây dựng prototype nhanh kiểm chứng logic UI, state model | **FE** | `.agent/FE/prototype/SKILL.md` |
| Thiết kế UI/UX giao diện tiếp nhận bảo hành, màu sắc, bố cục | **FE** | `.agent/FE/frontend-design/SKILL.md` + `.agent/FE/ui-ux-pro-max/SKILL.md` |
| Lập trình HTML/CSS/JS frontend, hiển thị timeline phiếu, SPA | **FE** | `.agent/FE/frontend-ui-engineering/SKILL.md` |
| Tối giản hóa code CSS/JS, loại bỏ mã thừa, tăng tính mô-đun | **FE** | `.agent/FE/code-simplification/SKILL.md` |
| Tối ưu tốc độ tải trang, caching, render form tiếp nhận nhanh | **FE** | `.agent/FE/performance-optimization/SKILL.md` |
| Test-Driven Development (Red-Green-Refactor, test seams, unit/integration) | **TESTER** | `.agent/TESTER/tdd/SKILL.md` |
| Viết Unit Test độc lập với Mock Repository (3 loại test Buổi 7) | **TESTER** | `.agent/TESTER/test-driven-development/SKILL.md` |
| Kiểm thử tích hợp API qua HTTP, Postman collections, status code | **TESTER** | `.agent/TESTER/api-skill/SKILL.md` |
| Kiểm thử tự động E2E giao diện web bằng Playwright | **TESTER** | `.agent/TESTER/playwright-skill/SKILL.md` |
| Kiểm thử thủ công trên trình duyệt qua DevTools | **TESTER** | `.agent/TESTER/browser-testing-with-devtools/SKILL.md` |
| Kiểm thử kịch bản tiếp nhận thực tế người dùng quầy | **TESTER** | `.agent/TESTER/webapp-testing/SKILL.md` |
| Review Code 2 trục song song (Standards & Fowler smells vs Spec) | **QC** | `.agent/QC/code-review/SKILL.md` |
| Đối chiếu Code với Spec (QT-01..QT-09, SRS, 100% khớp quy tắc) | **QC** | `.agent/QC/spec-to-code-compliance/SKILL.md` |
| Review Pull Request, đánh giá clean code 4 tầng phân lớp | **QC** | `.agent/QC/code-review-and-quality/SKILL.md` |
| Soát Git Diff trước khi commit, đảm bảo tính nguyên tử | **QC** | `.agent/QC/differential-review/SKILL.md` |
| Kiểm tra cấu hình mặc định, bảo vệ thông tin bí mật trong `.env` | **QC** | `.agent/QC/insecure-defaults/SKILL.md` |
| Rà soát bẫy JavaScript (async/await, prototype, closure, scope) | **QC** | `.agent/QC/sharp-edges/SKILL.md` |
| Phân tích tĩnh mã nguồn, linting, kiểm tra chất lượng code | **QC** | `.agent/QC/static-analysis/SKILL.md` |
| Mô hình đe dọa an toàn dữ liệu khách hàng và lịch sử bảo hành | **QC** | `.agent/QC/security-threat-model/SKILL.md` |
| Phân loại Issue/PR theo cỗ máy trạng thái, xác minh và tạo brief | **QA** | `.agent/QA/triage/SKILL.md` |
| Soạn thảo mô tả Pull Request (PR) chuẩn mực và chuyên nghiệp | **QA** | `.agent/QA/pr/SKILL.md` |
| Tổ chức hồi tưởng (Retrospective) đúc kết bài học sau sprint | **QA** | `.agent/QA/retro/SKILL.md` |
| Thiết lập Husky pre-commit hooks (lint, typecheck, test) | **QA** | `.agent/QA/setup-pre-commit/SKILL.md` |
| Kiểm soát tiêu chuẩn bàn giao Definition of Done, checklist CDTN1 | **QA** | `.agent/QA/constraint-driven-development/SKILL.md` |
| Thách thức giả định, tìm điểm mù trong luồng bảo hành | **QA** | `.agent/QA/doubt-driven-development/SKILL.md` |
| Chuẩn Conventional Commits, gắn tag phiên bản (v0.1, v0.2, v1.0) | **QA** | `.agent/QA/git-workflow-and-versioning/SKILL.md` |
| Đóng gói release, kiểm tra 16/16 test pass, sẵn sàng nghiệm thu | **QA** | `.agent/QA/shipping-and-launch/SKILL.md` |
| Phỏng vấn đào sâu, thử thách kế hoạch đa vai trò (General Grill) | **_shared** | `.agent/_shared/productivity/grill-me/SKILL.md` |
| Đóng gói bàn giao ngữ cảnh phiên làm việc cho agent tiếp theo | **_shared** | `.agent/_shared/productivity/handoff/SKILL.md` |
| Kỹ năng viết tài liệu, đặc tả và prompt dành cho AI Agent | **_shared** | `.agent/_shared/productivity/writing-for-agents/SKILL.md` |
| Điều phối đa sub-agents song song cho mục tiêu dài hạn | **_shared** | `.agent/_shared/productivity/chief-of-staff/SKILL.md` |
| Định tuyến nhanh tìm kiếm skill phù hợp nhất trong kho | **_shared** | `.agent/_shared/productivity/ask-matt/SKILL.md` |
| Tạo / sửa báo cáo Word (`.docx`) nộp BT1, BT2, BT3, đồ án tốt nghiệp | **Office** | `OfficeCLI-main/skills/officecli-docx/SKILL.md` |
| Tạo bảng tính Excel (`.xlsx`) ma trận RTM, số liệu thống kê test | **Office** | `OfficeCLI-main/skills/officecli-xlsx/SKILL.md` |
| Tạo slide thuyết trình PowerPoint (`.pptx`) bảo vệ Sprint / Đồ án | **Office** | `OfficeCLI-main/skills/officecli-pptx/SKILL.md` |

---

## 3. GIAO THỨC TÍCH HỢP CODEGRAPH — BỘ NHỚ KIẾN TRÚC DÀI HẠN & GIẢM 90% TOKEN

Repository đã được lập chỉ mục toàn diện tại `.codegraph/`. **CodeGraph là công cụ bắt buộc số 1** để tìm kiếm, đọc hiểu và phân tích tác động mã nguồn mà không làm tràn context window.

### 3.1. Các Lệnh CodeGraph Chuẩn Cho Dự Án L2

1. **Khám phá Kiến trúc & Logic Hàm (Thay thế hoàn toàn Grep / Read hàng loạt file):**
   - Sử dụng MCP tool `codegraph_explore` hoặc lệnh shell:
     ```powershell
     codegraph explore "TicketService calculateDueDate QT-04"
     codegraph explore "validateCreateTicket ticketRoutes"
     ```
   - Trả về mã nguồn chính xác của symbol kèm sơ đồ call path 2 chiều (caller/callee) trong **1 lượt gọi duy nhất**.
2. **Dựng Ngữ Cảnh Tinh Gọn Trước Khi Thực Hiện Task:**
   ```powershell
   codegraph context "Thêm quy tắc kiểm tra số lần bảo hành của khách hàng"
   ```
   - Tự động trích xuất đúng các controller, service, repository liên quan, giảm 90% lượng token phải đọc.
3. **Phân Tích Tác Động Trước Khi Sửa Code (`Impact Analysis`):**
   ```powershell
   codegraph impact "TicketService.createTicket"
   codegraph impact "TicketRepository.save"
   ```
   - Xác định toàn bộ các controller, route và test suite bị ảnh hưởng trước khi thực hiện chỉnh sửa, ngăn chặn 100% lỗi hồi quy (regression bugs).
4. **Khoanh Vùng Bộ Kiểm Thử Bị Ảnh Hưởng (`Affected Tests`):**
   ```powershell
   codegraph affected src/backend/services/ticketService.js
   ```
   - Xác định đúng test file cần chạy lại (ví dụ: `tests/ticket.service.test.js`) thay vì chạy mù quáng toàn bộ hệ thống.
5. **Đồng Bộ Bộ Nhớ Khi Mã Nguồn Thay Đổi (`Sync Memory`):**
   ```powershell
   codegraph sync
   ```
   - Cập nhật lại đồ thị tri thức sau khi thêm hoặc sửa các hàm, class, repository mới.

---

## 4. GIAO THỨC TÍCH HỢP CÔNG CỤ `OfficeCLI` (BÁO CÁO BT1, BT2, BT3)

Công cụ **`OfficeCLI`** (tại thư mục `Báo cáo/BT2/OfficeCLI-main` hoặc `Báo cáo/BT3/OfficeCLI-main`) là công cụ tiêu chuẩn để tạo, chỉnh sửa và thẩm định các báo cáo học phần Chuyên đề tốt nghiệp 1 theo định dạng Microsoft Office (.docx, .pptx, .xlsx).

### Quy Trình 3 Bước Chuẩn Của `OfficeCLI`:
1. **Bước 1: Tra cứu Schema & Mở Session:**
   - Tra cứu cấu trúc cú pháp: `officecli help <docx|xlsx|pptx> <element>`
   - Mở file trong bộ nhớ: `officecli open "Báo cáo/BT2/BT2_2374802010247_NGUYEN BA ANH KHOI.docx"`
2. **Bước 2: Chỉnh Sửa Hàng Loạt Bằng Batch:**
   - Dùng lệnh batch nguyên tử để chèn bảng ma trận kiểm thử, cập nhật nội dung rubric:
     ```powershell
     officecli batch "file.docx" --commands '[{"action": "insert-table", "data": [...]}]'
     ```
3. **Bước 3: Xác Thực Toàn Vẹn & Đóng Session:**
   - Kiểm tra tính hợp lệ OpenXML: `officecli validate "file.docx"`
   - Xem trước nội dung dạng text để kiểm tra không bị lỗi layout: `officecli view "file.docx" text`
   - Đóng session an toàn: `officecli close "file.docx"`

### Tiêu Chuẩn Báo Cáo Học Phần CDTN1 (Đại học Văn Lang):
- **Tài liệu Word (`.docx`):** Trang bìa chuẩn mẫu Khoa CNTT ĐH Văn Lang, Bảng phân công công việc, Ma trận truy vết yêu cầu (SRS $\rightarrow$ Use Case $\rightarrow$ Class $\rightarrow$ Test Case), Kết quả 16/16 test PASS kèm ảnh chụp minh chứng.
- **Bảng tính Excel (`.xlsx`):** Ma trận kiểm thử phần mềm (Test Matrix), phân loại 3 loại test (Luồng đúng, Giá trị biên, Dữ liệu sai / Quy tắc vi phạm).
- **Slide PowerPoint (`.pptx`):** Tỉ lệ 16:9, Action Title nêu bật thành quả từng Sprint, sơ đồ kiến trúc 4 lớp, demo wireframe giao diện.

---

## 5. LUỒNG PHÁT TRIỂN PHẦN MỀM CHUẨN DỰ ÁN MEKONG CRM (L2 SDLC WORKFLOW)

Mọi tính năng, quy tắc nghiệp vụ hoặc phản hồi điều chỉnh thiết kế từ Giảng viên đều vận hành theo quy trình 6 giai đoạn khép kín:

```text
[GIAI ĐOẠN 1: BA & QUY TẮC NGHIỆP VỤ (BUSINESS RULES)]
  ├─ Nạp: .agent/BA/interview-me -> .agent/BA/spec-driven-development -> .agent/BA/documentation-and-adrs
  ├─ Nghiệp vụ: Cập nhật docs/srs.md, ghi nhận lý do điều chỉnh vào docs/thay-doi-thiet-ke.md
  └─ Đầu ra: Đặc tả quy tắc (QT-01..QT-09), User Story (US1..US7), API Contract (docs/api-contract.md)
         │
         ▼
[GIAI ĐOẠN 2: KIẾN TRÚC & PHÂN TẦNG (ARCHITECTURE & REPOSITORY PATTERN)]
  ├─ Tra cứu CodeGraph: codegraph explore "kiến trúc 4 tầng phân lớp"
  ├─ Nạp: .agent/BA/planning-and-task-breakdown + .agent/BE/postgres-best-practices
  ├─ Ràng buộc: Đúng 4 tầng phân lớp (Controller -> Service -> Repository Interface -> DB)
  └─ Đầu ra: DDL schema.sql chuẩn 3NF, migrate.js nạp master data, danh sách task sprint
         │
         ▼
[GIAI ĐOẠN 3: BE/FE IMPLEMENTATION & TDD]
  ├─ Tra cứu CodeGraph: codegraph context "<tính năng>" & codegraph impact "<hàm sửa đổi>"
  ├─ Nạp: .agent/BE/incremental-implementation + .agent/FE/frontend-ui-engineering
  ├─ Ràng buộc:
  │    - BE: Logic nghiệp vụ chỉ nằm tại TicketService, không rò rỉ sang Controller; xử lý SLA trừ Chủ Nhật.
  │    - FE: SPA thuần tương tác đúng API Contract, hiển thị trạng thái và timeline trực quan.
  └─ Đầu ra: Source code sạch + Git commit nguyên tử theo Conventional Commits + `codegraph sync`
         │
         ▼
[GIAI ĐOẠN 4: TESTER (KIỂM THỬ KIM TỰ THÁP, ĐỦ 5 LOẠI CHUẨN BUỔI 13 & BT3)]
  ├─ Tra cứu CodeGraph: codegraph affected [danh_sách_file_sửa]
  ├─ Nạp: .agent/TESTER/test-driven-development + .agent/TESTER/api-skill + .agent/TESTER/tdd
  ├─ Ràng buộc Kim tự tháp kiểm thử (Tránh hình nón ngược):
  │    - Unit test (6–8 test): Kiểm tra hàm thuần, cô lập CSDL/mạng bằng repo giả và tiêm đồng hồ cố định.
  │    - Integration test (2–4 test): Service + PostgreSQL thật, kiểm tra lưu trữ và ràng buộc DDL.
  │    - System/API test (1–3 test): Gọi qua HTTP/Supertest kiểm tra toàn bộ luồng, status code và header.
  ├─ Ràng buộc 5 loại test BT3 (Bắt buộc đủ 5 loại, chuẩn 8 cột có kiểm tra tác dụng phụ):
  │    1. Luồng đúng (Happy Path): ≥ 1 test cho MỖI quy tắc đã hiện thực (QT-01, QT-04, QT-05, QT-06, QT-09).
  │    2. Giá trị biên (Boundary): 2 test ở đúng hai bên ranh giới (QT-05 biên ngày hết hạn, QT-04 biên ca qua Chủ Nhật).
  │    3. Dữ liệu sai (Invalid Data): 2 test kiểm tra status code (400, 409) VÀ thông báo lỗi NÊU RÕ tên trường.
  │    4. Bảo mật / Chất lượng dữ liệu: 1 test OWASP A01:2025 Broken Access Control (tài khoản không có quyền -> 403).
  │    5. Tính tái lập: 1 test chạy nạp master data / migration lần thứ hai không lỗi, không nhân đôi.
  ├─ Tự động hóa CI: Thiết lập .github/workflows/ci.yml chạy trên máy sạch GitHub Actions (Node 20, npm ci, npm test).
  └─ Đầu ra: 100% test pass bằng lệnh npm test (suite 44/44 pass) + Bảng Test Report 8 cột trong docs/test-report.md
         │
         ▼
[GIAI ĐOẠN 5: QC (KIỂM SOÁT CHẤT LƯỢNG, BẢO MẬT OWASP TOP 10:2025 & BUG LOG 7 DÒNG)]
  ├─ Nạp: .agent/QC/spec-to-code-compliance + .agent/QC/code-review-and-quality + .agent/QC/differential-review
  ├─ Tự kiểm 5 mục OWASP Top 10:2025 (Track SE):
  │    - A01 Broken Access Control: Kiểm tra phân quyền chi nhánh và vai trò, chặn sửa phiếu người khác (403/404).
  │    - A02 Security Misconfiguration: Phản hồi lỗi tuyệt đối không để lộ stack trace, tên bảng hay chuỗi kết nối.
  │    - A04 Cryptographic Failures: Mật khẩu băm an toàn (scrypt salt riêng), số điện thoại che theo QT-15.
  │    - A05 Injection: Sanitize Serial/IMEI bằng regex, 100% truy vấn CSDL dùng Parameterized Queries ($1, $2).
  │    - A07 Authentication Failures: Thiếu hoặc sai lệch 1 ký tự token phải trả về HTTP 401.
  ├─ Ghi nhận Bug Log chuẩn 7 dòng (docs/bug-log.md):
  │    - Phân loại khách quan bằng 2 câu hỏi: Critical (hỏng hệ thống / sai dữ liệu / bảo mật) -> Major -> Minor.
  │    - Đủ 7 dòng: Mã&Mức độ, Phát hiện bởi, Triệu chứng, Cách tái lập, Nguyên nhân thật, Cách sửa, Link commit.
  └─ Đầu ra: Checklist bảo mật 7 mục (docs/checklist-bao-mat.md) + Bug Log ≥ 3 bug (≥ 1 Critical/Major) có link commit thật.
         │
         ▼
[GIAI ĐOẠN 6: QA & ĐÓNG GÓI BÀN GIAO BT3 (PHÉP THỬ MÁY TRẮNG & RELEASE v1.0)]
  ├─ Nạp: .agent/QA/constraint-driven-development + .agent/QA/shipping-and-launch
  ├─ Ràng buộc 9 tiêu chí kỹ thuật BT3 (4 mục CỐT LÕI C1–C4 và 4 mục riêng SE S1–S4):
  │    - C1 (CỐT LÕI): Gói đóng gói dựng lại từ máy sạch bằng ≤ 2 lệnh theo Deployment Guide (cp .env.example .env && docker compose up -d --build).
  │    - C2 (CỐT LÕI): Test Report có 10–12 test case đủ 8 cột, đủ 5 loại kiểm thử.
  │    - C3 (CỐT LÕI): Bộ kiểm thử PASS bằng 1 lệnh; một test case ngẫu nhiên chạy lại được tại chỗ.
  │    - C4 (CỐT LÕI): Bug Log ≥ 3 bug, ≥ 1 Critical/Major, đủ 7 dòng, link commit mở được và trỏ đúng thay đổi.
  │    - C5: Deployment Guide tiếng Anh đủ 5 mục (Yêu cầu, Dựng hệ thống, Biến môi trường, Dữ liệu mẫu, Cách kiểm tra).
  │    - C6: Checklist bảo mật 7 mục đã điền đủ kèm minh chứng cụ thể.
  │    - C7: Không có secret trong repo, .env chưa từng bị commit vào lịch sử git.
  │    - C8: Chạy lại nạp dữ liệu / migration lần thứ hai không lỗi, không nhân đôi.
  │    - C9: Tài liệu kỹ thuật mô tả đúng hệ thống thật (API docs đủ 7 mục cho mọi endpoint).
  ├─ Thực hiện Phép thử máy trắng (White-box clean machine test) kiểm chứng khả năng tái lập độc lập.
  ├─ Gắn tag Git: git tag -a v1.0 -m "Bai tap 3" và git push origin v1.0 lên repo PUBLIC.
  └─ Đầu ra: Báo cáo BT3 (.docx / .pdf), Slide (.pptx), ảnh chụp minh chứng chạy thật ở mục 7 của PDF.
```

---

## 6. DANH MỤC THƯ MỤC SKILL & TÀI LIỆU THAM CHIẾU NỘI BỘ

Toàn bộ các kỹ năng được lưu trữ có cấu trúc bên dưới thư mục `.agent/`:

```text
.agent/
├── AGENTS.md                          # Bản sao đồng bộ của file điều phối này
├── AGENT_WORKFLOW_AND_ROUTER.md       # File điều phối trung tâm (Master Router)
├── GEMINI.md                          # Bản sao đồng bộ dành cho Gemini Agent
├── BA/                                # Kỹ năng dành cho Business Analyst
│   ├── doc-coauthoring/               # Đồng soạn thảo tài liệu kỹ thuật
│   ├── documentation-and-adrs/        # Viết tài liệu thiết kế và quyết định kiến trúc ADR
│   ├── domain-modeling/               # [MỚI] Xây dựng & chuẩn hóa mô hình nghiệp vụ, GLOSSARY, ADR
│   ├── grill-with-docs/               # [MỚI] Phỏng vấn sâu đào bới yêu cầu kèm lập tức ghi nhận ADR & Glossary
│   ├── idea-refine/                   # Tinh chỉnh ý tưởng & phạm vi
│   ├── interview-me/                  # Phỏng vấn làm rõ yêu cầu mập mờ
│   ├── planning-and-task-breakdown/   # Phân rã WBS và kế hoạch Sprint
│   ├── spec-driven-development/       # Phát triển hướng đặc tả (SDD / SRS)
│   ├── to-questionnaire/              # [MỚI] Chuyển quyết định còn bỏ ngỏ thành phiếu câu hỏi khảo sát
│   ├── to-spec/                       # [MỚI] Chuyển đổi hội thoại thành đặc tả SRS & User Stories
│   ├── to-tickets/                    # [MỚI] Phân rã spec thành tracer-bullet vertical slices có blocking edges
│   └── wayfinder/                     # [MỚI] Lập bản đồ điều hướng chuỗi decision tickets quy mô lớn
├── BE/                                # Kỹ năng dành cho Backend Developer (Node.js/Express)
│   ├── api-and-interface-design/      # Thiết kế RESTful API contract & mã lỗi
│   ├── ci-cd-and-automation/          # Tự động hóa npm scripts & Docker
│   ├── codebase-design/               # [MỚI] Thiết kế Deep Modules (John Ousterhout), seams, leverage & locality
│   ├── debugging-and-error-recovery/  # Gỡ lỗi runtime và xử lý Exception
│   ├── diagnosing-bugs/               # [MỚI] Chẩn đoán lỗi hóc búa & suy giảm hiệu năng qua feedback loop đỏ
│   ├── implement/                     # [MỚI] Quy trình hiện thực hóa công việc dựa trên đặc tả/ticket
│   ├── implement-spec/                # [MỚI] Hiện thực hóa chính xác kết quả đầu ra từ to-spec và to-tickets
│   ├── improve-codebase-architecture/ # [MỚI] Quét codebase tìm cơ hội làm sâu module, xuất báo cáo visual HTML
│   ├── incremental-implementation/    # Hiện thực code từng bước theo 4 tầng phân lớp
│   ├── observability-and-instrumentation/ # Health check, logger, requestId
│   ├── postgres-best-practices/       # DDL 3NF, transaction, tối ưu pg.Pool
│   ├── security-and-hardening/        # Phòng chống SQL Injection, input validation
│   ├── source-driven-development/     # Clean code, bám sát kiến trúc hiện hữu
│   └── wizard/                        # [MỚI] Sinh bash script wizard tương tác cho thao tác thủ công, migration
├── FE/                                # Kỹ năng dành cho Frontend Developer
│   ├── browser-testing-with-devtools/ # Test trực tiếp trên Chrome DevTools
│   ├── code-simplification/           # Tối giản hóa cấu trúc CSS/JS
│   ├── frontend-design/               # Thiết kế bảng màu, typography, layout
│   ├── frontend-ui-engineering/       # Xây dựng giao diện web 3 màn hình tiếp nhận
│   ├── performance-optimization/      # Tối ưu DOM render và thời gian tải
│   ├── prototype/                     # [MỚI] Xây dựng throwaway prototype kiểm chứng mô hình trạng thái & logic UI
│   ├── source-driven-development/     # Giao diện bám sát API backend
│   └── ui-ux-pro-max/                 # Chuẩn UI/UX cao cấp, design system tokens
├── QA/                                # Kỹ năng dành cho Quality Assurance
│   ├── cicd-pipeline-skill/           # Thiết lập pipeline kiểm thử liên tục
│   ├── code-review-and-quality/       # Đánh giá tiêu chuẩn code & cấu trúc repo
│   ├── constraint-driven-development/ # Kiểm soát các ràng buộc phi chức năng (NFR)
│   ├── doubt-driven-development/      # Đặt câu hỏi hoài nghi, tìm lỗ hổng logic
│   ├── git-workflow-and-versioning/   # Chuẩn Conventional Commits & Git Tagging
│   ├── pr/                            # [MỚI] Soạn thảo PR body chuẩn mực, bối cảnh, giải pháp, checklist
│   ├── retro/                         # [MỚI] Tổ chức hồi tưởng (Retrospective) sau sprint đúc kết cải tiến
│   ├── setup-pre-commit/              # [MỚI] Thiết lập Husky, lint-staged, Prettier, type checking và tests
│   └── shipping-and-launch/           # Nghiệm thu sản phẩm, bàn giao release
├── QC/                                # Kỹ năng dành cho Quality Control & Security
│   ├── code-review/                   # [MỚI] Review code 2 trục song song (Standards & Fowler smells vs Spec)
│   ├── differential-review/           # Soát xét git diff trước khi commit
│   ├── insecure-defaults/             # Rà soát cấu hình thiếu an toàn
│   ├── performance-optimization/      # Kiểm tra hiệu năng truy vấn và thuật toán SLA
│   ├── security-and-hardening/        # Quét an toàn ứng dụng web
│   ├── security-best-practices/       # Thực hành an toàn dữ liệu khách hàng
│   ├── security-threat-model/         # Phân tích mô hình đe dọa (Threat Modeling)
│   ├── sharp-edges/                   # Cảnh báo bẫy ngữ nghĩa trong JavaScript
│   ├── spec-to-code-compliance/       # Đối chiếu code với đặc tả quy tắc nghiệp vụ
│   └── static-analysis/               # Phân tích tĩnh chất lượng mã nguồn
├── TESTER/                            # Kỹ năng dành cho Tester / Automation QA
│   ├── api-skill/                     # Kiểm thử API endpoint & Postman
│   ├── browser-testing-with-devtools/ # Kiểm thử thao tác trên trình duyệt
│   ├── debugging-and-error-recovery/  # Phân tích nguyên nhân test thất bại
│   ├── playwright-skill/              # Tự động hóa kiểm thử UI bằng Playwright
│   ├── tdd/                           # [MỚI] Test-Driven Development (Red-Green-Refactor, test seams, contracts)
│   ├── test-driven-development/       # Quy trình TDD, bộ test 3 loại Buổi 7
│   └── webapp-testing/                # Kiểm thử chức năng toàn diện trên web
└── _shared/
    ├── productivity/                  # [MỚI] Kỹ năng năng suất & điều phối dùng chung
    │   ├── ask-matt/                  # Bộ định tuyến tìm skill phù hợp nhất
    │   ├── chief-of-staff/            # Điều phối sub-agents đa nhiệm cho mục tiêu dài hạn
    │   ├── claude-handoff/            # Chuyển giao công việc sang agent nền
    │   ├── grill-me/                  # Phỏng vấn đào sâu, thử thách tư duy đa vai trò
    │   ├── grilling/                  # Giao thức phỏng vấn theo frontier & design tree
    │   ├── handoff/                   # Bàn giao ngữ cảnh phiên làm việc cho sub-agent tiếp theo
    │   ├── research/                  # Nghiên cứu câu hỏi chuyên sâu từ tài liệu gốc đáng tin cậy
    │   ├── setup-matt-pocock-skills/  # Cấu hình tracker, nhãn triage, domain docs
    │   ├── teach/                     # Hướng dẫn học tập kỹ năng mới trong workspace
    │   ├── wait-what/                 # Ngắt nhịp và định hình lại thông điệp khi lệch hướng
    │   └── writing-for-agents/        # Kỹ thuật viết tài liệu kỹ thuật & prompt chuẩn cho Agent
    └── references/                    # Danh mục tài liệu tham chiếu chuẩn
        ├── accessibility-checklist.md # Checklist khả năng truy cập
        ├── definition-of-done.md      # Tiêu chí hoàn thành (DoD) buổi học / BT
        ├── observability-checklist.md # Checklist khả năng quan sát hệ thống
        ├── orchestration-patterns.md  # Mẫu phối hợp giữa các Agent
        ├── performance-checklist.md   # Checklist hiệu năng ứng dụng
        ├── security-checklist.md      # Checklist bảo mật ứng dụng
        └── testing-patterns.md        # Mẫu thiết kế bộ test 3 loại (Happy/Edge/Error)
```

## Agent skills

### Issue tracker

Issues and specs live as GitHub issues (`gh` CLI). See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context layout (`GLOSSARY.md` + `docs/adr/`). See `docs/agents/domain.md`.

---

## 7. QUY CHUẨN KIỂM THỬ & BẢO ĐẢM CHẤT LƯỢNG BUỔI 13 & BÀI TẬP 3 (PHÂN HỆ L2 SE)

Toàn bộ quy trình kiểm thử và hoàn thiện Bài tập 3 (Giai đoạn 3) của sinh viên Nguyễn Bá Anh Khôi tuân thủ nghiêm ngặt 7 trụ cột tri thức từ Buổi 13:

### 7.1. Mô Hình Kim Tự Tháp Kiểm Thử (Testing Pyramid)
- **Cấu trúc kim tự tháp (Đáy rộng - Đỉnh hẹp):**
  - **Unit Test (6–8 test):** Tập trung vào tầng Service (`ticketService.js`) và Validator. Kiểm tra logic nghiệp vụ thuần, chạy trong vài mili-giây, cô lập CSDL và mạng.
  - **Integration Test (2–4 test):** Kiểm tra tích hợp giữa Service, Repository và CSDL PostgreSQL thật (`schema.sql`, ràng buộc khoá ngoại, CHECK, UNIQUE).
  - **System / API Test (1–3 test):** Kiểm thử toàn diện qua giao diện HTTP Express bằng test runner, kiểm tra mã trạng thái, header và thân phản hồi.
- **Quy tắc cô lập phụ thuộc:**
  - Tiêm phụ thuộc (Dependency Injection): Service nhận repository và đồng hồ (`dongHo = () => new Date()`) từ bên ngoài.
  - Trong test: Dùng repo giả + đồng hồ cố định mốc thời gian để ngăn chặn triệt để hiện tượng test nhấp nháy (flaky test).
  - Tiền điều kiện dựng bằng code (`resetDb()`, `seedDemo()`), không phụ thuộc vào dữ liệu ngẫu nhiên có sẵn trên máy phát triển.

### 7.2. Chuẩn 8 Cột Của Một Test Case (Mục 2.2 Đề Bài BT3)
Mỗi test case trong `docs/test-report.md` bắt buộc phải có đầy đủ 8 cột:
1. **Mã test case:** Mã định danh duy nhất (`TC-01`, `TC-02`...) để Bug Log dễ dàng tham chiếu.
2. **Tiền điều kiện:** Trạng thái dữ liệu và hệ thống trước khi chạy test.
3. **Các bước thực hiện:** Đánh số từng bước hành động cụ thể.
4. **Dữ liệu thử cụ thể:** Giá trị đầu vào rõ ràng, không dùng giá trị chung chung.
5. **Kết quả mong đợi:** Quan sát được, đo lường được, và **phải kiểm tra cả tác dụng phụ** (ví dụ: bị từ chối 409 và CSDL KHÔNG phát sinh bản ghi mới).
6. **Mức ưu tiên:** Cao / Trung bình / Thấp.
7. **Kết quả thực tế:** Ghi nhận bằng lời cụ thể khi chạy thật.
8. **PASS / FAIL:** Khớp 100% kết quả mong đợi mới ghi PASS; kèm minh chứng lệnh chạy.

### 7.3. Hai Kỹ Thuật Chọn Dữ Liệu Thử
- **Phân vùng tương đương (Equivalence Partitioning):** Chia miền dữ liệu thành các nhóm hệ thống xử lý giống nhau; chọn 1 giá trị đại diện mỗi nhóm (Ví dụ: độ dài mô tả lỗi: < 10, 10–2000, > 2000; số điện thoại đúng 10 số vs sai định dạng).
- **Giá trị biên (Boundary Value Analysis):** Lỗi thường tập trung ở ranh giới giữa các vùng. Đặt 2 test biên ở đúng hai bên ranh giới để phát hiện lỗi sai toán tử so sánh (`<` thay vì `≤`). Ví dụ: ngày cuối bảo hành (còn hạn) vs ngày kế tiếp (hết hạn).

### 7.4. Đảm Bảo Đủ 5 Loại Test BT3 Yêu Cầu
Bộ 10–12 test case trong Test Report phải phân bố đủ 5 loại kiểm thử:
1. **Luồng đúng (Happy Path):** $\ge 1$ test cho MỖI quy tắc nghiệp vụ đã hiện thực (`QT-01`, `QT-04`, `QT-05`, `QT-06`, `QT-09`).
2. **Giá trị biên (Boundary):** 2 test ở hai bên của cùng một ranh giới (`QT-05` biên kết thúc bảo hành và `QT-04` biên ca làm việc qua Chủ Nhật).
3. **Dữ liệu sai (Invalid Data):** 2 test kiểm tra cả mã trạng thái (400, 409) VÀ nội dung thông báo lỗi nêu rõ tên trường vi phạm.
4. **Bảo mật (OWASP Top 10:2025):** 1 test kiểm tra Broken Access Control (A01) — tài khoản không có quyền bị từ chối với HTTP 403.
5. **Tính tái lập (Reproducibility):** 1 test chạy nạp dữ liệu / migration lần thứ hai không lỗi và không nhân đôi dữ liệu.

### 7.5. Tiêu Chuẩn Test Plan 4 Mục & Bug Log 7 Dòng
- **Test Plan 4 mục rút gọn (`docs/test-plan.md`):**
  1. Phạm vi: Những gì kiểm và CHỦ Ý KHÔNG KIỂM kèm lý do rõ ràng.
  2. Loại test & số lượng mỗi tầng: Kim tự tháp kiểm thử, kỹ thuật chọn dữ liệu, đủ 5 loại BT3.
  3. Tiêu chí thành công đo được: Phát biểu bằng số (`100% pass`, thời gian chạy $\le 5$s, không còn bug Critical).
  4. Môi trường & dữ liệu thử: Môi trường chạy, nguồn dữ liệu fixtures, cơ chế dựng và dọn dẹp.
- **Bug Log 7 dòng (`docs/bug-log.md`):**
  - Phân loại khách quan bằng 2 câu hỏi:
    1. *Hệ thống không dùng được, dữ liệu sai, hoặc lỗ hổng bảo mật?* $\rightarrow$ **CÓ** $\rightarrow$ **CRITICAL** (bắt buộc sửa hết).
    2. *Chức năng quan trọng sai nhưng có cách làm khác?* $\rightarrow$ **CÓ** $\rightarrow$ **MAJOR** (phải sửa hoặc nêu lý do).
    3. *Không thuộc 2 câu trên:* $\rightarrow$ **MINOR**.
  - Đủ 7 dòng: 1. Mã & Mức độ · 2. Phát hiện bởi · 3. Triệu chứng · 4. Cách tái lập · 5. Nguyên nhân thật sự (không phải triệu chứng) · 6. Cách sửa (tệp nào, hàm nào) · 7. Link commit mở được + xác nhận test PASS + hồi quy.

### 7.6. Bảng 9 Tiêu Chí Kỹ Thuật BT3 (C1–C9) & 4 Tiêu Chí Riêng SE (S1–S4)
- **Mục kiểm chứng chung:**
  - **C1 (CỐT LÕI):** Gói đóng gói dựng lại từ thư mục trống bằng $\le 2$ lệnh theo đúng Deployment Guide.
  - **C2 (CỐT LÕI):** Test Report có 10–12 test case đủ 8 cột, đủ 5 loại kiểm thử.
  - **C3 (CỐT LÕI):** Bộ kiểm thử PASS bằng 1 lệnh (`npm test`); một test case ngẫu nhiên chạy lại được tại chỗ.
  - **C4 (CỐT LÕI):** Bug Log có $\ge 3$ bug, $\ge 1$ Critical/Major, đủ 7 dòng, link commit mở được và trỏ đúng.
  - **C5:** Deployment Guide đủ 5 mục tiếng Anh, có mục "cách kiểm tra hệ thống đã chạy đúng".
  - **C6:** Checklist bảo mật 7 mục đã điền đủ kèm minh chứng cụ thể.
  - **C7:** Không có secret trong repo, và `.env` chưa từng bị commit vào lịch sử git.
  - **C8:** Chạy lại lần thứ hai (nạp dữ liệu / migration) không lỗi, không nhân đôi.
  - **C9:** Tài liệu kỹ thuật mô tả đúng hệ thống thật, không mô tả tính năng chưa có.
- **Mục kiểm chứng riêng Track SE:**
  - **S1:** API docs đủ mọi endpoint, mỗi endpoint đủ 7 mục, có ví dụ request/response THẬT.
  - **S2:** Có test kiểm quyền truy cập theo chủ sở hữu (OWASP A01) và test đó PASS.
  - **S3:** Mật khẩu trong CSDL là chuỗi băm (scrypt salt riêng), không đọc được.
  - **S4:** Thông báo lỗi hệ thống không để lộ vết ngăn xếp (stack trace), tên bảng hay chuỗi kết nối.

### 7.7. Quy Trình Phép Thử Máy Trắng (White-Box Clean Machine Test)
Quy trình chuẩn giảng viên dùng để kiểm tra độ tin cậy và tính độc lập của prototype:
```bash
# 1. Xóa sạch container và volume cũ
docker compose down -v
# 2. Clone repo theo tag v1.0 vào thư mục sạch
git clone --branch v1.0 https://github.com/Khoidep-zai/cdtn1-NguyenBaAnhKhoi-l2.git .
# 3. Thực thi đúng 2 lệnh trong Deployment Guide
cp .env.example .env
docker compose up -d --build
# 4. Kiểm tra sức khỏe dịch vụ
docker compose ps               # api và postgres phải healthy
curl -s http://localhost:3000/health
# 5. Chạy bộ kiểm thử tự động
npm test                        # Toàn bộ test case PASS 100%
```
