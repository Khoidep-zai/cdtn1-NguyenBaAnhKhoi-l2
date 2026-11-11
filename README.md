# Mekong Mobile CRM — Phân hệ Tiếp nhận và Phân loại Bảo hành (L2)

**Sinh viên thực hiện:** Nguyễn Bá Anh Khôi — **MSSV:** 2374802010247  
**Chuyên ngành:** Kỹ thuật Phần mềm (Software Engineering - Track SE) | **Khoa:** Công nghệ Thông tin — Đại học Văn Lang  
**Học phần:** Chuyên đề Tốt nghiệp 1 (CDTN1 - HK1 2026–2027)  
**Phân hệ:** L2 — Tiếp nhận & Phân loại yêu cầu bảo hành điện thoại Mekong Mobile  

---

## 1. Giới thiệu Tổng quan Phân hệ L2

Phân hệ L2 là cửa ngõ nghiệp vụ tiếp nhận và phân loại bảo hành thiết bị di động trong chuỗi trung tâm bảo hành Mekong Mobile, hiện thực hóa đầy đủ các quy tắc nghiệp vụ cốt lõi:
- **QT-01 (Định danh khách hàng):** Tra cứu hồ sơ khách hàng duy nhất qua Số điện thoại, chuẩn hóa định dạng SĐT Việt Nam.
- **QT-04 (Thuật toán SLA thông minh):** Tự động tính hạn cam kết hoàn tất theo mức ưu tiên (CAO: 24h, TRUNG BÌNH: 72h, THẤP: 120h) và **tự động loại trừ ngày Chủ Nhật** khỏi thời gian làm việc.
- **QT-05 (Kiểm tra hạn bảo hành):** Đối chiếu ngày mua hàng và thời hạn bảo hành thiết bị; hỗ trợ quy trình duyệt ngoại lệ khi hết hạn.
- **QT-06 (Vòng đời trạng thái một chiều):** Quản lý nghiêm ngặt quy trình chuyển trạng thái `MOI` $\rightarrow$ `DA_PHAN_CONG` $\rightarrow$ `DANG_XU_LY` $\rightarrow$ `HOAN_TAT` $\rightarrow$ `DA_BAN_GIAO`, lưu vết lịch sử kiểm toán trong `ticket_status_log`.
- **QT-07 & QT-09 (Định danh phiếu & thiết bị):** Cấp phát mã phiếu chuẩn `BH-xxxxxx/yyyy`, kiểm soát mỗi Serial/IMEI chỉ có duy nhất một phiếu đang mở xử lý.
- **Phân quyền RBAC 3 cấp độ:** Quản lý hệ thống (`QUAN_LY_HE_THONG`), Quản lý chi nhánh (`QUAN_LY_CHI_NHANH`), và Nhân viên tiếp nhận (`NHAN_VIEN`).
- **Bảo mật giao diện & xác thực:** Mật khẩu được băm an toàn bằng thuật toán `scrypt` với muối ngẫu nhiên (salt), token phiên JWT HS256 bảo vệ qua Cookie `HttpOnly; SameSite=Strict`, trường mật khẩu trang bị nút con mắt (Eye toggle) cho phép xem lại mật khẩu đã nhập một cách an toàn.

---

## 2. Hướng dẫn Khởi chạy Bằng Docker (Phương thức Chuẩn DUY NHẤT)

Dự án tuân thủ nghiêm ngặt **Tiêu chuẩn Buổi 11 Track SE (Tiêu chí Đóng gói TP4 & Phép thử máy trắng)**. Toàn bộ hệ thống được container hóa khép kín đa tầng (Multi-tier Containerization) gồm CSDL PostgreSQL 16 Alpine, dịch vụ tự động nạp dữ liệu Migration, và máy chủ Web API / SPA.

Người chấm hoặc Giảng viên chỉ cần chạy **2 lệnh duy nhất** trong terminal:

### Bước 1: Sao chép tệp cấu hình môi trường mẫu
```bash
cp .env.example .env
```
*(Trên Windows PowerShell có thể dùng: `Copy-Item .env.example .env`)*

### Bước 2: Khởi chạy toàn bộ hệ thống bằng Docker Compose
```bash
docker compose up -d --build
```

Docker Compose sẽ tự động thực hiện tuần tự:
1. Khởi động container CSDL `postgres` (PostgreSQL 16 Alpine) và kiểm tra trạng thái sẵn sàng thông qua `healthcheck` (`pg_isready`).
2. Kích hoạt container `migrate` nạp cấu trúc bảng 3NF và dữ liệu mẫu (6 chi nhánh, 6 nhóm sự cố, 67.037 khách hàng, 7.800 thiết bị, 7.800 phiếu bảo hành và 3 tài khoản demo).
3. Khởi chạy máy chủ ứng dụng `api` (Express 5.x + Frontend SPA) với tài khoản không đặc quyền (`USER app`) và gắn cổng mạng `3000`.

### Bước 3: Truy cập ứng dụng
- **Giao diện Web tiếp nhận:** [http://localhost:3000](http://localhost:3000)
- **Kiểm tra trạng thái dịch vụ (Smoke Test):** `curl -i http://localhost:3000/health`
- **Kiểm tra kết nối CSDL PostgreSQL:** `curl -i http://localhost:3000/health/db`

### Các lệnh quản trị Docker hữu ích:
```bash
# Xem trạng thái các container đang chạy
docker compose ps

# Xem nhật ký hoạt động (logs) thời gian thực của máy chủ
docker compose logs -f api

# Dừng và xóa toàn bộ container kèm phân vùng dữ liệu
docker compose down -v
```

---

## 3. Hướng dẫn Triển khai Lên Netlify (Serverless + Neon Cloud PostgreSQL)

Mã nguồn đã được tối ưu hóa toàn diện cho kiến trúc điện toán không máy chủ (Serverless Architecture) trên nền tảng **Netlify** kết hợp cơ sở dữ liệu **Neon Serverless PostgreSQL (AWS Singapore - `ap-southeast-1`)**:

### Kiến trúc đóng gói Netlify:
- **Tập tin cấu hình:** [`netlify.toml`](netlify.toml) cấu hình runtime Node 20 (`.nvmrc`), cơ chế đóng gói `esbuild`, tự động nhúng từ điển thiết bị `dataset/**`, thiết lập bộ tiêu đề bảo mật HTTP (OWASP A01 & A05: HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).
- **Hàm Serverless:** [`netlify/functions/api.js`](netlify/functions/api.js) sử dụng `serverless-http` bọc ứng dụng Express 5, định tuyến trong suốt toàn bộ endpoint `/api/*` và `/health`.

### Các bước triển khai (Deploy steps):
1. Đẩy mã nguồn dự án lên kho lưu trữ GitHub công khai.
2. Đăng nhập trang quản trị Netlify, chọn **Add new site** $\rightarrow$ **Import an existing project** $\rightarrow$ Chọn repository GitHub của bạn.
3. Cấu hình thông số Build:
   - **Build command:** `npm run build`
   - **Publish directory:** `src/frontend`
   - **Functions directory:** `netlify/functions`
4. Cấu hình Biến môi trường (Environment Variables) trong **Site configuration** $\rightarrow$ **Environment variables**:
   - `DATABASE_URL`: Chuỗi kết nối có Connection Pool từ Neon Cloud (ví dụ: `postgresql://neondb_owner:***@ep-...-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`)
   - `JWT_SECRET`: Khóa bí mật JWT ngẫu nhiên tối thiểu 32 ký tự (ví dụ tạo bằng: `openssl rand -hex 32`)
   - `NODE_ENV`: `production`
5. Nhấp nút **Deploy site**. Sau 1-2 phút, Netlify sẽ cấp phát tên miền công khai dạng `https://<ten-ung-dung>.netlify.app`.

---

## 4. Tài khoản Đăng nhập Demo (Dành cho Giảng viên / Người chấm)

Để đảm bảo an toàn thông tin khi triển khai trên môi trường Internet công cộng (chống lộ thông tin đăng nhập theo chuẩn OWASP Top 10), giao diện người dùng **không hiển thị bất kỳ tài khoản hay mật khẩu văn bản rõ nào**.

Vui lòng sử dụng thông tin các tài khoản demo đã được nạp sẵn sau đây để đăng nhập:

| Vai trò | Tên đăng nhập | Mật khẩu mẫu | Phạm vi quyền hạn |
| :--- | :--- | :--- | :--- |
| **Quản lý hệ thống** | `system.admin` | `MekongDemo@2026` | Toàn quyền xem tất cả chi nhánh, quản trị danh mục và tài khoản nhân sự. |
| **Quản lý chi nhánh** | `manager.ninhkieu` | `MekongDemo@2026` | Quản lý phiếu và nhân viên thuộc TTBH Ninh Kiều (Chi nhánh 04). |
| **Nhân viên tiếp nhận**| `staff.ninhkieu` | `MekongDemo@2026` | Tiếp nhận, tạo phiếu và thao tác phiếu tại TTBH Ninh Kiều (Chi nhánh 04). |

*Lưu ý:* Tại ô Mật khẩu của form đăng nhập, bạn có thể nhấp vào **biểu tượng con mắt** ở góc phải để xem lại nội dung mật khẩu đã gõ.

---

## 5. Kiểm thử Tự động Toàn diện (Automated Testing Suite)

Dự án áp dụng mô hình Kim tự tháp kiểm thử 5 loại test bắt buộc theo quy định Chuyên đề Tốt nghiệp 1 (sử dụng test runner tích hợp sẵn `node:test` của Node.js, không phụ thuộc thư viện thứ ba):

```bash
npm test
```

### Kết quả kiểm thử thực tế (55/55 passed):
```text
ℹ tests 56
ℹ suites 1
ℹ pass 55
ℹ fail 0
ℹ cancelled 0
ℹ skipped 1
ℹ duration_ms ~73000ms
```

- **Luồng đúng (Happy Path):** Đầy đủ test case cho QT-01 (tra cứu khách), QT-04 (thuật toán SLA), QT-05 (hạn bảo hành), QT-06 (vòng đời trạng thái), QT-09 (ràng buộc 1 phiếu mở/thiết bị).
- **Giá trị biên (Boundary):** Kiểm thử ranh giới ca tiếp nhận Thứ Bảy qua Chủ Nhật, ranh giới ngày hết hạn bảo hành.
- **Dữ liệu sai (Invalid Data):** Kiểm tra từ chối dữ liệu thiếu trường, SĐT sai định dạng, mô tả lỗi < 10 ký tự với mã lỗi HTTP và thông báo chỉ rõ tên trường.
- **Bảo mật & Phân quyền (RBAC / OWASP A01):** Kiểm tra chặn truy cập không phiên (401), chặn nhân viên thao tác ngoài chi nhánh (403), chặn tài khoản thường nâng quyền.
- **Tính tái lập (Repeatability):** Chạy lại migration/seed an toàn, không nhân đôi bản ghi.

---

## 6. Danh mục Tài liệu Kỹ thuật Phụ trợ

Toàn bộ tài liệu đặc tả, phân tích thiết kế và kiểm thử của phân hệ L2 được lưu trữ tại thư mục [`docs/`](docs/):
- **Đặc tả & Thiết kế:** [Đặc tả yêu cầu SRS](docs/srs.md) | [Kiến trúc phân tầng](docs/architecture.md) | [Hợp đồng API chuẩn](docs/api-contract.md) | [Nhật ký thay đổi thiết kế](docs/thay-doi-thiet-ke.md)
- **Kiểm thử & Chất lượng:** [Kế hoạch kiểm thử](docs/test-plan.md) | [Báo cáo kết quả kiểm thử](docs/test-report.md) | [Nhật ký lỗi (Bug Log)](docs/bug-log.md)
- **Minh chứng nghiệm thu:** [Thư mục ảnh chụp minh chứng màn hình](docs/screenshots/)
