
-- 1. Fix escrow_payments: restrict UPDATE to only allow status transitions via a security definer function
DROP POLICY IF EXISTS "Participants can update escrow" ON public.escrow_payments;

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
