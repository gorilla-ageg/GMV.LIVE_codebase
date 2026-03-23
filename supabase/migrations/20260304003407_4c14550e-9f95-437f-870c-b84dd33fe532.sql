
CREATE POLICY "Participants can read deals" ON public.deals FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = deals.conversation_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())));

CREATE POLICY "Participants can create deals" ON public.deals FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = deals.conversation_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())));

CREATE POLICY "Participants can update deals" ON public.deals FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = deals.conversation_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())));

CREATE POLICY "Participants can read offers" ON public.deal_offers FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.deals d JOIN public.conversations c ON c.id = d.conversation_id WHERE d.id = deal_offers.deal_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())));

CREATE POLICY "Participants can create offers" ON public.deal_offers FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.deals d JOIN public.conversations c ON c.id = d.conversation_id WHERE d.id = deal_offers.deal_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())));

CREATE POLICY "Participants can update offers" ON public.deal_offers FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.deals d JOIN public.conversations c ON c.id = d.conversation_id WHERE d.id = deal_offers.deal_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())));

CREATE POLICY "Participants can read signatures" ON public.deal_signatures FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.deals d JOIN public.conversations c ON c.id = d.conversation_id WHERE d.id = deal_signatures.deal_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())));

CREATE POLICY "Users can sign deals" ON public.deal_signatures FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.deals d JOIN public.conversations c ON c.id = d.conversation_id WHERE d.id = deal_signatures.deal_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())));

CREATE POLICY "Participants can read escrow" ON public.escrow_payments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.deals d JOIN public.conversations c ON c.id = d.conversation_id WHERE d.id = escrow_payments.deal_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())));

CREATE POLICY "Participants can create escrow" ON public.escrow_payments FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.deals d JOIN public.conversations c ON c.id = d.conversation_id WHERE d.id = escrow_payments.deal_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())));

CREATE POLICY "Participants can update escrow" ON public.escrow_payments FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.deals d JOIN public.conversations c ON c.id = d.conversation_id WHERE d.id = escrow_payments.deal_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())));

CREATE POLICY "Participants can read shipments" ON public.shipments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.deals d JOIN public.conversations c ON c.id = d.conversation_id WHERE d.id = shipments.deal_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())));

CREATE POLICY "Participants can create shipments" ON public.shipments FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.deals d JOIN public.conversations c ON c.id = d.conversation_id WHERE d.id = shipments.deal_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())));

CREATE POLICY "Participants can update shipments" ON public.shipments FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.deals d JOIN public.conversations c ON c.id = d.conversation_id WHERE d.id = shipments.deal_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())));
