# 📱 Mekong Mobile CRM — Phân hệ Tiếp nhận và Phân loại Bảo hành (L2)

> **Học phần:** Chuyên đề Tốt nghiệp 1 (CDTN1 — HK1 2026–2027)  
> **Chuyên ngành:** Kỹ thuật Phần mềm (Software Engineering — Track SE)  
> **Khoa:** Công nghệ Thông tin — Trường Đại học Văn Lang  
> **Sinh viên thực hiện:** Nguyễn Bá Anh Khôi — **MSSV:** `2374802010247`  
> **Kho lưu trữ GitHub:** [https://github.com/Khoidep-zai/cdtn1-NguyenBaAnhKhoi-l2](https://github.com/Khoidep-zai/cdtn1-NguyenBaAnhKhoi-l2)  
> **Bản phát hành chính thức (Release):** [Tag v1.0 Production](https://github.com/Khoidep-zai/cdtn1-NguyenBaAnhKhoi-l2/releases/tag/v1.0)  

---

## 🌐 Hệ Thống Đã Triển Khai Trực Tuyến (Production Live Demo)

Hệ thống đã được đóng gói và triển khai thành công 100% trên nền tảng đám mây **Netlify Serverless** kết hợp cơ sở dữ liệu **Neon Serverless PostgreSQL (AWS Singapore — `ap-southeast-1`)**, sẵn sàng kiểm thử và chấm điểm ngay lập tức:

* 🔗 **Trang web ứng dụng (Live URL):** [https://cdtn1.netlify.app](https://cdtn1.netlify.app)
* 🩺 **Kiểm tra trạng thái máy chủ (Smoke Test):** [https://cdtn1.netlify.app/health](https://cdtn1.netlify.app/health)
* 🗄️ **Kiểm tra kết nối CSDL Cloud Neon:** [https://cdtn1.netlify.app/health/db](https://cdtn1.netlify.app/health/db)

---

## 👥 Tài Khoản Đăng Nhập Demo Sẵn Sàng (Dành Cho Giảng Viên / Người Chấm)

Để đảm bảo an toàn thông tin theo chuẩn **OWASP Top 10** (chống rò rỉ thông tin nhạy cảm), hệ thống **không hiển thị mật khẩu văn bản rõ trên giao diện**. Giảng viên có thể đăng nhập bằng các tài khoản phân quyền 3 cấp độ đã được cấu hình sẵn:

| Vai trò người dùng | Tên đăng nhập (Username) | Mật khẩu chuẩn (Password) | Phạm vi chi nhánh & Quyền hạn nghiệp vụ |
| :--- | :--- | :--- | :--- |
| **Quản lý hệ thống** | `system.admin` | `MekongDemo@2026` | Toàn quyền trên tất cả 6 chi nhánh; quản trị tài khoản nhân viên, cấu hình danh mục sự cố. |
| **Quản lý chi nhánh** | `manager.ninhkieu` | `MekongDemo@2026` | Quản lý nhân viên thuộc TTBH Ninh Kiều (Chi nhánh 04); có thẩm quyền **Duyệt ngoại lệ bảo hành** khi máy hết hạn. |
| **Nhân viên tiếp nhận** | `staff.ninhkieu` | `MekongDemo@2026` | Tiếp nhận máy, lập phiếu mới, cập nhật tiến độ xử lý và lưu ảnh bàn giao tại TTBH Ninh Kiều. |

> [!TIP]
> Trường nhập mật khẩu trên giao diện được trang bị sẵn **nút con mắt (Eye toggle)** cho phép người chấm xem lại mật khẩu đã nhập để tránh gõ nhầm.

---

## 🚀 Hướng Dẫn Khởi Chạy Nhanh Bằng Docker (2 Lệnh Chuẩn Duy Nhất)

Dự án tuân thủ nghiêm ngặt **Tiêu chuẩn Buổi 11 & Buổi 16 Track SE (Tiêu chí C1 & Phép thử máy trắng)**. Toàn bộ kiến trúc đa tầng (PostgreSQL 16 Alpine + Database Migration + Web API/SPA) được tự động dựng hoàn chỉnh chỉ với **đúng 2 câu lệnh**:

### Bước 1: Tạo tệp cấu hình môi trường từ mẫu
- **Trên Windows PowerShell:**
  ```powershell
  Copy-Item .env.example .env
  ```
- **Trên Linux / macOS (Bash):**
  ```bash
  cp .env.example .env
  ```

### Bước 2: Khởi chạy toàn bộ hệ thống bằng Docker Compose
```bash
docker compose up -d --build
```
*(Nếu đã cài sẵn Node.js trên máy, bạn cũng có thể chạy lệnh rút gọn: `npm run docker:up`)*

---

### Quá trình khởi động diễn ra tự động như thế nào?
1. **Khởi động CSDL PostgreSQL 16 Alpine (`postgres`)**: Kích hoạt bộ đệm tối ưu hóa (`shared_buffers=256MB`, `synchronous_commit=off`), tự động chạy healthcheck `pg_isready` định kỳ mỗi 3 giây.
2. **Kích hoạt Migration tự động (`migrate`)**: Đợi PostgreSQL đạt trạng thái `healthy`, nạp cấu trúc bảng quan hệ 3NF chuẩn, 13 indexes, và nạp trọn bộ dữ liệu thực tế (6 chi nhánh, 6 nhóm sự cố, 320 sản phẩm, 67.037 khách hàng, 7.800 phiếu bảo hành và 3 tài khoản demo).
3. **Khởi chạy Web API & Frontend SPA (`api`)**: Sử dụng image đã build được cache dùng chung (`cdtn1-mekong-l2:latest`), chạy với tài khoản bảo mật không đặc quyền (`USER app`) và gắn cổng mạng `3000`.

---

### Truy Cập Ứng Dụng Cục Bộ
- 🌐 **Giao diện Web tiếp nhận:** [http://localhost:3000](http://localhost:3000)
- 🩺 **Kiểm tra trạng thái máy chủ (Smoke Test):** `curl -i http://localhost:3000/health`
- 🗄️ **Kiểm tra kết nối CSDL PostgreSQL:** `curl -i http://localhost:3000/health/db`

### Các lệnh quản trị Docker tiện ích:
```bash
# Xem trạng thái các container đang chạy (phải có trạng thái healthy)
docker compose ps

# Xem nhật ký hoạt động (logs) thời gian thực của máy chủ API
docker compose logs -f api

# Chạy toàn bộ 57 bài test tự động ngay bên trong container
docker compose exec api npm test

# Dừng và giải phóng toàn bộ tài nguyên volume dữ liệu
docker compose down -v
```

---

## 🎯 1. Tổng Quan Nghiệp Vụ Phân Hệ L2 (Core Business Rules)

Phân hệ L2 là cửa ngõ nghiệp vụ tiếp nhận và phân loại bảo hành thiết bị di động trong chuỗi trung tâm bảo hành Mekong Mobile, hiện thực hóa đầy đủ các quy tắc cốt lõi:

* **QT-01 (Định danh khách hàng):** Tra cứu hồ sơ khách hàng duy nhất qua Số điện thoại; tự động chuẩn hóa định dạng SĐT Việt Nam (10 chữ số). Nếu chưa tồn tại, hệ thống hỗ trợ đăng ký nhanh ngay tại màn hình tiếp nhận.
* **QT-04 (Thuật toán SLA thông minh):** Tự động tính hạn cam kết hoàn tất (`due_date`) theo mức độ ưu tiên:
  - Mức **CAO:** 24 giờ
  - Mức **TRUNG BÌNH:** 72 giờ
  - Mức **THẤP:** 120 giờ  
  > [!IMPORTANT]
  > Thuật toán **tự động loại trừ ngày Chủ Nhật** khỏi thời gian làm việc của trung tâm bảo hành.
* **QT-05 (Kiểm tra điều kiện bảo hành & Duyệt ngoại lệ):** Đối chiếu ngày mua hàng và thời hạn bảo hành đến thời điểm cuối cùng `23:59:59.999Z` của ngày hết hạn. Đối với thiết bị đã hết hạn bảo hành, chỉ có **Quản lý chi nhánh** mới có quyền bấm duyệt ngoại lệ kèm lý do chính đáng.
* **QT-06 (Vòng đời trạng thái một chiều nghiêm ngặt):** Quản lý tiến trình xử lý qua 6 trạng thái kế thừa:  
  $$\text{MOI} \longrightarrow \text{DA\_PHAN\_CONG} \longrightarrow \text{DANG\_XU\_LY} \longrightarrow \text{CHO\_LINH\_KIEN} \longrightarrow \text{HOAN\_TAT} \longrightarrow \text{DA\_BAN\_GIAO}$$  
  Mọi lần chuyển trạng thái đều được ghi vết kiểm toán (Audit Log) vào bảng `ticket_status_log` với người cập nhật, thời điểm và ghi chú.
* **QT-07 & QT-09 (Định danh phiếu & Kiểm soát thiết bị):** Tự sinh mã phiếu bảo hành chuẩn `BH-xxxxxx/yyyy`. Cưỡng chế quy tắc: Mỗi số Serial/IMEI chỉ được phép có duy nhất **một phiếu bảo hành đang mở** trong toàn hệ thống.
* **Lưu trữ dữ liệu bền vững 100% (Full Data Persistence):** Toàn bộ dữ liệu phiếu mới tạo, thay đổi trạng thái và ảnh bàn giao được lưu trực tiếp vào CSDL PostgreSQL 16 / Neon Cloud, tuyệt đối không bị mất mát khi khởi động lại máy chủ.

---

## 🏗️ 2. Kiến Trúc Kỹ Thuật Đa Tầng (Technical Architecture)

```text
               ┌────────────────────────────────────────────────────────┐
               │             TRÌNH DUYỆT NGƯỜI DÙNG                     │
               │  - Giao diện Single Page Application (SPA)             │
               │  - Responsive Glassmorphism Design, Eye Toggle         │
               │  - Tra cứu khách hàng theo SĐT (AJAX / Fetch API)      │
               └──────────────────────────┬─────────────────────────────┘
                                          │ HTTP / RESTful API (Port 3000)
                                          ▼
               ┌────────────────────────────────────────────────────────┐
               │         BACKEND WEB API SERVER (Node.js 20)            │
               │  - Framework: Express.js 5.x                           │
               │  - Xác thực: scrypt hash (salt ngẫu nhiên) + JWT       │
               │  - Session: Cookie HttpOnly; SameSite=Strict           │
               │  - Middleware: CORS, Request Rate-limit, Global Error  │
               └──────────────────────────┬─────────────────────────────┘
                                          │ Connection Pool (pg.Pool)
                                          ▼
               ┌────────────────────────────────────────────────────────┐
               │          CƠ SỞ DỮ LIỆU POSTGRESQL 16                   │
               │  - Chuẩn hóa 3NF: service_center, issue_category,      │
               │    customer, device, ticket, ticket_status_log,        │
               │    handover_photo, app_user                            │
               │  - 13 Chỉ mục hiệu năng cao (B-Tree Indexes)           │
               │  - Hỗ trợ Docker cục bộ & Neon Serverless Cloud        │
               └────────────────────────────────────────────────────────┘
```

---

## 📡 3. Danh Sách RESTful API Endpoints

Hệ thống cung cấp đầy đủ các API theo chuẩn RESTful JSON, có xác thực bảo mật và phân quyền vai trò:

### A. Xác thực & Quản trị tài khoản (`/api/auth`)
| Phương thức | Đường dẫn API | Quyền hạn | Chức năng |
|:---:|:---|:---:|:---|
| `POST` | `/api/auth/login` | Public | Đăng nhập bằng username/password, cấp phát JWT qua Cookie HttpOnly |
| `GET` | `/api/auth/me` | Authenticated | Lấy thông tin tài khoản hiện tại, vai trò và chi nhánh công tác |
| `POST` | `/api/auth/logout` | Authenticated | Đăng xuất và xóa phiên Cookie |
| `GET` | `/api/auth/users` | Admin | Lấy danh sách tài khoản người dùng trong hệ thống |
| `POST` | `/api/auth/users` | Admin | Khởi tạo tài khoản nhân sự mới |
| `PATCH` | `/api/auth/profile` | Authenticated | Tự cập nhật họ tên và mật khẩu cá nhân |

### B. Tiếp nhận & Xử lý phiếu bảo hành (`/api/tickets`)
| Phương thức | Đường dẫn API | Quyền hạn | Chức năng |
|:---:|:---|:---:|:---|
| `GET` | `/api/tickets` | Staff / Manager / Admin | Lấy danh sách phiếu (hỗ trợ lọc theo trung tâm, trạng thái, phân trang) |
| `POST` | `/api/tickets` | Staff / Manager / Admin | Lập phiếu bảo hành mới (kiểm tra bảo hành, tính SLA, gán mã phiếu) |
| `GET` | `/api/tickets/:code` | Staff / Manager / Admin | Xem chi tiết phiếu bảo hành và toàn bộ lịch sử chuyển trạng thái |
| `PATCH` | `/api/tickets/:code/status` | Staff / Manager / Admin | Cập nhật trạng thái phiếu theo chu trình một chiều (QT-06) |
| `PATCH` | `/api/tickets/:code/warranty-exception` | Manager / Admin | Duyệt ngoại lệ bảo hành cho máy quá hạn (QT-05) |
| `PUT` | `/api/tickets/:code/handover-photo` | Staff / Manager / Admin | Lưu trữ ảnh chụp bàn giao máy cho khách |

### C. Khách hàng & Danh mục Master Data
| Phương thức | Đường dẫn API | Quyền hạn | Chức năng |
|:---:|:---|:---:|:---|
| `GET` | `/api/customers` | Authenticated | Tra cứu khách hàng theo số điện thoại (QT-01) |
| `POST` | `/api/customers` | Authenticated | Đăng ký nhanh hồ sơ khách hàng mới |
| `GET` | `/api/centers` | Authenticated | Lấy danh sách 6 trung tâm bảo hành Mekong Mobile |
| `GET` | `/api/categories` | Authenticated | Lấy danh mục 6 nhóm sự cố phân loại |
| `GET` | `/api/products` | Authenticated | Tra cứu từ điển 320 thiết bị điện thoại |

---

## 🧪 4. Kiểm Thử Tự Động (Automated Testing)

Hệ thống tích hợp sẵn bộ kiểm thử toàn diện gồm **57 bài test** được tổ chức thành 16 test suites độc lập:

```bash
# Chạy toàn bộ test suites cục bộ
npm test

# Chạy test bên trong Docker container đang hoạt động
docker compose exec api npm test
```

### Kết quả nghiệm thu thực tế:
```text
ℹ tests 57
ℹ suites 1
ℹ pass 55
ℹ fail 0
ℹ cancelled 0
ℹ skipped 2
ℹ duration_ms ~84s
```
* **Các ca kiểm thử bao phủ:**
  - Kiểm thử đơn vị (Unit Tests): `ticket.validator.test.js`, `auth.service.test.js`, `slaHelper`.
  - Kiểm thử hợp đồng API (Contract Tests): `ticket.contract.test.js`.
  - Kiểm thử toàn vẹn CSDL (Integrity Tests): `ticket.integrity.pg.test.js`, `ticket.persistence.test.js`.
  - Kiểm thử phân quyền RBAC: `auth.integration.test.js`.
  - Kiểm thử tích hợp trọn vẹn quy trình L2: `ticket.test.js`.
  - Kiểm thử an toàn DoS & Bảo mật: `data-state-security.test.js`, `error-safety.test.js`, `cors.test.js`.

---

## 🛠️ 5. Hướng Dẫn Xử Lý Sự Cố (Troubleshooting)

1. **Xung đột cổng `3000`:**
   Nếu máy của bạn đang có ứng dụng khác chiếm dụng cổng 3000, hãy mở tệp `.env` và đổi thành:
   ```env
   PORT=3001
   ```
   Sau đó chạy lại `docker compose up -d`. Bạn sẽ truy cập ứng dụng qua: `http://localhost:3001`.

2. **Khởi tạo lại sạch từ đầu (Reset Database):**
   Nếu muốn xóa toàn bộ CSDL và để dịch vụ migration nạp lại từ đầu:
   ```bash
   docker compose down -v
   docker compose up -d --build
   ```

3. **Xem logs chi tiết khi cần gỡ lỗi:**
   ```bash
   docker compose logs -f api
   ```

---

## 📋 6. Cam Kết Liêm Chính Học Thuật

Em xin cam đoan toàn bộ mã nguồn phân hệ L2 và tài liệu kỹ thuật đi kèm là kết quả học tập và nghiên cứu độc lập của bản thân sinh viên **Nguyễn Bá Anh Khôi (MSSV: 2374802010247)** dưới sự hướng dẫn của Quý Giảng viên Học phần Chuyên đề Tốt nghiệp 1. Toàn bộ các công cụ hỗ trợ AI đã được công khai minh bạch trong tệp [`docs/ai-disclosure.md`](docs/ai-disclosure.md) theo đúng quy định của Khoa Công nghệ Thông tin — Trường Đại học Văn Lang.

---
*Bản quyền © 2026–2027 Nguyễn Bá Anh Khôi — Khoa CNTT — Đại học Văn Lang.*
