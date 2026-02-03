-- Migration: Create members table for storing member details (name, mobile number)
-- Run this against your MySQL database before using /api/members
-- Members can optionally be linked to a booking via booking_id

CREATE TABLE IF NOT EXISTS members (
  id VARCHAR(255) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  mobile_number VARCHAR(20) NOT NULL,

  -- Optional: link member to a booking (e.g. travellers on that booking)
  booking_id VARCHAR(255) NULL,

  created_at DATETIME NULL DEFAULT NULL,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_members_booking_id (booking_id),
  INDEX idx_members_mobile (mobile_number(15)),
  INDEX idx_members_name (name(100))
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional foreign key (uncomment if you want referential integrity)
-- ALTER TABLE members ADD CONSTRAINT fk_members_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;
