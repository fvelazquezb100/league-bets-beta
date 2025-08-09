-- Add fixture_id column to bets table to link bets to specific matches
ALTER TABLE public.bets ADD COLUMN fixture_id INTEGER;

-- Create an index for better performance when querying by fixture_id
CREATE INDEX idx_bets_fixture_id ON public.bets(fixture_id);

-- Add comment to document the column
COMMENT ON COLUMN public.bets.fixture_id IS 'Links bet to specific match fixture from API-Football';