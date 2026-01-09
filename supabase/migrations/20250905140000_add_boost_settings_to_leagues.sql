-- Add boost settings to leagues table
-- This migration adds boost_max_stake and boost_multiplier columns to the leagues table
-- These settings control the SuperBoleto feature
-- 
-- IMPORTANT NOTES:
-- - All existing leagues (both free and premium) will be set to boost_max_stake = 200 and boost_multiplier = 1.25
-- - All new leagues (created as 'free' by default) will also have boost_max_stake = 200 and boost_multiplier = 1.25
-- - These values are fixed for free leagues and cannot be changed until the league is upgraded to 'premium'
-- - Only premium leagues can edit these values through the admin interface

-- Add boost_max_stake column (maximum stake for boost bets)
ALTER TABLE public.leagues
ADD COLUMN IF NOT EXISTS boost_max_stake numeric DEFAULT 200;

-- Add boost_multiplier column (multiplier for boost bets: 1.25, 1.5, or 2)
ALTER TABLE public.leagues
ADD COLUMN IF NOT EXISTS boost_multiplier numeric DEFAULT 1.25;

-- Add constraint to ensure boost_multiplier is one of the allowed values
ALTER TABLE public.leagues
DROP CONSTRAINT IF EXISTS leagues_boost_multiplier_check;

ALTER TABLE public.leagues
ADD CONSTRAINT leagues_boost_multiplier_check 
CHECK (boost_multiplier IN (1.25, 1.5, 2.0));

-- Add constraint to ensure boost_max_stake is between min_bet and max_bet
-- This will be enforced at the application level, but we add a check constraint for basic validation
ALTER TABLE public.leagues
DROP CONSTRAINT IF EXISTS leagues_boost_max_stake_check;

ALTER TABLE public.leagues
ADD CONSTRAINT leagues_boost_max_stake_check 
CHECK (boost_max_stake IS NULL OR boost_max_stake >= 0);

-- Update ALL existing leagues with default values (200 and 1.25)
-- These values will be applied to all existing leagues, both free and premium
-- Note: Only premium leagues will be able to edit these values through the admin interface
UPDATE public.leagues
SET 
  boost_max_stake = 200,
  boost_multiplier = 1.25;

-- Update create_league_and_join function to include boost settings
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
  -- New leagues are created as 'free' by default, and will have boost_max_stake = 200 and boost_multiplier = 1.25
  -- These values cannot be changed until the league is upgraded to 'premium'
  INSERT INTO public.leagues (
    name,
    join_code,
    budget,
    min_bet,
    max_bet,
    week,
    reset_budget,
    available_leagues,
    boost_max_stake,
    boost_multiplier
  ) VALUES (
    league_name_param,
    v_join_code,
    1000,          -- Default budget
    10,            -- Default min bet
    500,           -- Default max bet
    1,             -- Initial week
    'weekly',      -- Default to weekly reset (lowercase)
    ARRAY[140, 39, 78],  -- Default leagues: La Liga, Premier League, Bundesliga
    200,           -- Default boost_max_stake for new leagues (fixed at 200 for free leagues)
    1.25           -- Default boost_multiplier for new leagues (fixed at 1.25 for free leagues)
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
