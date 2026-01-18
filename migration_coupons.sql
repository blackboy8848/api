-- Migration: Create coupons, coupon_events, and coupon_slots tables
-- Run this against your MySQL database before using /api/coupons
--
-- #1046 "No database selected" fix:
--   In phpMyAdmin: click your database in the LEFT SIDEBAR first, then open
--   the SQL tab and run this script. The selected database is used automatically.
--
--   Or, if running from a different client, uncomment and set the line below
--   (replace your_database_name with your DB_NAME or DB_SCHEMA from .env):
-- USE your_database_name;
--
-- Prerequisites: `events` and `tour_slots` must exist. If they do not, create
-- coupon_events and coupon_slots without the FOREIGN KEY CONSTRAINT lines.
--
-- Coupon Level: company (Company Level), event (Event Level), batch (Batch Level)
-- Discount Type: percentage (%), fixed (Fixed Amount)
-- Discount Applicable: per_person, per_order, per_ticket
-- Coupon Type: private, public
-- Validity Type: fixed_date, relative_date

CREATE TABLE IF NOT EXISTS coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  coupon_level ENUM('company', 'event', 'batch') NOT NULL DEFAULT 'event',
  coupon_code VARCHAR(100) NOT NULL,
  discount_type ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
  discount_applicable ENUM('per_person', 'per_order', 'per_ticket') NOT NULL DEFAULT 'per_person',
  discount DECIMAL(10, 2) NOT NULL,
  coupon_inventory INT NOT NULL DEFAULT 0,
  group_size INT NULL COMMENT 'Min/max group size for coupon to apply',
  affiliate_email VARCHAR(255) NULL,
  coupon_type ENUM('private', 'public') NOT NULL DEFAULT 'private',
  valid_from DATE NULL,
  valid_till DATE NULL,
  validity_type ENUM('fixed_date', 'relative_date') NOT NULL DEFAULT 'fixed_date',
  company_id VARCHAR(255) NULL COMMENT 'Optional: for company-level scoping',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_coupons_code (coupon_code),
  INDEX idx_coupons_level (coupon_level),
  INDEX idx_coupons_type (coupon_type),
  INDEX idx_coupons_valid_from (valid_from),
  INDEX idx_coupons_valid_till (valid_till),
  INDEX idx_coupons_created_at (created_at)
);

-- Join table: coupon <-> events (for event-level and batch-level; event-level uses this only)
CREATE TABLE IF NOT EXISTS coupon_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  coupon_id INT NOT NULL,
  event_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uk_coupon_events (coupon_id, event_id),
  INDEX idx_coupon_events_coupon (coupon_id),
  INDEX idx_coupon_events_event (event_id),
  CONSTRAINT fk_coupon_events_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
  CONSTRAINT fk_coupon_events_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Join table: coupon <-> tour_slots (batches) for batch-level coupons
CREATE TABLE IF NOT EXISTS coupon_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  coupon_id INT NOT NULL,
  slot_id INT NOT NULL COMMENT 'tour_slots.id',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uk_coupon_slots (coupon_id, slot_id),
  INDEX idx_coupon_slots_coupon (coupon_id),
  INDEX idx_coupon_slots_slot (slot_id),
  CONSTRAINT fk_coupon_slots_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
  CONSTRAINT fk_coupon_slots_slot FOREIGN KEY (slot_id) REFERENCES tour_slots(id) ON DELETE CASCADE
);
