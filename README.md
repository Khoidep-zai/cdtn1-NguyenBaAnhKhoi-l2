# Mekong Mobile CRM — Tiếp nhận và phân loại bảo hành (L2)

Sinh viên: Nguyễn Bá Anh Khôi — 2374802010247 — Kỹ thuật phần mềm, Đại học Văn Lang. Dự án phục vụ học phần Chuyên đề Tốt nghiệp 1.

## Phạm vi và trạng thái thực tế

Ứng dụng gồm màn hình đăng nhập, danh sách phiếu, tạo phiếu và chi tiết phiếu. Hệ thống hỗ trợ tìm khách hàng theo số điện thoại, phân loại sự cố, tính SLA, theo dõi lịch sử và chuyển trạng thái, cùng phân quyền nhân viên, quản lý chi nhánh và quản lý hệ thống.

**Giới hạn hiện tại:** phiếu mới, khách hàng mới, lịch sử phát sinh và ảnh bàn giao được giữ trong bộ nhớ máy chủ; chúng mất khi máy chủ khởi động lại. PostgreSQL đang được sử dụng cho tài khoản và một số danh mục; kết nối thành công không có nghĩa phiếu mới đã được lưu vào cơ sở dữ liệu. Không sử dụng phiên bản này để lưu dữ liệu nghiệp vụ cần bảo toàn. Chi tiết: [Tổng quan hệ thống](docs/hien-trang-he-thong.md).

## Yêu cầu

- Node.js 20 trở lên và npm; đã chạy bộ kiểm thử với Node.js 24.15.0 và npm 11.12.1.
- PostgreSQL hoạt động, có cơ sở dữ liệu riêng cho dự án và thông tin kết nối phù hợp. Đã kiểm tra kết nối PostgreSQL 18 trên máy phát triển.
- Dữ liệu mẫu trong thư mục `dataset/` và tệp khóa `package-lock.json`.

## Cài đặt trên Windows PowerShell

Tại thư mục dự án, sao chép cấu hình mẫu:

```powershell
Copy-Item .env.example .env
```

Mở `.env`, nhập thông số PostgreSQL của máy, đặt `JWT_SECRET` thành chuỗi bí mật dài ít nhất 32 byte. Không đưa `.env` hoặc bí mật thật lên Git. PostgreSQL phải được khởi động và cơ sở dữ liệu `DB_NAME` phải tồn tại trước bước tiếp theo.

Cài đúng các phiên bản phụ thuộc từ lockfile:

```powershell
npm ci
```

Khởi tạo cấu trúc và nạp dữ liệu mẫu vào **cơ sở dữ liệu dành riêng cho bản demo**:

```powershell
npm run db:migrate
```

Migration có thao tác nhập dữ liệu: kiểm tra đích kết nối và sao lưu trước khi chạy với dữ liệu hiện có. Tạo quản lý hệ thống đầu tiên nếu cơ sở dữ liệu chưa có tài khoản đó:

```powershell
npm run auth:bootstrap
```

Lệnh bootstrap yêu cầu nhập thông tin trong terminal. Có thể tạo ba tài khoản mẫu development bằng `npm run auth:seed-roles` trên cơ sở dữ liệu demo chưa có các tên tài khoản tương ứng; mật khẩu ngẫu nhiên chỉ hiện một lần. Không chạy lệnh này ở production.

Khởi động ứng dụng:

```powershell
npm start
```

Mở http://localhost:3000. `GET /health` kiểm tra dịch vụ; `GET /health/db` kiểm tra kết nối PostgreSQL. Docker Compose trong repository chưa được xác nhận bằng phép thử dựng lại phiên bản hiện tại; ưu tiên hướng dẫn thủ công ở trên.

## Tài khoản demo cho giảng viên

Các tài khoản do chủ dự án cung cấp, chỉ dành cho môi trường demo:

| Vai trò | Tên đăng nhập | Mật khẩu |
| --- | --- | --- |
| Quản lý hệ thống | `system.admin` | `admin123` |
| Quản lý chi nhánh | `manager.hcm` | `123456` |
| Nhân viên | `staff.hcm` | `123456` |

Các tài khoản này phụ thuộc dữ liệu tài khoản đã có trong PostgreSQL của môi trường demo; lệnh seed mặc định tạo tên và mật khẩu ngẫu nhiên khác. Không dùng các mật khẩu này cho tài khoản vận hành.

## Hướng dẫn sử dụng web

1. Đăng nhập tại http://localhost:3000. Quản lý hệ thống xem toàn hệ thống; quản lý chi nhánh và nhân viên bị giới hạn theo chi nhánh.
2. Trên danh sách phiếu, tìm theo tên, điện thoại, serial hoặc mã phiếu; chọn trạng thái, chi nhánh theo quyền và dùng nút đặt lại khi cần.
3. Chọn **Tạo phiếu mới**, tra cứu khách bằng số điện thoại; nếu chưa có hồ sơ, nhập thông tin và đăng ký khách hàng. Chọn thiết bị, nhập serial, mô tả sự cố, nhóm lỗi và mức ưu tiên rồi tạo phiếu.
4. Nếu bảo hành chưa xác minh hoặc hết hạn, ghi nhận khách đồng ý sửa dịch vụ tính phí hoặc quản lý phê duyệt ngoại lệ trước khi phân công.
5. Trong chi tiết, chuyển trạng thái theo vòng đời hợp lệ và xem thời gian, người thực hiện, ghi chú trong lịch sử. Sau khi hoàn thành, chọn hoặc lưu ảnh nhân viên và khách chụp chung trước khi xác nhận bàn giao.
6. Chỉ sử dụng dữ liệu demo: trạng thái, ảnh và phiếu mới chưa tồn tại sau khi máy chủ khởi động lại.

## Kiểm thử

```powershell
npm test
```

Lần chạy ngày 29/10/2026 trên máy phát triển: 44 bài kiểm thử, 44 thành công, 0 thất bại. Một số kiểm thử cần PostgreSQL và cấu hình môi trường phù hợp; kết quả có thể khác trên máy chưa cấu hình.

## Tài liệu

- [Hiện trạng, dữ liệu và giới hạn](docs/hien-trang-he-thong.md)
- [Đặc tả](docs/srs.md), [kiến trúc](docs/architecture.md), [hợp đồng API](docs/api-contract.md)
- [Kế hoạch kiểm thử](docs/test-plan.md), [kết quả kiểm thử](docs/test-report.md), [nhật ký lỗi](docs/bug-log.md)

Các tài liệu và ảnh minh chứng cũ phản ánh thời điểm tạo; ưu tiên hiện trạng cập nhật ở trên khi có khác biệt.
