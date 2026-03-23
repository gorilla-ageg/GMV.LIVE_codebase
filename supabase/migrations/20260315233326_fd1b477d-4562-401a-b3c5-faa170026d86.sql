-- 1. Restrict profiles SELECT to own row only
DROP POLICY "Authenticated can read profiles" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- 2. Products: add role check to INSERT
DROP POLICY "Brands can insert products" ON public.products;
CREATE POLICY "Brands can insert products" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = brand_id
    AND public.has_role(auth.uid(), 'brand')
  );

-- 3. Products: add role check to UPDATE
DROP POLICY "Brands can update own products" ON public.products;
CREATE POLICY "Brands can update own products" ON public.products
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = brand_id
    AND public.has_role(auth.uid(), 'brand')
  );

-- 4. Products: add role check to DELETE
DROP POLICY "Brands can delete own products" ON public.products;
CREATE POLICY "Brands can delete own products" ON public.products
  FOR DELETE TO authenticated
  USING (
    auth.uid() = brand_id
    AND public.has_role(auth.uid(), 'brand')
  );