# CLAUDE.md — Mekong Mobile CRM (Phân hệ L2)
**Dự án:** Chuyên đề Tốt nghiệp 1 (CDTN1 - HK1 2026–2027) | Khoa CNTT – Đại học Văn Lang  
**Phân hệ:** L2 – Tiếp nhận và phân loại yêu cầu bảo hành (Mekong Mobile CRM)  
**Sinh viên:** Nguyễn Bá Anh Khôi | **MSSV:** 2374802010247 | **Track:** Software Engineering (SE)  
**Quy chuẩn cốt lõi (Hiến pháp):** `.specify/memory/constitution.md`

---

## 1. NGUYÊN TẮC HOẠT ĐỘNG CỦA CLAUDE TRONG DỰ ÁN (OPERATING PROTOCOL)

Khi nhận bất kỳ yêu cầu lập trình, thay đổi nghiệp vụ hoặc bổ sung tính năng nào từ người dùng, **Claude TUYỆT ĐỐI KHÔNG viết code ngay lập tức (NO PREMATURE CODING)**. Claude bắt buộc phải áp dụng quy trình **Spec-Driven Development** thông qua bộ công cụ **Spec-Kit** đã tích hợp sẵn trong repo theo 6 giai đoạn:

```text
Prompt Người Dùng (Yêu cầu tính năng / sửa lỗi / đổi quy tắc)
      │
      ▼
[GIAI ĐOẠN 1: ĐỐI CHIẾU HIẾN PHÁP] ──► /speckit-constitution
  └─ Đọc .specify/memory/constitution.md để thẩm định tính hợp lệ của yêu cầu với 6 nguyên tắc cốt lõi.
      │
      ▼
[GIAI ĐOẠN 2: LÀM RÕ ĐIỂM MƠ HỒ]    ──► /speckit-clarify (Nếu có điểm chưa rõ)
  └─ Đặt tối đa 3-5 câu hỏi trúng đích về biên dữ liệu, hành vi ngoại lệ trước khi lập kế hoạch.
      │
      ▼
[GIAI ĐOẠN 3: LẬP KẾ HOẠCH KỸ THUẬT]──► /speckit-plan
  └─ Thiết kế kiến trúc, hợp đồng API, mô hình dữ liệu (plan.md, research.md, data-model.md).
      │
      ▼
[GIAI ĐOẠN 4: PHÂN RÃ CHECKLIST]    ──► /speckit-tasks
  └─ Phân rã công việc thành checklist chi tiết theo thứ tự TDD và phụ thuộc (tasks.md).
      │
      ▼
[GIAI ĐOẠN 5: RÀ SOÁT KHỚP NỐI]      ──► /speckit-analyze
  └─ Rà soát chéo tính nhất quán giữa spec.md ↔ plan.md ↔ tasks.md ↔ constitution.md.
      │
      ▼
[GIAI ĐOẠN 6: THỰC THI VIẾT CODE]   ──► /speckit-implement
  └─ Viết code theo TDD (Red-Green-Refactor), kiểm thử từng task đến khi 100% test pass.
```

---

## 2. BỘ CÔNG CỤ SPEC-KIT VÀ CÁCH THỰC THI (SLASH COMMANDS & POWERSHELL SCRIPTS)

Trong môi trường Windows / PowerShell, Claude có thể gọi trực tiếp các lệnh script trong `.specify/scripts/powershell/` hoặc thực thi các skill tương ứng:

| Lệnh / Slash Command | Mục đích & Mô tả | Script PowerShell hỗ trợ |
| :--- | :--- | :--- |
| `/speckit-constitution` | Xem hoặc cập nhật Hiến pháp dự án tại `.specify/memory/constitution.md`. Mọi code phải tuân thủ Hiến pháp này. | `powershell -File .specify/scripts/powershell/resolve-template.ps1 constitution-template -Json` |
| `/speckit-clarify` | Phân tích spec tìm điểm mơ hồ, hỏi người dùng để chốt quyết định thiết kế. | `powershell -File .specify/scripts/powershell/check-prerequisites.ps1 -Json -PathsOnly` |
| `/speckit-plan` | Khởi tạo kế hoạch kỹ thuật, data model và API contracts cho feature. | `powershell -File .specify/scripts/powershell/setup-plan.ps1 -Json` |
| `/speckit-tasks` | Phân rã spec và plan thành danh sách task TDD chi tiết trong `tasks.md`. | `powershell -File .specify/scripts/powershell/setup-tasks.ps1 -Json` |
| `/speckit-analyze` | Rà soát chéo chất lượng giữa `spec.md`, `plan.md` và `tasks.md` (chế độ chỉ đọc). | `powershell -File .specify/scripts/powershell/check-prerequisites.ps1 -Json -RequireSpec -RequireTasks -IncludeTasks` |
| `/speckit-implement` | Triển khai mã nguồn theo từng task trong `tasks.md`, chạy test xác minh liên tục. | Chạy test: `npm test` hoặc `node --test tests/*.test.js` |

*Ghi chú:* Để tạo nhánh hoặc thư mục feature mới, chạy:
```powershell
powershell -File .specify/scripts/powershell/create-new-feature.ps1 "Tên mô tả tính năng" -ShortName "feature-name"
```

---

## 3. CÁC QUY TẮC BẤT BIẾN VỀ KIẾN TRÚC & NGHIỆP VỤ (INVARIANTS)

### 3.1. Kiến Trúc 4 Tầng Phân Lập (4-Tier Clean Architecture)
1. **Lớp Trình diễn (Presentation Layer - HTML/CSS/JS SPA):** Chỉ hiển thị và nhận event. Không chứa logic nghiệp vụ.
2. **Lớp Điều phối (Controller & Middleware - Express 5):** Tiếp nhận request, xác thực JWT/Cookie, validate format. **CẤM chứa logic nghiệp vụ, CẤM truy vấn CSDL trực tiếp**.
3. **Lớp Nghiệp vụ Cốt lõi (Business Service Layer - TicketService, SLACalculator):** **Nơi DUY NHẤT** thi hành quy tắc nghiệp vụ (QT-01..QT-09). Độc lập hoàn toàn với công nghệ lưu trữ.
4. **Lớp Truy xuất Dữ liệu (Repository Layer - PostgreSQL DDL & Adapters):** Thao tác dữ liệu, che giấu chi tiết SQL đằng sau Interface.

### 3.2. Bảng Quy Tắc Nghiệp Vụ Cốt Lõi (QT-01 Đến QT-09)
- **QT-01:** Số điện thoại khách hàng là duy nhất (`UNIQUE phone`). Tự động tải hồ sơ cũ khi SĐT đã tồn tại, không tạo trùng.
- **QT-04:** Tính hạn hoàn tất SLA (CAO: 24h, TRUNG_BÌNH: 72h, THẤP: 120h). **Nghỉ Chủ Nhật: nếu khoảng SLA cắt ngang Chủ Nhật, tự động cộng thêm 24 giờ.**
- **QT-05:** Thiết bị còn hạn khi $(Ngày\_tiếp\_nhận - Ngày\_mua) \le warranty\_months$. Không đối soát được thì `is_warranty = false`, cần quản lý duyệt ngoại lệ hoặc thỏa thuận sửa tính phí.
- **QT-06:** Vòng đời trạng thái một chiều: `MOI` $\rightarrow$ `DA_PHAN_CONG` $\rightarrow$ `DANG_XU_LY` $\rightarrow$ `HOAN_TAT` $\rightarrow$ `DA_BAN_GIAO`. Hủy (`DA_HUY`) chỉ từ `MOI` hoặc `DA_PHAN_CONG`. CẤM chuyển ngược. Tự động ghi nhật ký `ticket_status_log`.
- **QT-07:** Mã phiếu chuẩn hóa `BH-xxxxxx/yyyy` (ví dụ: `BH-000001/2026`).
- **QT-09:** Mỗi thiết bị chỉ được có tối đa 1 phiếu bảo hành đang mở (`MOI`, `DA_PHAN_CONG`, `DANG_XU_LY`).

---

## 4. TIÊU CHUẨN KIỂM THỬ (TEST STANDARDS)
- Framework kiểm thử: Native `node:test` + `node:assert/strict`.
- Lệnh chạy test nhanh:
  ```powershell
  node --test tests/smoke.test.js tests/ticket.service.test.js tests/ticket.test.js tests/ticket.validator.test.js tests/ticket.contract.test.js
  ```
- Phải đảm bảo đủ 5 loại kiểm thử: Luồng đúng, Giá trị biên, Dữ liệu sai (nêu rõ tên trường), Bảo mật OWASP A01 (RBAC), Tính tái lập.
- Unit Test cho Service phải dùng Mock Repository, chạy độc lập không cần CSDL mạng.

---

## 5. TỐI ƯU HÓA TOKEN & CODEGRAPH
- Dự án có sẵn chỉ mục `.codegraph/`.
- Khi cần tìm hiểu code, tìm symbol hay trace call graph: Dùng `codegraph explore "<symbol>"` thay vì dùng grep/find quét toàn bộ thư mục.
- Tuyệt đối không đọc toàn bộ các file cùng một lúc. Nạp ngữ cảnh tăng dần (Progressive Disclosure) theo đúng giai đoạn Spec-Kit.

