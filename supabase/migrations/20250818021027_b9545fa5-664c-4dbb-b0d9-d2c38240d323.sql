
-- 1) Allow league members to view each other's bets (read-only)
-- Keep existing "Users can view their own bets" policy; we add an additional one.
CREATE POLICY "League members can view league bets"
ON public.bets
FOR SELECT
USING (
  -- Either the bet is mine (already allowed by existing policy) OR
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = public.bets.user_id
      AND p.league_id IS NOT NULL
      AND p.league_id = public.get_current_user_league_id()
  )
);

-- 2) Allow league members to view bet selections of bets in their league (read-only)
-- Keep existing "Users can view their own bet selections" policy; we add an additional one.
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

-- 3) Ensure nested selects work by adding a foreign key bet_selections.bet_id -> bets.id
-- First, remove any potential orphan bet selections to avoid FK creation failure.
DELETE FROM public.bet_selections bs
WHERE NOT EXISTS (
  SELECT 1 FROM public.bets b WHERE b.id = bs.bet_id
);

-- Then, add the foreign key with cascade on delete so selections are removed when a bet is deleted.
ALTER TABLE public.bet_selections
  ADD CONSTRAINT bet_selections_bet_id_fkey
  FOREIGN KEY (bet_id)
  REFERENCES public.bets(id)
  ON DELETE CASCADE;
