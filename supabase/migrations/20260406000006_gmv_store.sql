-- GMV Store: Allow admin to create products, conversations, deals, and messages

-- 1. Add affiliate_link column to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS affiliate_link TEXT;

-- 2. Admin can insert products (for GMV Store catalog)
DROP POLICY IF EXISTS "Admin can insert products" ON public.products;
CREATE POLICY "Admin can insert products"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Admin can create conversations (to chat with creators about GMV Store products)
DROP POLICY IF EXISTS "Admin can create conversations" ON public.conversations;
CREATE POLICY "Admin can create conversations"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Admin can read all conversations
DROP POLICY IF EXISTS "Admin can read conversations" ON public.conversations;
CREATE POLICY "Admin can read conversations"
  ON public.conversations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Admin can update conversations
DROP POLICY IF EXISTS "Admin can update conversations" ON public.conversations;
CREATE POLICY "Admin can update conversations"
  ON public.conversations FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. Admin can insert deals
DROP POLICY IF EXISTS "Admin can insert deals" ON public.deals;
CREATE POLICY "Admin can insert deals"
  ON public.deals FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. Admin can update deals
DROP POLICY IF EXISTS "Admin can update deals" ON public.deals;
CREATE POLICY "Admin can update deals"
  ON public.deals FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 8. Admin can send messages
DROP POLICY IF EXISTS "Admin can send messages" ON public.messages;
CREATE POLICY "Admin can send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    AND auth.uid() = sender_id
  );

-- 9. Admin can read all messages
DROP POLICY IF EXISTS "Admin can read messages" ON public.messages;
CREATE POLICY "Admin can read messages"
  ON public.messages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
