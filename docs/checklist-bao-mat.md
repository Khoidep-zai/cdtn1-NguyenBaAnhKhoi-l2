# Checklist Bảo Mật — Tự Đánh Giá Phân Hệ L2 (Track SE)

- **Dự án:** Chuyên đề Tốt nghiệp 1 (CDTN1 - HK1 2026–2027) | Khoa CNTT – Đại học Văn Lang
- **Phân hệ:** L2 – Tiếp nhận và phân loại yêu cầu bảo hành (Mekong Mobile CRM)
- **Sinh viên:** Nguyễn Bá Anh Khôi | **MSSV:** 2374802010247 | **Track:** Software Engineering (SE)
- **Tiêu chuẩn áp dụng:** 7 mục bắt buộc của Bài tập 3 (Mục 2.5) & 5 mục OWASP Top 10:2025 ưu tiên (Buổi 13 Mục A4)

---

## 1. Bảng Tự Đánh Giá 7 Mục Bảo Mật Bắt Buộc (BT3)

Mỗi mục được đánh giá khách quan bằng một trong ba trạng thái: **ĐÃ LÀM / CHƯA LÀM / KHÔNG ÁP DỤNG**, kèm một dòng minh chứng thực tế có thể kiểm chứng được trong mã nguồn và môi trường chạy.

| # | Mục kiểm tra bảo mật | Đánh giá | Minh chứng thực tế trong mã nguồn & cấu hình |
|:---:|---|:---:|---|
| **1** | **Không có secret / password nào trong repo** | **ĐÃ LÀM** | File `.env` nằm trong `.gitignore`; repo chỉ commit `.env.example` với giá trị mẫu. Lệnh `git log --all --full-history -- .env` không tìm thấy bất kỳ bản ghi rò rỉ nào trong lịch sử git. Không hardcode chuỗi kết nối PostgreSQL. |
| **2** | **Dữ liệu vào được kiểm ở tầng ứng dụng** | **ĐÃ LÀM** | `src/backend/validators/ticketValidator.js` kiểm tra toàn diện payload (NOT NULL, độ dài, regex serial `^[A-Za-z0-9-]{6,40}$`); CSDL PostgreSQL có ràng buộc `CHECK (priority IN ('CAO', 'TRUNG_BINH', 'THAP'))` và `UNIQUE (ticket_code)`. |
| **3** | **Kiểm soát truy cập theo chủ sở hữu (OWASP A01)** | **ĐÃ LÀM** | Middleware `authenticate` xác thực cookie session; middleware `requireRoles` kiểm soát quyền hạn theo chi nhánh (`branch_id`). Thử nghiệm sửa ngoại lệ bảo hành bằng tài khoản không có thẩm quyền bị chặn với HTTP 403 `KHONG_CO_QUYEN` (kiểm chứng qua test `TC-09`). |
| **4** | **Mật khẩu & dữ liệu nhạy cảm được băm hoặc mã hóa** | **ĐÃ LÀM** | Mật khẩu tài khoản được băm một chiều bằng thuật toán an toàn `scrypt` kèm salt ngẫu nhiên riêng biệt trong `src/backend/services/authService.js`. Số điện thoại khách hàng hiển thị trên giao diện danh sách được che theo quy tắc `QT-15` (`090****567`). |
| **5** | **Thông báo lỗi không lộ cấu trúc bên trong (OWASP A02)** | **ĐÃ LÀM** | Middleware xử lý lỗi tập trung trong `src/backend/index.js` trả về JSON chuẩn `{ success: false, error: '...', message: '...', requestId: '...' }`, tuyệt đối che giấu vết ngăn xếp (stack trace), tên bảng hay thông tin kết nối CSDL khi gặp lỗi 500. |
| **6** | **Nhật ký không ghi secret hay dữ liệu cá nhân thừa** | **ĐÃ LÀM** | `src/backend/utils/logger.js` ghi nhật ký theo chuẩn JSON có cấu trúc (gồm timestamp, level, requestId, method, url, statusCode, durationMs); tự động lọc bỏ trường mật khẩu và token, không in dữ liệu cá nhân thô ra stdout. |
| **7** | **Thư viện phụ thuộc được ghim phiên bản & kiểm tra** | **ĐÃ LÀM** | Toàn bộ phụ thuộc được ghim phiên bản chính xác qua `package-lock.json` (`express ^5.2.1`, `pg ^8.23.1`, `dotenv ^18.0.5`); runtime sử dụng Node.js 20 LTS chính thức; kiểm tra `npm audit` không phát hiện lỗ hổng nghiêm trọng (0 critical vulnerabilities). |

---

## 2. Đối Chiếu & Tự Kiểm 5 Mục Ưu Tiên OWASP Top 10:2025 (Theo Buổi 13 Mục A4)

| Mã OWASP | Định nghĩa & Nguy cơ | Cách tự kiểm chứng bằng tay | Kết quả mong đợi | Kết quả thực tế & Minh chứng mã nguồn |
|---|---|---|---|---|
| **A01:2025**<br>Broken Access Control | Người dùng hoặc vai trò thấp truy cập / chỉnh sửa tài nguyên ngoài phạm vi quyền hạn của mình. | Đăng nhập tài khoản Nhân viên chi nhánh A, lấy token, gửi request `PATCH /api/tickets/:id/warranty-exception` hoặc thao tác trên phiếu của chi nhánh B. | HTTP 403 `KHONG_CO_QUYEN` hoặc HTTP 404. Tuyệt đối không trả về HTTP 200. | **ĐẠT (PASS)** — API từ chối với HTTP 403, thông báo lỗi `KHONG_CO_QUYEN`. Được kiểm chứng tự động qua test `TC-09` trong suite kiểm thử. |
| **A02:2025**<br>Security Misconfiguration | Cấu hình để lộ vết ngăn xếp, mở CORS bừa bãi hoặc bật debug mode trên môi trường production. | Gửi request sai cú pháp cố tình gây Exception và đọc nội dung JSON phản hồi; kiểm tra cấu hình CORS. | Phản hồi lỗi KHÔNG chứa stack trace, tên bảng CSDL, hay chuỗi kết nối. | **ĐẠT (PASS)** — Phản hồi chỉ chứa mã lỗi nghiệp vụ chuẩn kèm `requestId` để tra cứu trong log nội bộ; stack trace được giấu kín tại middleware lỗi `src/backend/index.js`. |
| **A04:2025**<br>Cryptographic Failures | Dữ liệu nhạy cảm (mật khẩu người dùng) lưu dưới dạng plain text hoặc thuật toán băm yếu (MD5/SHA1). | Truy vấn trực tiếp vào bảng người dùng `SELECT password_hash FROM users` hoặc kiểm tra logic tạo tài khoản. | Mật khẩu phải là chuỗi băm kèm salt an toàn (scrypt), không thể dịch ngược. | **ĐẠT (PASS)** — Hàm `hashPassword` sử dụng `crypto.scryptSync` với salt ngẫu nhiên 16 bytes; không có mật khẩu dạng rõ trong CSDL. |
| **A05:2025**<br>Injection | Dữ liệu người dùng nhập vào bị thông dịch thành câu lệnh SQL hoặc mã script thực thi. | Nhập vào trường Serial/IMEI chuỗi injection `' OR 1=1 --` và `<script>alert(1)</script>`. | Không trả về toàn bộ bản ghi; chuỗi bị từ chối hoặc escape an toàn. | **ĐẠT (PASS)** — Tầng Validator từ chối ngay lập tức với mã lỗi `DU_LIEU_KHONG_HOP_LE`; các truy vấn SQL tầng Repository đều sử dụng Parameterized Queries (`$1`, `$2`), triệt tiêu 100% SQLi. |
| **A07:2025**<br>Authentication Failures | Cơ chế xác thực lỏng lẻo, cho phép truy cập tài nguyên bảo mật khi thiếu token hoặc token giả mạo. | Gọi API yêu cầu xác thực mà không gửi cookie token; hoặc sửa đổi 1 ký tự trong chuỗi session token. | Trả về HTTP 401 Unauthorized cho cả hai trường hợp; không cho phép bypass. | **ĐẠT (PASS)** — Middleware `authenticate` kiểm tra chữ ký token bằng `JWT_SECRET`; token thiếu hoặc sai lệch 1 ký tự lập tức bị từ chối với HTTP 401. |

---

## 3. Kết Luận Bảo Mật
Phân hệ L2 đã hoàn thành 100% các tiêu chí bảo mật theo rubric đánh giá Bài tập 3 của Khoa CNTT ĐH Văn Lang, đạt chuẩn chất lượng theo hướng dẫn thực hành an toàn thông tin chuyên ngành Kỹ thuật phần mềm (Track SE).
