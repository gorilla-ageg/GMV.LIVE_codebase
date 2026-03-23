
-- Add direct FK constraints from tables to profiles so PostgREST can resolve joins
ALTER TABLE public.creator_profiles 
  ADD CONSTRAINT creator_profiles_profile_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.brand_profiles 
  ADD CONSTRAINT brand_profiles_profile_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.products 
  ADD CONSTRAINT products_brand_profile_fkey 
  FOREIGN KEY (brand_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.conversations 
  ADD CONSTRAINT conversations_brand_profile_fkey 
  FOREIGN KEY (brand_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.conversations 
  ADD CONSTRAINT conversations_creator_profile_fkey 
  FOREIGN KEY (creator_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
