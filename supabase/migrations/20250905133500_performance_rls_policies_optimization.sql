-- ============================================================================
-- Performance Optimization: RLS Policies and Indexes
-- Date: 15 Nov 2025, 20:46:00
-- 
-- This migration optimizes Row Level Security policies and indexes to improve
-- query performance by:
-- 1. Replacing auth.uid() with (select auth.uid()) in RLS policies to avoid
--    re-evaluation per row (InitPlan optimization)
-- 2. Consolidating multiple permissive policies where possible
-- 3. Removing duplicate indexes
-- 4. Adding missing indexes on foreign keys
-- ============================================================================

-- ============================================================================
-- PART 1: Optimize RLS Policies - Replace auth.uid() with (select auth.uid())
-- ============================================================================

-- Leagues policies
DROP POLICY IF EXISTS "Users can only view their own league" ON public.leagues;
CREATE POLICY "Users can only view their own league" 
ON public.leagues 
FOR SELECT 
TO public
USING (id = (SELECT profiles.league_id FROM profiles WHERE profiles.id = (select auth.uid())));

DROP POLICY IF EXISTS "Users can update their own league" ON public.leagues;
CREATE POLICY "Users can update their own league" 
ON public.leagues 
FOR UPDATE 
TO public
USING (id = (SELECT profiles.league_id FROM profiles WHERE profiles.id = (select auth.uid())))
WITH CHECK (id = (SELECT profiles.league_id FROM profiles WHERE profiles.id = (select auth.uid())));

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile or league members" ON public.profiles;
CREATE POLICY "Users can view own profile or league members" 
ON public.profiles 
FOR SELECT 
TO public
USING ((id = (select auth.uid())) OR ((league_id IS NOT NULL) AND (league_id = get_current_user_league_id())));

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (id = (select auth.uid()))
WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
TO authenticated
USING (id = (select auth.uid()));

-- Bets policies - Consolidate SELECT policies
DROP POLICY IF EXISTS "Users can view their own bets" ON public.bets;
DROP POLICY IF EXISTS "League members can view league bets" ON public.bets;
CREATE POLICY "Users can view their own or league bets" 
ON public.bets 
FOR SELECT 
TO public
USING (
  (user_id = (select auth.uid())) 
  OR 
  ((EXISTS (SELECT 1 FROM profiles p WHERE p.id = bets.user_id AND p.league_id IS NOT NULL AND p.league_id = get_current_user_league_id())) AND (status <> 'pending'::text))
);

DROP POLICY IF EXISTS "Users can create their own bets" ON public.bets;
CREATE POLICY "Users can create their own bets" 
ON public.bets 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own bets" ON public.bets;
CREATE POLICY "Users can update their own bets" 
ON public.bets 
FOR UPDATE 
TO authenticated
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own bets" ON public.bets;
CREATE POLICY "Users can delete their own bets" 
ON public.bets 
FOR DELETE 
TO authenticated
USING (user_id = (select auth.uid()));

-- Bet selections policies - Consolidate SELECT policies
DROP POLICY IF EXISTS "Users can view their own bet selections" ON public.bet_selections;
DROP POLICY IF EXISTS "League members can view league bet selections" ON public.bet_selections;
CREATE POLICY "Users can view their own or league bet selections" 
ON public.bet_selections 
FOR SELECT 
TO public
USING (
  (bet_id IN (SELECT b.id FROM bets b WHERE b.user_id = (select auth.uid())))
  OR
  (EXISTS (SELECT 1 FROM (bets b JOIN profiles p ON p.id = b.user_id) WHERE b.id = bet_selections.bet_id AND p.league_id IS NOT NULL AND p.league_id = get_current_user_league_id() AND bet_selections.status <> 'pending'::text))
);

DROP POLICY IF EXISTS "Users can create their own bet selections" ON public.bet_selections;
CREATE POLICY "Users can create their own bet selections" 
ON public.bet_selections 
FOR INSERT 
TO public
WITH CHECK (bet_id IN (SELECT bets.id FROM bets WHERE bets.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users can update their own bet selections" ON public.bet_selections;
CREATE POLICY "Users can update their own bet selections" 
ON public.bet_selections 
FOR UPDATE 
TO public
USING (bet_id IN (SELECT bets.id FROM bets WHERE bets.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users can delete their own bet selections" ON public.bet_selections;
CREATE POLICY "Users can delete their own bet selections" 
ON public.bet_selections 
FOR DELETE 
TO public
USING (bet_id IN (SELECT bets.id FROM bets WHERE bets.user_id = (select auth.uid())));

-- Weekly performance policies
-- Note: Service role policy must remain separate as it applies to service_role for ALL actions
-- We only optimize the user-facing SELECT policy
DROP POLICY IF EXISTS "Users can view their own performance or league members" ON public.weekly_performance;
CREATE POLICY "Users can view their own performance or league members" 
ON public.weekly_performance 
FOR SELECT 
TO public
USING (
  (user_id = (select auth.uid())) 
  OR 
  ((league_id IS NOT NULL) AND (league_id = get_current_user_league_id()))
);

-- Backup bet selections policies - Consolidate SELECT policies
DROP POLICY IF EXISTS "Users can view their own backup bet selections" ON public.backup_bet_selections;
DROP POLICY IF EXISTS "Superadmins can view all backup bet selections" ON public.backup_bet_selections;
CREATE POLICY "Users or superadmins can view backup bet selections" 
ON public.backup_bet_selections 
FOR SELECT 
TO authenticated
USING (
  (bet_id IN (SELECT b.id FROM backup_bets b WHERE b.user_id = (select auth.uid())))
  OR
  (is_superadmin())
);

-- Backup bets policies - Consolidate SELECT policies
DROP POLICY IF EXISTS "Users can view their own backup bets" ON public.backup_bets;
DROP POLICY IF EXISTS "Superadmins can view all backup bets" ON public.backup_bets;
CREATE POLICY "Users or superadmins can view backup bets" 
ON public.backup_bets 
FOR SELECT 
TO authenticated
USING (
  (user_id = (select auth.uid()))
  OR
  (is_superadmin())
);

-- Backup profiles points policies - Consolidate SELECT policies
DROP POLICY IF EXISTS "Users can view their own backup profile points" ON public.backup_profiles_points;
DROP POLICY IF EXISTS "Superadmins can view all backup profile points" ON public.backup_profiles_points;
CREATE POLICY "Users or superadmins can view backup profile points" 
ON public.backup_profiles_points 
FOR SELECT 
TO authenticated
USING (
  (id = (select auth.uid()))
  OR
  (is_superadmin())
);

-- Match blocks policies
DROP POLICY IF EXISTS "League members can view match blocks" ON public.match_blocks;
CREATE POLICY "League members can view match blocks" 
ON public.match_blocks
FOR SELECT
TO authenticated
USING (league_id = get_current_user_league_id());

DROP POLICY IF EXISTS "Users can create match blocks in their league" ON public.match_blocks;
CREATE POLICY "Users can create match blocks in their league"
ON public.match_blocks
FOR INSERT
TO authenticated
WITH CHECK (
    blocker_user_id = (select auth.uid())
    AND league_id = get_current_user_league_id()
    AND blocked_user_id IN (
        SELECT p.id FROM public.profiles p 
        WHERE p.league_id = get_current_user_league_id()
        AND p.id <> (select auth.uid())
    )
);

DROP POLICY IF EXISTS "Users can manage their own match blocks" ON public.match_blocks;
CREATE POLICY "Users can manage their own match blocks"
ON public.match_blocks
FOR UPDATE
TO authenticated
USING (blocker_user_id = (select auth.uid()))
WITH CHECK (blocker_user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own match blocks" ON public.match_blocks;
CREATE POLICY "Users can delete their own match blocks"
ON public.match_blocks
FOR DELETE
TO authenticated
USING (blocker_user_id = (select auth.uid()));

-- Match availability control policies - Consolidate SELECT policies
DROP POLICY IF EXISTS "Anyone can read match availability" ON public.match_availability_control;
DROP POLICY IF EXISTS "League admins can modify match availability for their league" ON public.match_availability_control;
CREATE POLICY "Anyone can read match availability" ON public.match_availability_control
  FOR SELECT
  USING (true);

CREATE POLICY "League admins can modify match availability for their league" ON public.match_availability_control
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (select auth.uid())
      AND (
        global_role = 'superadmin' OR
        (role = 'admin_league' AND league_id = match_availability_control.league_id)
      )
    )
  );

-- Betting settings policies - Consolidate SELECT policies
DROP POLICY IF EXISTS "Anyone can read betting settings" ON public.betting_settings;
DROP POLICY IF EXISTS "Only superadmins can modify betting settings" ON public.betting_settings;
CREATE POLICY "Anyone can read betting settings" ON public.betting_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Only superadmins can modify betting settings" ON public.betting_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (select auth.uid())
      AND global_role = 'superadmin'
    )
  );

-- News policies - Consolidate ALL action policies
DROP POLICY IF EXISTS "Superadmins can manage all news" ON public.news;
DROP POLICY IF EXISTS "Admins can manage all news" ON public.news;
CREATE POLICY "Superadmins or admins can manage all news" 
ON public.news 
FOR ALL 
TO public
USING (
  (is_superadmin())
  OR
  (has_admin_privileges())
);

-- ============================================================================
-- PART 2: Remove Duplicate Index
-- ============================================================================

-- Remove duplicate index on match_odds_cache (keep PRIMARY KEY)
DROP INDEX IF EXISTS public.match_odds_cache_single_row;

-- ============================================================================
-- PART 3: Add Missing Indexes on Foreign Keys
-- ============================================================================

-- Index for match_blocks.league_id foreign key
CREATE INDEX IF NOT EXISTS idx_match_blocks_league_id 
ON public.match_blocks(league_id);

-- Index for weekly_performance.league_id foreign key
CREATE INDEX IF NOT EXISTS idx_weekly_performance_league_id 
ON public.weekly_performance(league_id);

-- ============================================================================
-- PART 4: Comments
-- ============================================================================

COMMENT ON POLICY "Users can view their own or league bets" ON public.bets IS 
'Optimized policy consolidating "Users can view their own bets" and "League members can view league bets". Uses (select auth.uid()) for InitPlan optimization.';

COMMENT ON POLICY "Users can view their own or league bet selections" ON public.bet_selections IS 
'Optimized policy consolidating "Users can view their own bet selections" and "League members can view league bet selections". Uses (select auth.uid()) for InitPlan optimization.';

COMMENT ON POLICY "Users or superadmins can view backup bet selections" ON public.backup_bet_selections IS 
'Optimized policy consolidating user and superadmin SELECT policies. Uses (select auth.uid()) for InitPlan optimization.';

COMMENT ON POLICY "Users or superadmins can view backup bets" ON public.backup_bets IS 
'Optimized policy consolidating user and superadmin SELECT policies. Uses (select auth.uid()) for InitPlan optimization.';

COMMENT ON POLICY "Users or superadmins can view backup profile points" ON public.backup_profiles_points IS 
'Optimized policy consolidating user and superadmin SELECT policies. Uses (select auth.uid()) for InitPlan optimization.';

