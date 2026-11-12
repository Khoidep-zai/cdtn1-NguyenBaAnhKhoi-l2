-- Run after schema.sql and ticket-integrity.sql. Additive and rerunnable.
BEGIN;
ALTER TABLE ticket ADD COLUMN IF NOT EXISTS product_id INTEGER;
CREATE TABLE IF NOT EXISTS ticket_handover_photo (
 ticket_id BIGINT PRIMARY KEY REFERENCES ticket(ticket_id) ON DELETE CASCADE,
 bytes BYTEA NOT NULL CHECK (octet_length(bytes)<=8388608),
 content_type TEXT NOT NULL CHECK(content_type IN ('image/jpeg','image/png','image/webp')),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Ensure standard seed/demo customers for US1 / QT-01 verification
INSERT INTO customer (full_name, phone, email, address)
VALUES
 ('Trần Văn A', '0901234567', 'tranvana@gmail.com', '123 Đường 30/4, Quận Ninh Kiều, Cần Thơ'),
 ('Nguyễn Văn An', '0909123456', 'nguyenvanan@gmail.com', '456 Đại lộ Hòa Bình, Ninh Kiều, Cần Thơ')
ON CONFLICT (phone) DO UPDATE SET full_name = EXCLUDED.full_name;

-- CSV imports supplied explicit IDs. Bring sequences forward without ever rewinding them.
LOCK TABLE customer,device,ticket IN SHARE ROW EXCLUSIVE MODE;
SELECT setval('customer_customer_id_seq',GREATEST((SELECT last_value FROM customer_customer_id_seq),COALESCE((SELECT max(customer_id) FROM customer),1)),true);
SELECT setval('device_device_id_seq',GREATEST((SELECT last_value FROM device_device_id_seq),COALESCE((SELECT max(device_id) FROM device),1)),true);
SELECT setval('ticket_ticket_id_seq',GREATEST((SELECT last_value FROM ticket_ticket_id_seq),COALESCE((SELECT max(ticket_id) FROM ticket),1)),true);
COMMIT;
