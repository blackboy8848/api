-- Migration: Create global_policies table for Policies Management
-- Run this against your MySQL database before using /api/policies
--
-- Policy types match the UI tabs: Inclusions, Exclusions, Cancellation Policies,
-- Terms & Conditions, FAQs, What To Carry, Additional Info.
-- These are reusable policy items that can be imported into events.

-- USE your_database_name;  -- Uncomment and set if needed

CREATE TABLE IF NOT EXISTS global_policies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  policy_type ENUM(
    'inclusions',
    'exclusions',
    'cancellation_policies',
    'terms_and_conditions',
    'faqs',
    'what_to_carry',
    'additional_info'
  ) NOT NULL,
  title VARCHAR(500) NOT NULL COMMENT 'Short label for the policy item',
  content TEXT NULL COMMENT 'Full policy text or description',
  sort_order INT NOT NULL DEFAULT 0 COMMENT 'Display order within the same policy_type',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_global_policies_type (policy_type),
  INDEX idx_global_policies_sort (policy_type, sort_order),
  INDEX idx_global_policies_created_at (created_at)
);
