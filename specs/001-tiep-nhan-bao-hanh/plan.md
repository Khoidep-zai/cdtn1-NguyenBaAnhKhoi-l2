# Implementation Plan: Tiếp nhận và Phân loại Yêu cầu Bảo hành (L2)

**Branch**: `001-tiep-nhan-bao-hanh` | **Date**: 2026-11-04 | **Spec**: `specs/001-tiep-nhan-bao-hanh/spec.md`  
**Constitution**: `.specify/memory/constitution.md` (Version 1.0.0)

---

## 1. Technical Context & Architecture

### 1.1 Kiến Trúc Phân Lớp 4 Tầng (4-Tier Architecture)
- **Tầng Trình diễn (Presentation):** `src/frontend/` (SPA: `index.html`, `create-ticket.html`, `ticket-detail.html`, `js/app.js`, `css/style.css`).
- **Tầng Điều phối (Controller & Middleware):** `src/backend/controllers/` (`TicketController.js`, `CustomerController.js`, `authController.js`), `src/backend/middlewares/` (`authenticate.js`).
- **Tầng Nghiệp vụ Cốt lõi (Business Service):** `src/backend/services/` (`TicketService.js`, `SLACalculator.js`, `PhoneHelper.js`, `authService.js`).
- **Tầng Dữ liệu (Repository & Persistence):** `src/backend/repositories/` (`TicketRepository.js`, `CustomerRepository.js`), `src/backend/db/` (`schema.sql`, `migrate.js`, `ticket-integrity.sql`).

### 1.2 Technology Stack
- **Runtime**: Node.js v20+ LTS
- **Framework**: Express.js 5.x
- **Database**: PostgreSQL 15 & In-Memory runtime repository adapter
- **Testing**: Native `node:test` + `node:assert/strict`
- **Security**: Scrypt password hash + JWT HS256 (Secret >= 32 bytes) + HttpOnly cookies

---

## 2. Constitution Check (Gate Review)

| Nguyên tắc Hiến pháp | Trạng thái tuân thủ | Minh chứng thực tế |
| :--- | :---: | :--- |
| **I. 4-Tier Layered Architecture** | **PASS** | Logic nghiệp vụ (QT-01..QT-09) chỉ nằm tại `TicketService` và `SLACalculator`. Controller không query DB trực tiếp. |
| **II. Business Invariants (QT-01..09)** | **PASS** | QT-01 SĐT duy nhất, QT-04 SLA trừ Chủ Nhật, QT-05 điều kiện bảo hành, QT-06 cỗ máy trạng thái 1 chiều, QT-07 format mã phiếu, QT-09 1 phiếu mở/thiết bị. |
| **III. TDD & 5-Type Test Pyramid** | **PASS** | Bộ test 34/34 pass bằng `node:test`. Đủ 5 loại kiểm thử (Happy path, Biên SLA/Bảo hành, Dữ liệu sai, Bảo mật RBAC, Tính tái lập). |
| **IV. Spec & Contract Compliance** | **PASS** | Endpoint RESTful khớp 100% `docs/api-contract.md`. |
| **V. RBAC & Fail-Secure Security** | **PASS** | 3 Role (`NHAN_VIEN`, `QUAN_LY_CHI_NHANH`, `QUAN_LY_HE_THONG`). Chặn 401 khi thiếu phiên, 403 khi sai quyền/chi nhánh. |
| **VI. Zero-Waste Token & CodeGraph** | **PASS** | Tra cứu symbol qua CodeGraph index, không quét file bừa bãi. |

---

## 3. Data Model & Entity Contracts

- **Customer (`khach_hang`)**: `customer_id`, `name`, `phone` (UNIQUE), `address`, `created_at`.
- **Device (`thiet_bi`)**: `device_id`, `customer_id`, `product_id`, `serial_no` (UNIQUE), `purchase_date`, `warranty_months`.
- **Ticket (`phieu_bao_hanh`)**: `ticket_id`, `ticket_code` (`BH-xxxxxx/yyyy`), `device_id`, `center_id`, `issue_category_id`, `priority` (CAO, TRUNG_BÌNH, THẤP), `status` (`MOI`, `DA_PHAN_CONG`, `DANG_XU_LY`, `HOAN_TAT`, `DA_BAN_GIAO`, `DA_HUY`), `fault_description`, `is_warranty`, `received_at`, `due_date`, `assigned_technician_id`.
- **Ticket Status Log (`nhat_ky_trang_thai`)**: `log_id`, `ticket_id`, `from_status`, `to_status`, `changed_by`, `reason`, `created_at`.
