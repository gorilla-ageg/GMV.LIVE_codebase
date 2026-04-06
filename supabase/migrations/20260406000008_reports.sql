-- Reports table for flagging users, products, and deals
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id),
  reported_user_id UUID REFERENCES auth.users(id),
  deal_id UUID REFERENCES public.deals(id),
  product_id UUID REFERENCES public.products(id),
  report_type TEXT NOT NULL CHECK (report_type IN ('user', 'product', 'deal')),
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can submit a report
CREATE POLICY "Users can submit reports"
  ON public.reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Users can read their own reports
CREATE POLICY "Users can read own reports"
  ON public.reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);

-- Admin can read all reports
CREATE POLICY "Admin can read all reports"
  ON public.reports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update reports (change status)
CREATE POLICY "Admin can update reports"
  ON public.reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete reports
CREATE POLICY "Admin can delete reports"
  ON public.reports FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
