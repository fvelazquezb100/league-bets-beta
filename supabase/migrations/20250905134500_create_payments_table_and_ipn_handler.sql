-- ============================================================================
-- Create payments table for PayPal transactions
-- Supports: donations, PRO user subscriptions, Premium league subscriptions
-- Date: 2025-01-01
-- ============================================================================

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  league_id bigint REFERENCES public.leagues(id) ON DELETE SET NULL,
  payment_type text NOT NULL CHECK (payment_type IN ('donation', 'pro', 'premium')),
  amount numeric NOT NULL,
  currency text DEFAULT 'EUR' NOT NULL,
  transaction_id text UNIQUE NOT NULL,
  payer_email text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  ipn_data jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Constraints
  CONSTRAINT payments_user_or_league CHECK (
    (payment_type = 'donation' AND user_id IS NOT NULL) OR
    (payment_type = 'pro' AND user_id IS NOT NULL) OR
    (payment_type = 'premium' AND league_id IS NOT NULL AND user_id IS NOT NULL)
  )
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_league_id ON public.payments(league_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON public.payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at);

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view their own payments"
ON public.payments
FOR SELECT
TO authenticated
USING (user_id = (select auth.uid()));

-- League admins can view payments for their league
CREATE POLICY "League admins can view league payments"
ON public.payments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid())
    AND (
      p.global_role = 'superadmin' OR
      (p.role = 'admin_league' AND p.league_id = payments.league_id)
    )
  )
);

-- Superadmins can view all payments
CREATE POLICY "Superadmins can view all payments"
ON public.payments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid())
    AND global_role = 'superadmin'
  )
);

-- Service role can insert/update payments (for IPN handler)
CREATE POLICY "Service role can manage payments"
ON public.payments
FOR ALL
TO service_role
WITH CHECK (true);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to get user's total donations
CREATE OR REPLACE FUNCTION public.get_user_total_donations(user_uuid uuid DEFAULT auth.uid())
RETURNS numeric AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM public.payments
  WHERE user_id = user_uuid
    AND payment_type = 'donation'
    AND status = 'completed';
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Function to check if user has active PRO subscription
CREATE OR REPLACE FUNCTION public.user_has_pro_subscription(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.payments
    WHERE user_id = user_uuid
      AND payment_type = 'pro'
      AND status = 'completed'
      -- Assuming PRO is a one-time payment, if it's recurring, add date checks here
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Function to check if league has active premium subscription
CREATE OR REPLACE FUNCTION public.league_has_premium_subscription(league_id_param bigint)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.payments
    WHERE league_id = league_id_param
      AND payment_type = 'premium'
      AND status = 'completed'
      -- Assuming premium is a one-time payment, if it's recurring, add date checks here
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Function to get payment statistics for superadmins
CREATE OR REPLACE FUNCTION public.get_payment_statistics()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_donations', (
      SELECT COALESCE(SUM(amount), 0)
      FROM public.payments
      WHERE payment_type = 'donation' AND status = 'completed'
    ),
    'total_pro_payments', (
      SELECT COALESCE(SUM(amount), 0)
      FROM public.payments
      WHERE payment_type = 'pro' AND status = 'completed'
    ),
    'total_premium_payments', (
      SELECT COALESCE(SUM(amount), 0)
      FROM public.payments
      WHERE payment_type = 'premium' AND status = 'completed'
    ),
    'total_amount', (
      SELECT COALESCE(SUM(amount), 0)
      FROM public.payments
      WHERE status = 'completed'
    ),
    'pending_count', (
      SELECT COUNT(*)
      FROM public.payments
      WHERE status = 'pending'
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

