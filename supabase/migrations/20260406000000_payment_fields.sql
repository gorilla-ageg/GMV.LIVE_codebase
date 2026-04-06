-- Add payment fields to creator_profiles
ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('Venmo','PayPal','Zelle','CashApp','Wire','Other')),
  ADD COLUMN IF NOT EXISTS payment_handle TEXT;

-- Add payment status fields to deals
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','sent','confirmed')),
  ADD COLUMN IF NOT EXISTS payment_method_used TEXT;

-- RLS policy: creator payment info is readable by
-- 1. The creator themselves (always)
-- 2. A brand that has a deal with that creator at status 'contract_signed' or later
CREATE POLICY "creators_read_own_payment_info"
  ON creator_profiles
  FOR SELECT
  USING (
    auth.uid() = user_id
  );

CREATE POLICY "brands_read_creator_payment_after_contract"
  ON creator_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM deals d
      JOIN conversations c ON c.id = d.conversation_id
      WHERE c.creator_user_id = creator_profiles.user_id
        AND c.brand_user_id = auth.uid()
        AND d.status IN (
          'signed', 'contracted', 'funded', 'escrow_funded',
          'shipped', 'delivered', 'in_progress', 'live',
          'completed', 'disputed'
        )
    )
  );

-- Allow creators to update their own payment info
CREATE POLICY "creators_update_own_payment_info"
  ON creator_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
