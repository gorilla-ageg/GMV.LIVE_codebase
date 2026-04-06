-- Admin can delete creator profiles
DROP POLICY IF EXISTS "Admin can delete creator_profiles" ON public.creator_profiles;
CREATE POLICY "Admin can delete creator_profiles"
  ON public.creator_profiles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete brand profiles
DROP POLICY IF EXISTS "Admin can delete brand_profiles" ON public.brand_profiles;
CREATE POLICY "Admin can delete brand_profiles"
  ON public.brand_profiles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete products
DROP POLICY IF EXISTS "Admin can delete products" ON public.products;
CREATE POLICY "Admin can delete products"
  ON public.products FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
