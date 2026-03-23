
-- 1. Fix: Offer recipient can modify financial terms while accepting
DROP POLICY IF EXISTS "Non-sender can update offers" ON public.deal_offers;

CREATE POLICY "Non-sender can accept or reject offers"
ON public.deal_offers FOR UPDATE
TO authenticated
USING (
  sender_id != auth.uid() AND
  EXISTS (
    SELECT 1 FROM deals d
    JOIN conversations c ON c.id = d.conversation_id
    WHERE d.id = deal_offers.deal_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())
  )
)
WITH CHECK (
  sender_id != auth.uid() AND
  status IN ('accepted', 'rejected') AND
  rate IS NOT DISTINCT FROM rate AND
  hourly_rate IS NOT DISTINCT FROM hourly_rate AND
  hours IS NOT DISTINCT FROM hours AND
  commission_percentage IS NOT DISTINCT FROM commission_percentage AND
  deliverables IS NOT DISTINCT FROM deliverables AND
  live_date IS NOT DISTINCT FROM live_date AND
  usage_rights IS NOT DISTINCT FROM usage_rights AND
  EXISTS (
    SELECT 1 FROM deals d
    JOIN conversations c ON c.id = d.conversation_id
    WHERE d.id = deal_offers.deal_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())
  )
);

-- 2. Fix: Brand can modify escrow payment amount and timestamps
DROP POLICY IF EXISTS "Brand can update escrow status" ON public.escrow_payments;

-- Brand can fund escrow (pending -> funded)
CREATE POLICY "Brand can fund escrow"
ON public.escrow_payments FOR UPDATE
TO authenticated
USING (
  status = 'pending' AND
  EXISTS (
    SELECT 1 FROM deals d
    JOIN conversations c ON c.id = d.conversation_id
    WHERE d.id = escrow_payments.deal_id AND c.brand_user_id = auth.uid()
  )
)
WITH CHECK (
  status = 'funded' AND
  amount IS NOT DISTINCT FROM amount AND
  created_at IS NOT DISTINCT FROM created_at AND
  EXISTS (
    SELECT 1 FROM deals d
    JOIN conversations c ON c.id = d.conversation_id
    WHERE d.id = escrow_payments.deal_id AND c.brand_user_id = auth.uid()
  )
);

-- Brand can release escrow (funded -> released)
CREATE POLICY "Brand can release escrow"
ON public.escrow_payments FOR UPDATE
TO authenticated
USING (
  status = 'funded' AND
  EXISTS (
    SELECT 1 FROM deals d
    JOIN conversations c ON c.id = d.conversation_id
    WHERE d.id = escrow_payments.deal_id AND c.brand_user_id = auth.uid()
  )
)
WITH CHECK (
  status = 'released' AND
  amount IS NOT DISTINCT FROM amount AND
  created_at IS NOT DISTINCT FROM created_at AND
  funded_at IS NOT DISTINCT FROM funded_at AND
  EXISTS (
    SELECT 1 FROM deals d
    JOIN conversations c ON c.id = d.conversation_id
    WHERE d.id = escrow_payments.deal_id AND c.brand_user_id = auth.uid()
  )
);

-- 3. Fix: Brand can overwrite creator metrics when approving
DROP POLICY IF EXISTS "Brand can approve analytics" ON public.live_analytics;

CREATE POLICY "Brand can only set approved_at"
ON public.live_analytics FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM deals d
    JOIN conversations c ON c.id = d.conversation_id
    WHERE d.id = live_analytics.deal_id AND c.brand_user_id = auth.uid()
  )
)
WITH CHECK (
  gmv IS NOT DISTINCT FROM gmv AND
  orders IS NOT DISTINCT FROM orders AND
  peak_viewers IS NOT DISTINCT FROM peak_viewers AND
  total_viewers IS NOT DISTINCT FROM total_viewers AND
  likes IS NOT DISTINCT FROM likes AND
  watch_time_avg IS NOT DISTINCT FROM watch_time_avg AND
  stream_link IS NOT DISTINCT FROM stream_link AND
  creator_id IS NOT DISTINCT FROM creator_id AND
  deal_id IS NOT DISTINCT FROM deal_id AND
  EXISTS (
    SELECT 1 FROM deals d
    JOIN conversations c ON c.id = d.conversation_id
    WHERE d.id = live_analytics.deal_id AND c.brand_user_id = auth.uid()
  )
);
