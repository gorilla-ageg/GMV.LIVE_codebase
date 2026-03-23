
-- 1. Fix contracts & live_analytics: change role from public to authenticated
DROP POLICY IF EXISTS "Participants can read contracts" ON public.contracts;
DROP POLICY IF EXISTS "Participants can create contracts" ON public.contracts;
DROP POLICY IF EXISTS "Participants can update contracts" ON public.contracts;

CREATE POLICY "Participants can read contracts" ON public.contracts FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM deals d JOIN conversations c ON c.id = d.conversation_id WHERE d.id = contracts.deal_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())));

CREATE POLICY "Participants can create contracts" ON public.contracts FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM deals d JOIN conversations c ON c.id = d.conversation_id WHERE d.id = contracts.deal_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())));

CREATE POLICY "Participants can update contracts" ON public.contracts FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM deals d JOIN conversations c ON c.id = d.conversation_id WHERE d.id = contracts.deal_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())));

DROP POLICY IF EXISTS "Participants can read analytics" ON public.live_analytics;
DROP POLICY IF EXISTS "Creator can submit analytics" ON public.live_analytics;
DROP POLICY IF EXISTS "Participants can update analytics" ON public.live_analytics;

CREATE POLICY "Participants can read analytics" ON public.live_analytics FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM deals d JOIN conversations c ON c.id = d.conversation_id WHERE d.id = live_analytics.deal_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())));

CREATE POLICY "Creator can submit analytics" ON public.live_analytics FOR INSERT TO authenticated
WITH CHECK (creator_id = auth.uid() AND EXISTS (SELECT 1 FROM deals d JOIN conversations c ON c.id = d.conversation_id WHERE d.id = live_analytics.deal_id AND c.creator_user_id = auth.uid()));

CREATE POLICY "Participants can update analytics" ON public.live_analytics FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM deals d JOIN conversations c ON c.id = d.conversation_id WHERE d.id = live_analytics.deal_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())));

-- 2. Fix products: only show active products to non-owners
DROP POLICY IF EXISTS "Anyone can read active products" ON public.products;

CREATE POLICY "Anyone can read active products" ON public.products FOR SELECT TO authenticated
USING (status = 'active' OR auth.uid() = brand_id);

-- 3. Fix escrow INSERT: restrict to brand only
DROP POLICY IF EXISTS "Participants can create escrow" ON public.escrow_payments;

CREATE POLICY "Brand can create escrow" ON public.escrow_payments FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM deals d JOIN conversations c ON c.id = d.conversation_id WHERE d.id = escrow_payments.deal_id AND c.brand_user_id = auth.uid()));

-- 4. Fix conversations INSERT: enforce role matching
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT TO authenticated
WITH CHECK (
  (auth.uid() = brand_user_id AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'brand'))
  OR
  (auth.uid() = creator_user_id AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'creator'))
);
