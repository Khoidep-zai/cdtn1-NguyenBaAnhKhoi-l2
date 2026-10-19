# AGENT SKILLS NAVIGATOR — MEKONG MOBILE CRM (L2)

**Dự án:** Chuyên đề Tốt nghiệp 1 (CDTN1 - HK1 2026–2027)  
**Tác giả:** Nguyễn Bá Anh Khôi (MSSV: 2374802010247 - Track SE)  
**Phân hệ:** L2 – Tiếp nhận và phân loại yêu cầu bảo hành (Warranty Reception & Issue Categorization)  
**Đường dẫn cấu hình trung tâm:** [.agent/AGENT_WORKFLOW_AND_ROUTER.md](file:///c:/O%20E/Chuyen%20de%201/Test/cdtn1-NguyenBaAnhKhoi-l2/src/.agent/AGENT_WORKFLOW_AND_ROUTER.md)

---

## 🧭 Bản Đồ Định Tuyến Nhanh Theo Vai Trò (Quick Skill Navigator)

| Vai trò | Mục tiêu chính | Kỹ năng cốt lõi & Mới tích hợp | Đường dẫn kích hoạt |
| :--- | :--- | :--- | :--- |
| **BA** | Làm rõ yêu cầu, phỏng vấn sâu, SRS, User Stories, ADR, WBS | `grill-with-docs` (Mới), `domain-modeling` (Mới), `to-spec` (Mới), `to-tickets` (Mới), `wayfinder` (Mới), `interview-me`, `spec-driven-development` | [BA Skills](file:///c:/O%20E/Chuyen%20de%201/Test/cdtn1-NguyenBaAnhKhoi-l2/src/.agent/BA) |
| **BE** | Hiện thực 4 tầng phân lớp, Deep Modules, chẩn đoán lỗi, DDL PostgreSQL | `codebase-design` (Mới), `improve-codebase-architecture` (Mới), `diagnosing-bugs` (Mới), `implement-spec` (Mới), `wizard` (Mới), `api-and-interface-design`, `incremental-implementation`, `postgres-best-practices` | [BE Skills](file:///c:/O%20E/Chuyen%20de%201/Test/cdtn1-NguyenBaAnhKhoi-l2/src/.agent/BE) |
| **FE** | Xây dựng giao diện web 3 màn hình tiếp nhận, prototype, SPA | `prototype` (Mới), `frontend-ui-engineering`, `frontend-design`, `ui-ux-pro-max`, `code-simplification` | [FE Skills](file:///c:/O%20E/Chuyen%20de%201/Test/cdtn1-NguyenBaAnhKhoi-l2/src/.agent/FE) |
| **TESTER** | Viết bộ kiểm thử 3 loại chuẩn Buổi 7, TDD Red-Green-Refactor | `tdd` (Mới), `test-driven-development`, `api-skill`, `playwright-skill`, `webapp-testing` | [TESTER Skills](file:///c:/O%20E/Chuyen%20de%201/Test/cdtn1-NguyenBaAnhKhoi-l2/src/.agent/TESTER) |
| **QC** | Kiểm soát tuân thủ đặc tả, review mã 2 trục (Standards vs Spec), an toàn | `code-review` (Mới), `spec-to-code-compliance`, `code-review-and-quality`, `differential-review`, `sharp-edges` | [QC Skills](file:///c:/O%20E/Chuyen%20de%201/Test/cdtn1-NguyenBaAnhKhoi-l2/src/.agent/QC) |
| **QA** | State machine triage, PR body chuẩn mực, Pre-commit hooks, Retro | `triage` (Mới), `pr` (Mới), `retro` (Mới), `setup-pre-commit` (Mới), `constraint-driven-development`, `git-workflow-and-versioning`, `shipping-and-launch` | [QA Skills](file:///c:/O%20E/Chuyen%20de%201/Test/cdtn1-NguyenBaAnhKhoi-l2/src/.agent/QA) |
| **Productivity** | Năng suất chung, phỏng vấn sâu, bàn giao ngữ cảnh, viết tài liệu cho Agent | `grill-me` (Mới), `grilling` (Mới), `handoff` (Mới), `writing-for-agents` (Mới), `research` (Mới), `ask-matt` (Mới), `chief-of-staff` (Mới) | [_shared/productivity](file:///c:/O%20E/Chuyen%20de%201/Test/cdtn1-NguyenBaAnhKhoi-l2/src/.agent/_shared/productivity) |
| **Office** | Soạn thảo và cập nhật báo cáo BT1, BT2, BT3 (.docx, .pptx, .xlsx) | `officecli-docx`, `officecli-pptx`, `officecli-xlsx` | `Báo cáo/BT2/OfficeCLI-main` |

---

## ⚡ Các Công Cụ Tăng Tốc Tối Thượng

1. **`codegraph` (Knowledge Graph / Long-term Memory):**
   - Đã được lập chỉ mục tại `.codegraph/`.
   - Tìm kiếm symbol & call path trong 1 lượt: `codegraph explore "<symbol hoặc câu hỏi>"`
   - Dựng ngữ cảnh tinh gọn: `codegraph context "<mô tả task>"`
   - Phân tích tác động trước khi sửa: `codegraph impact "<Class.Method>"`
   - Xác định bộ test cần chạy: `codegraph affected [files]`
2. **`officecli` (Office Automation Engine):**
   - Tự động hóa cập nhật file báo cáo Word/PowerPoint/Excel, bảo đảm chuẩn rubric Đại học Văn Lang.
3. **Bộ kỹ năng kỹ thuật chuẩn hoá Matt Pocock:**
   - Bộ skill công nghệ hàng đầu thế giới được tối ưu hoá theo triết lý Deep Modules (John Ousterhout), Test-Driven Development (Kent Beck), Fowler Code Smells và Zero-waste Token Architecture.
