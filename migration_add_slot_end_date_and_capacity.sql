-- Migration: Add slot_end_date (date only, no time) to tour_slots
-- Run this before using the updated Add Slot API with slot_end_date and total_capacity.
-- Note: total_capacity already exists in tour_slots; this adds only slot_end_date.

-- Add slot_end_date: DATE only (no time), nullable for existing rows
ALTER TABLE tour_slots
ADD COLUMN slot_end_date DATE NULL
COMMENT 'End date of the slot (date only, no time)'
AFTER slot_time;

-- Optional: if total_capacity does NOT exist in your tour_slots, uncomment below:
-- ALTER TABLE tour_slots
-- ADD COLUMN total_capacity INT(11) NULL DEFAULT NULL
-- COMMENT 'Slot capacity'
-- AFTER slot_end_date;
