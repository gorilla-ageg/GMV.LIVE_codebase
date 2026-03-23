
ALTER TABLE public.creator_profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS experience_level text,
  ADD COLUMN IF NOT EXISTS product_interests text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS has_tiktok_affiliate text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_images text[] DEFAULT '{}'::text[];
