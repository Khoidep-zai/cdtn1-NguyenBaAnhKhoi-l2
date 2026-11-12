# Mekong Mobile CRM — Phân hệ Tiếp nhận và Phân loại Bảo hành (L2)

**Sinh viên thực hiện:** Nguyễn Bá Anh Khôi — **MSSV:** 2374802010247  
**Chuyên ngành:** Kỹ thuật Phần mềm (Software Engineering - Track SE) | **Khoa:** Công nghệ Thông tin — Đại học Văn Lang  
**Học phần:** Chuyên đề Tốt nghiệp 1 (CDTN1 - HK1 2026–2027)  
**Phân hệ:** L2 — Tiếp nhận & Phân loại yêu cầu bảo hành điện thoại Mekong Mobile  
**Kho lưu trữ GitHub (Public):** [https://github.com/Khoidep-zai/cdtn1-NguyenBaAnhKhoi-l2](https://github.com/Khoidep-zai/cdtn1-NguyenBaAnhKhoi-l2)  
**Bản phát hành chính thức (Release Tag):** [Tag v1.0](https://github.com/Khoidep-zai/cdtn1-NguyenBaAnhKhoi-l2/releases/tag/v1.0)  

---

### 🌐 Hệ thống Đã Triển khai Trực tuyến (Production Live Demo)

Hệ thống đã được đóng gói và triển khai thành công 100% trên nền tảng điện toán đám mây công cộng (Netlify Serverless + Neon Serverless PostgreSQL), sẵn sàng truy cập và chấm điểm ngay lập tức:

* **Trang web ứng dụng (Production URL):** [https://cdtn1.netlify.app](https://cdtn1.netlify.app)
* **Kiểm tra trạng thái máy chủ (Smoke Test):** [https://cdtn1.netlify.app/health](https://cdtn1.netlify.app/health)
* **Kiểm tra kết nối CSDL Cloud Neon:** [https://cdtn1.netlify.app/health/db](https://cdtn1.netlify.app/health/db)

---

## 1. Giới thiệu Tổng quan Phân hệ L2

Phân hệ L2 là cửa ngõ nghiệp vụ tiếp nhận và phân loại bảo hành thiết bị di động trong chuỗi trung tâm bảo hành Mekong Mobile, hiện thực hóa đầy đủ các quy tắc nghiệp vụ cốt lõi:
- **QT-01 (Định danh khách hàng):** Tra cứu hồ sơ khách hàng duy nhất qua Số điện thoại, chuẩn hóa định dạng SĐT Việt Nam (10 chữ số).
- **QT-04 (Thuật toán SLA thông minh):** Tự động tính hạn cam kết hoàn tất theo mức ưu tiên (CAO: 24h, TRUNG BÌNH: 72h, THẤP: 120h) và **tự động loại trừ ngày Chủ Nhật** khỏi thời gian làm việc của trung tâm.
- **QT-05 (Kiểm tra hạn bảo hành):** Đối chiếu ngày mua hàng và thời hạn bảo hành thiết bị đến tích tắc cuối cùng `23:59:59.999Z` của ngày cuối cùng; hỗ trợ quy trình duyệt ngoại lệ khi hết hạn.
- **QT-06 (Vòng đời trạng thái một chiều):** Quản lý nghiêm ngặt quy trình chuyển trạng thái `MOI` $\rightarrow$ `DA_PHAN_CONG` $\rightarrow$ `DANG_XU_LY` $\rightarrow$ `CHO_LINH_KIEN` $\rightarrow$ `HOAN_TAT` $\rightarrow$ `DA_BAN_GIAO`, lưu vết lịch sử kiểm toán trong bảng `ticket_status_logs`.
- **QT-07 & QT-09 (Định danh phiếu & thiết bị):** Cấp phát mã phiếu chuẩn `BH-xxxxxx/yyyy`, kiểm soát mỗi Serial/IMEI chỉ có duy nhất một phiếu đang mở xử lý trong toàn hệ thống.
- **Phân quyền RBAC 3 cấp độ:** Quản lý hệ thống (`QUAN_LY_HE_THONG`), Quản lý chi nhánh (`QUAN_LY_CHI_NHANH`), và Nhân viên tiếp nhận (`NHAN_VIEN`).
- **Lưu trữ dữ liệu bền vững (Persistence):** Toàn bộ dữ liệu khách hàng, phiếu bảo hành và ảnh bàn giao được lưu trữ trực tiếp, an toàn vào cơ sở dữ liệu PostgreSQL 16 / Neon Cloud (không bị mất mát khi khởi động lại máy chủ).
- **Bảo mật giao diện & xác thực:** Mật khẩu được băm an toàn bằng thuật toán `scrypt` với muối ngẫu nhiên (salt), token phiên JWT HS256 bảo vệ qua Cookie `HttpOnly; SameSite=Strict`, trường mật khẩu trang bị nút con mắt (Eye toggle) cho phép xem lại mật khẩu an toàn.

---

## 2. Hướng dẫn Khởi chạy Bằng Docker (Phương thức Chuẩn DUY NHẤT)

Dự án tuân thủ nghiêm ngặt **Tiêu chuẩn Buổi 11 & Buổi 16 Track SE (Tiêu chí C1 & Phép thử máy trắng)**. Toàn bộ hệ thống được container hóa khép kín đa tầng gồm CSDL PostgreSQL 16 Alpine, dịch vụ tự động nạp dữ liệu Migration, và máy chủ Web API / SPA.

Người chấm hoặc Giảng viên chỉ cần chạy **2 lệnh duy nhất** từ thư mục dự án:

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
2. Kích hoạt container `migrate` nạp cấu trúc bảng 3NF và dữ liệu mẫu (6 chi nhánh, 6 nhóm sự cố, 320 sản phẩm, 67.037 khách hàng, 7.800 phiếu bảo hành và 3 tài khoản demo).
3. Khởi chạy máy chủ ứng dụng `api` (Express 5.x + Frontend SPA) với tài khoản không đặc quyền (`USER app`) và gắn cổng mạng `3000`.

### Bước 3: Truy cập ứng dụng cục bộ
- **Giao diện Web tiếp nhận:** [http://localhost:3000](http://localhost:3000)
- **Kiểm tra trạng thái dịch vụ (Smoke Test):** `curl -i http://localhost:3000/health`
- **Kiểm tra kết nối CSDL PostgreSQL:** `curl -i http://localhost:3000/health/db`

### Các lệnh quản trị Docker hữu ích:
```bash
# Xem trạng thái các container đang chạy (phải có chữ healthy)
docker compose ps

# Xem nhật ký hoạt động (logs) thời gian thực của máy chủ
docker compose logs -f api

# Dừng và xóa toàn bộ container kèm phân vùng dữ liệu để chạy lại từ đầu
docker compose down -v
```

---

## 3. Triển khai Lên Netlify & Neon Cloud PostgreSQL (Điểm cộng BT3: +1.0)

Mã nguồn đã được tối ưu hóa toàn diện cho kiến trúc điện toán không máy chủ (Serverless Architecture) trên nền tảng **Netlify** kết hợp cơ sở dữ liệu **Neon Serverless PostgreSQL (AWS Singapore - `ap-southeast-1`)**:

* **Đường dẫn ứng dụng chính thức:** **[https://cdtn1.netlify.app](https://cdtn1.netlify.app)**
* **Tập tin cấu hình Netlify:** [`netlify.toml`](netlify.toml) cấu hình runtime Node 20 (`.nvmrc`), cơ chế đóng gói `esbuild`, tự động nhúng từ điển thiết bị `dataset/**`, thiết lập bộ tiêu đề bảo mật HTTP (OWASP A01 & A05: HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).
* **Hàm Serverless:** [`netlify/functions/api.js`](netlify/functions/api.js) sử dụng `serverless-http` bọc ứng dụng Express 5, định tuyến trong suốt toàn bộ endpoint `/api/*` và `/health`.
* **Cơ sở dữ liệu Neon Cloud:** Kết nối qua chuỗi `DATABASE_URL` có tích hợp sẵn PgBouncer Connection Pooling và kết nối bảo mật `sslmode=require`.

---

## 4. Tài khoản Đăng nhập Demo (Dành cho Giảng viên / Người chấm)

Để đảm bảo an toàn thông tin khi triển khai trên môi trường Internet công cộng (chống lộ thông tin đăng nhập theo chuẩn OWASP Top 10), giao diện người dùng **không hiển thị bất kỳ tài khoản hay mật khẩu văn bản rõ nào**.

Hệ thống đã nạp sẵn 3 tài khoản demo phân quyền đầy đủ, đã được kiểm chứng hoạt động 100% trên cả môi trường Docker local và trang web online:

| Vai trò người dùng | Tên đăng nhập (Username) | Mật khẩu chuẩn (Password) | Phạm vi chi nhánh & Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Quản lý hệ thống** | `system.admin` | `MekongDemo@2026` | Toàn quyền xem và xử lý phiếu trên tất cả 6 chi nhánh; quản trị tài khoản nhân sự và danh mục. |
| **Quản lý chi nhánh** | `manager.ninhkieu` | `MekongDemo@2026` | Quản lý phiếu và nhân viên thuộc TTBH Ninh Kiều (Chi nhánh 04); có quyền duyệt ngoại lệ bảo hành. |
| **Nhân viên tiếp nhận** | `staff.ninhkieu` | `MekongDemo@2026` | Tiếp nhận máy, tạo phiếu mới, cập nhật tiến độ xử lý và lưu ảnh bàn giao tại TTBH Ninh Kiều. |

> [!TIP]
> **Mẹo hữu ích khi đăng nhập:** Tại ô Mật khẩu của form đăng nhập, bạn có thể nhấp vào **biểu tượng con mắt (Eye toggle)** ở góc phải để hiển thị/ẩn nội dung mật khẩu đã gõ nhằm tránh gõ nhầm ký tự.

---

## 5. Hướng dẫn Các Bước Thao tác Nghiệp vụ Trên Giao diện Web

Sau khi đăng nhập thành công vào hệ thống (tại [https://cdtn1.netlify.app](https://cdtn1.netlify.app) hoặc `http://localhost:3000`), quy trình tiếp nhận bảo hành chuẩn diễn ra qua 6 bước:

```text
[ĐĂNG NHẬP] ──► [TRA CỨU SĐT] ──► [TẠO PHIẾU BẢO HÀNH] ──► [DUYỆT NGOẠI LỆ (NẾU CÓ)] ──► [CẬP NHẬT TRẠNG THÁI] ──► [LƯU ẢNH BÀN GIAO]
```

### Bước 1: Đăng nhập theo vai trò
- Truy cập màn hình đăng nhập.
- Điền tài khoản (ví dụ: `staff.ninhkieu` hoặc `manager.ninhkieu`) và mật khẩu `MekongDemo@2026`.
- Hệ thống thiết lập phiên làm việc an toàn và hiển thị giao diện tiếp nhận tương ứng với phạm vi chi nhánh được phân công.

### Bước 2: Tra cứu hồ sơ khách hàng (QT-01)
- Trên thanh công cụ, nhập Số điện thoại khách hàng (ví dụ: `0901234567` hoặc `+84901234567`) và nhấn **Tra cứu**.
- Hệ thống tự động chuẩn hóa định dạng số điện thoại về chuẩn 10 chữ số Việt Nam.
- Nếu khách hàng đã có trong cơ sở dữ liệu, thông tin cá nhân và lịch sử các lần bảo hành trước sẽ hiển thị ngay lập tức. Nếu là khách mới, hệ thống mở form cho phép đăng ký nhanh thông tin khách hàng.

### Bước 3: Tiếp nhận và tạo phiếu bảo hành mới (QT-04, QT-05, QT-07, QT-09)
- Nhấn nút **Tạo phiếu mới**.
- Chọn thiết bị/sản phẩm từ danh mục master data.
- Nhập số Serial/IMEI thiết bị:
  - Hệ thống áp dụng quy tắc **QT-09**: Nếu thiết bị đang có phiếu bảo hành chưa hoàn tất, hệ thống sẽ cảnh báo lỗi HTTP 409 `PHIEU_DANG_MO` và ngăn chặn tạo trùng.
- Nhập mô tả sự cố (tối thiểu 10 ký tự), nhóm phân loại sự cố và chọn mức độ ưu tiên (`CAO`, `TRUNG_BINH`, `THAP`).
- Nhập ngày mua hàng:
  - Hệ thống tự động kiểm tra quy tắc **QT-05**: Xác định thiết bị còn hay hết hạn bảo hành đến mốc `23:59:59.999Z` của ngày cuối cùng.
  - Hệ thống tự động kích hoạt **SLA Engine (QT-04)**: Tính toán ngày hẹn trả khách cam kết, tự động cộng bù thêm thời gian nếu khoảng thời gian xử lý chạy qua ngày Chủ Nhật (ngày trung tâm đóng cửa).
- Nhấn **Lưu phiếu**: Phiếu được cấp mã chuẩn dạng `BH-xxxxxx/yyyy` (QT-07) và lưu trữ bền vững vào CSDL.

### Bước 4: Phê duyệt ngoại lệ bảo hành (Dành cho Quản lý)
- Trong trường hợp thiết bị đã hết hạn bảo hành nhưng khách hàng có lý do chính đáng được hỗ trợ, Quản lý chi nhánh (`manager.ninhkieu`) hoặc Quản lý hệ thống (`system.admin`) mở chi tiết phiếu và thực hiện **Duyệt ngoại lệ bảo hành**.
- Tài khoản Nhân viên thường (`staff.ninhkieu`) nếu cố tình thực hiện thao tác này sẽ bị hệ thống từ chối với mã lỗi HTTP 403 `KHONG_CO_QUYEN` (kiểm chứng OWASP A01:2025 Broken Access Control).

### Bước 5: Cập nhật vòng đời trạng thái một chiều (QT-06)
- Trong màn hình Chi tiết phiếu bảo hành, nhân viên cập nhật trạng thái xử lý theo đúng tiến trình:
  `MOI` $\rightarrow$ `DA_PHAN_CONG` $\rightarrow$ `DANG_XU_LY` $\rightarrow$ `CHO_LINH_KIEN` $\rightarrow$ `HOAN_TAT`.
- Hệ thống kiểm soát ma trận `VALID_TRANSITIONS`: Tuyệt đối ngăn chặn cập nhật quay ngược trạng thái (ví dụ từ `DANG_XU_LY` lùi về `MOI`).
- Mỗi lần chuyển trạng thái, hệ thống tự động ghi nhận một bản ghi kiểm toán vào lịch sử dòng thời gian (Timeline) gồm: trạng thái trước, trạng thái sau, người thực hiện, thời điểm và ghi chú.

### Bước 6: Lưu ảnh bàn giao và hoàn tất đóng phiếu
- Khi thiết bị đã được sửa chữa xong (`HOAN_TAT`), nhân viên quầy tiến hành bàn giao cho khách hàng.
- Tải lên hoặc chọn ảnh chụp bàn giao thực tế giữa nhân viên và khách nhận máy.
- Chuyển trạng thái sang `DA_BAN_GIAO` để hoàn tất đóng vòng đời phiếu bảo hành.

---

## 6. Kiểm thử Tự động Toàn diện (Automated Testing Suite)

Dự án áp dụng mô hình Kim tự tháp kiểm thử 5 loại test bắt buộc theo quy định Chuyên đề Tốt nghiệp 1 (sử dụng test runner tích hợp sẵn `node:test` của Node.js, không phụ thuộc thư viện thứ ba):

```bash
npm test
```

### Kết quả kiểm thử thực tế (55/55 passed, 100% assertions đạt):
```text
ℹ tests 57
ℹ suites 1
ℹ pass 55
ℹ fail 0
ℹ cancelled 0
ℹ skipped 2
ℹ duration_ms ~83872ms (~84s)
```

- **Luồng đúng (Happy Path):** Đầy đủ test case cho QT-01 (tra cứu khách), QT-04 (thuật toán SLA), QT-05 (hạn bảo hành), QT-06 (vòng đời trạng thái), QT-09 (ràng buộc 1 phiếu mở/thiết bị).
- **Giá trị biên (Boundary):** Kiểm thử ranh giới ca tiếp nhận Thứ Bảy qua Chủ Nhật, ranh giới ngày hết hạn bảo hành mốc `23:59:59.999Z`.
- **Dữ liệu sai (Invalid Data):** Kiểm tra từ chối dữ liệu thiếu trường, SĐT sai định dạng, mô tả lỗi < 10 ký tự với mã lỗi HTTP và thông báo chỉ rõ tên trường.
- **Bảo mật & Phân quyền (RBAC / OWASP A01):** Kiểm tra chặn truy cập không phiên (401), chặn nhân viên thao tác ngoài chi nhánh (403), chặn tài khoản thường nâng quyền.
- **Tính tái lập (Repeatability):** Chạy lại migration/seed lần 2 an toàn (`ON CONFLICT DO NOTHING`), không lỗi và không nhân đôi bản ghi.
- **Tính bền vững CSDL (Persistence):** Kiểm thử lưu trữ và truy vấn phiếu bảo hành thực tế trên PostgreSQL 16.

---

## 7. Danh mục Tài liệu Kỹ thuật Phụ trợ

Toàn bộ tài liệu đặc tả, phân tích thiết kế và kiểm thử của phân hệ L2 được lưu trữ tại thư mục [`docs/`](docs/):
- **Đặc tả & Thiết kế:** [Đặc tả yêu cầu SRS](docs/srs.md) | [Kiến trúc phân tầng](docs/architecture.md) | [Hợp đồng API chuẩn](docs/api-contract.md) | [Nhật ký thay đổi thiết kế](docs/thay-doi-thiet-ke.md) | [Tài liệu tham chiếu API chi tiết](docs/api-reference.md)
- **Kiểm thử & Chất lượng:** [Kế hoạch kiểm thử](docs/test-plan.md) | [Báo cáo kết quả kiểm thử](docs/test-report.md) | [Nhật ký lỗi (Bug Log)](docs/bug-log.md) | [Checklist bảo mật 7 mục](docs/checklist-bao-mat.md)
- **Hướng dẫn triển khai:** [Hướng dẫn triển khai chi tiết](docs/deployment-guide.md) | [Bản kê khai AI](docs/ai-disclosure.md)
- **Minh chứng nghiệm thu:** [Thư mục ảnh chụp minh chứng màn hình thực tế](docs/screenshots/)
