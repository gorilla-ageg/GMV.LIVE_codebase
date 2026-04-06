-- Admin can read, create, and update contracts
DROP POLICY IF EXISTS "Admin can read contracts" ON public.contracts;
CREATE POLICY "Admin can read contracts"
  ON public.contracts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin can create contracts" ON public.contracts;
CREATE POLICY "Admin can create contracts"
  ON public.contracts FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin can update contracts" ON public.contracts;
CREATE POLICY "Admin can update contracts"
  ON public.contracts FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can read and create deal signatures
DROP POLICY IF EXISTS "Admin can read signatures" ON public.deal_signatures;
CREATE POLICY "Admin can read signatures"
  ON public.deal_signatures FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin can sign deals" ON public.deal_signatures;
CREATE POLICY "Admin can sign deals"
  ON public.deal_signatures FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND user_id = auth.uid());

-- Admin can read and create deal offers
DROP POLICY IF EXISTS "Admin can read offers" ON public.deal_offers;
CREATE POLICY "Admin can read offers"
  ON public.deal_offers FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin can create offers" ON public.deal_offers;
CREATE POLICY "Admin can create offers"
  ON public.deal_offers FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin can update offers" ON public.deal_offers;
CREATE POLICY "Admin can update offers"
  ON public.deal_offers FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
