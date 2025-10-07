-- Create budget and availability reset functions
-- Date: 05 Sep 2025, 13:00:00

-- ============================================================================
-- Function: reset_daily_budget
-- Resets weekly_budget for users in leagues with reset_budget = 'daily'
-- Intended to be executed by a daily cron job
-- ============================================================================
CREATE OR REPLACE FUNCTION public.reset_daily_budget()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles p
  SET weekly_budget = l.budget
  FROM public.leagues l
  WHERE p.league_id = l.id
    AND l.reset_budget = 'daily';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.reset_daily_budget() IS 'Resets weekly_budget for all users in leagues configured with daily budget resets.';

GRANT EXECUTE ON FUNCTION public.reset_daily_budget() TO authenticated;

-- ============================================================================
-- Function: reset_weekly_budget
-- Resets weekly_budget for users in leagues with reset_budget = 'weekly'
-- Also increments week by +1 for ALL leagues
-- Intended to be executed by a weekly cron job
-- ============================================================================
CREATE OR REPLACE FUNCTION public.reset_weekly_budget()
RETURNS void AS $$
BEGIN
  -- Reset budgets for weekly leagues
  UPDATE public.profiles p
  SET weekly_budget = l.budget
  FROM public.leagues l
  WHERE p.league_id = l.id
    AND l.reset_budget = 'weekly';

  -- Increment week by +1 for ALL leagues
  UPDATE public.leagues
  SET week = week + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.reset_weekly_budget() IS 'Resets weekly budgets for weekly leagues and increments the week number by +1 for all leagues.';

GRANT EXECUTE ON FUNCTION public.reset_weekly_budget() TO authenticated;

-- ============================================================================
-- Function: reset_match_availability
-- For each league, ensures availability entries exist from today (inclusive)
-- through today + 6 days (inclusive), setting them to TRUE. Disables any dates
-- after this window.
-- Can be executed any day; it dynamically computes the 7-day window.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.reset_match_availability()
RETURNS void AS $$
DECLARE
  v_start_date DATE := CURRENT_DATE;
  v_end_date   DATE := (CURRENT_DATE + INTERVAL '6 days')::date;
  league_record RECORD;
BEGIN
  FOR league_record IN SELECT id FROM public.leagues LOOP
    -- Upsert TRUE for the 7-day window starting today
    PERFORM public.initialize_match_availability(
      v_start_date,
      v_end_date,
      true,
      league_record.id
    );

    -- Disable any date after the window
    UPDATE public.match_availability_control
    SET is_live_betting_enabled = false,
        updated_at = now()
    WHERE league_id = league_record.id
      AND date > v_end_date;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.reset_match_availability() IS 'Initializes availability to TRUE for the 7-day window starting today per league, and disables dates beyond the window.';

GRANT EXECUTE ON FUNCTION public.reset_match_availability() TO authenticated;


