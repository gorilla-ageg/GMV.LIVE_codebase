
-- Fix: The previous WITH CHECK clauses used self-comparison which is always true.
-- Use triggers to enforce column immutability instead.

-- 1. Trigger: Prevent financial term changes when accepting/rejecting offers
CREATE OR REPLACE FUNCTION public.prevent_offer_term_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If the sender is NOT the one updating (i.e. recipient accepting/rejecting),
  -- prevent changes to financial terms
  IF OLD.sender_id != auth.uid() THEN
    IF NEW.rate IS DISTINCT FROM OLD.rate
      OR NEW.hourly_rate IS DISTINCT FROM OLD.hourly_rate
      OR NEW.hours IS DISTINCT FROM OLD.hours
      OR NEW.commission_percentage IS DISTINCT FROM OLD.commission_percentage
      OR NEW.deliverables IS DISTINCT FROM OLD.deliverables
      OR NEW.live_date IS DISTINCT FROM OLD.live_date
      OR NEW.usage_rights IS DISTINCT FROM OLD.usage_rights
    THEN
      RAISE EXCEPTION 'Cannot modify financial terms when accepting or rejecting an offer';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_offer_term_changes ON public.deal_offers;
CREATE TRIGGER trg_prevent_offer_term_changes
  BEFORE UPDATE ON public.deal_offers
  FOR EACH ROW EXECUTE FUNCTION public.prevent_offer_term_changes();

-- 2. Trigger: Prevent escrow amount/timestamp tampering
CREATE OR REPLACE FUNCTION public.prevent_escrow_tampering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Amount is always immutable after creation
  IF NEW.amount IS DISTINCT FROM OLD.amount THEN
    RAISE EXCEPTION 'Cannot modify escrow amount after creation';
  END IF;
  -- created_at is immutable
  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Cannot modify escrow created_at';
  END IF;
  -- funded_at is immutable once set
  IF OLD.funded_at IS NOT NULL AND NEW.funded_at IS DISTINCT FROM OLD.funded_at THEN
    RAISE EXCEPTION 'Cannot modify funded_at after it has been set';
  END IF;
  -- released_at is immutable once set
  IF OLD.released_at IS NOT NULL AND NEW.released_at IS DISTINCT FROM OLD.released_at THEN
    RAISE EXCEPTION 'Cannot modify released_at after it has been set';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_escrow_tampering ON public.escrow_payments;
CREATE TRIGGER trg_prevent_escrow_tampering
  BEFORE UPDATE ON public.escrow_payments
  FOR EACH ROW EXECUTE FUNCTION public.prevent_escrow_tampering();

-- 3. Trigger: Prevent brand from modifying creator metrics
CREATE OR REPLACE FUNCTION public.prevent_analytics_metric_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_brand boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM deals d
    JOIN conversations c ON c.id = d.conversation_id
    WHERE d.id = NEW.deal_id AND c.brand_user_id = auth.uid()
  ) INTO is_brand;

  IF is_brand THEN
    IF NEW.gmv IS DISTINCT FROM OLD.gmv
      OR NEW.orders IS DISTINCT FROM OLD.orders
      OR NEW.peak_viewers IS DISTINCT FROM OLD.peak_viewers
      OR NEW.total_viewers IS DISTINCT FROM OLD.total_viewers
      OR NEW.likes IS DISTINCT FROM OLD.likes
      OR NEW.watch_time_avg IS DISTINCT FROM OLD.watch_time_avg
      OR NEW.stream_link IS DISTINCT FROM OLD.stream_link
    THEN
      RAISE EXCEPTION 'Brand cannot modify creator performance metrics';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_analytics_metric_changes ON public.live_analytics;
CREATE TRIGGER trg_prevent_analytics_metric_changes
  BEFORE UPDATE ON public.live_analytics
  FOR EACH ROW EXECUTE FUNCTION public.prevent_analytics_metric_changes();

-- 4. Simplify the RLS policies back to participant checks (triggers handle field restrictions)
DROP POLICY IF EXISTS "Non-sender can accept or reject offers" ON public.deal_offers;
CREATE POLICY "Non-sender can update offers"
ON public.deal_offers FOR UPDATE
TO authenticated
USING (
  sender_id != auth.uid() AND
  EXISTS (
    SELECT 1 FROM deals d
    JOIN conversations c ON c.id = d.conversation_id
    WHERE d.id = deal_offers.deal_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Brand can fund escrow" ON public.escrow_payments;
DROP POLICY IF EXISTS "Brand can release escrow" ON public.escrow_payments;
CREATE POLICY "Brand can update escrow"
ON public.escrow_payments FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM deals d
    JOIN conversations c ON c.id = d.conversation_id
    WHERE d.id = escrow_payments.deal_id AND c.brand_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Brand can only set approved_at" ON public.live_analytics;
CREATE POLICY "Brand can approve analytics"
ON public.live_analytics FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM deals d
    JOIN conversations c ON c.id = d.conversation_id
    WHERE d.id = live_analytics.deal_id AND c.brand_user_id = auth.uid()
  )
);
