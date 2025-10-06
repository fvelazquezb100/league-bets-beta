-- Fix reset_weekly_budgets function to include all three functionalities:
-- 1. Reset weekly budgets
-- 2. Increment week by +1
-- 3. Handle match availability for upcoming days
-- Date: 05 Sep 2025, 12:55:00

-- ============================================================================
-- PART 1: Drop and recreate the reset_weekly_budgets function with all features
-- ============================================================================

-- Drop the existing function first to avoid conflicts
DROP FUNCTION IF EXISTS public.reset_weekly_budgets();

CREATE OR REPLACE FUNCTION public.reset_weekly_budgets()
RETURNS jsonb AS $$
DECLARE
  v_current_date DATE;
  v_next_tuesday DATE;
  v_result jsonb;
  v_updated_leagues INTEGER := 0;
  v_updated_availability INTEGER := 0;
  league_record RECORD;
BEGIN
  -- Get current date
  v_current_date := CURRENT_DATE;
  
  -- Calculate next Tuesday (if today is Tuesday, use next Tuesday)
  v_next_tuesday := v_current_date + INTERVAL '1 week';
  -- Adjust to Tuesday (assuming Monday = 1, Tuesday = 2, etc.)
  WHILE EXTRACT(DOW FROM v_next_tuesday) != 2 LOOP
    v_next_tuesday := v_next_tuesday + INTERVAL '1 day';
  END LOOP;
  
  -- ============================================================================
  -- FUNCTIONALITY 1: Reset weekly budgets for all leagues with weekly reset
  -- ============================================================================
  
  UPDATE public.profiles
  SET weekly_budget = l.budget
  FROM public.leagues l
  WHERE profiles.league_id = l.id
    AND l.reset_budget = 'weekly';
  
  GET DIAGNOSTICS v_updated_leagues = ROW_COUNT;
  
  -- ============================================================================
  -- FUNCTIONALITY 2: Increment week by +1 for weekly leagues
  -- ============================================================================
  
  UPDATE public.leagues
  SET week = week + 1
  WHERE reset_budget = 'weekly';
  
  -- ============================================================================
  -- FUNCTIONALITY 3: Handle match availability for upcoming days
  -- ============================================================================
  
  -- Reset match availability for ALL leagues (both free and premium)
  FOR league_record IN 
    SELECT id FROM public.leagues
  LOOP
    -- Enable availability for this league from today until next Monday
    PERFORM public.initialize_match_availability(
      v_current_date,
      v_next_tuesday - INTERVAL '1 day',
      true,
      league_record.id
    );
    
    -- Disable availability for dates after next Monday for this league
    UPDATE public.match_availability_control
    SET is_live_betting_enabled = false,
        updated_at = now()
    WHERE league_id = league_record.id
      AND date > (v_next_tuesday - INTERVAL '1 day');
  END LOOP;
  
  GET DIAGNOSTICS v_updated_availability = ROW_COUNT;
  
  -- ============================================================================
  -- Return comprehensive success response
  -- ============================================================================
  
  v_result := jsonb_build_object(
    'success', true,
    'message', 'Weekly budgets, week increment, and match availability reset successfully',
    'updated_leagues', v_updated_leagues,
    'updated_availability_days', v_updated_availability,
    'reset_period', jsonb_build_object(
      'from', v_current_date,
      'to', v_next_tuesday - INTERVAL '1 day'
    ),
    'next_reset_date', v_next_tuesday,
    'features_executed', jsonb_build_array(
      'weekly_budget_reset',
      'week_increment',
      'match_availability_update'
    )
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'features_executed', jsonb_build_array()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 2: Grant necessary permissions
-- ============================================================================

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION public.reset_weekly_budgets() TO authenticated;

-- ============================================================================
-- PART 3: Add comment to document the function
-- ============================================================================

COMMENT ON FUNCTION public.reset_weekly_budgets() IS 'Comprehensive weekly reset function that: 1) Resets weekly budgets for weekly leagues, 2) Increments week by +1 for weekly leagues, 3) Updates match availability for all leagues from current date to next Monday';
