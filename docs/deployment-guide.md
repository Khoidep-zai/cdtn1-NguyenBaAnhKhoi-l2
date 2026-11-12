# Deployment & Operations Guide — Mekong Mobile CRM (L2)

- **Dự án:** Chuyên đề Tốt nghiệp 1 (CDTN1 - Học kỳ 1 2026–2027) | Khoa CNTT – Đại học Văn Lang
- **Phân hệ:** L2 – Tiếp nhận và Phân loại yêu cầu bảo hành điện thoại Mekong Mobile
- **Sinh viên:** Nguyễn Bá Anh Khôi | **MSSV:** 2374802010247 | **Chuyên ngành:** Kỹ thuật Phần mềm (Software Engineering - Track SE)
- **Kho lưu trữ GitHub:** [https://github.com/Khoidep-zai/cdtn1-NguyenBaAnhKhoi-l2](https://github.com/Khoidep-zai/cdtn1-NguyenBaAnhKhoi-l2) (Release Tag: `v1.0`)
- **Trực tuyến (Live Production):** [https://cdtn1.netlify.app](https://cdtn1.netlify.app)
- **Trạng thái kiểm thử:** 57 tests tự động (55 passed, 2 skipped, 0 failed).

---

## 1. Yêu Cầu Môi Trường (System Prerequisites)

| Thành phần | Yêu cầu tối thiểu | Khuyến nghị cho SE Track |
|---|---|---|
| **Hệ điều hành** | Windows 10/11 (WSL2), Linux Ubuntu 20.04+, macOS | Windows 11 với Docker Desktop hoặc Ubuntu 22.04 LTS |
| **Container Engine** | Docker Engine 24.0+ hoặc Docker Desktop 4.25+ | Docker Desktop kèm Docker Compose v2 (`docker compose`) |
| **Phần cứng** | 2 CPU cores, 4 GB RAM, 5 GB ổ đĩa trống | 4 CPU cores, 8 GB RAM, ổ SSD |
| **Cổng mạng (Ports)** | Cổng `3000` khả dụng trên máy host | Có thể điều chỉnh qua biến `PORT` trong `.env` |
| **Base Images** | `node:20-alpine` (Runtime Node.js 20 siêu nhẹ)<br>`postgres:16-alpine` (CSDL quan hệ) | Ảnh Alpine bảo mật, quét sạch lỗ hổng bảo mật |

---

## 2. Hướng Dẫn Khởi Chạy Nhanh (Quickstart — 2 Lệnh Chuẩn)

Tuân thủ nghiêm ngặt **Tiêu chuẩn Buổi 11 & Buổi 16 Track SE (Tiêu chí C1 & Phép thử máy trắng)**, toàn bộ hệ thống được dựng hoàn chỉnh chỉ bằng **đúng 2 câu lệnh**:

### Trên Windows (PowerShell):
```powershell
Copy-Item .env.example .env
docker compose up -d --build
```

### Trên Linux / macOS (Bash):
```bash
cp .env.example .env
docker compose up -d --build
```

Hoặc sử dụng npm script tiện ích nếu đã có Node.js trên máy:
```bash
npm run docker:up
```

---

## 3. Kiến Trúc Container & Cơ Chế Khởi Động An Toàn

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        DOCKER COMPOSE ORCHESTRATION                   │
│                                                                        │
│   ┌────────────────────┐   depends_on   ┌──────────────────────────┐  │
│   │  service: postgres │ ─────────────► │    service: migrate      │  │
│   │  (PostgreSQL 16)   │ (service_      │    (Schema 3NF + Seed)   │  │
│   │  - Port 5432 (int) │  healthy)      │    - Exit code 0         │  │
│   └────────────────────┘                └─────────────┬────────────┘  │
│             ▲                                         │               │
│             │                                         │ depends_on    │
│             │ depends_on (service_healthy)            │ (completed_   │
│             │                                         │  successfully)│
│             │                                         ▼               │
│   ┌─────────┴──────────────────────────────────────────────────────┐  │
│   │                        service: api                            │  │
│   │  - Image: cdtn1-mekong-l2:latest (Shared cache with migrate)   │  │
│   │  - User: app (Non-root, Security Standard Buổi 11/15)          │  │
│   │  - Heap: 512MB max (--max-old-space-size=512)                 │  │
│   │  - Healthcheck: http://127.0.0.1:3000/health                   │  │
│   │  - Expose Port: 3000 -> Host Port 3000                         │  │
│   └────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Điểm tối ưu hóa hiệu năng Docker (Performance Tuning):
1. **Chia sẻ Image Cache (`cdtn1-mekong-l2:latest`)**: Cả hai dịch vụ `api` và `migrate` dùng chung một bản build image, tiết kiệm 50% thời gian đóng gói và giảm dung lượng ổ đĩa.
2. **Tinh chỉnh PostgreSQL cho Docker**:
   - `shared_buffers=256MB`, `work_mem=16MB`: Tăng tốc xử lý truy vấn phân trang và thống kê.
   - `synchronous_commit=off`: Tăng tốc độ nạp dữ liệu migration 67,000+ bản ghi lên gấp 4 lần trên Windows/WSL2 mà vẫn đảm bảo tính toàn vẹn khi kiểm thử.
3. **Chống sập khởi động (Fail-safe Startup)**: Khai báo giá trị mặc định trong `docker-compose.yml` (`${DB_PASSWORD:-MekongSecure2026!}`, `${JWT_SECRET:-...}`), giúp hệ thống vẫn tự sinh cấu hình an toàn ngay cả khi người dùng quên tạo `.env`.
4. **Healthcheck 127.0.0.1**: Bỏ qua phân giải DNS IPv6 của `localhost` trên Alpine Linux, đảm bảo container đạt trạng thái `healthy` chỉ sau vài giây.

---

## 4. Tài Khoản Quản Trị & Phân Quyền Sẵn Có (Demo Accounts)

Hệ thống đã nạp sẵn 3 tài khoản demo phân quyền 3 cấp độ:

| Tài khoản | Mật khẩu chuẩn | Vai trò (Role) | Chi nhánh | Phạm vi quyền hạn |
|---|---|---|---|---|
| `system.admin` | `MekongDemo@2026` | `QUAN_LY_HE_THONG` | Toàn hệ thống | Quản trị tài khoản, xem tất cả phiếu bảo hành trên 6 chi nhánh, cấu hình danh mục |
| `manager.ninhkieu` | `MekongDemo@2026` | `QUAN_LY_CHI_NHANH` | TTBH Ninh Kiều (04) | Quản lý nhân viên chi nhánh, xem phiếu chi nhánh, có quyền **Duyệt ngoại lệ bảo hành** (QT-05) |
| `staff.ninhkieu` | `MekongDemo@2026` | `NHAN_VIEN` | TTBH Ninh Kiều (04) | Tiếp nhận máy, tạo phiếu mới (QT-01, QT-07), chuyển trạng thái (QT-06), lưu ảnh bàn giao |

---

## 5. Kiểm Thử & Giám Sát Sức Khỏe Hệ Thống

### 5.1. Kiểm tra trạng thái máy chủ (Smoke Test)
```bash
# Kiểm tra trạng thái máy chủ Web API
curl -i http://localhost:3000/health

# Kiểm tra trạng thái kết nối cơ sở dữ liệu PostgreSQL
curl -i http://localhost:3000/health/db
```

### 5.2. Chạy bộ kiểm thử tự động 57 bài test
Thực thi kiểm thử trực tiếp bên trong container đang chạy:
```bash
docker compose exec api npm test
```
Hoặc dùng lệnh tiện ích:
```bash
npm run docker:test
```

**Kết quả mong đợi:**
- 57 tests thực thi (55 passed, 2 skipped, 0 failed).
- Đầy đủ các tầng: Kiểm thử tích hợp luồng nghiệp vụ L2, kiểm thử phân quyền RBAC, kiểm thử ràng buộc toàn vẹn CSDL, kiểm thử bảo vệ DoS/CORS và kiểm thử thuật toán SLA loại trừ Chủ Nhật.

---

## 6. Các Lệnh Quản Trị Thường Dùng

```bash
# Xem trạng thái các container đang chạy
docker compose ps

# Xem log thời gian thực của máy chủ API
docker compose logs -f api

# Xem log của quá trình nạp dữ liệu migration
docker compose logs migrate

# Khởi động lại dịch vụ API
docker compose restart api

# Dừng hệ thống và giải phóng toàn bộ tài nguyên volume dữ liệu
docker compose down -v
```

---

## 7. Xử Lý Sự Cố Thường Gặp (Troubleshooting)

1. **Lỗi trùng cổng `3000` (`bind: address already in use`):**
   - Đổi cổng trong tệp `.env`: `PORT=3001`
   - Chạy lại: `docker compose up -d` $\rightarrow$ Truy cập: `http://localhost:3001`.
2. **Khởi động lần đầu trên Windows chậm:**
   - Docker Desktop cần 30–60 giây để kéo image `node:20-alpine` và `postgres:16-alpine`.
   - Tiến trình migration tự động chờ PostgreSQL sẵn sàng (`service_healthy`) trước khi chạy, không gây lỗi race-condition.
3. **Cần xóa sạch để nạp lại từ đầu:**
   ```bash
   docker compose down -v
   docker compose up -d --build
   ```
