-- Add second half, penalty, and match status details to match_results
ALTER TABLE public.match_results
ADD COLUMN IF NOT EXISTS second_half_home integer,
ADD COLUMN IF NOT EXISTS second_half_away integer,
ADD COLUMN IF NOT EXISTS penalty_home integer,
ADD COLUMN IF NOT EXISTS penalty_away integer,
ADD COLUMN IF NOT EXISTS match_status text;

COMMENT ON COLUMN public.match_results.second_half_home IS 'Goals scored by the home team in the second half (minutes 45-90).';
COMMENT ON COLUMN public.match_results.second_half_away IS 'Goals scored by the away team in the second half (minutes 45-90).';
COMMENT ON COLUMN public.match_results.penalty_home IS 'Penalty shootout goals scored by the home team when applicable.';
COMMENT ON COLUMN public.match_results.penalty_away IS 'Penalty shootout goals scored by the away team when applicable.';
COMMENT ON COLUMN public.match_results.match_status IS 'How the match finished: FT (regular time), AET (after extra time), PEN (after penalties).';

