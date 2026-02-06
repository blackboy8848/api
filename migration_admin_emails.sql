-- Migration: Admin Email Inbox – received emails and replies
-- Run this against your MySQL database before using /api/admin/emails
-- Used by Dashboard → Email (list, read, mark read, reply)

-- Inbox: received emails (contact form, booking, etc.)
CREATE TABLE IF NOT EXISTS admin_emails (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  from_email VARCHAR(255) NOT NULL,
  from_name VARCHAR(255) NULL,
  to_email VARCHAR(255) NOT NULL COMMENT 'Support/admin recipient',
  subject VARCHAR(500) NOT NULL,
  body TEXT NULL,
  body_html TEXT NULL,
  received_at DATETIME NULL DEFAULT NULL,
  read_at DATETIME NULL DEFAULT NULL COMMENT 'When first read (null = unread)',
  replied_at DATETIME NULL DEFAULT NULL,
  reply_message_id VARCHAR(36) NULL COMMENT 'Id of sent reply in admin_email_replies',
  source VARCHAR(100) NULL DEFAULT 'contact_form' COMMENT 'e.g. contact_form, booking',
  metadata JSON NULL COMMENT 'Extra data',
  created_at DATETIME NULL DEFAULT NULL,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_admin_emails_received_at (received_at),
  INDEX idx_admin_emails_read_at (read_at),
  INDEX idx_admin_emails_source (source(50)),
  INDEX idx_admin_emails_created_at (created_at)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sent replies (optional – store replies for thread view)
CREATE TABLE IF NOT EXISTS admin_email_replies (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  email_id VARCHAR(36) NOT NULL COMMENT 'References admin_emails.id',
  body TEXT NULL,
  body_html TEXT NULL,
  sent_at DATETIME NULL DEFAULT NULL,
  created_at DATETIME NULL DEFAULT NULL,

  INDEX idx_admin_email_replies_email_id (email_id),
  INDEX idx_admin_email_replies_sent_at (sent_at)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional foreign key
-- ALTER TABLE admin_email_replies ADD CONSTRAINT fk_admin_email_replies_email
--   FOREIGN KEY (email_id) REFERENCES admin_emails(id) ON DELETE CASCADE;
