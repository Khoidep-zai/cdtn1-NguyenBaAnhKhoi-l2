<!--
Sync Impact Report:
- Version change: 1.0.0 -> 1.1.0
- Ratification Date: 2026-10-15
- Last Amended: 2026-11-05
- Added sections:
  1. Section VII: Tiêu Chuẩn Nghiệm Thu & Đóng Gói Bài Tập 3 (Buổi 14 Workshop & BT3 Invariants)
  2. Bổ sung quy định 6 thành phần bắt buộc (TP1..TP6) và Phép thử máy trắng (White-box verification)
  3. Bổ sung quy định bắt buộc minh chứng ảnh chụp thực tế tại `docs/screenshots/`
- Deferred Items: None. All placeholders fully resolved.
-->

# Mekong Mobile CRM (Phân hệ L2) Constitution

Tài liệu Hiến pháp Dự án quy định các nguyên tắc thiết kế bất biến, tiêu chuẩn kiến trúc, quy tắc nghiệp vụ và quy trình kiểm soát chất lượng bắt buộc áp dụng cho mọi AI Agent (Gemini, Claude, Antigravity) và Kỹ sư phát triển phần mềm trong phân hệ L2 — Tiếp nhận và phân loại yêu cầu bảo hành (Mekong Mobile CRM).

---

## Core Principles

### I. Kiến Trúc Phân Lớp 4 Tầng & Phụ Thuộc Một Chiều (4-Tier Layered Architecture)
- Hệ thống MUST tuân thủ nghiêm ngặt mô hình 4 tầng phân lập theo nguyên tắc **Single-Directional Dependency**:
  1. **Lớp Trình diễn (Presentation Layer - HTML5/CSS3/Vanilla JS SPA):** Chỉ chịu trách nhiệm hiển thị giao diện, tiếp nhận tương tác người dùng và gọi API qua HTTP REST. KHÔNG chứa logic nghiệp vụ hay logic tính toán SLA.
  2. **Lớp Điều phối & Định tuyến (Controller & Middleware Layer - Express.js):** Tiếp nhận HTTP Request, kiểm tra tính hợp lệ cơ bản của dữ liệu đầu vào (format, kiểu dữ liệu), xác thực phiên/quyền hạn qua JWT/Cookie, và chuyển tiếp xuống Service. CONTROLLER TUYỆT ĐỐI KHÔNG chứa quy tắc nghiệp vụ và KHÔNG truy vấn cơ sở dữ liệu trực tiếp.
  3. **Lớp Nghiệp vụ Cốt lõi (Business Service Layer - TicketService, SLACalculator, PhoneHelper):** Nơi DUY NHẤT lưu giữ toàn bộ quy tắc nghiệp vụ (QT-01 đến QT-09), tính toán SLA, kiểm tra điều kiện bảo hành, và điều phối quy trình. Service KHÔNG được phụ thuộc vào chi tiết công nghệ lưu trữ dữ liệu (Database-agnostic).
  4. **Lớp Truy xuất Dữ liệu & Lưu trữ (Data Access & Persistence Layer - Repositories & PostgreSQL DDL):** Thực thi các thao tác CRUD và che giấu toàn bộ chi tiết câu lệnh SQL/In-memory store đằng sau Repository Interface.
- Mọi lời gọi MUST đi từ tầng trên xuống tầng dưới (Presentation $\rightarrow$ Controller $\rightarrow$ Service $\rightarrow$ Repository Interface $\rightarrow$ DB Engine). Tuyệt đối CẤM tầng dưới gọi ngược lên tầng trên.

### II. Bất Biến Quy Tắc Nghiệp Vụ Bảo Hành (Business Rules Invariants QT-01..QT-09)
Mọi dòng code phát sinh MUST tôn trọng đầy đủ các quy tắc nghiệp vụ đã được chuẩn hóa trong `docs/srs.md`:
- **QT-01 (Định danh Khách hàng duy nhất):** Số điện thoại khách hàng là khóa nghiệp vụ duy nhất (`UNIQUE phone`). Chuẩn hóa định dạng SĐT (loại bỏ khoảng trắng, dấu chấm, hỗ trợ đầu số 0x hoặc +84) trước khi tra cứu hoặc lưu trữ. Khi SĐT đã tồn tại, BẮT BUỘC tái sử dụng hồ sơ cũ, không được phép tạo bản ghi khách hàng trùng lặp.
- **QT-04 (Thuật toán Tính hạn Cam kết SLA):** Hạn hoàn tất (`due_date`) được tính tự động từ thời điểm tiếp nhận (`received_at`) theo mức ưu tiên:
  - CAO: Hoàn tất trong 24 giờ làm việc.
  - TRUNG_BÌNH: Hoàn tất trong 72 giờ làm việc.
  - THẤP: Hoàn tất trong 120 giờ làm việc.
  - **Quy tắc ngày làm việc:** Trung tâm bảo hành làm việc từ Thứ Hai đến Thứ Bảy, nghỉ Chủ Nhật. Nếu khoảng thời gian SLA cắt ngang qua ngày Chủ Nhật, hệ thống BẮT BUỘC tự động cộng dồn thêm 24 giờ của ngày Chủ Nhật vào `due_date`.
- **QT-05 (Xác minh Điều kiện Bảo hành Thiết bị):** Thiết bị còn hạn bảo hành khi: $(Ngày\_tiếp\_nhận - Ngày\_mua) \le warranty\_months$. Nếu không tra cứu được dữ liệu mua hàng từ ERP hoặc thiết bị hết hạn, phiếu MUST được đánh dấu `is_warranty = false` ("Chưa xác minh bảo hành" / "Hết hạn"), yêu cầu phê duyệt ngoại lệ của Quản lý hoặc thỏa thuận sửa dịch vụ tính phí có lưu vết.
- **QT-06 (Vòng Đời Trạng Thái Phiếu Một Chiều):** Vòng đời trạng thái của phiếu bảo hành là đồ thị có hướng nghiêm ngặt:
  $$\text{MOI} \longrightarrow \text{DA\_PHAN\_CONG} \longrightarrow \text{DANG\_XU\_LY} \longrightarrow \text{HOAN\_TAT} \longrightarrow \text{DA\_BAN\_GIAO}$$
  Trạng thái $\text{DA\_HUY}$ chỉ được chuyển từ $\text{MOI}$ hoặc $\text{DA\_PHAN\_CONG}$. TUYỆT ĐỐI CẤM chuyển trạng thái ngược chiều. Mọi bước chuyển trạng thái hợp lệ MUST tự động ghi nhật ký vào bảng `ticket_status_log` (`from_status`, `to_status`, `changed_by`, `created_at`).
- **QT-07 (Định dạng Mã Phiếu Bảo Hành):** Mã phiếu được cấp phát tự động theo định dạng chuẩn hóa `BH-xxxxxx/yyyy` (ví dụ: `BH-000001/2026`), đảm bảo tính duy nhất trên toàn hệ thống.
- **QT-09 (Định danh Thiết bị qua Serial/IMEI):** Mỗi thiết bị gắn với duy nhất 1 số Serial/IMEI. Không cho phép tồn tại nhiều hơn một phiếu bảo hành đang ở trạng thái mở (`MOI`, `DA_PHAN_CONG`, `DANG_XU_LY`) cho cùng một thiết bị.

### III. Phát Triển Theo Kiểm Thử & Kim Tự Tháp 5 Loại Test (TDD & 5-Type Test Pyramid)
- Phát triển tính năng MUST tuân theo quy trình TDD (Red-Green-Refactor): Viết test case trước $\rightarrow$ Chạy test thất bại $\rightarrow$ Viết code tối thiểu để test pass $\rightarrow$ Refactor chuẩn hóa.
- Bộ test MUST cấu trúc theo mô hình kim tự tháp và đầy đủ **5 loại test bắt buộc** theo chuẩn kiểm thử CDTN1:
  1. **Luồng Đúng (Happy Path):** Tối thiểu 1 test cho mỗi quy tắc QT-01, QT-04, QT-05, QT-06, QT-09.
  2. **Giá Trị Biên (Boundary Value):** Tối thiểu 2 test tại ranh giới (ví dụ: tạo phiếu vào sáng Thứ Bảy chạm ranh giới Chủ Nhật; thiết bị đúng ngày hết hạn bảo hành).
  3. **Dữ Liệu Sai / Vi Phạm Quy Tắc (Invalid Data):** Kiểm tra hệ thống từ chối với status code chuẩn (HTTP 400/409) VÀ thông điệp lỗi NÊU RÕ tên trường vi phạm (ví dụ: mô tả lỗi < 10 ký tự, SĐT sai định dạng).
  4. **Bảo Mật & Phân Quyền (Security & Access Control):** Kiểm tra chống truy cập trái phép OWASP Top 10 (A01:2025 Broken Access Control), chặn nhân viên thao tác ngoài phạm vi chi nhánh (HTTP 403), chặn truy cập không phiên (HTTP 401).
  5. **Tính Tái Lập & Idempotency (Repeatability):** Chạy lại script migration/seed không gây lỗi trùng lặp dữ liệu hay phá vỡ khóa ngoại.
- **Unit Test cô lập (Test Seams):** Unit test cho tầng Service và Helper MUST dùng Mock/Fake Repository, không phụ thuộc kết nối database mạng hoặc PostgreSQL thật để chạy tức thì (< 500ms).

### IV. Tuân Thủ Tuyệt Đối Đặc Tả SRS & Hợp Đồng API (Spec-Driven & Contract Compliance)
- Tài liệu `docs/srs.md` và `docs/api-contract.md` là Single Source of Truth cho toàn bộ hành vi hệ thống.
- Mã nguồn và API Endpoint phát sinh MUST trùng khớp 100% với đặc tả hợp đồng:
  - Đúng đường dẫn route, phương thức HTTP (GET, POST, PUT, PATCH).
  - Đúng cấu trúc JSON request/response body, định dạng ngày giờ ISO 8601 UTC (`YYYY-MM-DDTHH:mm:ss.sssZ`).
  - Đúng mã trạng thái HTTP (200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 500 Internal Error).
- CẤM TỰ Ý bổ sung trường dữ liệu hoặc endpoint mới mà chưa được ghi nhận trong đặc tả hoặc chưa cập nhật `docs/thay-doi-thiet-ke.md`.

### V. Bảo Mật An Toàn Phiên & Phân Quyền RBAC 3 Vai Trò (Fail-Secure & Zero Hardcoding)
- Hệ thống áp dụng kiểm soát quyền RBAC 3 vai trò:
  - `NHAN_VIEN`: Chỉ xem và thao tác trên phiếu bảo hành thuộc chi nhánh mình được gán.
  - `QUAN_LY_CHI_NHANH`: Giám sát toàn bộ phiếu và quản lý tài khoản nhân viên trong chi nhánh.
  - `QUAN_LY_HE_THONG`: Toàn quyền quản trị tài khoản, danh mục và cấu hình toàn hệ thống.
- **Fail-Secure Architecture:** Mọi endpoint bảo vệ MUST mặc định chặn truy cập nếu thiếu phiên đăng nhập hợp lệ.
- **Zero Hardcoding Credentials:** Không bao giờ lưu mật khẩu hoặc JWT Secret dạng chuỗi thô trong mã nguồn. Sử dụng hàm băm mật khẩu Scrypt kết hợp Salt ngẫu nhiên và JWT HS256 với Secret tối thiểu 32 bytes đọc từ biến môi trường `.env`. Cookie phiên phải có cờ `HttpOnly`, `SameSite=Strict`, `Path=/`.
- Che giấu toàn bộ chi tiết ngăn xếp lỗi (stack trace) phía server; phản hồi lỗi 500 chỉ trả về thông điệp chung "Lỗi máy chủ nội bộ" kèm `requestId` để truy vết qua file log.

### VI. Giao Thức Tiết Kiệm Token & Bộ Nhớ Dài Hạn CodeGraph (Zero-Waste Token & Memory)
- Khi đọc hiểu hoặc tìm kiếm mã nguồn, AI Agent MUST sử dụng `codegraph` (`codegraph_explore` hoặc lệnh `codegraph`) để truy vấn trực tiếp symbol, interface và call graph 2 chiều, KHÔNG dùng lệnh đọc hàng loạt (`NO BULK READING`) gây tràn ngữ cảnh.
- Tuân thủ nguyên tắc **Tiết lộ Tăng dần (Progressive Disclosure)**: Chỉ nạp đúng ngữ cảnh và artifact cần thiết cho công đoạn hiện tại, giải phóng ngữ cảnh cũ trước khi chuyển giao giai đoạn.

### VII. Tiêu Chuẩn Nghiệm Thu & Đóng Gói Bài Tập 3 (Buổi 14 Workshop & BT3 Invariants)
- **Đầy đủ 6 Thành phần bắt buộc:**
  1. `TP1` - Test Plan rút gọn (4 mục, có phần chủ ý không kiểm, kỹ thuật phân vùng tương đương và giá trị biên).
  2. `TP2` - Test Report (10–12 test case, đủ 8 cột, đủ 5 loại kiểm thử, có kết quả CHẠY THẬT và kiểm tra tác dụng phụ side-effects).
  3. `TP3` - Bug Log (ít nhất 3 bug, ≥ 1 Critical/Major, mỗi bug đủ 7 dòng, có link commit mở được trên GitHub public).
  4. `TP4` - Gói đóng gói chạy được bằng $\le 2$ lệnh (`cp .env.example .env` && `docker compose up -d --build`).
  5. `TP5` - Deployment Guide tiếng Anh 5 mục + Checklist bảo mật 7 mục có minh chứng thực tế.
  6. `TP6` - API Documentation tiếng Anh (mọi endpoint đủ 7 mục, có request/response JSON thật).
- **Phép Thử Máy Trắng (Clean Machine Test):** Giảng viên clone thư mục trống chạy $\le 2$ lệnh là hệ thống lên healthy, không cần hỏi sinh viên.
- **Minh chứng ảnh chụp thực tế:** Mọi test case và minh chứng chạy hệ thống MUST có ảnh chụp lưu tại `docs/screenshots/` (ví dụ `TC-01.png`..`TC-12.png`).
- **Cập nhật Nhật ký Thay đổi Thiết kế:** Mọi phản hồi từ Giảng viên ở BT2 MUST được phản hồi và ghi nhận quyết định xử lý vào `docs/thay-doi-thiet-ke.md` theo cấu trúc 4 dòng.

---

## Technology Stack & Execution Invariants

| Thành phần | Công nghệ / Thư viện chuẩn | Ràng buộc kỹ thuật |
| :--- | :--- | :--- |
| **Môi trường Runtime** | Node.js (phiên bản v20+ LTS) | Dùng ECMAScript Modules hoặc CommonJS nhất quán theo `package.json`. |
| **Framework Web Backend**| Express.js 5.x | Sử dụng router modular, middleware tập trung xử lý lỗi. |
| **Cơ sở Dữ liệu Quan hệ**| PostgreSQL 16 Alpine | DDL chuẩn hóa 3NF, khóa ngoại ràng buộc toàn vẹn, index tối ưu `phone`, `serial_no`. |
| **Thư viện Kiểm thử** | Native `node:test` + `node:assert/strict` | Chạy không cần phụ thuộc thư viện bên ngoài (Jest/Mocha), hỗ trợ `--test-concurrency=1`. |
| **Giao diện Người dùng** | HTML5 / Modern Vanilla CSS / ES6 JS | SPA tương tác không dùng framework nặng, hỗ trợ Dark Mode và Responsive. |
| **Quản lý Môi trường** | `dotenv` | Cấu hình qua `.env`, cung cấp file mẫu `.env.example`. |
| **Đóng gói Môi trường** | Docker & Docker Compose v2 | Multi-stage Dockerfile, user không đặc quyền `app`, healthcheck probes. |

---

## Quy Trình Phát Triển Chuẩn Spec-Kit 6 Giai Đoạn (Spec-Kit Pipeline)

Mọi yêu cầu thêm mới, sửa đổi tính năng hay điều chỉnh quy tắc nghiệp vụ MUST đi qua 6 bước khép kín dưới đây trước khi commit mã nguồn:

```text
[BƯỚC 1: CONSTITUTION CHECK]  ──►  /speckit-constitution  (Kiểm tra sự phù hợp với Hiến pháp dự án)
              │
              ▼
[BƯỚC 2: SPEC CLARIFICATION]  ──►  /speckit-clarify       (Làm rõ điểm mơ hồ, ngoại lệ, biên nghiệp vụ)
              │
              ▼
[BƯỚC 3: TECHNICAL PLANNING]  ──►  /speckit-plan          (Thiết kế kiến trúc, DTO, hợp đồng API, data model)
              │
              ▼
[BƯỚC 4: TASK DECOMPOSITION]  ──►  /speckit-tasks         (Phân rã công việc thành checklist chi tiết theo thứ tự TDD)
              │
              ▼
[BƯỚC 5: CROSS-CHECK ANALYSIS]──►  /speckit-analyze       (Rà soát chéo tính nhất quán giữa Spec, Plan và Tasks)
              │
              ▼
[BƯỚC 6: IMPLEMENT & VERIFY]  ──►  /speckit-implement     (Thực thi code từng task theo TDD, chạy test pass 100%)
```

- **Quy tắc chặn (Gatekeeper):** Không được nhảy cóc sang Bước 6 (Viết code) khi chưa hoàn thành Bước 3, 4 và 5.
- Khi có bất kỳ điểm mâu thuẫn giữa yêu cầu mới và Hiến pháp, nội dung Hiến pháp luôn có giá trị pháp lý cao nhất và phải được ưu tiên tuân thủ.

---

## Governance

- **Phạm vi hiệu lực:** Hiến pháp này có hiệu lực tối cao và bắt buộc tuân thủ đối với mọi tác vụ sinh mã, refactor và review code trong phân hệ L2.
- **Quy trình sửa đổi (Amendment Procedure):** 
  - Mọi đề xuất thay đổi nguyên tắc cốt lõi phải được ghi nhận rõ lý do trong `docs/thay-doi-thiet-ke.md`.
  - Cập nhật số phiên bản Hiến pháp theo Semantic Versioning:
    - **MAJOR (X.0.0):** Khi thay đổi kiến trúc cốt lõi (ví dụ: đổi mô hình 4 tầng) hoặc thay đổi lớn trong quy tắc nghiệp vụ.
    - **MINOR (1.X.0):** Khi bổ sung quy tắc nghiệp vụ mới hoặc chuẩn hóa thêm tiêu chuẩn kiểm thử (như v1.1.0 cho Buổi 14 & BT3).
    - **PATCH (1.0.X):** Khi chỉnh sửa câu chữ, làm rõ giải thích hoặc cập nhật đường dẫn tài liệu.

**Version**: 1.1.0 | **Ratified**: 2026-10-15 | **Last Amended**: 2026-11-05
