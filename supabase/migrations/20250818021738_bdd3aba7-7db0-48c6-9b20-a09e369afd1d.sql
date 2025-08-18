-- Audit fix: ensure SELECT policies are PERMISSIVE (OR), not restrictive (AND)
-- We drop and recreate only SELECT policies on bets and bet_selections.

-- 1) Bets SELECT policies
DROP POLICY IF EXISTS "Users can view their own bets" ON public.bets;
DROP POLICY IF EXISTS "League members can view league bets" ON public.bets;

CREATE POLICY "Users can view their own bets"
ON public.bets
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "League members can view league bets"
ON public.bets
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = public.bets.user_id
      AND p.league_id IS NOT NULL
      AND p.league_id = public.get_current_user_league_id()
  )
);

-- 2) Bet selections SELECT policies
DROP POLICY IF EXISTS "Users can view their own bet selections" ON public.bet_selections;
DROP POLICY IF EXISTS "League members can view league bet selections" ON public.bet_selections;

CREATE POLICY "Users can view their own bet selections"
ON public.bet_selections
FOR SELECT
USING (
  bet_id IN (SELECT b.id FROM public.bets b WHERE b.user_id = auth.uid())
);

CREATE POLICY "League members can view league bet selections"
ON public.bet_selections
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.bets b
    JOIN public.profiles p ON p.id = b.user_id
    WHERE b.id = public.bet_selections.bet_id
      AND p.league_id IS NOT NULL
      AND p.league_id = public.get_current_user_league_id()
  )
);
