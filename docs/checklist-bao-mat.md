# Checklist bảo mật Buổi 15 — Track SE

Cập nhật: 12/11/2026. Trạng thái áp dụng cho mã nguồn hiện tại hướng tới bản phát hành chính thức tag `v1.0`. ĐÃ LÀM nghĩa là đã thực hiện biện pháp kỹ thuật và có bộ kiểm thử tự động kiểm chứng; không phải phát ngôn chủ quan về an toàn tuyệt đối.

## Bảy mục bắt buộc

| # | Nội dung | Trạng thái | Minh chứng và giới hạn kỹ thuật |
|---|---|---|---|
| 1 | Không có secret trong repo | ĐÃ LÀM | Lệnh `git log --all --oneline -- .env` trả về rỗng (chưa từng commit `.env` vào lịch sử Git); `git grep` trong `src/` không phát hiện secret/mật khẩu ghi cứng; tệp `.env.example` chỉ chứa giá trị mẫu công khai. |
| 2 | Kiểm tra đầu vào tại ứng dụng | ĐÃ LÀM | Tầng `src/backend/validators/ticketValidator.js` và `tests/ticket.validator.test.js` kiểm tra mọi trường bắt buộc (NOT NULL), regex serial `^[A-Za-z0-9-]{6,40}$` chặn ký tự lạ và SQL Injection payload; escape HTML tại giao diện frontend. |
| 3 | Phân quyền theo phạm vi | ĐÃ LÀM | Bộ kiểm thử `tests/auth.integration.test.js` xác minh cơ chế RBAC (3 vai trò) và phạm vi chi nhánh (Branch Scoping - Center ID); nhân viên chi nhánh khác hoặc thiếu quyền duyệt ngoại lệ bảo hành bị từ chối với HTTP 403. |
| 4 | Mật khẩu băm an toàn | ĐÃ LÀM | Tầng `src/backend/services/authService.js` sử dụng thuật toán `scrypt` kèm salt ngẫu nhiên 16 bytes; `tests/auth.service.test.js` kiểm chứng mật khẩu lưu trong DB có tiền tố `$s0$...`, không lưu plaintext. |
| 5 | Lỗi không lộ cấu trúc nội bộ | ĐÃ LÀM | Middleware xử lý lỗi tập trung `src/backend/middlewares/errorHandler.js` ẩn toàn bộ stack trace trên môi trường production, chỉ trả về mã lỗi nghiệp vụ chuẩn hóa; `tests/error-safety.test.js` và `tests/health-safety.test.js` kiểm chứng. |
| 6 | Log không chứa secret/PII thừa | ĐÃ LÀM | Bộ logger có cấu trúc `src/backend/utils/logger.js` tự động che giấu thông tin nhạy cảm (JWT token, password), loại bỏ query string khỏi log yêu cầu; được kiểm chứng qua `tests/logger.test.js`. |
| 7 | Khóa dependency và audit | ĐÃ LÀM | Sử dụng `package-lock.json` cố định phiên bản thư viện; lệnh `npm audit` ghi nhận 0 lỗ hổng bảo mật (minh chứng: `docs/evidence/npm-audit.json`). |

## Ba phép quét bảo mật tĩnh (A4)

Thực hiện lệnh quét tương đương grep trên toàn bộ mã nguồn `src/`:

```sh
rg -n -e '(SELECT|INSERT|UPDATE|DELETE).*(\+ *[a-zA-Z_]|\$\{)' src
rg -n -e 'innerHTML|dangerouslySetInnerHTML|v-html' src
rg -n -e 'exec\(|execSync|spawn\(|os\.system|shell=True' src
```

- **SQL Injection Scan:** 0 kết quả nối chuỗi; toàn bộ truy vấn CSDL đều dùng parameterized queries (`$1, $2, ...`) qua kết nối PostgreSQL Pool.
- **XSS Scan:** Toàn bộ nội dung động đều được lọc qua hàm `escapeHtml` và `escapeStateText`; không có mã độc nào được render trực tiếp ra DOM.
- **Command Injection Scan:** 0 kết quả sử dụng shell execution; các tác vụ nền đều thực thi bằng hàm nội bộ hoặc mảng tham số cố định.

## Checklist tự kiểm SE (A6)

| Mục | Trạng thái | Minh chứng |
|---|---|---|
| Ba lệnh quét A4 | ĐÃ LÀM | Đã quét và lưu kết quả tại các tệp `evidence/scan-*.txt`. |
| JWT_SECRET từ môi trường, >=32, dừng khi thiếu | ĐÃ LÀM | `tests/startup.test.js`: Server từ chối khởi động nếu thiếu hoặc secret < 32 ký tự. |
| Xác minh thuật toán, không decode để cấp quyền | ĐÃ LÀM | `authService.verifySession` kiểm tra chữ ký HMAC-SHA256 hợp lệ; từ chối token giả mạo hoặc hết hạn. |
| Payload không chứa PII | ĐÃ LÀM | Token chỉ chứa `sub`, `iat`, `exp`; vai trò và quyền hạn được truy vấn lại từ CSDL mỗi phiên. |
| Kiểm soát sở hữu / Phạm vi chi nhánh | ĐÃ LÀM | Kiểm thử HTTP branch scoping trong `tests/auth.integration.test.js`. |
| CORS theo biến môi trường | ĐÃ LÀM | Cấu hình `src/backend/middlewares/cors.js` và `tests/cors.test.js`. |
| Cookie HttpOnly / SameSite / Secure | ĐÃ LÀM | `authController.js` cấu hình cookie với cờ `HttpOnly`, `SameSite=Strict` và `Secure` khi chạy production. |
| Không lộ secret trong URL | ĐÃ LÀM | Xác thực qua Cookie/Header Authorization; query string được lọc bỏ khỏi log. |
| Lỗi không lộ nội bộ | ĐÃ LÀM | `tests/error-safety.test.js`, `tests/health-safety.test.js`. |
| API Documentation đủ 7 mục, ví dụ thật | ĐÃ LÀM | `docs/api-reference.md` bao phủ 23 endpoints với đầy đủ request/response thực tế. |
| Guide chỉ dẫn cấu hình HTTPS | ĐÃ LÀM | `docs/deployment-guide.md` Mục 2 có mẫu cấu hình reverse proxy TLS. |

## Các điều kiện bàn giao và xác nhận

- Tự động nạp 3 tài khoản demo mẫu (`system.admin`, `manager.ninhkieu`, `staff.ninhkieu`) với mật khẩu băm scrypt trong `migrate.js`, đảm bảo hệ thống sẵn sàng đăng nhập ngay sau 2 lệnh dựng (đáp ứng tiêu chuẩn C1). Lệnh `npm run auth:bootstrap` vẫn được giữ lại để tạo quản trị độc lập khi cần.
- Bộ kiểm thử tự động đạt **55 PASS, 2 SKIP, 0 FAIL (tổng 57 tests)**; minh chứng tại `docs/evidence/test-run.txt` và `docs/evidence/docker-tests.txt`.
- Dữ liệu phiếu bảo hành, khách hàng và ảnh bàn giao đã được chuyển đổi hoàn toàn sang lưu trữ bền vững trong cơ sở dữ liệu PostgreSQL (`pgTicketRepository.js`, `pgCustomerRepository.js`, `pgHandoverPhotoStore.js`) từ commit `900a9ef`, đảm bảo an toàn và bảo toàn dữ liệu trọn vẹn qua các lần khởi động lại máy chủ.
