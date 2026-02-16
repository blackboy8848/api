-- Optional PDF itinerary for tours (e.g. upload URL stored here).
-- Run on your MySQL/MariaDB schema.

ALTER TABLE tours
  ADD COLUMN itinerary_pdf_url VARCHAR(500) DEFAULT NULL
  COMMENT 'Optional URL/path to uploaded PDF itinerary';
