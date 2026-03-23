-- Add supplemental columns to deals and deal_offers.
-- Core enums, tables, and RLS are created in 20260304000000_deal_system.sql.

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS commission_percentage NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS hours NUMERIC(6,1),
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12,2);

ALTER TABLE public.deal_offers
  ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hours NUMERIC(6,1) NOT NULL DEFAULT 0;
