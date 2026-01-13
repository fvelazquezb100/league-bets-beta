-- ============================================================================
-- Add premium pricing columns and logic to leagues table
-- ============================================================================
-- This migration adds:
-- 1. members column: real-time count of league members
-- 2. premium_cost column: calculated price based on formula
-- 3. premium_pricing_settings in betting_settings: JSONB with cost parameters
-- 4. Functions to calculate members and premium_cost

-- ============================================================================
-- PART 1: Add premium_pricing_settings to betting_settings table
-- ============================================================================

-- Add JSONB column to betting_settings for premium pricing settings
ALTER TABLE public.betting_settings
ADD COLUMN IF NOT EXISTS premium_pricing_settings jsonb DEFAULT '{}'::jsonb;

-- Add comment
COMMENT ON COLUMN public.betting_settings.premium_pricing_settings IS 'JSONB object storing premium pricing parameters: coste_fijo, coste_miembro, coste_mes, maximo, minimo, formula_factor. Formula: coste_fijo + members * coste_miembro - coste_mes * (formula_factor - months_remaining)';

-- Insert default premium pricing settings (only if not exists)
-- We'll use a single row with setting_key = 'premium_pricing' to store all values
INSERT INTO public.betting_settings (setting_key, setting_value, description, premium_pricing_settings)
VALUES (
  'premium_pricing',
  'active',
  'Premium league pricing configuration',
  '{
    "coste_fijo": 0,
    "coste_miembro": 0,
    "coste_mes": 0,
    "maximo": 1000,
    "minimo": 0,
    "formula_factor": 10
  }'::jsonb
)
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- PART 2: Add members and premium_cost columns to leagues table
-- ============================================================================

-- Add members column (will be calculated in real-time via view or functions)
ALTER TABLE public.leagues
ADD COLUMN IF NOT EXISTS members integer DEFAULT 0;

-- Add premium_cost column (will be calculated in real-time via view or functions)
ALTER TABLE public.leagues
ADD COLUMN IF NOT EXISTS premium_cost numeric(10, 2) DEFAULT 0;

-- Add comments
COMMENT ON COLUMN public.leagues.members IS 'Count of members in the league. Updated automatically via trigger when profiles change. For real-time calculation, use calculate_league_members(league_id) function.';
COMMENT ON COLUMN public.leagues.premium_cost IS 'Calculated premium cost using formula: coste_fijo + members * coste_miembro - coste_mes * (formula_factor - months_until_may). Formula parameters are configurable in betting_settings. Updated automatically via trigger when profiles change. For real-time calculation, use calculate_premium_cost(league_id) function.';

-- ============================================================================
-- PART 3: Create function to calculate members count for a league
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_league_members(league_id_param bigint)
RETURNS integer AS $$
DECLARE
  v_members_count integer;
BEGIN
  SELECT COUNT(*)::integer
  INTO v_members_count
  FROM public.profiles
  WHERE league_id = league_id_param;
  
  RETURN COALESCE(v_members_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_league_members IS 'Calculates the real-time count of members in a league';

-- ============================================================================
-- PART 4: Create function to calculate months remaining until next May (May included)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_months_until_may()
RETURNS integer AS $$
DECLARE
  v_current_date date;
  v_current_year integer;
  v_current_month integer;
  v_may_date date;
  v_months_remaining integer;
BEGIN
  -- Use CURRENT_DATE to get real-time current date (not cached)
  v_current_date := CURRENT_DATE;
  v_current_year := EXTRACT(YEAR FROM v_current_date);
  v_current_month := EXTRACT(MONTH FROM v_current_date);
  
  -- If current month is May or later, target is May of next year
  -- Otherwise, target is May of current year
  IF v_current_month >= 5 THEN
    v_may_date := DATE(v_current_year + 1 || '-05-01');
  ELSE
    v_may_date := DATE(v_current_year || '-05-01');
  END IF;
  
  -- Calculate months between current date and May (inclusive)
  -- We need to count from current month to May (inclusive)
  -- If we're in May, count 1 month (May itself)
  -- If we're in June, count 11 months (June to May next year, including May)
  -- etc.
  
  IF v_current_month <= 5 THEN
    -- We're before or in May, count from current month to May (inclusive)
    v_months_remaining := 5 - v_current_month + 1;
  ELSE
    -- We're after May, count from current month to May next year (inclusive)
    v_months_remaining := (12 - v_current_month + 1) + 5;
  END IF;
  
  -- Ensure at least 1 month (if we're in May, we still count May)
  IF v_months_remaining < 1 THEN
    v_months_remaining := 1;
  END IF;
  
  RETURN v_months_remaining;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.calculate_months_until_may IS 'Calculates months remaining until next May (May included)';

-- ============================================================================
-- PART 5: Create function to calculate premium_cost for a league
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_premium_cost(league_id_param bigint)
RETURNS numeric(10, 2) AS $$
DECLARE
  v_members integer;
  v_coste_fijo numeric(10, 2);
  v_coste_miembro numeric(10, 2);
  v_coste_mes numeric(10, 2);
  v_maximo numeric(10, 2);
  v_minimo numeric(10, 2);
  v_months_remaining integer;
  v_calculated_cost numeric(10, 2);
  v_premium_pricing jsonb;
BEGIN
  -- Get members count
  v_members := public.calculate_league_members(league_id_param);
  
  -- Get premium pricing settings from betting_settings
  SELECT premium_pricing_settings
  INTO v_premium_pricing
  FROM public.betting_settings
  WHERE setting_key = 'premium_pricing';
  
  -- Extract values from JSONB (with defaults)
  v_coste_fijo := COALESCE((v_premium_pricing->>'coste_fijo')::numeric, 0);
  v_coste_miembro := COALESCE((v_premium_pricing->>'coste_miembro')::numeric, 0);
  v_coste_mes := COALESCE((v_premium_pricing->>'coste_mes')::numeric, 0);
  v_maximo := COALESCE((v_premium_pricing->>'maximo')::numeric, 1000);
  v_minimo := COALESCE((v_premium_pricing->>'minimo')::numeric, 0);
  
  -- Calculate months remaining until next May
  v_months_remaining := public.calculate_months_until_may();
  
  -- Calculate cost: coste_fijo + members * coste_miembro - coste_mes * (10 - months_remaining)
  v_calculated_cost := v_coste_fijo + (v_members * v_coste_miembro) - (v_coste_mes * (10 - v_months_remaining));
  
  -- Apply min/max constraints
  IF v_calculated_cost > v_maximo THEN
    v_calculated_cost := v_maximo;
  END IF;
  
  IF v_calculated_cost < v_minimo THEN
    v_calculated_cost := v_minimo;
  END IF;
  
  RETURN v_calculated_cost;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_premium_cost IS 'Calculates premium cost for a league based on configurable formula: coste_fijo + members * coste_miembro - coste_mes * (formula_factor - months_remaining). All parameters including formula_factor are stored in betting_settings (capped between minimo and maximo)';

-- ============================================================================
-- PART 6: Create function to update members and premium_cost for all leagues
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_league_pricing()
RETURNS jsonb AS $$
DECLARE
  v_league_record RECORD;
  v_updated_count integer := 0;
  v_result jsonb;
BEGIN
  -- Loop through all leagues and update members and premium_cost
  FOR v_league_record IN
    SELECT id FROM public.leagues
  LOOP
    UPDATE public.leagues
    SET
      members = public.calculate_league_members(v_league_record.id),
      premium_cost = public.calculate_premium_cost(v_league_record.id)
    WHERE id = v_league_record.id;
    
    v_updated_count := v_updated_count + 1;
  END LOOP;
  
  v_result := jsonb_build_object(
    'success', true,
    'message', 'League pricing updated successfully',
    'updated_leagues', v_updated_count
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.update_league_pricing IS 'Updates members count and premium_cost for all leagues';

-- ============================================================================
-- PART 7: Create trigger to update members and premium_cost when profiles change
-- ============================================================================

-- Function to update league pricing when a profile's league_id changes
CREATE OR REPLACE FUNCTION public.trigger_update_league_pricing()
RETURNS trigger AS $$
DECLARE
  v_old_league_id bigint;
  v_new_league_id bigint;
BEGIN
  -- Get old and new league_id
  IF TG_OP = 'UPDATE' THEN
    v_old_league_id := OLD.league_id;
    v_new_league_id := NEW.league_id;
  ELSIF TG_OP = 'INSERT' THEN
    v_new_league_id := NEW.league_id;
  ELSIF TG_OP = 'DELETE' THEN
    v_old_league_id := OLD.league_id;
  END IF;
  
  -- Update old league if league_id changed or user deleted
  IF v_old_league_id IS NOT NULL AND (TG_OP = 'UPDATE' AND v_old_league_id != v_new_league_id OR TG_OP = 'DELETE') THEN
    UPDATE public.leagues
    SET
      members = public.calculate_league_members(v_old_league_id),
      premium_cost = public.calculate_premium_cost(v_old_league_id)
    WHERE id = v_old_league_id;
  END IF;
  
  -- Update new league if league_id changed or user inserted
  IF v_new_league_id IS NOT NULL AND (TG_OP = 'UPDATE' AND v_old_league_id != v_new_league_id OR TG_OP = 'INSERT') THEN
    UPDATE public.leagues
    SET
      members = public.calculate_league_members(v_new_league_id),
      premium_cost = public.calculate_premium_cost(v_new_league_id)
    WHERE id = v_new_league_id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.trigger_update_league_pricing IS 'Trigger function to update league members and premium_cost when profiles change';

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS update_league_pricing_on_profile_change ON public.profiles;
CREATE TRIGGER update_league_pricing_on_profile_change
  AFTER INSERT OR UPDATE OF league_id OR DELETE
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_league_pricing();

-- ============================================================================
-- PART 8: Create view for real-time calculation of members and premium_cost
-- ============================================================================

-- Create a view that calculates members and premium_cost in real-time
-- This view recalculates the values EVERY TIME it is queried (true real-time)
-- Use this view when you need the absolute latest values
CREATE OR REPLACE VIEW public.leagues_with_pricing AS
SELECT 
  l.*,
  public.calculate_league_members(l.id) AS members_realtime,
  public.calculate_premium_cost(l.id) AS premium_cost_realtime
FROM public.leagues l;

COMMENT ON VIEW public.leagues_with_pricing IS 'View that provides REAL-TIME calculated members and premium_cost for leagues. Values are recalculated on every query. Use members_realtime and premium_cost_realtime columns.';

-- Grant permissions to view
GRANT SELECT ON public.leagues_with_pricing TO authenticated, anon;

-- ============================================================================
-- PART 9: Initialize members and premium_cost for existing leagues
-- ============================================================================

-- Update all existing leagues with current members count and premium_cost
-- These are cached values that can be updated via trigger or manually
DO $$
DECLARE
  v_league_record RECORD;
BEGIN
  FOR v_league_record IN
    SELECT id FROM public.leagues
  LOOP
    UPDATE public.leagues
    SET
      members = public.calculate_league_members(v_league_record.id),
      premium_cost = public.calculate_premium_cost(v_league_record.id)
    WHERE id = v_league_record.id;
  END LOOP;
END $$;

-- ============================================================================
-- PART 10: Create discounts table
-- ============================================================================

-- Create discounts table for managing discount codes
CREATE TABLE IF NOT EXISTS public.discounts (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  codigo varchar(50) NOT NULL UNIQUE,
  tipo_descuento varchar(1) NOT NULL CHECK (tipo_descuento IN ('%', '€')),
  cantidad numeric(10, 2) NOT NULL,
  creacion timestamp with time zone NOT NULL DEFAULT now(),
  numero_veces_usados integer NOT NULL DEFAULT 0,
  caducidad date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add comments
COMMENT ON TABLE public.discounts IS 'Table storing discount codes for premium league purchases';
COMMENT ON COLUMN public.discounts.codigo IS 'Unique discount code';
COMMENT ON COLUMN public.discounts.tipo_descuento IS 'Discount type: % (percentage) or € (fixed amount)';
COMMENT ON COLUMN public.discounts.cantidad IS 'Discount amount: 0-100 if tipo_descuento is %, monetary amount if tipo_descuento is €';
COMMENT ON COLUMN public.discounts.creacion IS 'Creation date of the discount code';
COMMENT ON COLUMN public.discounts.numero_veces_usados IS 'Number of times this discount code has been used';
COMMENT ON COLUMN public.discounts.caducidad IS 'Expiration date of the discount code (NULL means no expiration)';

-- Add constraint to ensure cantidad is between 0 and 100 if tipo_descuento is '%'
-- and non-negative if tipo_descuento is '€'
ALTER TABLE public.discounts
ADD CONSTRAINT discounts_cantidad_percentage_check 
CHECK (
  (tipo_descuento = '%' AND cantidad >= 0 AND cantidad <= 100) OR
  (tipo_descuento = '€' AND cantidad >= 0)
);

-- Add constraint to ensure numero_veces_usados is non-negative
ALTER TABLE public.discounts
ADD CONSTRAINT discounts_numero_veces_usados_check 
CHECK (numero_veces_usados >= 0);

-- Create index on codigo for fast lookups
CREATE INDEX IF NOT EXISTS idx_discounts_codigo ON public.discounts(codigo);

-- Create index on caducidad for filtering expired discounts
CREATE INDEX IF NOT EXISTS idx_discounts_caducidad ON public.discounts(caducidad);

-- Enable RLS on discounts table
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

-- RLS Policy 1: Everyone can read discounts (needed to validate codes)
CREATE POLICY "Anyone can read discounts" ON public.discounts
  FOR SELECT
  USING (true);

-- RLS Policy 2: Only superadmins can insert/update/delete discounts
CREATE POLICY "Only superadmins can modify discounts" ON public.discounts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (select auth.uid())
      AND global_role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (select auth.uid())
      AND global_role = 'superadmin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_discounts_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_discounts_updated_at ON public.discounts;
CREATE TRIGGER update_discounts_updated_at
  BEFORE UPDATE ON public.discounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_discounts_updated_at();
