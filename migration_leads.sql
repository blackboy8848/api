-- Migration: Create leads table for Contact Us form and Lead Channels dashboard
-- Run this against your MySQL database before using /api/leads

-- Lead status: New Enquiry, Call Not Picked, Contacted, Qualified, Plan & Quote Sent,
-- In Pipeline, Negotiating, Awaiting Payment, Booked, Lost & Closed, Future Prospect
-- Lead state (temperature): Hot, Warm, Cold
-- Lead source: other, manual, onelink

CREATE TABLE IF NOT EXISTS leads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone_country_code VARCHAR(10) DEFAULT '91',
  phone_number VARCHAR(20) NOT NULL,

  -- Lead categorization (from dashboard)
  lead_source VARCHAR(50) DEFAULT 'other' COMMENT 'other, manual, onelink',
  lead_state ENUM('Hot', 'Warm', 'Cold') DEFAULT 'Cold',
  lead_status VARCHAR(80) DEFAULT 'New Enquiry',

  -- Assignment (assigned_to references users.uid)
  assigned_to VARCHAR(255) NULL,

  -- Enquiry / interest (from Contact form: Select Event, Select Departure Batch)
  enquiry_destination VARCHAR(500) NULL COMMENT 'e.g. Bali Adventure, MANALI - KASOL-MANIKARAN',
  tour_id VARCHAR(255) NULL,
  event_id VARCHAR(255) NULL,
  slot_id INT NULL COMMENT 'Departure batch / tour_slots.id',

  -- Notes and remarks
  notes TEXT NULL,
  remarks TEXT NULL,

  -- Conversion tracking (when "Create Booking" is used)
  converted_to_booking_id VARCHAR(255) NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_leads_lead_state (lead_state),
  INDEX idx_leads_lead_source (lead_source),
  INDEX idx_leads_lead_status (lead_status),
  INDEX idx_leads_assigned_to (assigned_to),
  INDEX idx_leads_created_at (created_at),
  INDEX idx_leads_email (email),
  INDEX idx_leads_name (name(100))
);

-- Optional foreign keys (uncomment if you want referential integrity)
-- ALTER TABLE leads ADD CONSTRAINT fk_leads_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(uid) ON DELETE SET NULL;
-- ALTER TABLE leads ADD CONSTRAINT fk_leads_tour_id FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE SET NULL;
-- ALTER TABLE leads ADD CONSTRAINT fk_leads_event_id FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL;
-- ALTER TABLE leads ADD CONSTRAINT fk_leads_slot_id FOREIGN KEY (slot_id) REFERENCES tour_slots(id) ON DELETE SET NULL;
-- ALTER TABLE leads ADD CONSTRAINT fk_leads_converted_to_booking FOREIGN KEY (converted_to_booking_id) REFERENCES bookings(id) ON DELETE SET NULL;
