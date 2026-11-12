# Nhật ký Gỡ lỗi & Xử lý sự cố (Bug Log)

- **Dự án:** Chuyên đề Tốt nghiệp 1 (CDTN1 - HK1 2026–2027) | Khoa CNTT – Đại học Văn Lang
- **Phân hệ:** L2 – Tiếp nhận và phân loại yêu cầu bảo hành (Mekong Mobile CRM)
- **Sinh viên:** Nguyễn Bá Anh Khôi | **MSSV:** 2374802010247 | **Track:** Software Engineering (SE)
- **Tiêu chuẩn áp dụng:** Mẫu Bug Log 7 dòng chuẩn Đề bài BT3 (Mục 2.3) & Buổi 13 Lý thuyết (Mục 3)
- **Kho lưu trữ:** `https://github.com/Khoidep-zai/cdtn1-NguyenBaAnhKhoi-l2`
- **Tiêu chí phân loại lỗi khách quan:**
  - *Câu hỏi 1:* "Hệ thống không dùng được, dữ liệu bị sai, hoặc có lỗ hổng bảo mật?" $\rightarrow$ **CÓ** $\rightarrow$ **CRITICAL** (bắt buộc sửa 100%).
  - *Câu hỏi 2:* "Một chức năng quan trọng sai hoặc không dùng được, nhưng có cách làm khác?" $\rightarrow$ **CÓ** $\rightarrow$ **MAJOR** (phải sửa hoặc nêu rõ phương án thay thế).
  - *Không rơi vào 2 câu trên:* $\rightarrow$ **MINOR** (ảnh hưởng trải nghiệm/trình bày, nghiệp vụ vẫn đúng).

---

## BUG-001 — Mất toàn bộ dữ liệu phiếu và khách hàng mới khi máy chủ khởi động lại (Data Persistence Loss)

1. **Mã và mức độ:** BUG-001 · CRITICAL — Dữ liệu nghiệp vụ cốt lõi (phiếu bảo hành, khách hàng mới, ảnh bàn giao) bị biến mất hoàn toàn sau khi tiến trình server bị restart hoặc deploy phiên bản mới.
2. **Phát hiện bởi:** Phép thử khởi động lại hệ thống và suite `tests/ticket.persistence.test.js` trong quá trình nghiệm thu tích hợp.
3. **Triệu chứng:** Tiếp nhận thành công các phiếu bảo hành mới qua API `POST /api/tickets`; tuy nhiên khi container hoặc tiến trình Express restart, danh sách phiếu quay về trạng thái ban đầu, các phiếu mới tạo biến mất hoàn toàn.
4. **Cách tái lập:** Tạo phiếu mới qua `POST /api/tickets` $\rightarrow$ nhận mã phiếu (vd `TKT-7809`) $\rightarrow$ khởi động lại server (`docker compose restart api`) $\rightarrow$ gọi `GET /api/tickets/TKT-7809` $\rightarrow$ API trả về HTTP 404 `KHONG_TIM_THAY_PHIEU`.
5. **Nguyên nhân gốc:** Tầng Controller (`ticketController.js`) ban đầu kết nối trực tiếp đến Service và Repository lưu trữ tạm trong bộ nhớ RAM (`ticketRepository.js` in-memory), chưa hiện thực hóa tầng truy xuất cơ sở dữ liệu PostgreSQL bền vững.
6. **Cách sửa:** Xây dựng mới hoàn chỉnh `pgTicketRepository.js`, `pgCustomerRepository.js`, `pgHandoverPhotoStore.js` và `pgTicketService.js` sử dụng connection pool kết nối PostgreSQL chuẩn 3NF; chuyển hướng toàn bộ Controller tiếp nhận, bàn giao và tra cứu sang dịch vụ PostgreSQL bền vững.
7. **Link commit và xác nhận:** [Commit 900a9ef](https://github.com/Khoidep-zai/cdtn1-NguyenBaAnhKhoi-l2/commit/900a9ef897b04c5273ea400c28340f0448d490fa) · Chạy bộ kiểm thử tự động `tests/ticket.persistence.test.js` $\rightarrow$ tạo phiếu, restart context, truy vấn lại dữ liệu $\rightarrow$ PASS 100%, dữ liệu được bảo toàn vĩnh viễn trong CSDL PostgreSQL.

---

## BUG-002 — Bộ kiểm thử tự động thất bại trên GitHub Actions do thiếu môi trường PostgreSQL (CI Pipeline Failure)

1. **Mã và mức độ:** BUG-002 · MAJOR — Pipeline CI trên GitHub Actions bị gián đoạn (đỏ toàn bộ), không thể tự động nghiệm thu chất lượng mã nguồn trên môi trường sạch.
2. **Phát hiện bởi:** GitHub Actions CI Runner (Job `test` trong `.github/workflows/ci.yml`).
3. **Triệu chứng:** Khi đẩy mã nguồn lên GitHub, workflow tự động chạy `npm test` nhưng lập tức ném lỗi `ECONNREFUSED 127.0.0.1:5432`, khiến toàn bộ 15 test suite phụ thuộc CSDL bị sập.
4. **Cách tái lập:** Kích hoạt workflow CI trên runner `ubuntu-latest` chưa cài đặt dịch vụ cơ sở dữ liệu $\rightarrow$ lệnh `npm test` thất bại 100% tại bước kết nối DB pool.
5. **Nguyên nhân gốc:** Tệp cấu hình CI `.github/workflows/ci.yml` chỉ thiết lập môi trường Node.js mà thiếu khai báo container dịch vụ PostgreSQL (`services.postgres`), đồng thời chưa có bước tự động thực thi migration tạo bảng trước khi chạy test.
6. **Cách sửa:** Khai báo PostgreSQL service container (`postgres:16-alpine`) trong workflow với đầy đủ biến môi trường và healthcheck; thêm bước chạy tự động `node src/backend/db/migrate.js` trước lệnh `npm test` và cập nhật cấu hình fallback host/port trong `src/backend/config/index.js`.
7. **Link commit và xác nhận:** [Commit 6b74169](https://github.com/Khoidep-zai/cdtn1-NguyenBaAnhKhoi-l2/commit/6b74169d26984ca7ad27c0e9ed27b5ca43acd0fa) · GitHub Actions chạy lại toàn bộ suite test trên runner sạch $\rightarrow$ kết quả xanh (PASS 100%), hoàn tất kiểm chứng tự động liên tục.

---

## BUG-003 — Lỗi không tìm thấy file dữ liệu mẫu khi triển khai trên Netlify Serverless (Serverless Path Resolution ENOENT)

1. **Mã và mức độ:** BUG-003 · MAJOR — Toàn bộ API phân hệ L2 bị tê liệt (HTTP 500) khi chạy trên nền tảng Serverless do không thể nạp các file dữ liệu danh mục ban đầu.
2. **Phát hiện bởi:** Smoke test sau khi triển khai lên môi trường Internet (`https://cdtn1.netlify.app/api/centers`).
3. **Triệu chứng:** Gọi bất kỳ API nào cần danh mục (trung tâm, nhóm sự cố, sản phẩm) đều nhận về mã lỗi HTTP 500 với thông báo `ENOENT: no such file or directory, open '.../dataset/...'`.
4. **Cách tái lập:** Triển khai mã nguồn lên Netlify Functions $\rightarrow$ truy cập endpoint `/api/centers` hoặc `/health` $\rightarrow$ hệ thống ném ngoại lệ không tìm thấy tệp dataset.
5. **Nguyên nhân gốc:** Nền tảng Serverless Netlify đóng gói hàm vào thư mục tạm `/var/task`, trong khi hàm `loadCsv` trong `dataLoader.js` sử dụng đường dẫn tương đối dựa trên `process.cwd()`, dẫn đến sai lệch vị trí thư mục gốc so với cấu trúc đóng gói serverless.
6. **Cách sửa:** Nâng cấp cơ chế phân giải đường dẫn trong `src/backend/data/dataLoader.js`: kiểm tra đa tầng đường dẫn hợp lệ qua `process.env.LAMBDA_TASK_ROOT`, `__dirname` và `process.cwd()`; đồng thời cấu hình `included_files` trong `netlify.toml` để đảm bảo thư mục `dataset/**` luôn được đóng gói cùng lambda functions.
7. **Link commit và xác nhận:** [Commit f948a0b](https://github.com/Khoidep-zai/cdtn1-NguyenBaAnhKhoi-l2/commit/f948a0bac1c8b3bf070a2119fd1e3ff715155b39) · Triển khai lại trên Netlify và chạy smoke test $\rightarrow$ nạp thành công 6 trung tâm, 6 nhóm sự cố, 320 sản phẩm $\rightarrow$ HTTP 200 (PASS).


---

## BUG-004 — Tối ưu hóa hiệu năng Docker Compose, nạp dữ liệu và kiểm tra sức khỏe máy chủ (Docker Performance & Healthcheck Tuning)

1. **Mã và mức độ:** BUG-004 · MINOR / ENHANCEMENT — Hiệu năng khởi chạy Docker Compose trên môi trường máy cá nhân và Windows WSL2 bị chậm do build image 2 lần độc lập (`migrate` và `api`) và PostgreSQL ghi đĩa tuần tự chậm khi nạp 67.037 bản ghi khách hàng.
2. **Phát hiện bởi:** Đo lường thời gian thực thi lệnh `docker compose up -d --build` trên môi trường thực tế của sinh viên và người chấm.
3. **Triệu chứng:** Lệnh khởi động Docker mất nhiều thời gian biên dịch lại cùng một Dockerfile cho hai dịch vụ `migrate` và `api`; tiến trình nạp dữ liệu khách hàng gây nghẽn I/O đĩa trên Windows; kiểm tra sức khỏe `fetch('http://localhost:3000/health')` bị độ trễ do phân giải IPv6/IPv4 trên Alpine Linux.
4. **Cách tái lập:** Chạy `docker compose up -d --build` từ trạng thái chưa có cache $\rightarrow$ Docker thực hiện 2 lượt build riêng biệt; container `postgres` chạy với cấu hình mặc định chưa tinh chỉnh bộ nhớ đệm.
5. **Nguyên nhân gốc:** `docker-compose.yml` định nghĩa `build: .` cho cả 2 dịch vụ nhưng thiếu tên `image` chung; cấu hình PostgreSQL mặc định bật `synchronous_commit` và giới hạn `shared_buffers` ở mức thấp (128MB); healthcheck dùng `localhost` thay vì IP tĩnh `127.0.0.1`.
6. **Cách sửa:**
   - Đặt `image: cdtn1-mekong-l2:latest` cho cả `api` và `migrate` để chia sẻ trọn vẹn lớp image build một lần duy nhất.
   - Bổ sung cấu hình tối ưu PostgreSQL vào `docker-compose.yml`: `-c shared_buffers=256MB -c work_mem=16MB -c synchronous_commit=off -c checkpoint_completion_target=0.9 -c wal_buffers=16MB`.
   - Cập nhật cờ npm trong `Dockerfile`: `npm ci --omit=dev --prefer-offline --no-audit --no-fund` và trỏ healthcheck về `http://127.0.0.1:3000/health`.
   - Cung cấp giá trị fallback an toàn cho `${DB_PASSWORD:-MekongSecure2026!}` và `${JWT_SECRET:-...}` trong Compose file để chống lỗi sập khi thiếu tệp `.env`.
7. **Link commit và xác nhận:** Commit mới · Thời gian build Docker giảm xuống chỉ còn ~14 giây; tiến trình migration và nạp dữ liệu chạy trơn tru mượt mà; 57/57 tests PASS 100%.
