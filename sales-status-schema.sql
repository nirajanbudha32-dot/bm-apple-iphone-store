-- ============================================
-- SALES: Add Invoice Status + Customer Type
-- Run in Supabase SQL Editor
-- ============================================

-- Invoice status: DRAFT, CONFIRMED, PAID, PARTIALLY_PAID, CREDIT, CANCELLED, RETURNED, PARTIALLY_RETURNED
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'CONFIRMED';

-- Customer type: Individual, Business, VAT Registered
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS customer_type text NOT NULL DEFAULT 'Individual';
