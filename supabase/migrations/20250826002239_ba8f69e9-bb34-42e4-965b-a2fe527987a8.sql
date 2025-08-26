-- Harden RLS on backup tables to prevent public reads
-- 1) Ensure RLS is enabled
ALTER TABLE IF EXISTS public.backup_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.backup_bet_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.backup_profiles_points ENABLE ROW LEVEL SECURITY;

-- 2) Backup Bets: Restrict public access, allow only owner and superadmin to read
DROP POLICY IF EXISTS "Users can view their own backup bets" ON public.backup_bets;
DROP POLICY IF EXISTS "Superadmins can view all backup bets" ON public.backup_bets;
DROP POLICY IF EXISTS "Service role can manage backup bets" ON public.backup_bets;

-- Only authenticated users can read their own rows
CREATE POLICY "Users can view their own backup bets"
ON public.backup_bets
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Superadmins (authenticated) can read all
CREATE POLICY "Superadmins can view all backup bets"
ON public.backup_bets
FOR SELECT
TO authenticated
USING (is_superadmin());

-- Service role (server) can manage all — scoped strictly to service_role
CREATE POLICY "Service role can manage backup bets"
ON public.backup_bets
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3) Backup Bet Selections: tie access to parent bet ownership or superadmin
DROP POLICY IF EXISTS "Users can view their own backup bet selections" ON public.backup_bet_selections;
DROP POLICY IF EXISTS "Superadmins can view all backup bet selections" ON public.backup_bet_selections;
DROP POLICY IF EXISTS "Service role can manage backup bet selections" ON public.backup_bet_selections;

CREATE POLICY "Users can view their own backup bet selections"
ON public.backup_bet_selections
FOR SELECT
TO authenticated
USING (
  bet_id IN (
    SELECT b.id FROM public.backup_bets b WHERE b.user_id = auth.uid()
  )
);

CREATE POLICY "Superadmins can view all backup bet selections"
ON public.backup_bet_selections
FOR SELECT
TO authenticated
USING (is_superadmin());

CREATE POLICY "Service role can manage backup bet selections"
ON public.backup_bet_selections
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4) Backup Profiles Points: owner-only read, superadmin read, service role manage
DROP POLICY IF EXISTS "Users can view their own backup profile points" ON public.backup_profiles_points;
DROP POLICY IF EXISTS "Superadmins can view all backup profile points" ON public.backup_profiles_points;
DROP POLICY IF EXISTS "Service role can manage backup profile points" ON public.backup_profiles_points;

CREATE POLICY "Users can view their own backup profile points"
ON public.backup_profiles_points
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Superadmins can view all backup profile points"
ON public.backup_profiles_points
FOR SELECT
TO authenticated
USING (is_superadmin());

CREATE POLICY "Service role can manage backup profile points"
ON public.backup_profiles_points
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
