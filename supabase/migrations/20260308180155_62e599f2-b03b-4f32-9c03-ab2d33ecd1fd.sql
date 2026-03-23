
-- 1. Expand deal_status enum with missing values
ALTER TYPE public.deal_status ADD VALUE IF NOT EXISTS 'contracted';
ALTER TYPE public.deal_status ADD VALUE IF NOT EXISTS 'funded';
ALTER TYPE public.deal_status ADD VALUE IF NOT EXISTS 'shipped';
ALTER TYPE public.deal_status ADD VALUE IF NOT EXISTS 'delivered';
ALTER TYPE public.deal_status ADD VALUE IF NOT EXISTS 'live';
ALTER TYPE public.deal_status ADD VALUE IF NOT EXISTS 'disputed';

-- 2. Add columns to deals table
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS rate numeric,
  ADD COLUMN IF NOT EXISTS deliverables text,
  ADD COLUMN IF NOT EXISTS live_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS usage_rights text[] DEFAULT '{}';

-- 3. Add columns to deal_offers table
ALTER TABLE public.deal_offers
  ADD COLUMN IF NOT EXISTS deliverables text,
  ADD COLUMN IF NOT EXISTS live_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS usage_rights text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rate numeric;

-- 4. Create contracts table
CREATE TABLE IF NOT EXISTS public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  terms jsonb NOT NULL DEFAULT '{}',
  brand_signed_at timestamp with time zone,
  creator_signed_at timestamp with time zone,
  pdf_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(deal_id)
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read contracts"
  ON public.contracts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM deals d JOIN conversations c ON c.id = d.conversation_id
    WHERE d.id = contracts.deal_id
    AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())
  ));

CREATE POLICY "Participants can create contracts"
  ON public.contracts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM deals d JOIN conversations c ON c.id = d.conversation_id
    WHERE d.id = contracts.deal_id
    AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())
  ));

CREATE POLICY "Participants can update contracts"
  ON public.contracts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM deals d JOIN conversations c ON c.id = d.conversation_id
    WHERE d.id = contracts.deal_id
    AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())
  ));

-- 5. Create live_analytics table
CREATE TABLE IF NOT EXISTS public.live_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL,
  stream_link text,
  peak_viewers integer DEFAULT 0,
  total_viewers integer DEFAULT 0,
  gmv numeric DEFAULT 0,
  orders integer DEFAULT 0,
  likes integer DEFAULT 0,
  watch_time_avg integer DEFAULT 0,
  submitted_at timestamp with time zone DEFAULT now(),
  approved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(deal_id)
);

ALTER TABLE public.live_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read analytics"
  ON public.live_analytics FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM deals d JOIN conversations c ON c.id = d.conversation_id
    WHERE d.id = live_analytics.deal_id
    AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())
  ));

CREATE POLICY "Creator can submit analytics"
  ON public.live_analytics FOR INSERT
  WITH CHECK (
    creator_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM deals d JOIN conversations c ON c.id = d.conversation_id
      WHERE d.id = live_analytics.deal_id
      AND c.creator_user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can update analytics"
  ON public.live_analytics FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM deals d JOIN conversations c ON c.id = d.conversation_id
    WHERE d.id = live_analytics.deal_id
    AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())
  ));

-- 6. Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.contracts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_analytics;
