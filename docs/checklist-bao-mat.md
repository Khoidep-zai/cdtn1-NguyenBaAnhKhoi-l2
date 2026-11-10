# Checklist bảo mật Buổi 15 — Track SE

Cập nhật 10/11/2026. Trạng thái áp dụng cho working tree hiện tại, không tự động áp dụng cho tag v1.0 cũ. ĐÃ LÀM nghĩa là đã thực hiện biện pháp và phép kiểm được dẫn; không phải chứng nhận hệ thống không còn lỗ hổng.

## Bảy mục bắt buộc

| # | Nội dung | Trạng thái | Minh chứng và giới hạn |
|---|---|---|---|
| 1 | Không có secret trong repo | ĐÃ LÀM | git log --all --oneline -- .env rỗng (chưa từng commit .env); git grep trong src/ không phát hiện secret/mật khẩu ghi cứng; scripts/check-secret-history.js ghi nhận 0 ứng viên rò rỉ (evidence/secret-history-scan.json). .env.example chỉ chứa giá trị mẫu công khai. |
| 2 | Kiểm tra đầu vào tại ứng dụng | ĐÃ LÀM | tests/ticket.validator.test.js và test báo lỗi trường; ba phép quét A4 bên dưới. Đã sửa escape thông báo lỗi/loading, trạng thái và chuỗi hiển thị frontend; không coi phép quét regex là chứng minh toàn bộ ứng dụng an toàn. |
| 3 | Phân quyền theo phạm vi | ĐÃ LÀM | Bộ test HTTP auth/branch kiểm tra quyền vai trò, chi nhánh và từ chối thao tác trái quyền; xem evidence/test-run.txt. Vai trò được đọc lại từ CSDL mỗi request. |
| 4 | Mật khẩu băm an toàn | ĐÃ LÀM | tests/auth.service.test.js kiểm tra scrypt có salt riêng, mật khẩu sai không xác minh được. Dữ liệu gốc đã được chủ dự án xác nhận là dữ liệu mẫu test. Che SĐT không đồng nghĩa mã hóa CSDL. |
| 5 | Lỗi không lộ cấu trúc nội bộ | ĐÃ LÀM | tests/error-safety.test.js và health-safety.test.js kiểm tra lỗi controller và DB health; smoke test xác nhận DB health chỉ công bố connected. |
| 6 | Log không chứa secret/PII thừa | ĐÃ LÀM | tests/logger.test.js kiểm tra redaction, bỏ query string và không serialize message/stack của Error; config/db.js và src/index.js không log lỗi kết nối thô. Chưa phải kiểm chứng mọi log của hệ điều hành/proxy. |
| 7 | Khóa dependency và audit | ĐÃ LÀM | npm ci dùng package-lock.json; npm audit ghi 0 lỗ hổng tại evidence/npm-audit.json sau cập nhật dependency. Image Node/PostgreSQL mới ghim major, chưa ghim digest; audit npm không kiểm tra hệ điều hành trong image. |

## Ba phép quét A4

Dùng `rg -n -e` tương đương các mẫu grep của tài liệu học:

```sh
rg -n -e '(SELECT|INSERT|UPDATE|DELETE).*(\+ *[a-zA-Z_]|\$\{)' src
rg -n -e 'innerHTML|dangerouslySetInnerHTML|v-html' src
rg -n -e 'exec\(|execSync|spawn\(|os\.system|shell=True' src
```

- SQL: 0 kết quả; evidence/scan-sql.txt. Truy vấn tài khoản dùng tham số $1…; mẫu này có thể bỏ sót câu SQL nhiều dòng.
- HTML: 19 vị trí; evidence/scan-html.txt. dataState dùng escapeStateText cho nội dung biến; phần empty là template hằng. Danh sách tài khoản, phiếu và timeline dùng escapeHtml; danh sách thiết bị escape tên/nhãn; lựa chọn trạng thái lấy từ bảng hằng. Đã sửa chèn mã qua thông báo lỗi và escape thêm trạng thái, bảo hành, ngữ cảnh chuỗi JS của nút chi tiết. Test tái hiện: tests/data-state-security.test.js.
- Shell: 0 kết quả trong src; evidence/scan-shell.txt. Các script kiểm thử gọi tiến trình bằng mảng đối số, không nhận câu lệnh shell từ request.

## Checklist tự kiểm SE (A6)

| Mục | Trạng thái | Minh chứng |
|---|---|---|
| Ba lệnh quét A4 | ĐÃ LÀM | Ba file scan-*.txt; chưa có ảnh chụp terminal. |
| JWT_SECRET từ môi trường, >=32, dừng khi thiếu | ĐÃ LÀM | tests/startup.test.js: thiếu/ngắn đều thoát trước listen. Kiểm tra cả chuỗi Unicode ngắn nhưng có nhiều byte; yêu cầu ít nhất 32 ký tự. |
| Xác minh thuật toán, không decode để cấp quyền | ĐÃ LÀM | authService.verifySession kiểm HS256 và HMAC; auth.service.test.js kiểm giả mạo/hết hạn. |
| Payload không PII | ĐÃ LÀM | Chỉ sub, iat, exp; role tải từ CSDL, không cần đưa vào token. |
| Kiểm soát sở hữu/phạm vi | ĐÃ LÀM | Test HTTP nhánh/role trong evidence/test-run.txt. |
| CORS theo biến môi trường | ĐÃ LÀM | cors.js và tests/cors.test.js kiểm origin cho phép/từ chối, OPTIONS. |
| Cookie HttpOnly/SameSite/Secure | ĐÃ LÀM | authController đặt HttpOnly, SameSite=Strict; Secure khi production. Cần kiểm chứng trình duyệt trong bản Docker/HTTPS. |
| Không có secret trong URL | ĐÃ LÀM | Cookie session và body login; logger bỏ query. SĐT tìm kiếm là dữ liệu mẫu, không dùng token query. |
| Lỗi không lộ nội bộ | ĐÃ LÀM | error-safety, health-safety, smoke tests. |
| API docs đủ 7 mục, ví dụ thật | ĐÃ LÀM | api-reference.md: 23 cặp method/path, 25 phản hồi lưu tại evidence/api-examples.json. Endpoint ERP và overdue chưa có được đánh dấu trong api-contract.md. |
| Guide chỉ dẫn HTTPS | ĐÃ LÀM | deployment-guide.md mục 2; có cấu hình proxy ví dụ và giới hạn kiểm chứng. |

## Các điều kiện bàn giao và xác nhận

- Tự động nạp 3 tài khoản demo mẫu (`system.admin`, `manager.ninhkieu`, `staff.ninhkieu`) với mật khẩu băm scrypt trong `migrate.js`, đảm bảo hệ thống sẵn sàng đăng nhập ngay sau 2 lệnh dựng (đáp ứng tiêu chuẩn C1). Lệnh `npm run auth:bootstrap` vẫn được giữ lại để tạo quản trị độc lập khi cần.
- Docker project cô lập đã dựng đạt, 56/56 test PASS gồm migration lặp; minh chứng evidence/docker-tests.txt, docker-status.txt, docker-counts.txt.
- Tag v1.0 được cập nhật trỏ về commit phát hành chính thức sau khi commit toàn bộ mã nguồn Buổi 15.
- Dữ liệu ticket/customer và ảnh bàn giao đang dùng memory; không cam kết bền vững khi restart.
