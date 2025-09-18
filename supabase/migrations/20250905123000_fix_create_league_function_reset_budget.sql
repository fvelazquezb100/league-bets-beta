-- Fix create_league_and_join function to include reset_budget and default values
-- Date: 05 Sep 2025, 12:30:00
-- This migration updates the function to prevent future leagues from having NULL or incorrect reset_budget values

-- Update the create_league_and_join function to include proper default values
CREATE OR REPLACE FUNCTION public.create_league_and_join(
  league_name_param text,
  admin_username_param text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid;
  v_league_id bigint;
  v_join_code text;
  v_username text;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Generate a unique 6-character join code
  v_join_code := UPPER(substr(md5(random()::text), 1, 6));

  -- Insert league with complete default values (using lowercase 'weekly')
  INSERT INTO public.leagues (
    name,
    join_code,
    budget,
    min_bet,
    max_bet,
    week,
    reset_budget,  -- Now included with lowercase value
    available_leagues
  ) VALUES (
    league_name_param,
    v_join_code,
    1000,          -- Default budget
    10,            -- Default min bet
    500,           -- Default max bet
    1,             -- Initial week
    'weekly',      -- Default to weekly reset (lowercase)
    ARRAY[140, 39, 78]  -- Default leagues: La Liga, Premier League, Bundesliga
  ) RETURNING id INTO v_league_id;

  -- Use provided username or get current username
  IF admin_username_param IS NOT NULL THEN
    v_username := admin_username_param;
  ELSE
    SELECT username INTO v_username FROM public.profiles WHERE id = v_user_id;
  END IF;

  -- Update user profile to join the league as admin
  UPDATE public.profiles
  SET 
    league_id = v_league_id,
    role = 'admin_league',
    username = COALESCE(v_username, username)
  WHERE id = v_user_id;

  -- Return league info
  RETURN jsonb_build_object(
    'success', true,
    'league_id', v_league_id,
    'league_name', league_name_param,
    'join_code', v_join_code,
    'role', 'admin_league'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment explaining the fix
COMMENT ON FUNCTION public.create_league_and_join IS 'Creates a new league with proper default values including reset_budget=weekly (lowercase) to ensure compatibility with reset_weekly_budgets() function';
