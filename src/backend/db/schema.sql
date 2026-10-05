-- ========================================================
-- CƠ SỞ DỮ LIỆU PHÂN HỆ TIẾP NHẬN BẢO HÀNH (LUỒNG L2)
-- Hệ thống: Mekong Mobile CRM
-- Quản trị CSDL: PostgreSQL 18
-- ========================================================

-- 1. Bảng Trung tâm bảo hành (Service Center)
CREATE TABLE IF NOT EXISTS service_center (
    center_id   SERIAL PRIMARY KEY,
    center_code VARCHAR(20) NOT NULL UNIQUE,
    center_name VARCHAR(120) NOT NULL,
    thanh_pho   VARCHAR(60) NOT NULL
);

-- 2. Bảng Danh mục Nhóm sự cố (Issue Category)
CREATE TABLE IF NOT EXISTS issue_category (
    category_id      SERIAL PRIMARY KEY,
    category_name    VARCHAR(60) NOT NULL UNIQUE,
    default_priority VARCHAR(10) NOT NULL,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE
);

-- 3. Bảng Khách hàng (Customer - QT-01 với UNIQUE phone)
CREATE TABLE IF NOT EXISTS customer (
    customer_id BIGSERIAL PRIMARY KEY,
    full_name   VARCHAR(120) NOT NULL,
    phone       VARCHAR(20)  NOT NULL UNIQUE,
    email       VARCHAR(120),
    address     VARCHAR(255),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 4. Bảng Thiết bị (Device)
CREATE TABLE IF NOT EXISTS device (
    device_id       BIGSERIAL PRIMARY KEY,
    customer_id     BIGINT NOT NULL,
    serial_no       VARCHAR(50) NOT NULL UNIQUE,
    purchase_date   DATE,
    warranty_months SMALLINT NOT NULL DEFAULT 12,
    CONSTRAINT fk_device_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE RESTRICT
);

-- 5. Bảng Phiếu tiếp nhận bảo hành (Ticket - Bảng trung tâm L2)
CREATE TABLE IF NOT EXISTS ticket (
    ticket_id   BIGSERIAL PRIMARY KEY,
    ticket_code VARCHAR(30) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL,
    device_id   BIGINT,
    center_id   INT NOT NULL,
    category_id INT,
    issue_desc  TEXT NOT NULL,
    priority    VARCHAR(20) NOT NULL,
    status      VARCHAR(30) NOT NULL,
    received_at TIMESTAMP NOT NULL DEFAULT NOW(),
    due_date    TIMESTAMP NOT NULL,
    closed_at   TIMESTAMP,
    is_warranty BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_ticket_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE RESTRICT,
    CONSTRAINT fk_ticket_device   FOREIGN KEY (device_id)   REFERENCES device(device_id) ON DELETE SET NULL,
    CONSTRAINT fk_ticket_category FOREIGN KEY (category_id) REFERENCES issue_category(category_id) ON DELETE RESTRICT,
    CONSTRAINT fk_ticket_center   FOREIGN KEY (center_id)   REFERENCES service_center(center_id) ON DELETE RESTRICT
);

-- 6. Bảng Lịch sử chuyển trạng thái (Ticket Status Log - QT-06)
CREATE TABLE IF NOT EXISTS ticket_status_log (
    log_id      BIGSERIAL PRIMARY KEY,
    ticket_id   BIGINT NOT NULL,
    from_status VARCHAR(30),
    to_status   VARCHAR(30) NOT NULL,
    changed_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    changed_by  VARCHAR(100) NOT NULL,
    note        VARCHAR(255),
    CONSTRAINT fk_log_ticket FOREIGN KEY (ticket_id) REFERENCES ticket(ticket_id) ON DELETE CASCADE
);

-- Tạo Index tối ưu hóa truy vấn (NFR1 - tìm kiếm số điện thoại < 500ms)
CREATE INDEX IF NOT EXISTS idx_customer_phone ON customer(phone);
CREATE INDEX IF NOT EXISTS idx_ticket_code ON ticket(ticket_code);
CREATE INDEX IF NOT EXISTS idx_ticket_status ON ticket(status);
CREATE INDEX IF NOT EXISTS idx_ticket_center ON ticket(center_id);
CREATE INDEX IF NOT EXISTS idx_device_serial ON device(serial_no);
CREATE INDEX IF NOT EXISTS idx_status_log_ticket ON ticket_status_log(ticket_id);
