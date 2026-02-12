-- Migration: Create youtube_links table for "Experience yourself" / YouTube videos section
-- Run this against your MySQL database before using /api/youtube-links

CREATE TABLE IF NOT EXISTS youtube_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  url VARCHAR(1024) NOT NULL COMMENT 'YouTube video URL',
  title VARCHAR(255) NOT NULL,
  description VARCHAR(512) DEFAULT NULL COMMENT 'Optional caption/description under title',
  thumbnail VARCHAR(1024) DEFAULT NULL COMMENT 'Optional custom thumbnail URL (else use YouTube default)',
  sort_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1 COMMENT '1 = active (shown), 0 = inactive (hidden)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_active (is_active),
  INDEX idx_sort (sort_order)
);
