-- Migration Script (Safe Version): Add image_url and duration_label to tour_slot_variants table
-- Date: 2026-01-XX
-- Description: Adds image_url and duration_label columns with existence checks
-- This version checks if columns exist before adding them (MySQL 5.7+ compatible)

-- Check and add image_url column if it doesn't exist
SET @dbname = DATABASE();
SET @tablename = 'tour_slot_variants';
SET @columnname = 'image_url';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(500) NULL COMMENT \'URL to the departure location image\' AFTER capacity')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check and add duration_label column if it doesn't exist
SET @columnname = 'duration_label';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(50) NULL COMMENT \'Duration label (e.g., "1N/1D", "1D", "3 Hours")\' AFTER image_url')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Note: Index creation will fail if index already exists, which is safe to ignore
-- CREATE INDEX idx_variant_name ON tour_slot_variants(variant_name);
