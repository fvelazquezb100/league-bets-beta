-- Update available_leagues validation to include new leagues and make it extensible
-- This migration updates the validate_available_leagues function to include:
-- - Selecciones (557)
-- - Copa del Rey España (143)
-- - Super Copa España (556)
-- And makes it easier to add new leagues in the future

-- Create a reference table for valid league IDs (if it doesn't exist)
-- This allows adding new leagues by simply inserting into this table
CREATE TABLE IF NOT EXISTS public.valid_league_ids (
    league_id integer PRIMARY KEY,
    league_name text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.valid_league_ids IS 'Reference table for valid league IDs that can be used in available_leagues. Add new leagues by inserting rows here.';
COMMENT ON COLUMN public.valid_league_ids.league_id IS 'The league ID (must match API-Football league ID or internal ID)';
COMMENT ON COLUMN public.valid_league_ids.league_name IS 'Human-readable name of the league';
COMMENT ON COLUMN public.valid_league_ids.is_active IS 'If false, the league ID is no longer valid for new leagues';

-- Insert current valid league IDs
-- Using INSERT ... ON CONFLICT to allow re-running the migration
INSERT INTO public.valid_league_ids (league_id, league_name, is_active) VALUES
    (140, 'La Liga', true),
    (2, 'Champions League', true),
    (3, 'Europa League', true),
    (262, 'Liga MX', true),
    (39, 'Premier League', true),
    (135, 'Serie A', true),
    (78, 'Bundesliga', true),
    (61, 'Ligue 1', true),
    (557, 'Selecciones', true),
    (143, 'Copa del Rey España', true),
    (556, 'Super Copa España', true)
ON CONFLICT (league_id) DO UPDATE SET
    league_name = EXCLUDED.league_name,
    is_active = EXCLUDED.is_active;

-- Update the validation function to read from the reference table
-- This makes it easy to add new leagues: just insert into valid_league_ids
CREATE OR REPLACE FUNCTION validate_available_leagues(league_ids integer[])
RETURNS boolean AS $$
BEGIN
  -- Check if all league IDs are valid by querying the reference table
  -- Only check against active leagues
  RETURN (
    SELECT bool_and(league_id IN (SELECT league_id FROM public.valid_league_ids WHERE is_active = true))
    FROM unnest(league_ids) AS league_id
  );
END;
$$ LANGUAGE plpgsql;

-- Update the get_available_leagues function to read from the reference table
-- This automatically includes any new leagues added to valid_league_ids
CREATE OR REPLACE FUNCTION get_available_leagues(league_id_param bigint)
RETURNS TABLE(league_id integer, league_name text) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    unnest(l.available_leagues) as league_id,
    COALESCE(v.league_name, 'Unknown League') as league_name
  FROM public.leagues l
  LEFT JOIN public.valid_league_ids v ON v.league_id = unnest(l.available_leagues) AND v.is_active = true
  WHERE l.id = league_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions on the new table
GRANT SELECT ON public.valid_league_ids TO authenticated;
GRANT SELECT ON public.valid_league_ids TO anon;

-- Update comment to document the extensible approach
COMMENT ON FUNCTION validate_available_leagues(integer[]) IS 'Validates that all league IDs in the array exist in the valid_league_ids reference table and are active. To add new leagues, insert a row into valid_league_ids table.';
