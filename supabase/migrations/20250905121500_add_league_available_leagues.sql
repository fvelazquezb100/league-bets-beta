-- Add available_leagues column to leagues table
-- This will store an array of league IDs that are available for betting in this league

ALTER TABLE public.leagues 
ADD COLUMN available_leagues integer[] DEFAULT ARRAY[140, 2, 3, 262]; -- Default: La Liga, Champions, Europa, Liga MX

-- Add comment to explain the column
COMMENT ON COLUMN public.leagues.available_leagues IS 'Array of league IDs available for betting in this league. Default includes La Liga (140), Champions League (2), Europa League (3), and Liga MX (262)';

-- Create an index for better performance when filtering by available leagues
CREATE INDEX idx_leagues_available_leagues ON public.leagues USING GIN (available_leagues);

-- Update existing leagues to have the default available leagues
UPDATE public.leagues 
SET available_leagues = ARRAY[140, 2, 3, 262] 
WHERE available_leagues IS NULL;

-- Add constraint to ensure available_leagues is not empty
ALTER TABLE public.leagues 
ADD CONSTRAINT check_available_leagues_not_empty 
CHECK (array_length(available_leagues, 1) > 0);

-- Create a function to validate league IDs in available_leagues
CREATE OR REPLACE FUNCTION validate_available_leagues(league_ids integer[])
RETURNS boolean AS $$
BEGIN
  -- Check if all league IDs are valid (you can expand this list as you add more leagues)
  RETURN league_ids <@ ARRAY[140, 2, 3, 262, 39, 135, 78, 61]; -- Current + future European leagues
END;
$$ LANGUAGE plpgsql;

-- Add constraint to validate available_leagues
ALTER TABLE public.leagues 
ADD CONSTRAINT check_available_leagues_valid 
CHECK (validate_available_leagues(available_leagues));

-- Create a function to get available leagues for a specific league
CREATE OR REPLACE FUNCTION get_available_leagues(league_id_param bigint)
RETURNS TABLE(league_id integer, league_name text) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    unnest(l.available_leagues) as league_id,
    CASE unnest(l.available_leagues)
      WHEN 140 THEN 'La Liga'
      WHEN 2 THEN 'Champions League'
      WHEN 3 THEN 'Europa League'
      WHEN 262 THEN 'Liga MX'
      WHEN 39 THEN 'Premier League'
      WHEN 135 THEN 'Serie A'
      WHEN 78 THEN 'Bundesliga'
      WHEN 61 THEN 'Ligue 1'
      ELSE 'Unknown League'
    END as league_name
  FROM public.leagues l
  WHERE l.id = league_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_available_leagues(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_available_leagues(integer[]) TO authenticated;
