# MÔ HÌNH DỮ LIỆU & HỢP ĐỒNG API (API CONTRACT)
## Track Kỹ thuật phần mềm (SE) - Luồng L2

### 1. Kịch bản SQL DDL Skeleton (Mô hình ERD)

Dưới đây là kịch bản tạo 5 bảng cơ sở dữ liệu cốt lõi cho luồng L2 (Tiếp nhận và phân loại yêu cầu bảo hành). Toàn bộ bảng đều có khóa chính (PK) và thiết lập khóa ngoại (FK) hợp lệ.

```sql
-- 1. Bảng Khách hàng
CREATE TABLE customer (
    customer_id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(120),
    address VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Bảng Danh mục Nhóm sự cố
CREATE TABLE issue_category (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(60) NOT NULL UNIQUE, -- MAN_HINH, PIN, SAC, PHAN_MEM, NUOC_VAO, KHAC
    default_priority VARCHAR(10) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 3. Bảng Thiết bị
CREATE TABLE device (
    device_id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    serial_no VARCHAR(50) NOT NULL UNIQUE,
    purchase_date DATE,
    warranty_months SMALLINT NOT NULL DEFAULT 12,
    CONSTRAINT fk_device_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
);

-- 4. Bảng Phiếu bảo hành (Bảng trung tâm)
CREATE TABLE ticket (
    ticket_id BIGSERIAL PRIMARY KEY,
    ticket_code VARCHAR(20) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL,
    device_id BIGINT NOT NULL,
    center_id BIGINT NOT NULL,
    issue_desc TEXT NOT NULL,
    category_id INT,
    priority VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL, -- MOI, DA_PHAN_CONG, DANG_XU_LY, DA_HUY...
    received_at TIMESTAMP NOT NULL,
    due_date TIMESTAMP NOT NULL,
    closed_at TIMESTAMP,
    is_warranty BOOLEAN NOT NULL,
    CONSTRAINT fk_ticket_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
    CONSTRAINT fk_ticket_device FOREIGN KEY (device_id) REFERENCES device(device_id),
    CONSTRAINT fk_ticket_category FOREIGN KEY (category_id) REFERENCES issue_category(category_id)
);

-- 5. Bảng Lịch sử chuyển trạng thái
CREATE TABLE ticket_status_log (
    log_id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL,
    from_status VARCHAR(20),
    to_status VARCHAR(20) NOT NULL,
    changed_at TIMESTAMP NOT NULL,
    changed_by BIGINT NOT NULL, -- Tham chiếu tới Employee (Center Manager / Receptionist)
    note VARCHAR(255),
    CONSTRAINT fk_log_ticket FOREIGN KEY (ticket_id) REFERENCES ticket(ticket_id)
);
```

### 2. Danh mục API Endpoint

| Phương thức | Đường dẫn URL | Mục đích nghiệp vụ | User Story |
| :---: | :--- | :--- | :---: |
| `GET` | `/api/customers?phone={phone}` | Tra cứu hồ sơ khách hàng theo số điện thoại | US1 |
| `POST` | `/api/tickets` | Khởi tạo phiếu tiếp nhận bảo hành mới | US2, US3 |
| `PATCH` | `/api/tickets/{id}/status` | Cập nhật chuyển dịch trạng thái xử lý của phiếu | US4, US5 |
| `GET` | `/api/tickets?status=&center_id=` | Truy vấn danh sách phiếu (hỗ trợ lọc & phân trang) | US6 |

### 3. Đặc tả chi tiết Endpoint: `POST /api/tickets`

**Request Body (JSON):**
```json
{
  "customer_id": 1024,
  "device_id": 3311,
  "center_id": 2,
  "issue_desc": "Máy sạc không vào điện, cắm sạc báo lỗi phụ kiện không tương thích",
  "priority": "TRUNG_BINH",
  "category_id": 3
}
```

**Response 201 Created (Thành công):**
```json
{
  "ticket_id": 88231,
  "ticket_code": "BH-000231/2026",
  "status": "MOI",
  "received_at": "2026-09-08T14:30:00+07:00",
  "due_date": "2026-09-11T14:30:00+07:00"
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
