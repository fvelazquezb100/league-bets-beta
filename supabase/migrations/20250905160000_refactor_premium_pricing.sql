-- ============================================================================
-- Refactor premium pricing: Remove columns from leagues, update view, move settings, add discounts
-- ============================================================================

-- ============================================================================
-- PART 1: Drop existing view first (before removing columns it depends on)
-- ============================================================================

-- Drop existing view first to avoid dependency issues
DROP VIEW IF EXISTS public.leagues_with_pricing;

-- ============================================================================
-- PART 2: Remove members and premium_cost columns from leagues table
-- ============================================================================

ALTER TABLE public.leagues
DROP COLUMN IF EXISTS members;

ALTER TABLE public.leagues
DROP COLUMN IF EXISTS premium_cost;

-- ============================================================================
-- PART 3: Recreate leagues_with_pricing view with only required columns + RLS
-- ============================================================================

-- Create new view with: id, name, created_at, type, members_realtime, premium_cost_realtime
CREATE OR REPLACE VIEW public.leagues_with_pricing AS
SELECT 
  l.id,
  l.name,
  l.created_at,
  l.type,
  public.calculate_league_members(l.id) AS members_realtime,
  public.calculate_premium_cost(l.id) AS premium_cost_realtime
FROM public.leagues l;

COMMENT ON VIEW public.leagues_with_pricing IS 'View that provides real-time calculated members and premium_cost for leagues. Includes: id, name, created_at, type, members_realtime, premium_cost_realtime.';

-- Grant permissions to view
GRANT SELECT ON public.leagues_with_pricing TO authenticated, anon;

-- Note: RLS on views in PostgreSQL works through the underlying table
-- The leagues table already has RLS enabled and policies configured
-- Views inherit RLS from their underlying tables, so no additional RLS setup is needed

-- ============================================================================
-- PART 4: Move premium_pricing_settings from JSONB column to setting_value
-- ============================================================================

-- Get the current premium_pricing_settings JSONB value
DO $$
DECLARE
  v_premium_pricing jsonb;
BEGIN
  -- Get the premium_pricing_settings JSONB
  SELECT premium_pricing_settings INTO v_premium_pricing
  FROM public.betting_settings
  WHERE setting_key = 'premium_pricing';
  
  -- Update setting_value with the JSONB content (convert to text)
  IF v_premium_pricing IS NOT NULL THEN
    UPDATE public.betting_settings
    SET setting_value = v_premium_pricing::text
    WHERE setting_key = 'premium_pricing';
  END IF;
END $$;

-- Drop the premium_pricing_settings column
ALTER TABLE public.betting_settings
DROP COLUMN IF EXISTS premium_pricing_settings;

-- ============================================================================
-- PART 5: Update calculate_premium_cost function to read from setting_value instead of premium_pricing_settings
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
  v_formula_factor numeric(10, 2);
  v_months_remaining integer;
  v_calculated_cost numeric(10, 2);
  v_premium_pricing jsonb;
BEGIN
  -- Get members count
  v_members := public.calculate_league_members(league_id_param);
  
  -- Get premium pricing settings from betting_settings (now from setting_value)
  SELECT setting_value::jsonb
  INTO v_premium_pricing
  FROM public.betting_settings
  WHERE setting_key = 'premium_pricing';
  
  -- Extract values from JSONB (with defaults)
  v_coste_fijo := COALESCE((v_premium_pricing->>'coste_fijo')::numeric, 0);
  v_coste_miembro := COALESCE((v_premium_pricing->>'coste_miembro')::numeric, 0);
  v_coste_mes := COALESCE((v_premium_pricing->>'coste_mes')::numeric, 0);
  v_maximo := COALESCE((v_premium_pricing->>'maximo')::numeric, 1000);
  v_minimo := COALESCE((v_premium_pricing->>'minimo')::numeric, 0);
  v_formula_factor := COALESCE((v_premium_pricing->>'formula_factor')::numeric, 10);
  
  -- Calculate months remaining until next May
  v_months_remaining := public.calculate_months_until_may();
  
  -- Calculate cost: coste_fijo + members * coste_miembro - coste_mes * (formula_factor - months_remaining)
  -- The formula_factor is configurable from betting_settings (default: 10)
  v_calculated_cost := v_coste_fijo + (v_members * v_coste_miembro) - (v_coste_mes * (v_formula_factor - v_months_remaining));
  
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

COMMENT ON FUNCTION public.calculate_premium_cost IS 'Calculates premium cost for a league based on configurable formula: coste_fijo + members * coste_miembro - coste_mes * (formula_factor - months_remaining). All parameters are stored in betting_settings.setting_value as JSONB (capped between minimo and maximo)';

-- ============================================================================
-- PART 6: Remove trigger that updated members and premium_cost columns (no longer needed)
-- ============================================================================

-- Drop the trigger since we no longer have the columns to update
DROP TRIGGER IF EXISTS update_league_pricing_on_profile_change ON public.profiles;

-- Drop the trigger function (optional, but clean)
DROP FUNCTION IF EXISTS public.trigger_update_league_pricing();

-- ============================================================================
-- PART 7: Create discount codes
-- ============================================================================

-- Insert BIENVENIDA discount: 100% discount, expires 2026-03-01
INSERT INTO public.discounts (codigo, tipo_descuento, cantidad, creacion, numero_veces_usados, caducidad)
VALUES (
  'BIENVENIDA',
  '%',
  100,
  now(),
  0,
  '2026-03-01'::date
)
ON CONFLICT (codigo) DO UPDATE SET
  tipo_descuento = EXCLUDED.tipo_descuento,
  cantidad = EXCLUDED.cantidad,
  caducidad = EXCLUDED.caducidad;

-- Insert JAMBOLEAGUE50 discount: 50€ discount, expires 2026-06-01
INSERT INTO public.discounts (codigo, tipo_descuento, cantidad, creacion, numero_veces_usados, caducidad)
VALUES (
  'JAMBOLEAGUE50',
  '€',
  50,
  now(),
  0,
  '2026-06-01'::date
)
ON CONFLICT (codigo) DO UPDATE SET
  tipo_descuento = EXCLUDED.tipo_descuento,
  cantidad = EXCLUDED.cantidad,
  caducidad = EXCLUDED.caducidad;
