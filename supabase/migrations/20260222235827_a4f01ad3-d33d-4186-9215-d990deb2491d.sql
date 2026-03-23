
-- 1. Role enum
CREATE TYPE public.app_role AS ENUM ('creator', 'brand');

-- 2. Product status enum
CREATE TYPE public.product_status AS ENUM ('active', 'paused', 'closed');

-- 3. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. User roles table (for RLS security definer checks)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. Security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 6. Creator profiles
CREATE TABLE public.creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  niches TEXT[] DEFAULT '{}',
  platforms TEXT[] DEFAULT '{}',
  follower_count INTEGER DEFAULT 0,
  avg_gmv NUMERIC(12,2) DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0,
  portfolio_urls TEXT[] DEFAULT '{}',
  past_collabs TEXT[] DEFAULT '{}',
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;

-- 7. Brand profiles
CREATE TABLE public.brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL DEFAULT '',
  website TEXT,
  industry TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;

-- 8. Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  images TEXT[] DEFAULT '{}',
  category TEXT,
  budget_min NUMERIC(10,2),
  budget_max NUMERIC(10,2),
  target_platforms TEXT[] DEFAULT '{}',
  preferred_date DATE,
  commission_info TEXT,
  status product_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 9. Conversations
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- 10. Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 11. Trigger: auto-create profile + user_role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Profile will be completed during onboarding; role comes from metadata
  INSERT INTO public.profiles (id, role, display_name)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data ->> 'role')::app_role,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', '')
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data ->> 'role')::app_role
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12. Trigger: update last_message_at on new message
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_last_message();

-- ===== RLS POLICIES =====

-- Profiles: anyone authenticated can read, only owner can update
CREATE POLICY "Anyone can read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User roles: read own only
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Creator profiles: all authenticated can read, only owner can write
CREATE POLICY "Anyone can read creator profiles" ON public.creator_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Creators can insert own profile" ON public.creator_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Creators can update own profile" ON public.creator_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Brand profiles: all authenticated can read, only owner can write
CREATE POLICY "Anyone can read brand profiles" ON public.brand_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Brands can insert own profile" ON public.brand_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Brands can update own profile" ON public.brand_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Products: all authenticated can read, only owning brand can write
CREATE POLICY "Anyone can read active products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Brands can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (auth.uid() = brand_id);
CREATE POLICY "Brands can update own products" ON public.products FOR UPDATE TO authenticated USING (auth.uid() = brand_id);
CREATE POLICY "Brands can delete own products" ON public.products FOR DELETE TO authenticated USING (auth.uid() = brand_id);

-- Conversations: only participants can read/write
CREATE POLICY "Participants can read conversations" ON public.conversations FOR SELECT TO authenticated
  USING (auth.uid() = brand_user_id OR auth.uid() = creator_user_id);
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = brand_user_id OR auth.uid() = creator_user_id);

-- Messages: only conversation participants can read/write
CREATE POLICY "Participants can read messages" ON public.messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (auth.uid() = c.brand_user_id OR auth.uid() = c.creator_user_id)
    )
  );
CREATE POLICY "Participants can send messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (auth.uid() = c.brand_user_id OR auth.uid() = c.creator_user_id)
    )
  );
CREATE POLICY "Users can update own messages" ON public.messages FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (auth.uid() = c.brand_user_id OR auth.uid() = c.creator_user_id)
    )
  );

-- ===== STORAGE BUCKETS =====
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio', 'portfolio', true);

-- Storage policies: public read, authenticated upload to own folder
CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Auth upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Auth update avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public read product-images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Auth upload product-images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Auth update product-images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public read portfolio" ON storage.objects FOR SELECT USING (bucket_id = 'portfolio');
CREATE POLICY "Auth upload portfolio" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Auth update portfolio" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);
