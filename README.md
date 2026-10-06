# Tiếp nhận và phân loại yêu cầu bảo hành

Sinh viên:  
Nguyễn Bá Anh Khôi - 2374802010247 - Track SE

Học phần:  
Chuyên đề Tốt nghiệp 1, HK1 2026-2027

Luồng nghiệp vụ:  
L2 – Tiếp nhận và phân loại yêu cầu bảo hành

## 1. Mục tiêu
Hệ thống hỗ trợ nhân viên tiếp nhận tạo phiếu bảo hành từ thông tin khách hàng, kiểm tra tính hợp lệ và phân loại sơ bộ sự cố kỹ thuật. Giải pháp nhằm giảm thời gian xử lý, chuẩn hóa thông tin đầu vào và hỗ trợ quy trình tiếp nhận bảo hành hiệu quả.

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

## 4. Cấu trúc thư mục

```text
cdtn1-NguyenBaAnhKhoi-l2/
├── .env.example                 # Mẫu biến môi trường
├── .gitignore                   # File loại bỏ file không cần commit
├── Dockerfile                   # Cấu hình build Docker cho ứng dụng
├── docker-compose.yml           # Cấu hình chạy nhiều service cùng lúc
├── package.json                 # Script và dependency của project
├── package-lock.json            # Khóa phiên bản dependency
├── README.md                    # Tài liệu tổng quan dự án
│
├── docs/                       # Tài liệu nghiệp vụ và kiến trúc
│   ├── ai-disclosure.md
│   ├── api-contract.md
│   ├── architecture.md
│   ├── architecture.drawio
│   ├── deployment-guide.md
│   ├── erd.drawio
│   ├── phieu-pham-vi.md
│   ├── srs.md
│   ├── usecase.drawio
│   ├── wireframe.fig
│   └── wireframes.html
│
├── data/                       # Dữ liệu mẫu dùng cho phát triển và test
│   ├── README.md
│   ├── .keep
│   └── sample/
│       ├── customers_sample.csv
│       ├── issue_categories.csv
│       ├── stores.csv
│       ├── ticket_status_log_sample.csv
│       └── tickets_sample.csv
│
├── dataset/                    # Bộ dữ liệu nghiệp vụ chính (mô phỏng doanh nghiệp)
│   ├── README.md
│   ├── customers_raw.csv
│   ├── issue_categories.csv
│   ├── issue_descriptions.csv
│   ├── order_items.csv
│   ├── orders_2024_2026.csv
│   ├── part_stock.csv
│   ├── part_transactions.csv
│   ├── parts.csv
│   ├── products.csv
│   ├── service_centers.csv
│   ├── stores.csv
│   ├── survey_responses.csv
│   ├── technician_skills.csv
│   ├── technicians.csv
│   ├── ticket_status_log.csv
│   ├── tickets_history.csv
│   └── tools/
│       ├── gen_dataset.py
│       └── gen_sample.py
│
├── src/                       # Mã nguồn ứng dụng chính
│   ├── index.js               # Entry point tổng cho ứng dụng
│   ├── .agent/                # Thư mục trợ giúp/skill cho agent
│   │   ├── Hướng dẫn.txt
│   │   └── skills/
│   │       └── ui-ux-pro-max/
│   │           ├── SKILL.md
│   │           ├── data/
│   │           └── scripts/
│   │
│   ├── backend/               # Logic backend (API, service, repo, db)
│   │   ├── index.js
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   └── index.js
│   │   ├── controllers/
│   │   │   ├── catalogController.js
│   │   │   ├── customerController.js
│   │   │   └── ticketController.js
│   │   ├── data/
│   │   │   └── dataLoader.js
│   │   ├── db/
│   │   │   ├── migrate.js
│   │   │   └── schema.sql
│   │   ├── middlewares/
│   │   │   └── validateTicket.js
│   │   ├── repositories/
│   │   │   ├── ITicketRepository.js
│   │   │   ├── customerRepository.js
│   │   │   └── ticketRepository.js
│   │   ├── routes/
│   │   │   ├── catalogRoutes.js
│   │   │   ├── customerRoutes.js
│   │   │   └── ticketRoutes.js
│   │   ├── services/
│   │   │   └── ticketService.js
│   │   └── utils/
│   │       ├── phoneHelper.js
│   │       └── slaHelper.js
│   │
│   └── frontend/             # Giao diện frontend tĩnh
│       ├── app.js
│       ├── index.html
│       ├── phones-dataset.js
│       └── style.css
│
└── tests/                     # Test tự động
    ├── smoke.test.js
    └── ticket.test.js
```

### Ý nghĩa từng phần chính
- `docs/`: Chứa tài liệu nghiệp vụ, đặc tả hệ thống, sơ đồ kiến trúc, API contract.
- `data/`: Chứa dữ liệu mẫu nhỏ phục vụ phát triển cục bộ và test nhanh.
- `dataset/`: Chứa dữ liệu nghiệp vụ chính, được sinh từ script và dùng cho nghiên cứu, kiểm thử, ETL.
- `src/backend/`: Chứa API, business logic, repository, validation, schema database.
- `src/frontend/`: Chứa giao diện người dùng và logic client-side.
- `tests/`: Chứa các bộ test tự động liên quan đến API và smoke test.

## 5. Kiểm thử
npm test → hiển thị số test PASS (10/10 tests passed)

## 6. Trạng thái hiện tại
- [x] Khởi tạo project, smoke test chạy được (buổi 2)
- [ ] Module tiếp nhận yêu cầu (buổi 8–10)
- [ ] Module phân công kỹ thuật viên (buổi 10–12)
