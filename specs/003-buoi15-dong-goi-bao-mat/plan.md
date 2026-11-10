# Implementation Plan: Buổi 15 — đóng gói và bảo mật SE

**Branch**: `main` | **Date**: 2026-11-09 | **Spec**: [spec.md](spec.md)

## Summary

Khắc phục khoảng trống đóng gói, kiểm chứng bảo mật và tài liệu dựa trên hệ thống hiện tại; chỉ ghi nhận minh chứng được chạy thật.

## Technical Context

Node.js 20, Express 5, PostgreSQL 16, Docker Compose, `node:test`; ứng dụng web nội bộ. Giữ quy tắc chi nhánh và giao diện hiện hành. Không phá dữ liệu hiện có, không công khai secret; môi trường sạch dùng project và volume riêng. Không đặt chỉ tiêu hiệu năng ngoài đề bài.

## Constitution Check

- Phân tầng, SRS, hợp đồng và TDD: giữ nguyên; bổ sung test trước khi thay đổi hành vi.
- Cấu hình fail-secure, bảy mục bảo mật, hai lệnh dựng, tài liệu và minh chứng: bắt buộc; không khai kết quả chưa chạy.
- CodeGraph trước khi sửa và đồng bộ sau sửa. Ghi quyết định hiến pháp vào `docs/thay-doi-thiet-ke.md` trong giai đoạn thực thi.
- Sau thiết kế: các nguyên tắc đều áp dụng; ngoại lệ được chủ dự án chấp nhận ngày 10/11/2026: tạo quản trị qua auth:bootstrap tương tác sau hai lệnh dựng.

## Project Structure

`src/backend/`, `src/frontend/`, `db/`, `tests/`, `docs/`, `Dockerfile`, `docker-compose.yml` và thư mục feature hiện tại.

## Phases

1. Đánh giá hiện trạng, test gốc và thiết kế seed an toàn.
2. Test trước, hoàn thiện dựng sạch và nạp lại dữ liệu; kiểm thử Compose cô lập.
3. Test trước, sửa các lỗ hổng xác thực, cấu hình, log và phân quyền đã xác minh.
4. Kiểm tra từng endpoint và làm mới tài liệu, checklist kèm minh chứng thực.
5. Chạy toàn bộ kiểm thử, đối chiếu spec và ghi rõ phần chưa thể xác minh.

## Complexity Tracking

Ngoại lệ C1: không seed quản trị tự động; người vận hành tự đặt mật khẩu qua lệnh tương tác. Bản giao phải nêu rõ bước bổ sung này.
