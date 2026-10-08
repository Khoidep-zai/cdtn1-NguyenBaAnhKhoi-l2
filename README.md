# Tiếp nhận và phân loại yêu cầu bảo hành

Sinh viên:  
Nguyễn Bá Anh Khôi - 2374802010247 - Track SE

Học phần:  
Chuyên đề Tốt nghiệp 1, HK1 2026-2027

Luồng nghiệp vụ:  
L2 – Tiếp nhận và phân loại yêu cầu bảo hành

## 1. Mục tiêu
Hệ thống hỗ trợ nhân viên tiếp nhận tạo phiếu bảo hành từ thông tin khách hàng, kiểm tra tính hợp lệ và phân loại sơ bộ sự cố kỹ thuật. Giải pháp giúp chuẩn hóa quy trình tiếp nhận dịch vụ khách hàng, ghi nhận vết trạng thái rõ ràng và sẵn sàng chuyển tiếp dữ liệu sang phân hệ phân công kỹ thuật viên xử lý.

## 2. Yêu cầu môi trường
- Node.js 20 LTS (hoặc: Node.js 24 LTS)
- PostgreSQL 16 hoặc 18
- Biến môi trường: xem .env.example

## 3. Hướng dẫn chạy
(BT2 yêu cầu ≤ 4 bước)
1. cp .env.example .env và điền giá trị
2. npm install
3. npm run db:migrate
4. npm run dev → mở http://localhost:3000/health (hoặc http://localhost:3000/health/db kiểm tra CSDL)

## 4. Cách mở các file thiết kế
- **Sơ đồ Use Case, Kiến trúc, ERD (`docs/*.drawio`):** Mở trực tiếp trên web [app.diagrams.net](https://app.diagrams.net/) (File → Open From → Device) hoặc dùng tiện ích mở rộng *Draw.io Integration* trong VS Code / Cursor / IDE.
- **File thiết kế Wireframe (`docs/wireframe.fig`):** Mở trực tiếp bằng [Figma](https://www.figma.com/) (Import file `.fig`).
- **Wireframe HTML tương tác (`docs/wireframes.html`):** Mở trực tiếp bằng bất kỳ trình duyệt web nào (Chrome, Edge, Firefox) để trải nghiệm giao diện và luồng tương tác.
- **Hình ảnh sơ đồ xuất sẵn (`docs/export/*.png`):** Toàn bộ ảnh phân giải cao đã xuất sẵn phục vụ đối chiếu và chèn vào báo cáo.

## 5. Cấu trúc thư mục
- `docs/`: Chứa toàn bộ hồ sơ phân tích & thiết kế:
  - `srs.md`: Bản đặc tả yêu cầu phần mềm rút gọn (Mục 1 của báo cáo).
  - `usecase.drawio`: Sơ đồ Use Case chuẩn UML 2.5 (file gốc).
  - `architecture.drawio`, `architecture.md`: Sơ đồ kiến trúc 4 lớp và lập luận NFR (file gốc).
  - `erd.drawio`, `api-contract.md`: Mô hình dữ liệu quan hệ 3NF và hợp đồng API.
  - `wireframes.html`, `wireframe.fig`, `wireframe.png`: Wireframe 3 màn hình cốt lõi.
  - `ai-disclosure.md`: Bản kê khai sử dụng công cụ AI (Phụ lục).
  - `export/`: Toàn bộ hình ảnh sơ đồ vector/hi-res đã xuất sẵn.
- `db/`: Chứa file `schema.sql` (kịch bản SQL DDL skeleton chuẩn hóa cho PostgreSQL).
- `src/`: Toàn bộ mã nguồn ứng dụng (giao diện frontend Dark Mode, backend controller, service, repository, config).
- `tests/`: Bộ kiểm thử tự động (Smoke test và Integration test).
- `data/`: Bộ dataset mẫu từ Case Study (khách hàng, sản phẩm, phiếu mẫu).
- `BT1_2374802010247_NGUYỄN BÁ ANH KHÔI.pdf`: Bản báo cáo chính thức nộp VLU E-learning.

## 6. Kiểm thử
npm test → hiển thị số test PASS (10/10 tests passed)

## 7. Trạng thái hiện tại
- [x] Khởi tạo project, smoke test chạy được (buổi 2)
- [ ] Module tiếp nhận yêu cầu (buổi 8–10)
- [ ] Module phân công kỹ thuật viên (buổi 10–12)