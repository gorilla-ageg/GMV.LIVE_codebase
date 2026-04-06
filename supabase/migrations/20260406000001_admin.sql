-- Add admin to the app_role enum
-- This must be in its own migration because new enum values
-- cannot be used in the same transaction they are added.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
