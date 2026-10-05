-- ========================================================
-- CƠ SỞ DỮ LIỆU PHÂN HỆ TIẾP NHẬN BẢO HÀNH (LUỒNG L2)
-- Hệ thống: Mekong Mobile CRM
-- Quản trị CSDL: PostgreSQL 15 / 16
-- Sinh viên: Nguyễn Bá Anh Khôi - 2374802010247 (Track SE)
-- Chuẩn hóa: 3NF - Tối ưu toàn vẹn ACID (NFR3) & Hiệu năng tra cứu (NFR1)
-- ========================================================

-- 1. Bảng Trung tâm bảo hành (Service Center - 6 trung tâm chi nhánh)
CREATE TABLE IF NOT EXISTS service_center (
    center_id   SERIAL PRIMARY KEY,
    center_code VARCHAR(20) NOT NULL UNIQUE,
    center_name VARCHAR(120) NOT NULL,
    thanh_pho   VARCHAR(60) NOT NULL
);

-- 2. Bảng Danh mục Nhóm sự cố (Issue Category - 6 nhóm lỗi chuẩn hóa)
CREATE TABLE IF NOT EXISTS issue_category (
    category_id      SERIAL PRIMARY KEY,
    category_name    VARCHAR(60) NOT NULL UNIQUE, -- MAN_HINH, PIN, SAC, PHAN_MEM, NUOC_VAO, KHAC
    default_priority VARCHAR(20) NOT NULL CHECK (default_priority IN ('CAO', 'TRUNG_BINH', 'THAP')),
    is_active        BOOLEAN NOT NULL DEFAULT TRUE
);

-- 3. Bảng Khách hàng (Customer - Định danh duy nhất theo QT-01)
CREATE TABLE IF NOT EXISTS customer (
    customer_id BIGSERIAL PRIMARY KEY,
    full_name   VARCHAR(120) NOT NULL,
    phone       VARCHAR(20)  NOT NULL UNIQUE, -- QT-01: Khóa nghiệp vụ duy nhất chống tạo trùng hồ sơ
    email       VARCHAR(120),
    address     VARCHAR(255),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 4. Bảng Thiết bị của khách hàng (Device)
CREATE TABLE IF NOT EXISTS device (
    device_id       BIGSERIAL PRIMARY KEY,
    customer_id     BIGINT NOT NULL,
    serial_no       VARCHAR(50) NOT NULL UNIQUE, -- Số IMEI / Serial duy nhất
    purchase_date   DATE,
    warranty_months SMALLINT NOT NULL DEFAULT 12 CHECK (warranty_months > 0),
    CONSTRAINT fk_device_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE RESTRICT
);

-- 5. Bảng Phiếu tiếp nhận bảo hành (Ticket - Bảng trung tâm phân hệ L2)
CREATE TABLE IF NOT EXISTS ticket (
    ticket_id     BIGSERIAL PRIMARY KEY,
    ticket_code   VARCHAR(30) NOT NULL UNIQUE, -- Mã sinh tự động: BH-xxxxxx/yyyy
    customer_id   BIGINT NOT NULL,
    device_id     BIGINT,                      -- Cho phép NULL nếu khách chưa xác định máy
    center_id     INT NOT NULL,
    category_id   INT,                         -- Cho phép NULL nếu chưa phân loại nhóm sự cố

    -- QT-03, AC2.2: Mô tả lỗi tối thiểu 10 ký tự
    issue_desc    TEXT NOT NULL CHECK (length(issue_desc) >= 10),

    -- QT-06: Mức ưu tiên chỉ nhận 3 giá trị cố định
    priority      VARCHAR(20) NOT NULL CHECK (priority IN ('CAO', 'TRUNG_BINH', 'THAP')),

    -- QT-06: Vòng đời trạng thái một chiều, chỉ nhận 6 giá trị hợp lệ
    status        VARCHAR(30) NOT NULL DEFAULT 'MOI'
                  CHECK (status IN ('MOI', 'DA_PHAN_CONG', 'DANG_XU_LY', 'CHO_LINH_KIEN', 'HOAN_TAT', 'DA_HUY')),

    received_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date      TIMESTAMPTZ NOT NULL,        -- QT-04: Tự động tính toán theo SLA Engine
    closed_at     TIMESTAMPTZ,
    is_warranty   BOOLEAN NOT NULL DEFAULT TRUE, -- QT-05: Kết quả đối soát ERP
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ràng buộc logic giữa hai cột thời gian: ngày đóng phải sau ngày tiếp nhận
    CONSTRAINT chk_closed_after_received CHECK (closed_at IS NULL OR closed_at >= received_at),

    CONSTRAINT fk_ticket_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE RESTRICT,
    CONSTRAINT fk_ticket_device   FOREIGN KEY (device_id)   REFERENCES device(device_id) ON DELETE SET NULL,
    CONSTRAINT fk_ticket_category FOREIGN KEY (category_id) REFERENCES issue_category(category_id) ON DELETE RESTRICT,
    CONSTRAINT fk_ticket_center   FOREIGN KEY (center_id)   REFERENCES service_center(center_id) ON DELETE RESTRICT
);

-- 6. Bảng Lịch sử chuyển trạng thái (Ticket Status Log - QT-06 Audit Trail)
CREATE TABLE IF NOT EXISTS ticket_status_log (
    log_id      BIGSERIAL PRIMARY KEY,
    ticket_id   BIGINT NOT NULL,
    from_status VARCHAR(30),                   -- NULL khi khởi tạo phiếu lần đầu
    to_status   VARCHAR(30) NOT NULL,
    changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    changed_by  VARCHAR(100) NOT NULL,         -- Định danh nhân viên thực hiện (VD: RECEPTIONIST-01)
    note        VARCHAR(255),
    CONSTRAINT fk_log_ticket FOREIGN KEY (ticket_id) REFERENCES ticket(ticket_id) ON DELETE CASCADE
);

-- ========================================================
-- CHỈ MỤC INDEX TỐI ƯU HÓA HIỆU NĂNG THEO YÊU CẦU PHI CHỨC NĂNG
-- ========================================================

-- 1. Phục vụ NFR1 & US1: Tra cứu hồ sơ khách hàng theo SĐT < 500ms trên 67.037 bản ghi (B-Tree O(log N))
CREATE INDEX IF NOT EXISTS idx_customer_phone ON customer(phone);

-- 2. Phục vụ NFR1, FR6 & FR7: Lọc danh sách theo trạng thái và sắp xếp theo hạn SLA (tránh in-memory sort)
--    Đây là Composite Index phục vụ cả bộ lọc và ORDER BY trong một lần quét duy nhất.
CREATE INDEX IF NOT EXISTS idx_ticket_status_due ON ticket(status, due_date);

-- 3. Phục vụ tra cứu nhanh chi tiết phiếu theo mã biên nhận vật lý giao khách (FR9)
CREATE INDEX IF NOT EXISTS idx_ticket_code ON ticket(ticket_code);

-- 4. Phục vụ quản lý trung tâm lọc khối lượng công việc theo chi nhánh (FR6, US6)
CREATE INDEX IF NOT EXISTS idx_ticket_center ON ticket(center_id);

-- 5. Phục vụ đối soát thiết bị theo số IMEI/Serial (FR8, QT-05)
CREATE INDEX IF NOT EXISTS idx_device_serial ON device(serial_no);

-- 6. Phục vụ hiển thị dòng thời gian kiểm toán theo thứ tự thời gian (FR5, US5, NFR3)
--    Composite Index cho phép truy vấn theo ticket_id và sắp xếp theo changed_at mà không tốn chi phí sort.
CREATE INDEX IF NOT EXISTS idx_status_log_ticket ON ticket_status_log(ticket_id, changed_at);
