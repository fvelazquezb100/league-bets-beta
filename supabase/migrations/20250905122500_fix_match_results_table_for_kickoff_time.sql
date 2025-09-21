-- Fix match_results table to allow partial inserts for kickoff_time
-- This allows the update-football-cache function to create preliminary entries
-- with just fixture_id and kickoff_time, while process-matchday-results
-- fills in the complete match data later

-- Make most fields nullable so we can insert partial data initially
ALTER TABLE public.match_results 
ALTER COLUMN match_name DROP NOT NULL,
ALTER COLUMN home_team DROP NOT NULL,
ALTER COLUMN away_team DROP NOT NULL,
ALTER COLUMN league_id DROP NOT NULL,
ALTER COLUMN season DROP NOT NULL,
ALTER COLUMN home_goals DROP NOT NULL,
ALTER COLUMN away_goals DROP NOT NULL,
ALTER COLUMN halftime_home DROP NOT NULL,
ALTER COLUMN halftime_away DROP NOT NULL,
ALTER COLUMN outcome DROP NOT NULL,
ALTER COLUMN finished_at DROP NOT NULL;

-- Add a comment explaining the new structure
COMMENT ON TABLE public.match_results IS 'Stores match results and kickoff times. Records can be created initially with just fixture_id and kickoff_time, then completed when results are processed.';
