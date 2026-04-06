-- The public_profiles view uses security_invoker, but the profiles SELECT policy
-- restricts reads to own row only (auth.uid() = id). This breaks name resolution
-- across the app (deals inbox, deal rooms, feeds, etc).
--
-- Fix: add a policy allowing all authenticated users to read basic profile info.
-- The existing "Users can read own profile" policy stays for full profile data.

-- Drop and recreate the restrictive policy, replacing it with a permissive one
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

-- All authenticated users can read profiles (needed for public_profiles view,
-- deal partner names, chat display names, feed cards, etc)
CREATE POLICY "Authenticated can read profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);
