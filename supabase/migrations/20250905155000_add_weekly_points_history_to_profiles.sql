-- ============================================================================
-- Add weekly_points_history column to profiles table
-- ============================================================================
-- This migration adds a JSONB column to store historical weekly points
-- Format: {"1": 100, "2": 150, "3": 200} where key is week number and value is points

-- Add weekly_points_history column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS weekly_points_history jsonb DEFAULT '{}'::jsonb;

-- Add comment to explain the column
COMMENT ON COLUMN public.profiles.weekly_points_history IS 'JSON object storing weekly points history. Format: {"week_number": points}. Example: {"1": 100, "2": 150, "3": 200}';

-- ============================================================================
-- Update update_last_week_points() function to calculate and store all weekly points
-- ============================================================================
-- This function now calculates points for ALL weeks and stores them in weekly_points_history
CREATE OR REPLACE FUNCTION public.update_last_week_points()
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_updated_profiles INTEGER := 0;
  v_user_record RECORD;
  v_weekly_points jsonb;
  v_week_points NUMERIC;
  v_week TEXT;
BEGIN
  -- Loop through each user with a league_id
  FOR v_user_record IN 
    SELECT DISTINCT p.id, p.league_id
    FROM profiles p
    WHERE p.league_id IS NOT NULL
  LOOP
    -- Initialize empty JSON object for this user
    v_weekly_points := '{}'::jsonb;
    
    -- Get all unique weeks for this user's won bets
    FOR v_week IN
      SELECT b.week
      FROM bets b
      WHERE b.user_id = v_user_record.id
        AND b.status = 'won'
        AND b.week IS NOT NULL
        AND b.week != '0'
      GROUP BY b.week
      ORDER BY b.week::integer
    LOOP
      -- Calculate points for this week
      SELECT COALESCE(SUM(b.payout), 0)
      INTO v_week_points
      FROM bets b
      WHERE b.user_id = v_user_record.id
        AND b.week = v_week
        AND b.status = 'won';
      
      -- Add week and points to JSON object
      v_weekly_points := v_weekly_points || jsonb_build_object(v_week, v_week_points);
    END LOOP;
    
    -- Update the user's profile with weekly points history and last_week_points
    UPDATE profiles p
    SET 
      weekly_points_history = v_weekly_points,
      last_week_points = COALESCE((
        SELECT SUM(b.payout)
        FROM bets b
        JOIN leagues l ON l.id = p.league_id
        WHERE b.user_id = p.id
          AND b.week::integer = l.week::integer
          AND b.status = 'won'
      ), 0)
    WHERE p.id = v_user_record.id;
    
    v_updated_profiles := v_updated_profiles + 1;
  END LOOP;
  
  -- Return success response
  v_result := jsonb_build_object(
    'success', true,
    'message', 'Weekly points history updated successfully',
    'updated_profiles', v_updated_profiles
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Initialize weekly_points_history for existing users
-- ============================================================================
-- This calculates and stores historical points for all existing users
DO $$
DECLARE
  v_user_record RECORD;
  v_weekly_points jsonb;
  v_week_points NUMERIC;
  v_week TEXT;
BEGIN
  -- Loop through each user with a league_id
  FOR v_user_record IN 
    SELECT DISTINCT p.id, p.league_id
    FROM profiles p
    WHERE p.league_id IS NOT NULL
  LOOP
    -- Initialize empty JSON object for this user
    v_weekly_points := '{}'::jsonb;
    
    -- Get all unique weeks for this user's won bets
    FOR v_week IN
      SELECT b.week
      FROM bets b
      WHERE b.user_id = v_user_record.id
        AND b.status = 'won'
        AND b.week IS NOT NULL
        AND b.week != '0'
      GROUP BY b.week
      ORDER BY b.week::integer
    LOOP
      -- Calculate points for this week
      SELECT COALESCE(SUM(b.payout), 0)
      INTO v_week_points
      FROM bets b
      WHERE b.user_id = v_user_record.id
        AND b.week = v_week
        AND b.status = 'won';
      
      -- Add week and points to JSON object
      v_weekly_points := v_weekly_points || jsonb_build_object(v_week, v_week_points);
    END LOOP;
    
    -- Update the user's profile with weekly points history
    UPDATE profiles
    SET weekly_points_history = v_weekly_points
    WHERE id = v_user_record.id;
  END LOOP;
END $$;
