-- Migration: Create pickup_points table for pickup locations (Location, Map Link, Status)
-- Run this against your MySQL database before using /api/pickup-points

CREATE TABLE IF NOT EXISTS pickup_points (
  id VARCHAR(255) NOT NULL PRIMARY KEY,
  location_name VARCHAR(255) NOT NULL COMMENT 'e.g. Mashuri Gate Metro Station',
  map_link VARCHAR(500) NOT NULL COMMENT 'e.g. https://maps.google.com/?q=28.6692,77.2285',
  status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',

  created_at DATETIME NULL DEFAULT NULL,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_pickup_points_status (status),
  INDEX idx_pickup_points_location (location_name(100))
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
