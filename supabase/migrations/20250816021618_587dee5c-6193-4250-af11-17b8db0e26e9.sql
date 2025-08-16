
-- Revert the cross-league viewing policies added for player bet history

-- On bets table
DROP POLICY IF EXISTS "League members can view others settled and frozen bets" ON public.bets;

-- On bet_selections table
DROP POLICY IF EXISTS "League members can view others bet selections for visible bets" ON public.bet_selections;
