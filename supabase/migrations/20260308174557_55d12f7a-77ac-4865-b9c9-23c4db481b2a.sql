
-- Add onboarding columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_step text DEFAULT null;

-- Add new columns to creator_profiles
ALTER TABLE public.creator_profiles
  ADD COLUMN IF NOT EXISTS tiktok_handle text DEFAULT null,
  ADD COLUMN IF NOT EXISTS audience_type text DEFAULT null;

-- Add new columns to brand_profiles
ALTER TABLE public.brand_profiles
  ADD COLUMN IF NOT EXISTS industries text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS campaign_images text[] DEFAULT '{}'::text[];
