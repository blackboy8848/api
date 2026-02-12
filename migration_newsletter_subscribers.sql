-- Migration: Create newsletter_subscribers table for "Stay Updated" / Subscribe form
-- Run this against your MySQL database before using POST /api/subscribe

-- Stores email addresses from the newsletter signup. After subscribe we send a thank-you email.

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  subscribed TINYINT(1) DEFAULT 1 COMMENT '1 = subscribed, 0 = unsubscribed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uk_newsletter_subscribers_email (email),
  INDEX idx_newsletter_subscribers_subscribed (subscribed),
  INDEX idx_newsletter_subscribers_created_at (created_at)
);
