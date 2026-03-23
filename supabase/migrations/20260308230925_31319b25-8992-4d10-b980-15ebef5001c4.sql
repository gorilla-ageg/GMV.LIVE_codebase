ALTER TABLE public.creator_profiles
  ADD COLUMN IF NOT EXISTS facebook_handle text,
  ADD COLUMN IF NOT EXISTS twitter_handle text;