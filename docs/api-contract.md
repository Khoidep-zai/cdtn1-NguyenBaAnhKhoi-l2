# MÔ HÌNH DỮ LIỆU & HỢP ĐỒNG API (API CONTRACT)
## Luồng L2: Tiếp nhận và phân loại yêu cầu bảo hành

---

### 1. Sơ đồ thực thể quan hệ (ERD — Crow's Foot Notation)

Mô hình dữ liệu luồng L2 được thiết kế chuẩn hóa bậc 3 (3NF) gồm **5 bảng thực thể**, thể hiện đầy đủ khóa chính (PK), khóa ngoại (FK), các ràng buộc toàn vẹn và tỷ số lực lượng theo ký hiệu Crow's Foot (xem file `erd.drawio`).

#### Cấu trúc 5 bảng thực thể:

| Bảng | Mô tả | Khóa chính |
| :--- | :--- | :--- |
| `CUSTOMER` | Khách hàng — lưu hồ sơ định danh | `customer_id BIGSERIAL` |
| `DEVICE` | Thiết bị — mỗi máy cụ thể của khách | `device_id BIGSERIAL` |
| `TICKET` | Phiếu bảo hành — bảng trung tâm | `ticket_id BIGSERIAL` |
| `ISSUE_CATEGORY` | Danh mục nhóm sự cố | `category_id SERIAL` |
| `TICKET_STATUS_LOG` | Nhật ký chuyển trạng thái | `log_id BIGSERIAL` |

#### Quan hệ giữa các bảng (Crow's Foot):
- `CUSTOMER` **1 — 0..***: `DEVICE` (một khách hàng sở hữu 0 đến nhiều thiết bị)
- `CUSTOMER` **1 — 0..***: `TICKET` (một khách hàng có thể có nhiều phiếu)
- `DEVICE` **1 — 0..***: `TICKET` (một thiết bị có thể có nhiều phiếu bảo hành)
- `ISSUE_CATEGORY` **0..1 — 0..***: `TICKET` (`category_id` cho phép NULL - phiếu chưa phân loại)
- `TICKET` **1 — 1..***: `TICKET_STATUS_LOG` (một phiếu bắt buộc có ít nhất 1 bản ghi log)

#### Ràng buộc nghiệp vụ cốt lõi:
- **QT-01:** SĐT khách hàng là UNIQUE. Trùng SĐT sẽ tái sử dụng hồ sơ.
- **QT-04:** Hạn SLA sinh tự động theo Priority (CAO: 24h, TRUNG_BÌNH: 72h, THẤP: 120h).
- **QT-06:** Chuyển trạng thái 1 chiều, mọi thay đổi đều ghi vào `ticket_status_log`.
- *(1) `center_id` tham chiếu thực thể Trung tâm bảo hành, nằm ngoài phạm vi sơ đồ ERD này.*
- *(2) `changed_by` tham chiếu thực thể Người dùng/Nhân viên, nằm ngoài phạm vi sơ đồ ERD này.*

---

### 2. Kịch bản SQL DDL Skeleton (PostgreSQL)

Mã nguồn SQL DDL tạo cấu trúc **5 bảng cơ sở dữ liệu**, đảm bảo 100% bảng có khóa chính và thiết lập khóa ngoại hợp lệ:

```sql
-- 1. Bảng Khách hàng (Thực thi quy tắc QT-01 với UNIQUE phone)
CREATE TABLE customer (
    customer_id BIGSERIAL PRIMARY KEY,
    full_name   VARCHAR(120) NOT NULL,
    phone       VARCHAR(20)  NOT NULL UNIQUE,  -- QT-01: Khóa nghiệp vụ duy nhất
    email       VARCHAR(120),
    address     VARCHAR(255),
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- 2. Bảng Danh mục Nhóm sự cố
CREATE TABLE issue_category (
    category_id      SERIAL      PRIMARY KEY,
    category_name    VARCHAR(60) NOT NULL UNIQUE,  -- MAN_HINH, PIN, SAC, PHAN_MEM, NUOC_VAO, KHAC
    default_priority VARCHAR(10) NOT NULL,
    is_active        BOOLEAN     NOT NULL DEFAULT TRUE
);

-- 3. Bảng Thiết bị
CREATE TABLE device (
    device_id      BIGSERIAL   PRIMARY KEY,
    customer_id    BIGINT      NOT NULL,
    serial_no      VARCHAR(50) NOT NULL UNIQUE,  -- Số Serial / IMEI
    purchase_date  DATE,
    warranty_months SMALLINT   NOT NULL DEFAULT 12,
    CONSTRAINT fk_device_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
);

-- 4. Bảng Phiếu bảo hành (Bảng trung tâm)
CREATE TABLE ticket (
    ticket_id   BIGSERIAL   PRIMARY KEY,
    ticket_code VARCHAR(20) NOT NULL UNIQUE,   -- Định dạng: BH-xxxxxx/yyyy
    customer_id BIGINT      NOT NULL,
    device_id   BIGINT      NOT NULL,
    center_id   BIGINT      NOT NULL,          -- FK → service_center (ngoài phạm vi sơ đồ)
    category_id INT,                           -- NULL khi phiếu chưa phân loại
    issue_desc  TEXT        NOT NULL,
    priority    VARCHAR(10) NOT NULL,          -- CAO | TRUNG_BINH | THAP
    status      VARCHAR(20) NOT NULL,          -- MOI | DA_PHAN_CONG | DANG_XU_LY | DA_HUY
    received_at TIMESTAMP   NOT NULL,
    due_date    TIMESTAMP   NOT NULL,          -- QT-04: Tự động tính theo priority
    closed_at   TIMESTAMP,
    is_warranty BOOLEAN     NOT NULL,          -- QT-05: Kết quả xác minh bảo hành
    CONSTRAINT fk_ticket_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
    CONSTRAINT fk_ticket_device   FOREIGN KEY (device_id)   REFERENCES device(device_id),
    CONSTRAINT fk_ticket_category FOREIGN KEY (category_id) REFERENCES issue_category(category_id)
);

-- 5. Bảng Lịch sử chuyển trạng thái (QT-06)
CREATE TABLE ticket_status_log (
    log_id      BIGSERIAL   PRIMARY KEY,
    ticket_id   BIGINT      NOT NULL,
    from_status VARCHAR(20),                   -- NULL khi tạo lần đầu
    to_status   VARCHAR(20) NOT NULL,
    changed_at  TIMESTAMP   NOT NULL,
    changed_by  BIGINT      NOT NULL,          -- FK → employee (ngoài phạm vi sơ đồ)
    note        VARCHAR(255),
    CONSTRAINT fk_log_ticket FOREIGN KEY (ticket_id) REFERENCES ticket(ticket_id)
);
```

---

### 3. Hợp đồng API (API Contract Specification)

Đặc tả kỹ thuật giao tiếp giữa Frontend và Backend, làm căn cứ nghiệm thu và thiết lập bộ kiểm thử tự động.

#### 3.1 Danh mục Endpoint chính của Luồng L2

| Phương thức | Đường dẫn URL Endpoint | Mục đích nghiệp vụ | User Story |
| :---: | :--- | :--- | :---: |
| `GET` | `/api/customers?phone={phone}` | Tra cứu hồ sơ khách hàng theo số điện thoại (QT-01) | US1 |
| `POST` | `/api/customers` | Đăng ký mới hồ sơ khách hàng khi chưa tồn tại | US1 |
| `GET` | `/api/devices/{serial}/warranty` | Đối soát dữ liệu bảo hành thiết bị từ hệ thống ERP (QT-05) | US8 |
| `POST` | `/api/tickets` | Khởi tạo phiếu tiếp nhận bảo hành mới (FR2, QT-04) | US2, US4 |
| `GET` | `/api/tickets?status=&center_id=` | Truy vấn danh sách phiếu (lọc và phân trang) | US6 |
| `GET` | `/api/tickets?overdue=true` | Lấy danh sách phiếu sắp hoặc đã quá hạn SLA | US7 |
| `GET` | `/api/tickets/{id}` | Xem chi tiết phiếu kèm dòng thời gian lịch sử trạng thái | US5 |
| `PATCH` | `/api/tickets/{id}/status` | Cập nhật trạng thái phiếu và ghi nhật ký kiểm toán (QT-06) | US3, US5 |
| `GET` | `/api/categories` | Lấy danh mục 6 nhóm lỗi từ issue_categories | US2 |
| `GET` | `/api/centers` | Lấy danh mục 6 trung tâm bảo hành từ service_centers | US6 |

#### 3.2 Đặc tả chi tiết Endpoint: `POST /api/tickets`

**Request Body (JSON):**
```json
{
  "customer_id": 1024,
  "device_id": 3311,
  "center_id": 1,
  "category_id": 2,
  "priority": "CAO",
  "issue_desc": "Máy sập nguồn khi pin còn 20%, cắm sạc thì thân máy nóng rát"
}
```

**Response 201 Created (Khởi tạo thành công kèm SLA tự động theo QT-04):**
```json
{
  "success": true,
  "message": "Tạo phiếu bảo hành thành công",
  "data": {
    "ticket_id": 1001,
    "ticket_code": "BH-000231/2026",
    "status": "MOI",
    "priority": "CAO",
    "received_at": "2026-09-08T14:30:00+07:00",
    "due_date": "2026-09-09T14:30:00+07:00",
    "is_warranty": true
  }
}
```

**Response 400 Bad Request (Dữ liệu không hợp lệ):**
```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Dữ liệu gửi lên không thỏa mãn quy tắc kiểm tra",
    "fields": {
      "issue_desc": "Mô tả sự cố là trường bắt buộc và phải có từ 10 ký tự trở lên"
    }
  }
}
```

#### 3.3 Bảng quy tắc Validation chi tiết

| Tên trường | Bắt buộc | Kiểu dữ liệu / Ràng buộc | Thông báo lỗi khi vi phạm |
| :--- | :---: | :--- | :--- |
| `customer_id` | Có | Số nguyên dương, tồn tại trong bảng `customer` | Không tìm thấy hồ sơ khách hàng |
| `device_id` | Có | Số nguyên dương, phải thuộc quyền sở hữu của khách | Thiết bị không thuộc sở hữu của khách hàng này |
| `center_id` | Có | Số nguyên dương từ 1 đến 6 (thuộc `service_centers`) | Mã trung tâm tiếp nhận không hợp lệ |
| `category_id` | Có | Số nguyên từ 1 đến 6 (thuộc `issue_categories`) | Nhóm sự cố không tồn tại trong danh mục |
| `priority` | Có | Enum: `CAO`, `TRUNG_BINH`, `THAP` | Mức ưu tiên không hợp lệ (cho phép: CAO, TRUNG_BINH, THAP) |
| `issue_desc` | Có | Kiểu chuỗi, độ dài từ 10 đến 2000 ký tự | Mô tả sự cố là trường bắt buộc và phải có từ 10 ký tự trở lên |
