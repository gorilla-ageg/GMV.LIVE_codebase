-- =============================================================================
-- ALL_MIGRATIONS.sql
-- Consolidated, fully idempotent SQL for the GMB.LIVE codebase.
-- Generated from 26 migration files in chronological order.
-- Safe to paste into the Supabase SQL editor and run multiple times.
-- =============================================================================


-- =============================================================================
-- Migration: 20260222235827_a4f01ad3-d33d-4186-9215-d990deb2491d.sql
-- Initial schema: enums, core tables, trigger, RLS policies, storage buckets
-- =============================================================================

-- 1. Role enum
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('creator', 'brand');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Product status enum
DO $$ BEGIN
  CREATE TYPE public.product_status AS ENUM ('active', 'paused', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. User roles table (for RLS security definer checks)
CREATE TABLE IF NOT EXISTS public.user_roles (
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
CREATE TABLE IF NOT EXISTS public.creator_profiles (
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
CREATE TABLE IF NOT EXISTS public.brand_profiles (
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
CREATE TABLE IF NOT EXISTS public.products (
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
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- 10. Messages
CREATE TABLE IF NOT EXISTS public.messages (
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
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

DROP TRIGGER IF EXISTS on_new_message ON public.messages;
CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_last_message();

-- ===== RLS POLICIES =====

-- Profiles: anyone authenticated can read, only owner can update
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
CREATE POLICY "Anyone can read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User roles: read own only
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Creator profiles: all authenticated can read, only owner can write
DROP POLICY IF EXISTS "Anyone can read creator profiles" ON public.creator_profiles;
CREATE POLICY "Anyone can read creator profiles" ON public.creator_profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Creators can insert own profile" ON public.creator_profiles;
CREATE POLICY "Creators can insert own profile" ON public.creator_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Creators can update own profile" ON public.creator_profiles;
CREATE POLICY "Creators can update own profile" ON public.creator_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Brand profiles: all authenticated can read, only owner can write
DROP POLICY IF EXISTS "Anyone can read brand profiles" ON public.brand_profiles;
CREATE POLICY "Anyone can read brand profiles" ON public.brand_profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Brands can insert own profile" ON public.brand_profiles;
CREATE POLICY "Brands can insert own profile" ON public.brand_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Brands can update own profile" ON public.brand_profiles;
CREATE POLICY "Brands can update own profile" ON public.brand_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Products: all authenticated can read, only owning brand can write
DROP POLICY IF EXISTS "Anyone can read active products" ON public.products;
CREATE POLICY "Anyone can read active products" ON public.products FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Brands can insert products" ON public.products;
CREATE POLICY "Brands can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (auth.uid() = brand_id);

DROP POLICY IF EXISTS "Brands can update own products" ON public.products;
CREATE POLICY "Brands can update own products" ON public.products FOR UPDATE TO authenticated USING (auth.uid() = brand_id);

DROP POLICY IF EXISTS "Brands can delete own products" ON public.products;
CREATE POLICY "Brands can delete own products" ON public.products FOR DELETE TO authenticated USING (auth.uid() = brand_id);

-- Conversations: only participants can read/write
DROP POLICY IF EXISTS "Participants can read conversations" ON public.conversations;
CREATE POLICY "Participants can read conversations" ON public.conversations FOR SELECT TO authenticated
  USING (auth.uid() = brand_user_id OR auth.uid() = creator_user_id);

DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = brand_user_id OR auth.uid() = creator_user_id);

-- Messages: only conversation participants can read/write
DROP POLICY IF EXISTS "Participants can read messages" ON public.messages;
CREATE POLICY "Participants can read messages" ON public.messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (auth.uid() = c.brand_user_id OR auth.uid() = c.creator_user_id)
    )
  );

DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
CREATE POLICY "Participants can send messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (auth.uid() = c.brand_user_id OR auth.uid() = c.creator_user_id)
    )
  );

DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages" ON public.messages FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (auth.uid() = c.brand_user_id OR auth.uid() = c.creator_user_id)
    )
  );

-- ===== STORAGE BUCKETS =====
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio', 'portfolio', true)
  ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read, authenticated upload to own folder
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Auth upload avatars" ON storage.objects;
CREATE POLICY "Auth upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Auth update avatars" ON storage.objects;
CREATE POLICY "Auth update avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Public read product-images" ON storage.objects;
CREATE POLICY "Public read product-images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Auth upload product-images" ON storage.objects;
CREATE POLICY "Auth upload product-images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Auth update product-images" ON storage.objects;
CREATE POLICY "Auth update product-images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Public read portfolio" ON storage.objects;
CREATE POLICY "Public read portfolio" ON storage.objects FOR SELECT USING (bucket_id = 'portfolio');

DROP POLICY IF EXISTS "Auth upload portfolio" ON storage.objects;
CREATE POLICY "Auth upload portfolio" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Auth update portfolio" ON storage.objects;
CREATE POLICY "Auth update portfolio" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);


-- =============================================================================
-- Migration: 20260223001640_a42d3a57-75fa-4fea-8157-bba1a64f5420.sql
-- Add FK constraints from profile-linked tables to profiles
-- =============================================================================

-- Add direct FK constraints from tables to profiles so PostgREST can resolve joins
DO $$ BEGIN
  ALTER TABLE public.creator_profiles ADD CONSTRAINT creator_profiles_profile_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.brand_profiles ADD CONSTRAINT brand_profiles_profile_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.products ADD CONSTRAINT products_brand_profile_fkey FOREIGN KEY (brand_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.conversations ADD CONSTRAINT conversations_brand_profile_fkey FOREIGN KEY (brand_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.conversations ADD CONSTRAINT conversations_creator_profile_fkey FOREIGN KEY (creator_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- =============================================================================
-- Migration: 20260223212801_543c7b31-de5f-49b4-b398-ffefb668e545.sql
-- Create waitlist table
-- =============================================================================

-- Create waitlist table
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('creator', 'brand')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public waitlist signup)
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;
CREATE POLICY "Anyone can join waitlist"
ON public.waitlist
FOR INSERT
WITH CHECK (true);

-- Only authenticated admins could read (for now, no read policy needed)


-- =============================================================================
-- Migration: 20260304000000_deal_system.sql
-- Deal system: offers, negotiation, signing, escrow, shipping
-- =============================================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE public.deal_status AS ENUM (
    'negotiating',
    'agreed',
    'signed',
    'escrow_funded',
    'in_progress',
    'completed',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.offer_status AS ENUM (
    'pending',
    'accepted',
    'rejected',
    'countered',
    'expired'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.escrow_status AS ENUM (
    'pending',
    'funded',
    'released',
    'refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.shipment_status AS ENUM (
    'pending',
    'shipped',
    'in_transit',
    'delivered'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add message_type and metadata to messages
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Deals table (one per conversation)
CREATE TABLE IF NOT EXISTS public.deals (
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
CREATE TABLE IF NOT EXISTS public.deal_offers (
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
CREATE TABLE IF NOT EXISTS public.deal_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(deal_id, user_id)
);

-- Escrow payments
CREATE TABLE IF NOT EXISTS public.escrow_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL UNIQUE REFERENCES public.deals(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  status escrow_status NOT NULL DEFAULT 'pending',
  funded_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Shipments
CREATE TABLE IF NOT EXISTS public.shipments (
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
DROP POLICY IF EXISTS "Participants can read deals" ON public.deals;
CREATE POLICY "Participants can read deals"
  ON public.deals FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = deals.conversation_id
      AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Participants can create deals" ON public.deals;
CREATE POLICY "Participants can create deals"
  ON public.deals FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = deals.conversation_id
      AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Participants can update deals" ON public.deals;
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
DROP POLICY IF EXISTS "Participants can read offers" ON public.deal_offers;
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

DROP POLICY IF EXISTS "Participants can create offers" ON public.deal_offers;
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

DROP POLICY IF EXISTS "Participants can update offers" ON public.deal_offers;
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
DROP POLICY IF EXISTS "Participants can read signatures" ON public.deal_signatures;
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

DROP POLICY IF EXISTS "Users can sign deals" ON public.deal_signatures;
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
DROP POLICY IF EXISTS "Participants can read escrow" ON public.escrow_payments;
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

DROP POLICY IF EXISTS "Participants can create escrow" ON public.escrow_payments;
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

DROP POLICY IF EXISTS "Participants can update escrow" ON public.escrow_payments;
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
DROP POLICY IF EXISTS "Participants can read shipments" ON public.shipments;
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

DROP POLICY IF EXISTS "Participants can create shipments" ON public.shipments;
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

DROP POLICY IF EXISTS "Participants can update shipments" ON public.shipments;
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
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.deal_offers;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Trigger to update deals.updated_at
CREATE OR REPLACE FUNCTION public.update_deal_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_deal_update ON public.deals;
CREATE TRIGGER on_deal_update
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.update_deal_timestamp();


-- =============================================================================
-- Migration: 20260304003205_9638e964-5af8-4a7b-a8d3-58912e0d559f.sql
-- Add supplemental columns to deals and deal_offers
-- =============================================================================

-- Add supplemental columns to deals and deal_offers.
-- Core enums, tables, and RLS are created in 20260304000000_deal_system.sql.

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS commission_percentage NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS hours NUMERIC(6,1),
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12,2);

ALTER TABLE public.deal_offers
  ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hours NUMERIC(6,1) NOT NULL DEFAULT 0;


-- =============================================================================
-- Migration: 20260304003407_4c14550e-9f95-437f-870c-b84dd33fe532.sql
-- Re-declare deal and offer RLS policies (duplicate of deal_system, kept for completeness)
-- =============================================================================

DROP POLICY IF EXISTS "Participants can read deals" ON public.deals;
CREATE POLICY "Participants can read deals" ON public.deals FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = deals.conversation_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())));

DROP POLICY IF EXISTS "Participants can create deals" ON public.deals;
CREATE POLICY "Participants can create deals" ON public.deals FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = deals.conversation_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())));

DROP POLICY IF EXISTS "Participants can update deals" ON public.deals;
CREATE POLICY "Participants can update deals" ON public.deals FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = deals.conversation_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())));

DROP POLICY IF EXISTS "Participants can read offers" ON public.deal_offers;
CREATE POLICY "Participants can read offers" ON public.deal_offers FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.deals d JOIN public.conversations c ON c.id = d.conversation_id WHERE d.id = deal_offers.deal_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())));

DROP POLICY IF EXISTS "Participants can create offers" ON public.deal_offers;
CREATE POLICY "Participants can create offers" ON public.deal_offers FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.deals d JOIN public.conversations c ON c.id = d.conversation_id WHERE d.id = deal_offers.deal_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())));

DROP POLICY IF EXISTS "Participants can update offers" ON public.deal_offers;
CREATE POLICY "Participants can update offers" ON public.deal_offers FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.deals d JOIN public.conversations c ON c.id = d.conversation_id WHERE d.id = deal_offers.deal_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())));

DROP POLICY IF EXISTS "Participants can read signatures" ON public.deal_signatures;
CREATE POLICY "Participants can read signatures" ON public.deal_signatures FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.deals d JOIN public.conversations c ON c.id = d.conversation_id WHERE d.id = deal_signatures.deal_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())));

DROP POLICY IF EXISTS "Users can sign deals" ON public.deal_signatures;
CREATE POLICY "Users can sign deals" ON public.deal_signatures FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.deals d JOIN public.conversations c ON c.id = d.conversation_id WHERE d.id = deal_signatures.deal_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())));

DROP POLICY IF EXISTS "Participants can read escrow" ON public.escrow_payments;
CREATE POLICY "Participants can read escrow" ON public.escrow_payments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.deals d JOIN public.conversations c ON c.id = d.conversation_id WHERE d.id = escrow_payments.deal_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())));

DROP POLICY IF EXISTS "Participants can create escrow" ON public.escrow_payments;
CREATE POLICY "Participants can create escrow" ON public.escrow_payments FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.deals d JOIN public.conversations c ON c.id = d.conversation_id WHERE d.id = escrow_payments.deal_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())));

DROP POLICY IF EXISTS "Participants can update escrow" ON public.escrow_payments;
CREATE POLICY "Participants can update escrow" ON public.escrow_payments FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.deals d JOIN public.conversations c ON c.id = d.conversation_id WHERE d.id = escrow_payments.deal_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())));

DROP POLICY IF EXISTS "Participants can read shipments" ON public.shipments;
CREATE POLICY "Participants can read shipments" ON public.shipments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.deals d JOIN public.conversations c ON c.id = d.conversation_id WHERE d.id = shipments.deal_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())));

DROP POLICY IF EXISTS "Participants can create shipments" ON public.shipments;
CREATE POLICY "Participants can create shipments" ON public.shipments FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.deals d JOIN public.conversations c ON c.id = d.conversation_id WHERE d.id = shipments.deal_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())));

DROP POLICY IF EXISTS "Participants can update shipments" ON public.shipments;
CREATE POLICY "Participants can update shipments" ON public.shipments FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.deals d JOIN public.conversations c ON c.id = d.conversation_id WHERE d.id = shipments.deal_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())));


-- =============================================================================
-- Migration: 20260304004452_acc99ae5-93ec-453d-a3d5-b86b8efb564e.sql
-- Enable realtime for messages/deals/deal_offers and recreate update_deal_timestamp trigger
-- =============================================================================

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.deal_offers;
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.update_deal_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_deal_update ON public.deals;
CREATE TRIGGER on_deal_update BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.update_deal_timestamp();


-- =============================================================================
-- Migration: 20260304004507_bc5a541d-9f44-42c1-b828-0abf02c2e55c.sql
-- Update update_deal_timestamp to set search_path
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_deal_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;


-- =============================================================================
-- Migration: 20260308174557_55d12f7a-77ac-4865-b9c9-23c4db481b2a.sql
-- Add onboarding columns and new profile fields
-- =============================================================================

-- Add onboarding columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_step text DEFAULT null;

-- Add new columns to creator_profiles
ALTER TABLE public.creator_profiles
  ADD COLUMN IF NOT EXISTS tiktok_handle text DEFAULT null,
  ADD COLUMN IF NOT EXISTS audience_type text DEFAULT null;

-- Add new columns to brand_profiles
ALTER TABLE public.brand_profiles
  ADD COLUMN IF NOT EXISTS industries text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS campaign_images text[] DEFAULT '{}'::text[];


-- =============================================================================
-- Migration: 20260308174958_f0b3cb98-e9f8-4363-8ce8-5a866d3dd80f.sql
-- Update handle_new_user to handle missing role (set during onboarding now)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, role, display_name, onboarding_completed)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'creator'),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', ''),
    false
  );
  -- Only insert user_role if role is provided in metadata
  IF NEW.raw_user_meta_data ->> 'role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (
      NEW.id,
      (NEW.raw_user_meta_data ->> 'role')::app_role
    );
  END IF;
  RETURN NEW;
END;
$function$;


-- =============================================================================
-- Migration: 20260308175014_6361fb5d-bc9f-48fe-a9ce-e42a40808428.sql
-- Allow authenticated users to insert/update their own role
-- =============================================================================

-- Allow authenticated users to insert their own role
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
CREATE POLICY "Users can insert own role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own role (for role changes during onboarding)
DROP POLICY IF EXISTS "Users can update own role" ON public.user_roles;
CREATE POLICY "Users can update own role"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);


-- =============================================================================
-- Migration: 20260308180155_62e599f2-b03b-4f32-9c03-ab2d33ecd1fd.sql
-- Expand deal_status enum, add columns to deals/deal_offers, contracts table,
-- live_analytics table, realtime for new tables
-- =============================================================================

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

DROP POLICY IF EXISTS "Participants can read contracts" ON public.contracts;
CREATE POLICY "Participants can read contracts"
  ON public.contracts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM deals d JOIN conversations c ON c.id = d.conversation_id
    WHERE d.id = contracts.deal_id
    AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())
  ));

DROP POLICY IF EXISTS "Participants can create contracts" ON public.contracts;
CREATE POLICY "Participants can create contracts"
  ON public.contracts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM deals d JOIN conversations c ON c.id = d.conversation_id
    WHERE d.id = contracts.deal_id
    AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())
  ));

DROP POLICY IF EXISTS "Participants can update contracts" ON public.contracts;
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

DROP POLICY IF EXISTS "Participants can read analytics" ON public.live_analytics;
CREATE POLICY "Participants can read analytics"
  ON public.live_analytics FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM deals d JOIN conversations c ON c.id = d.conversation_id
    WHERE d.id = live_analytics.deal_id
    AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())
  ));

DROP POLICY IF EXISTS "Creator can submit analytics" ON public.live_analytics;
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

DROP POLICY IF EXISTS "Participants can update analytics" ON public.live_analytics;
CREATE POLICY "Participants can update analytics"
  ON public.live_analytics FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM deals d JOIN conversations c ON c.id = d.conversation_id
    WHERE d.id = live_analytics.deal_id
    AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())
  ));

-- 6. Enable realtime for new tables
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.contracts;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.live_analytics;
EXCEPTION WHEN others THEN NULL;
END $$;


-- =============================================================================
-- Migration: 20260308230635_03896c44-78bb-478b-803e-1b272f4b74c2.sql
-- Add instagram_handle and youtube_handle to creator_profiles
-- =============================================================================

ALTER TABLE public.creator_profiles
  ADD COLUMN IF NOT EXISTS instagram_handle text,
  ADD COLUMN IF NOT EXISTS youtube_handle text;


-- =============================================================================
-- Migration: 20260308230925_31319b25-8992-4d10-b980-15ebef5001c4.sql
-- Add facebook_handle and twitter_handle to creator_profiles
-- =============================================================================

ALTER TABLE public.creator_profiles
  ADD COLUMN IF NOT EXISTS facebook_handle text,
  ADD COLUMN IF NOT EXISTS twitter_handle text;


-- =============================================================================
-- Migration: 20260314001453_af1ab4e3-c66b-45dd-8c21-864ab208153c.sql
-- Security fixes: escrow UPDATE restricted to brand, messages UPDATE to sender only,
-- remove self-assignment role policies
-- =============================================================================

-- 1. Fix escrow_payments: restrict UPDATE to only allow status transitions via a security definer function
DROP POLICY IF EXISTS "Participants can update escrow" ON public.escrow_payments;

DROP POLICY IF EXISTS "Brand can update escrow status" ON public.escrow_payments;
CREATE POLICY "Brand can update escrow status"
ON public.escrow_payments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM deals d
    JOIN conversations c ON c.id = d.conversation_id
    WHERE d.id = escrow_payments.deal_id
    AND c.brand_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM deals d
    JOIN conversations c ON c.id = d.conversation_id
    WHERE d.id = escrow_payments.deal_id
    AND c.brand_user_id = auth.uid()
  )
);

-- 2. Fix messages: only allow users to update their own messages
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;

CREATE POLICY "Users can update own messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (auth.uid() = c.brand_user_id OR auth.uid() = c.creator_user_id)
  )
);

-- 3. Fix user_roles: remove self-assignment policies, only allow via trigger
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update own role" ON public.user_roles;


-- =============================================================================
-- Migration: 20260314001531_1735f635-e267-46fc-9ead-bc8f585936dd.sql
-- Create security definer function for safe role assignment during onboarding
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_user_role(_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update or insert the user's role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), _role)
  ON CONFLICT (user_id, role) DO UPDATE SET role = _role;

  -- Also delete any other roles for this user (one role at a time)
  DELETE FROM public.user_roles
  WHERE user_id = auth.uid() AND role != _role;
END;
$$;


-- =============================================================================
-- Migration: 20260314001750_33e5394c-d6cc-4b94-a4b8-9cd9bc19b5c7.sql
-- Fix contracts/live_analytics role to authenticated, fix products/escrow/conversations policies
-- =============================================================================

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

DROP POLICY IF EXISTS "Brand can create escrow" ON public.escrow_payments;
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


-- =============================================================================
-- Migration: 20260314002738_77e6f06f-3a6b-4f7a-ad7c-07710930cd1e.sql
-- Security fixes: restrict analytics update to brand only,
-- restrict offer updates to non-sender, fix profile visibility
-- =============================================================================

-- 1. Fix: Creators can inflate analytics / self-approve
-- Drop the overly permissive update policy
DROP POLICY IF EXISTS "Participants can update analytics" ON public.live_analytics;

-- Brand can only approve (set approved_at)
DROP POLICY IF EXISTS "Brand can approve analytics" ON public.live_analytics;
CREATE POLICY "Brand can approve analytics"
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
  EXISTS (
    SELECT 1 FROM deals d
    JOIN conversations c ON c.id = d.conversation_id
    WHERE d.id = live_analytics.deal_id AND c.brand_user_id = auth.uid()
  )
);

-- 2. Fix: Users can self-accept their own deal offers
DROP POLICY IF EXISTS "Participants can update offers" ON public.deal_offers;

-- Only the OTHER participant (non-sender) can update offers
DROP POLICY IF EXISTS "Non-sender can update offers" ON public.deal_offers;
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
)
WITH CHECK (
  sender_id != auth.uid() AND
  EXISTS (
    SELECT 1 FROM deals d
    JOIN conversations c ON c.id = d.conversation_id
    WHERE d.id = deal_offers.deal_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())
  )
);

-- Also allow sender to mark their own offer as "countered" (needed for counter flow)
DROP POLICY IF EXISTS "Sender can counter own offers" ON public.deal_offers;
CREATE POLICY "Sender can counter own offers"
ON public.deal_offers FOR UPDATE
TO authenticated
USING (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM deals d
    JOIN conversations c ON c.id = d.conversation_id
    WHERE d.id = deal_offers.deal_id AND (c.brand_user_id = auth.uid() OR c.creator_user_id = auth.uid())
  )
);

-- 3. Fix: Onboarding fields visible to all
-- Replace the open read policy with one that limits fields via a view
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;

-- Still allow all authenticated to read profiles (needed for display_name, avatar, etc)
-- But create a restricted view for general use
CREATE POLICY "Anyone can read profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);
-- Note: We'll handle field restriction at the application level since RLS is row-level not column-level

-- 4. Fix: RLS Policy Always True - check brand_profiles and creator_profiles
-- The INSERT policies on brand_profiles and creator_profiles already check auth.uid() = user_id
-- The "always true" warning is likely about the SELECT policies. These are intentional for public reads.
-- Let's check if waitlist has the issue - yes, INSERT with true for public role is intentional for waitlist.


-- =============================================================================
-- Migration: 20260314004231_fdc69271-4bd4-4afe-acb3-a4abf7ca9aad.sql
-- Further tighten offer acceptance, escrow transitions, and analytics approval policies
-- =============================================================================

-- 1. Fix: Offer recipient can modify financial terms while accepting
DROP POLICY IF EXISTS "Non-sender can update offers" ON public.deal_offers;

DROP POLICY IF EXISTS "Non-sender can accept or reject offers" ON public.deal_offers;
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
DROP POLICY IF EXISTS "Brand can fund escrow" ON public.escrow_payments;
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
DROP POLICY IF EXISTS "Brand can release escrow" ON public.escrow_payments;
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

DROP POLICY IF EXISTS "Brand can only set approved_at" ON public.live_analytics;
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


-- =============================================================================
-- Migration: 20260314004304_691490c1-c141-4498-a7ab-7d97767c73f0.sql
-- Replace WITH CHECK self-comparison with triggers for column immutability
-- =============================================================================

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
DROP POLICY IF EXISTS "Non-sender can update offers" ON public.deal_offers;
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
DROP POLICY IF EXISTS "Brand can update escrow" ON public.escrow_payments;
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
DROP POLICY IF EXISTS "Brand can approve analytics" ON public.live_analytics;
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


-- =============================================================================
-- Migration: 20260314004500_fb30a5d9-7bc2-48f3-9219-28fb9e0be097.sql
-- Replace direct brand UPDATE on escrow/analytics with security definer functions;
-- fix profile visibility with public_profiles view
-- =============================================================================

-- 1. Remove direct brand UPDATE on escrow - use a security definer function instead
DROP POLICY IF EXISTS "Brand can update escrow" ON public.escrow_payments;

CREATE OR REPLACE FUNCTION public.fund_escrow(_deal_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify caller is the brand
  IF NOT EXISTS (
    SELECT 1 FROM deals d
    JOIN conversations c ON c.id = d.conversation_id
    WHERE d.id = _deal_id AND c.brand_user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only the brand can fund escrow';
  END IF;

  UPDATE escrow_payments
  SET status = 'funded', funded_at = now()
  WHERE deal_id = _deal_id AND status = 'pending';
END;
$$;

CREATE OR REPLACE FUNCTION public.release_escrow(_deal_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify caller is the brand
  IF NOT EXISTS (
    SELECT 1 FROM deals d
    JOIN conversations c ON c.id = d.conversation_id
    WHERE d.id = _deal_id AND c.brand_user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only the brand can release escrow';
  END IF;

  UPDATE escrow_payments
  SET status = 'released', released_at = now()
  WHERE deal_id = _deal_id AND status = 'funded';
END;
$$;

-- 2. Remove direct brand UPDATE on analytics - use a security definer function
DROP POLICY IF EXISTS "Brand can approve analytics" ON public.live_analytics;

CREATE OR REPLACE FUNCTION public.approve_analytics(_deal_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify caller is the brand
  IF NOT EXISTS (
    SELECT 1 FROM deals d
    JOIN conversations c ON c.id = d.conversation_id
    WHERE d.id = _deal_id AND c.brand_user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only the brand can approve analytics';
  END IF;

  UPDATE live_analytics
  SET approved_at = now()
  WHERE deal_id = _deal_id AND approved_at IS NULL;
END;
$$;

-- 3. Fix profile visibility - restrict onboarding fields
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;

-- Users can read their own full profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Others can only read profiles (onboarding fields are still in the row but this is row-level, not column-level)
-- We'll use a view for public profile data instead
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, display_name, avatar_url, bio, role
FROM public.profiles;

-- Allow all authenticated to read the view (views inherit table RLS, so we need a SELECT policy)
DROP POLICY IF EXISTS "Anyone can read other profiles" ON public.profiles;
CREATE POLICY "Anyone can read other profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);


-- =============================================================================
-- Migration: 20260314004515_1b023a54-806d-4b3c-b773-039131e8e14c.sql
-- Fix security definer view, remove duplicate SELECT policies on profiles
-- =============================================================================

-- Fix security definer view - drop it and use invoker security instead
DROP VIEW IF EXISTS public.public_profiles;

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true)
AS SELECT id, display_name, avatar_url, bio, role FROM public.profiles;

-- Remove duplicate SELECT policies - keep just one
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can read other profiles" ON public.profiles;

-- Single policy: users read all profiles (needed for display names in chats, feeds etc.)
DROP POLICY IF EXISTS "Authenticated can read profiles" ON public.profiles;
CREATE POLICY "Authenticated can read profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);


-- =============================================================================
-- Migration: 20260314005054_3f854816-6194-457f-9c9b-c93c45921095.sql
-- Prevent role changes via profiles table using trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Cannot change role directly. Use set_user_role RPC.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_change ON public.profiles;
CREATE TRIGGER trg_prevent_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_change();


-- =============================================================================
-- Migration: 20260314034923_4b89605b-766c-4faa-bdc6-144967a3c86f.sql
-- Add additional creator_profiles columns and profile_images to profiles
-- =============================================================================

ALTER TABLE public.creator_profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS experience_level text,
  ADD COLUMN IF NOT EXISTS product_interests text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS has_tiktok_affiliate text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_images text[] DEFAULT '{}'::text[];


-- =============================================================================
-- Migration: 20260314042626_653b5cb5-3e59-4d30-a066-9848c8bed82b.sql
-- Add past_month_gmv column to products
-- =============================================================================

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS past_month_gmv numeric;


-- =============================================================================
-- Migration: 20260315233326_fd1b477d-4562-401a-b3c5-faa170026d86.sql
-- Restrict profiles SELECT to own row; add role checks to products INSERT/UPDATE/DELETE
-- =============================================================================

-- 1. Restrict profiles SELECT to own row only
DROP POLICY IF EXISTS "Authenticated can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- 2. Products: add role check to INSERT
DROP POLICY IF EXISTS "Brands can insert products" ON public.products;
CREATE POLICY "Brands can insert products" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = brand_id
    AND public.has_role(auth.uid(), 'brand')
  );

-- 3. Products: add role check to UPDATE
DROP POLICY IF EXISTS "Brands can update own products" ON public.products;
CREATE POLICY "Brands can update own products" ON public.products
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = brand_id
    AND public.has_role(auth.uid(), 'brand')
  );

-- 4. Products: add role check to DELETE
DROP POLICY IF EXISTS "Brands can delete own products" ON public.products;
CREATE POLICY "Brands can delete own products" ON public.products
  FOR DELETE TO authenticated
  USING (
    auth.uid() = brand_id
    AND public.has_role(auth.uid(), 'brand')
  );
