-- Add allocation_type support for vendor advance / unallocated payments
-- Run AFTER vendor-payments-schema.sql

-- Add allocation_type column (bill, advance, unallocated)
ALTER TABLE vendor_payment_allocations
  ADD COLUMN IF NOT EXISTS allocation_type text NOT NULL DEFAULT 'bill';

-- Make purchase_header_id nullable (for advance/unallocated payments)
ALTER TABLE vendor_payment_allocations
  ALTER COLUMN purchase_header_id DROP NOT NULL;
