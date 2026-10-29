-- Additive migration: preserve existing rows, never infer that old warranties were verified.
ALTER TABLE ticket ADD COLUMN IF NOT EXISTS warranty_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE ticket ADD COLUMN IF NOT EXISTS warranty_exception_approved BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE ticket ADD COLUMN IF NOT EXISTS warranty_approved_by VARCHAR(100);
ALTER TABLE ticket ADD COLUMN IF NOT EXISTS warranty_approved_at TIMESTAMPTZ;
ALTER TABLE ticket ADD COLUMN IF NOT EXISTS service_consent BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE ticket ADD COLUMN IF NOT EXISTS service_consent_by VARCHAR(100);
ALTER TABLE ticket ADD COLUMN IF NOT EXISTS service_consent_at TIMESTAMPTZ;
ALTER TABLE ticket DROP CONSTRAINT IF EXISTS ticket_status_check;
ALTER TABLE ticket ADD CONSTRAINT ticket_status_check CHECK
  (status IN ('MOI', 'DA_PHAN_CONG', 'DANG_XU_LY', 'CHO_LINH_KIEN', 'HOAN_TAT', 'DA_BAN_GIAO', 'DA_DONG', 'DA_HUY'));

-- The index rejects simultaneous open tickets even across multiple processes.
DROP INDEX IF EXISTS uq_ticket_open_device;
CREATE UNIQUE INDEX uq_ticket_open_device ON ticket(device_id)
  WHERE device_id IS NOT NULL AND status NOT IN ('HOAN_TAT', 'DA_BAN_GIAO', 'DA_DONG', 'DA_HUY');
CREATE UNIQUE INDEX IF NOT EXISTS uq_device_normalized_serial ON device (lower(btrim(serial_no)));
