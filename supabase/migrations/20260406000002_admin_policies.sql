-- Add suspended column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended BOOLEAN DEFAULT false;

-- Admin can read everything
CREATE POLICY "Admin full read on profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin full read on products"
  ON public.products FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin full read on deals"
  ON public.deals FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin full read on creator_profiles"
  ON public.creator_profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin full read on brand_profiles"
  ON public.brand_profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update product status and user profiles (for moderation)
CREATE POLICY "Admin can update products"
  ON public.products FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RUN THIS MANUALLY IN SUPABASE SQL EDITOR AFTER THE MIGRATION:
-- SELECT id FROM auth.users WHERE email = 'admin001@gmv.live';
-- UPDATE public.profiles SET role = 'admin' WHERE id = 'bea819e0-5597-4072-ba4d-9c0e24b2657f';
-- UPDATE public.user_roles SET role = 'admin' WHERE user_id = 'bea819e0-5597-4072-ba4d-9c0e24b2657f';
-- INSERT INTO public.user_roles (user_id, role) VALUES ('bea819e0-5597-4072-ba4d-9c0e24b2657f', 'admin')
--   ON CONFLICT DO NOTHING;
