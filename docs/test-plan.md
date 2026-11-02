# Test Plan rút gọn — Phân hệ tiếp nhận và phân loại bảo hành (L2)

- **Dự án:** Chuyên đề Tốt nghiệp 1 (CDTN1 - HK1 2026–2027) | Khoa CNTT – Đại học Văn Lang
- **Phân hệ:** L2 – Tiếp nhận và phân loại yêu cầu bảo hành (Mekong Mobile CRM)
- **Sinh viên:** Nguyễn Bá Anh Khôi | **MSSV:** 2374802010247 | **Track:** Software Engineering (SE)
- **Chuẩn cấu trúc:** 4 mục chuẩn rút gọn (Buổi 13 Lý thuyết & Đề bài BT3 Mục 2.1)

---

## 1. Phạm vi kiểm thử (Scope)

### 1.1. Các thành phần và quy tắc ĐƯỢC KIỂM THỬ:
- **Tiếp nhận và tra cứu hồ sơ khách hàng (`QT-01`):** Chuẩn hóa số điện thoại 10 chữ số, tra cứu danh bạ khách hàng.
- **Tính toán hạn cam kết SLA tự động (`QT-04`):** Thuật toán SLA Engine loại trừ chính xác ngày nghỉ Chủ Nhật theo giờ làm việc quy định.
- **Xác định điều kiện bảo hành (`QT-05`):** Kiểm tra thiết bị còn hạn bảo hành đến đúng mốc `23:59:59.999` của ngày cuối cùng.
- **Vòng đời trạng thái một chiều (`QT-06`):** Kiểm soát nghiêm ngặt ma trận chuyển trạng thái hợp lệ (`MOI` $\rightarrow$ `DA_TIEP_NHAN` $\rightarrow$ `DANG_XU_LY` $\rightarrow$ `CHO_LINH_KIEN` $\rightarrow$ `HOAN_TAT`), tuyệt đối cấm quay ngược hoặc nhảy cóc.
- **Ngăn chặn trùng lặp phiếu (`QT-09`):** Chặn tạo phiếu mới khi thiết bị (Serial/IMEI) đang có phiếu bảo hành chưa hoàn tất.
- **Tầng kiểm tra dữ liệu đầu vào (Validator):** Kiểm tra bắt buộc trường (NOT NULL), chống chuỗi lạ SQL Injection payload trong số Serial.
- **Kiểm soát truy cập và bảo mật (OWASP Top 10:2025):** Kiểm tra A01 Broken Access Control (chặn sửa/xem phiếu người khác), kiểm tra 401 unauthenticated, mật khẩu băm scrypt, ẩn vết ngăn xếp stack trace khi gặp lỗi hệ thống (A02).

### 1.2. Các thành phần CHỦ Ý KHÔNG KIỂM THỬ kèm lý do:
- **Màn hình cấu hình hệ thống:** Chỉ đọc (read-only), không chứa quy tắc nghiệp vụ biến đổi dữ liệu.
- **Kiểm thử hiệu năng và tải cao (Load / Stress testing):** Vượt quá giới hạn prototype cá nhân, thuộc phạm vi đồ án Chuyên đề tốt nghiệp 2 (CDTN2).
- **Kiểm thử chấp nhận người dùng cuối (User Acceptance Testing - UAT):** Yêu cầu triển khai diện rộng và người dùng thực tế tại quầy, thuộc CDTN2.

---

## 2. Loại test và số lượng mỗi tầng (Testing Pyramid)

Phân bố bộ kiểm thử theo mô hình Kim tự tháp chuẩn (đáy rộng Unit test, đỉnh hẹp API test, tránh bẫy "Hình nón ngược"):

```text
       ▲
      / \     System / API Test (3 test) - Kiểm tra luồng HTTP end-to-end, status code, response body
     /───\    
    /     \   Integration Test (2 test) - Tích hợp Service, Repository, ràng buộc CSDL PostgreSQL thật
   /───────\  
  /         \ Unit Test (7 test) - Hàm thuần, tách biệt CSDL/mạng, chạy mili-giây, kiểm tra quy tắc QT
 /───────────\
```

- **Unit test (7 test):** Tập trung tại tầng Service và Validator (`ticketService.js`, `ticketValidator.js`), cô lập phụ thuộc bên ngoài bằng mock repository và cố định mốc thời gian để tránh lỗi test nhấp nháy (flaky test).
- **Integration test (2 test):** Kiểm tra tích hợp giữa Service, Repository và cơ sở dữ liệu PostgreSQL thực tế (`schema.sql`, ràng buộc `UNIQUE`, `CHECK`).
- **API / System test (3 test):** Gọi ứng dụng Express qua HTTP bằng test runner, kiểm tra mã trạng thái, nội dung thông báo lỗi và bảo mật phân quyền.

### Kỹ thuật chọn dữ liệu thử:
- **Phân vùng tương đương (Equivalence Partitioning):** Chia miền dữ liệu thành vùng hợp lệ và không hợp lệ (ví dụ: độ dài `issue_description` < 10 ký tự, 10–2000 ký tự, > 2000 ký tự; số điện thoại đúng 10 số vs. sai định dạng).
- **Giá trị biên (Boundary Value Analysis):** Đặt test case tại và sát hai bên ranh giới để phát hiện lỗi sai toán tử (`<` thay vì `≤`). Ví dụ: ngày cuối bảo hành (còn hạn) vs. ngày kế tiếp (hết hạn); hạn SLA tiếp nhận chiều Thứ Bảy chuyển tiếp qua Chủ Nhật.

### Đảm bảo đủ 5 loại test bắt buộc theo đề bài BT3:
1. **Luồng đúng (Happy Path):** $\ge 1$ test cho MỖI quy tắc nghiệp vụ đã hiện thực (`QT-01`, `QT-04`, `QT-05`, `QT-06`, `QT-09`).
2. **Giá trị biên (Boundary):** 2 test ở hai bên của cùng một ranh giới (biên hạn bảo hành `QT-05` và biên hạn SLA qua Chủ Nhật `QT-04`).
3. **Dữ liệu sai (Invalid Data):** 2 test kiểm tra cả mã trạng thái (400, 409) VÀ nội dung thông báo nêu rõ tên trường vi phạm.
4. **Bảo mật / Chất lượng dữ liệu:** 1 test kiểm tra Broken Access Control (A01:2025 OWASP) — tài khoản không có quyền thì bị từ chối với HTTP 403.
5. **Tính tái lập (Reproducibility):** 1 test chạy nạp dữ liệu / migration lần thứ hai không lỗi và không nhân đôi bản ghi.

---

## 3. Tiêu chí thành công đo được (Measurable Success Criteria)

1. **100% test case PASS:** Toàn bộ 12 test case trong Test Report (và toàn bộ 44 assertions trong test suite) đều đạt kết quả PASS qua 1 lệnh duy nhất.
2. **Phủ kín quy tắc cốt lõi:** Mọi quy tắc nghiệp vụ đã hiện thực (`QT-01`, `QT-04`, `QT-05`, `QT-06`, `QT-09`) đều có ít nhất một test case kiểm chứng.
3. **Không còn bug Critical:** Không còn bất kỳ lỗi mức Critical nào đang mở. Mọi bug phát hiện đều đã được sửa, có mục Bug Log đủ 7 dòng và commit tương ứng.
4. **Thời gian chạy nhanh:** Toàn bộ suite test chạy hoàn tất trong thời gian $\le 5$ giây (thực tế chạy ~3.5 giây).
5. **Độc lập và xác định (Deterministic):** Không phụ thuộc vào thời điểm chạy test (nhờ tiêm mốc thời gian cố định) và không phụ thuộc dữ liệu ngẫu nhiên trên máy cá nhân.

---

## 4. Môi trường và dữ liệu thử (Test Environment & Data)

- **Môi trường thực thi:**
  - Runtime: Node.js 20 LTS (hoặc Node.js 22 LTS).
  - Framework & Runner: Express 5, Node.js built-in Test Runner (`node:test`, `node:assert/strict`).
  - Container hóa: Docker Compose v2, image `postgres:16-alpine`.
- **Dữ liệu thử nghiệm (Test Fixtures):**
  - Master data chuẩn: 6 trung tâm bảo hành, 6 nhóm phân loại sự cố, 320 mã sản phẩm từ `dataset/`.
  - Fixture khách hàng và thiết bị: Tài khoản kỹ thuật viên, tài khoản khách hàng mẫu, thiết bị mẫu `SN-10293` (mua 2026-06-01, hạn 12 tháng).
- **Cơ chế dựng và dọn dẹp:**
  - Tiền điều kiện được dựng bằng code (`resetDb()`, nạp mock repository) trước mỗi ca kiểm thử.
  - Tự động đóng kết nối cơ sở dữ liệu và giải phóng server sau khi kết thúc test, không để cổng bị treo.
- **Lệnh thực thi duy nhất:**
  ```bash
  npm test
  ```
  *(Tương đương: `node --test --test-concurrency=1 tests/*.test.js`)*
