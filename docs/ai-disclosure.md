# BẢN KÊ KHAI SỬ DỤNG TRÍ TUỆ NHÂN TẠO (AI DISCLOSURE)

- **Học phần:** Chuyên đề Tốt nghiệp 1 (CDTN1) — HK1, Năm học 2026–2027
- **Khoa:** Công nghệ Thông tin — Trường Đại học Văn Lang
- **Sinh viên:** Nguyễn Bá Anh Khôi
- **MSSV:** 2374802010247
- **Đề tài / Luồng nghiệp vụ:** L2 – Tiếp nhận và phân loại yêu cầu bảo hành (Mekong Mobile CRM)
- **Track chuyên ngành:** Software Engineering (SE)
- **Mốc nộp:** Bài tập 3 (BT3 — Tag v1.0)
- **Quy định áp dụng:** Mục 2.7 & Phụ lục Đề bài BT3, Tuân thủ chuẩn đạo đức CLO5

---

### Bảng khai báo sử dụng công cụ AI (Toàn bộ Giai đoạn 3: Buổi 13–16)

| Tên công cụ | Mục đích sử dụng | Vị trí áp dụng trong bài | Phương pháp kiểm chứng lại của sinh viên |
| :--- | :--- | :--- | :--- |
| **Gemini (Antigravity Assistant)** | Hỗ trợ phân tích đề bài BT3 và Workshop Buổi 16; rà soát thiết kế kim tự tháp kiểm thử 5 loại; kiểm tra rà soát Bug Log 7 dòng chuẩn đối chiếu commit thật; hỗ trợ đồng bộ dữ liệu kỹ thuật và tài liệu báo cáo. | `docs/test-plan.md`, `docs/test-report.md`, `docs/bug-log.md`, `docs/deployment-guide.md`, `tests/*.test.js`. | Tự tay kiểm tra từng điều kiện biên bằng tính toán tay; trực tiếp chạy lệnh `npm test` xác nhận 55/55 tests pass (tổng 57 tests); kiểm chứng từng link commit trên repo GitHub public. |
| **Claude / Spec-Kit Tools** | Hỗ trợ phân tích mã nguồn theo quy trình Spec-Driven Development; rà soát sự phù hợp với Hiến pháp dự án (`constitution.md`); kiểm tra chéo các ràng buộc kỹ thuật. | Thư mục `.specify/`, `specs/001-tiep-nhan-bao-hanh/`, `specs/002-kiem-thu-va-dong-goi-bt3/`. | Tự đọc hiểu toàn bộ cấu trúc quy trình; đối chiếu các quy tắc nghiệp vụ QT-01 đến QT-09 với yêu cầu của giảng viên; xác nhận không có quy tắc nào bị vi phạm. |
| **OfficeCLI CLI Tool** | Hỗ trợ tra cứu cấu trúc OpenXML, thẩm định tính hợp lệ của tài liệu báo cáo Word (`officecli validate`), kiểm tra số lượng bảng và các đề mục kỹ thuật. | Báo cáo `Báo cáo/BT3/BT3_2374802010247_NGUYỄN BÁ ANH KHÔI.docx`. | Mở trực tiếp file Word đối chiếu 8 mục theo rubric; kiểm tra kỹ trang bìa, mục lục, bảng biểu, giữ nguyên phông chữ Times New Roman và cỡ chữ chuẩn. |
| **Docker & Shell Scripts** | Tạo môi trường kiểm thử máy trắng tái lập được; đóng gói Multi-stage build và cấu hình PostgreSQL healthcheck. | `Dockerfile`, `docker-compose.yml`, `.env.example`, `docs/deployment-guide.md`. | Tự thực hiện phép thử máy trắng trên thư mục tạm: clone tag `v1.0`, chạy đúng 2 lệnh, kiểm tra `docker compose ps` báo healthy và curl endpoint `/health` thành công. |

---

### Cam kết Liêm chính Học thuật của Sinh viên

1. **Hiểu rõ sản phẩm:** Tôi xác nhận hiểu rõ bản chất kỹ thuật của mọi dòng mã nguồn, mọi ca kiểm thử, mọi nguyên nhân lỗi trong Bug Log và mọi chỉ dẫn trong Deployment Guide được nộp trong đồ án này.
2. **Chạy thật và kết quả thật:** 100% các kết quả ghi nhận trong Báo cáo Kiểm thử (`docs/test-report.md`) đều do tôi trực tiếp thực thi trên hệ thống thực tế và chụp màn hình minh chứng; tuyệt đối không có kết quả khống hay số liệu ngụy tạo.
3. **Trách nhiệm cá nhân:** Tôi hoàn toàn chịu trách nhiệm trước Hội đồng Đánh giá và Khoa CNTT Trường Đại học Văn Lang về tính trung thực, tính nguyên bản và độ an toàn của sản phẩm bàn giao.

> *"Tôi xác nhận đã đọc, hiểu và chịu trách nhiệm hoàn toàn về toàn bộ nội dung nộp trong báo cáo và mã nguồn này."*  
> **Sinh viên thực hiện:** Nguyễn Bá Anh Khôi  
> **MSSV:** 2374802010247  
> **Ngày xác nhận:** 12/11/2026
