-- Deal system: offers, negotiation, signing, escrow, shipping

-- Enums
CREATE TYPE public.deal_status AS ENUM (
  'negotiating',
  'agreed',
  'signed',
  'escrow_funded',
  'in_progress',
  'completed',
  'cancelled'
);

CREATE TYPE public.offer_status AS ENUM (
  'pending',
  'accepted',
  'rejected',
  'countered',
  'expired'
);

CREATE TYPE public.escrow_status AS ENUM (
  'pending',
  'funded',
  'released',
  'refunded'
);

CREATE TYPE public.shipment_status AS ENUM (
  'pending',
  'shipped',
  'in_transit',
  'delivered'
);

-- Add message_type and metadata to messages
ALTER TABLE public.messages
  ADD COLUMN message_type TEXT NOT NULL DEFAULT 'text',
  ADD COLUMN metadata JSONB;

-- Deals table (one per conversation)
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL UNIQUE REFERENCES public.conversations(id) ON DELETE CASCADE,
  status deal_status NOT NULL DEFAULT 'negotiating',
  hourly_rate NUMERIC(10,2),
  commission_percentage NUMERIC(5,2),
  hours NUMERIC(6,1),
  total_amount NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deal offers (negotiation history)
CREATE TABLE public.deal_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hourly_rate NUMERIC(10,2) NOT NULL,
  commission_percentage NUMERIC(5,2) NOT NULL,
  hours NUMERIC(6,1) NOT NULL,
  note TEXT,
  status offer_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deal signatures
CREATE TABLE public.deal_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(deal_id, user_id)
);

-- Escrow payments
CREATE TABLE public.escrow_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL UNIQUE REFERENCES public.deals(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  status escrow_status NOT NULL DEFAULT 'pending',
  funded_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Shipments
CREATE TABLE public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  tracking_number TEXT,
  carrier TEXT,
  status shipment_status NOT NULL DEFAULT 'pending',
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: Enable on all new tables
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deals
CREATE POLICY "Participants can read deals"
  ON public.deals FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = deals.conversation_id
      AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())
    )
  );

CREATE POLICY "Participants can create deals"
  ON public.deals FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = deals.conversation_id
      AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())
    )
  );

CREATE POLICY "Participants can update deals"
  ON public.deals FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = deals.conversation_id
      AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())
    )
  );

-- RLS Policies for deal_offers
CREATE POLICY "Participants can read offers"
  ON public.deal_offers FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.deals d
      JOIN public.conversations c ON c.id = d.conversation_id
      WHERE d.id = deal_offers.deal_id
      AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())
    )
  );

CREATE POLICY "Participants can create offers"
  ON public.deal_offers FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.deals d
      JOIN public.conversations c ON c.id = d.conversation_id
      WHERE d.id = deal_offers.deal_id
      AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())
    )
  );

CREATE POLICY "Participants can update offers"
  ON public.deal_offers FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.deals d
      JOIN public.conversations c ON c.id = d.conversation_id
      WHERE d.id = deal_offers.deal_id
      AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())
    )
  );

-- RLS Policies for deal_signatures
CREATE POLICY "Participants can read signatures"
  ON public.deal_signatures FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.deals d
      JOIN public.conversations c ON c.id = d.conversation_id
      WHERE d.id = deal_signatures.deal_id
      AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())
    )
  );

CREATE POLICY "Users can sign deals"
  ON public.deal_signatures FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.deals d
      JOIN public.conversations c ON c.id = d.conversation_id
      WHERE d.id = deal_signatures.deal_id
      AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())
    )
  );

-- RLS Policies for escrow_payments
CREATE POLICY "Participants can read escrow"
  ON public.escrow_payments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.deals d
      JOIN public.conversations c ON c.id = d.conversation_id
      WHERE d.id = escrow_payments.deal_id
      AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())
    )
  );

CREATE POLICY "Participants can create escrow"
  ON public.escrow_payments FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.deals d
      JOIN public.conversations c ON c.id = d.conversation_id
      WHERE d.id = escrow_payments.deal_id
      AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())
    )
  );

CREATE POLICY "Participants can update escrow"
  ON public.escrow_payments FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.deals d
      JOIN public.conversations c ON c.id = d.conversation_id
      WHERE d.id = escrow_payments.deal_id
      AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())
    )
  );

-- RLS Policies for shipments
CREATE POLICY "Participants can read shipments"
  ON public.shipments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.deals d
      JOIN public.conversations c ON c.id = d.conversation_id
      WHERE d.id = shipments.deal_id
      AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())
    )
  );

CREATE POLICY "Participants can create shipments"
  ON public.shipments FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.deals d
      JOIN public.conversations c ON c.id = d.conversation_id
      WHERE d.id = shipments.deal_id
      AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())
    )
  );

CREATE POLICY "Participants can update shipments"
  ON public.shipments FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.deals d
      JOIN public.conversations c ON c.id = d.conversation_id
      WHERE d.id = shipments.deal_id
      AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())
    )
  );

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deal_offers;

-- Trigger to update deals.updated_at
CREATE OR REPLACE FUNCTION public.update_deal_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_deal_update
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.update_deal_timestamp();
