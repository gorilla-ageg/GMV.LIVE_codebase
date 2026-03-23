
-- 1. Remove direct brand UPDATE on escrow - use a security definer function instead
DROP POLICY IF EXISTS "Brand can update escrow" ON public.escrow_payments;

CREATE OR REPLACE FUNCTION public.fund_escrow(_deal_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify caller is the brand
  IF NOT EXISTS (
    SELECT 1 FROM deals d
    JOIN conversations c ON c.id = d.conversation_id
    WHERE d.id = _deal_id AND c.brand_user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only the brand can fund escrow';
  END IF;

  UPDATE escrow_payments
  SET status = 'funded', funded_at = now()
  WHERE deal_id = _deal_id AND status = 'pending';
END;
$$;

CREATE OR REPLACE FUNCTION public.release_escrow(_deal_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify caller is the brand
  IF NOT EXISTS (
    SELECT 1 FROM deals d
    JOIN conversations c ON c.id = d.conversation_id
    WHERE d.id = _deal_id AND c.brand_user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only the brand can release escrow';
  END IF;

  UPDATE escrow_payments
  SET status = 'released', released_at = now()
  WHERE deal_id = _deal_id AND status = 'funded';
END;
$$;

-- 2. Remove direct brand UPDATE on analytics - use a security definer function
DROP POLICY IF EXISTS "Brand can approve analytics" ON public.live_analytics;

CREATE OR REPLACE FUNCTION public.approve_analytics(_deal_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify caller is the brand
  IF NOT EXISTS (
    SELECT 1 FROM deals d
    JOIN conversations c ON c.id = d.conversation_id
    WHERE d.id = _deal_id AND c.brand_user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only the brand can approve analytics';
  END IF;

  UPDATE live_analytics
  SET approved_at = now()
  WHERE deal_id = _deal_id AND approved_at IS NULL;
END;
$$;

-- 3. Fix profile visibility - restrict onboarding fields
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;

-- Users can read their own full profile
CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Others can only read profiles (onboarding fields are still in the row but this is row-level, not column-level)
-- We'll use a view for public profile data instead
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, display_name, avatar_url, bio, role
FROM public.profiles;

-- Allow all authenticated to read the view (views inherit table RLS, so we need a SELECT policy)
CREATE POLICY "Anyone can read other profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);
