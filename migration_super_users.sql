-- Migration: Create super_users table for supervisor/super admin role management
-- Run this against your MySQL database before using /api/supervisor
--
-- #1046 "No database selected" fix:
--   In phpMyAdmin: click your database in the LEFT SIDEBAR first, then open
--   the SQL tab and run this script. The selected database is used automatically.
--
--   Or, if running from a different client, uncomment and set the line below
--   (replace your_database_name with your DB_NAME or DB_SCHEMA from .env):
-- USE your_database_name;
--
-- This table stores super user/supervisor accounts with role-based navigation permissions.
-- The navigation_permissions field stores JSON data defining which navigation items are active.

CREATE TABLE IF NOT EXISTS super_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL COMMENT 'References users.uid',
  email VARCHAR(255) NOT NULL COMMENT 'Super user email (for identification)',
  display_name VARCHAR(255) NULL COMMENT 'Display name for the super user',
  is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Native active status (1 = active, 0 = inactive)',
  navigation_permissions JSON NOT NULL COMMENT 'Role-based navigation permissions as JSON',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_super_users_user_id (user_id),
  UNIQUE KEY uk_super_users_email (email),
  INDEX idx_super_users_is_active (is_active),
  INDEX idx_super_users_created_at (created_at)
);

-- Optional foreign key (uncomment if you want referential integrity)
-- ALTER TABLE super_users ADD CONSTRAINT fk_super_users_user_id FOREIGN KEY (user_id) REFERENCES users(uid) ON DELETE CASCADE;

-- Example navigation_permissions JSON structure:
-- {
--   "my_events": true,
--   "leads": {
--     "enabled": true,
--     "channel_leads": true,
--     "missed_checkouts": true
--   },
--   "bookings": {
--     "enabled": true,
--     "all_bookings": true,
--     "transactions": true,
--     "settlements": true,
--     "customers": true,
--     "refunds": true
--   },
--   "calendar": true,
--   "coupons": true,
--   "operations": true,
--   "oneinbox": true,
--   "onelink": true,
--   "instagram": true,
--   "whatsapp": true,
--   "pickup_points": true,
--   "analytics": {
--     "enabled": true,
--     "lead_analytics": true,
--     "booking_analytics": true
--   },
--   "policies": true,
--   "settings": true,
--   "user_management": true
-- }
