-- Migration Script: Add image_url and duration_label to tour_slot_variants table
-- Date: 2026-01-XX
-- Description: Adds image_url and duration_label columns to support departure location images and duration labels
-- Note: Run this script only once. If columns already exist, the ALTER TABLE statements will fail.

-- Add image_url column (optional, for departure location images)
ALTER TABLE tour_slot_variants 
ADD COLUMN image_url VARCHAR(500) NULL 
COMMENT 'URL to the departure location image' 
AFTER capacity;

-- Add duration_label column (optional, for variant-specific duration labels like "1N/1D", "1D", "3 Hours")
ALTER TABLE tour_slot_variants 
ADD COLUMN duration_label VARCHAR(50) NULL 
COMMENT 'Duration label (e.g., "1N/1D", "1D", "3 Hours")' 
AFTER image_url;

-- Add index on variant_name (from schema documentation)
-- Note: This will fail if the index already exists
CREATE INDEX idx_variant_name ON tour_slot_variants(variant_name);

-- Note: The updated_at column should already exist with ON UPDATE CURRENT_TIMESTAMP
-- If it doesn't exist, uncomment the following:
-- ALTER TABLE tour_slot_variants 
-- ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
