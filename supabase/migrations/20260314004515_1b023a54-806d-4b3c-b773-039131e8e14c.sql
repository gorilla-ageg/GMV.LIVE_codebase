
-- Fix security definer view - drop it and use invoker security instead
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS SELECT id, display_name, avatar_url, bio, role FROM public.profiles;

-- Remove duplicate SELECT policies - keep just one
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can read other profiles" ON public.profiles;

-- Single policy: users read all profiles (needed for display names in chats, feeds etc.)
CREATE POLICY "Authenticated can read profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);
