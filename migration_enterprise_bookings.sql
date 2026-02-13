-- =============================================================================
-- ENTERPRISE BOOKINGS MIGRATION
-- Run this against your MySQL database to upgrade to financial-grade schema.
-- Rules: Strict ENUMs, no physical deletes on bookings, immutable settlements,
--        append-only transactions, full audit logging.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. BOOKINGS TABLE (alter existing or create if not exists)
--    Add ENUM columns and soft-delete. Never DELETE rows; use is_deleted = TRUE.
-- -----------------------------------------------------------------------------

-- If you already have a bookings table, run each ALTER below once.
-- If you get "Duplicate column" error, that column already exists – skip that statement.

ALTER TABLE bookings ADD COLUMN booking_status ENUM('PENDING','CONFIRMED','CANCELLED') NOT NULL DEFAULT 'PENDING';
ALTER TABLE bookings ADD COLUMN payment_status ENUM('UNPAID','PAID','PARTIALLY_PAID','REFUND_INITIATED','REFUNDED') NOT NULL DEFAULT 'UNPAID';
ALTER TABLE bookings ADD COLUMN settlement_status ENUM('NOT_SETTLED','PENDING','SETTLED') NOT NULL DEFAULT 'NOT_SETTLED';
ALTER TABLE bookings ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Optional: backfill booking_status from existing status column (uncomment if you have a varchar status column)
-- UPDATE bookings SET booking_status = UPPER(REPLACE(COALESCE(status,'pending'), ' ', '_')) WHERE booking_status = 'PENDING' AND (status IS NOT NULL AND status != '');

-- Indexes for soft-delete and listing (ignore "Duplicate key" if index exists)
CREATE INDEX idx_bookings_is_deleted ON bookings(is_deleted);
CREATE INDEX idx_bookings_booking_status ON bookings(booking_status);
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);

-- -----------------------------------------------------------------------------
-- 2. TRANSACTIONS TABLE (Financial ledger – INSERT only, never UPDATE)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(36) PRIMARY KEY,
  booking_id VARCHAR(36) NOT NULL,
  transaction_type ENUM('PAYMENT','REFUND','ADJUSTMENT') NOT NULL,
  payment_method ENUM('ONLINE','MANUAL','UPI','CARD','BANK_TRANSFER') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status ENUM('PENDING','SUCCESS','FAILED') NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  INDEX idx_transactions_booking (booking_id),
  INDEX idx_transactions_created (created_at)
);

-- -----------------------------------------------------------------------------
-- 3. SETTLEMENTS TABLE (Immutable – never UPDATE; insert new row for adjustments)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS settlements (
  id VARCHAR(36) PRIMARY KEY,
  booking_id VARCHAR(36) NOT NULL,
  gross_amount DECIMAL(12,2) NOT NULL,
  vendor_cost DECIMAL(12,2) NOT NULL,
  commission DECIMAL(12,2) NOT NULL,
  processing_fee DECIMAL(12,2) NOT NULL,
  deduction DECIMAL(12,2) NOT NULL,
  net_amount DECIMAL(12,2) NOT NULL,
  status ENUM('PENDING','PROCESSED') NOT NULL DEFAULT 'PENDING',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  INDEX idx_settlements_booking (booking_id),
  INDEX idx_settlements_status (status)
);

-- -----------------------------------------------------------------------------
-- 4. REFUNDS TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS refunds (
  id VARCHAR(36) PRIMARY KEY,
  booking_id VARCHAR(36) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  reason TEXT,
  status ENUM('REQUESTED','APPROVED','PROCESSED','REJECTED') NOT NULL DEFAULT 'REQUESTED',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  INDEX idx_refunds_booking (booking_id),
  INDEX idx_refunds_status (status)
);

-- -----------------------------------------------------------------------------
-- 5. AUDIT_LOGS TABLE (Log every CREATE, UPDATE, CANCEL, REFUND)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(36) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  old_data JSON,
  new_data JSON,
  performed_by VARCHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_entity (entity_type, entity_id),
  INDEX idx_audit_created (created_at),
  INDEX idx_audit_performed_by (performed_by)
);

-- =============================================================================
-- END MIGRATION
-- =============================================================================
