-- Curated categories for frontend (e.g. homepage carousel)
-- Run this on your MySQL schema (e.g. u690251984_yashop8848)

CREATE TABLE IF NOT EXISTS curated_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  image VARCHAR(1024) DEFAULT NULL,
  tag VARCHAR(255) DEFAULT NULL,
  main_category VARCHAR(255) DEFAULT NULL,
  sub_category VARCHAR(255) DEFAULT NULL,
  sort_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active (is_active),
  INDEX idx_sort (sort_order)
);
