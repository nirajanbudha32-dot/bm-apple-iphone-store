-- Add contact name and location for VAT/Business invoices
-- Run this AFTER sales-status-schema.sql

ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_contact text DEFAULT '';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_location text DEFAULT '';
