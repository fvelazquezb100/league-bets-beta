-- ============================================================================
-- Allow admin_league to assign admin_league role to other users in their league
-- Only for premium leagues
-- Date: 03 Jan 2026
-- ============================================================================

-- Function to assign admin_league role to another user in the same league
-- Requirements:
-- 1. The caller must be admin_league
-- 2. The target user must be in the same league as the caller
-- 3. The league must be premium
CREATE OR REPLACE FUNCTION public.assign_league_admin_role(target_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  caller_profile public.profiles%ROWTYPE;
  target_profile public.profiles%ROWTYPE;
  league_info public.leagues%ROWTYPE;
BEGIN
  -- Get caller's profile
  SELECT * INTO caller_profile
  FROM public.profiles
  WHERE id = auth.uid();

  -- Check if caller exists
  IF caller_profile IS NULL THEN
    RAISE EXCEPTION 'Caller profile not found' USING ERRCODE = 'P0001';
  END IF;

  -- Check if caller is admin_league
  IF caller_profile.role <> 'admin_league' THEN
    RAISE EXCEPTION 'Only league administrators can assign admin roles' USING ERRCODE = '42501';
  END IF;

  -- Check if caller has a league
  IF caller_profile.league_id IS NULL THEN
    RAISE EXCEPTION 'Caller is not in a league' USING ERRCODE = 'P0001';
  END IF;

  -- Get target user's profile
  SELECT * INTO target_profile
  FROM public.profiles
  WHERE id = target_user_id;

  -- Check if target user exists
  IF target_profile IS NULL THEN
    RAISE EXCEPTION 'Target user not found' USING ERRCODE = 'P0001';
  END IF;

  -- Check if target user is in the same league
  IF target_profile.league_id IS NULL OR target_profile.league_id <> caller_profile.league_id THEN
    RAISE EXCEPTION 'Target user must be in the same league' USING ERRCODE = 'P0001';
  END IF;

  -- Get league information
  SELECT * INTO league_info
  FROM public.leagues
  WHERE id = caller_profile.league_id;

  -- Check if league exists
  IF league_info IS NULL THEN
    RAISE EXCEPTION 'League not found' USING ERRCODE = 'P0001';
  END IF;

  -- Check if league is premium
  IF league_info.type <> 'premium' THEN
    RAISE EXCEPTION 'This feature is only available for premium leagues' USING ERRCODE = 'P0001';
  END IF;

  -- Prevent self-assignment (optional, but good practice)
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot assign admin role to yourself' USING ERRCODE = 'P0001';
  END IF;

  -- Assign admin_league role to target user
  UPDATE public.profiles
  SET role = 'admin_league'
  WHERE id = target_user_id;

  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Admin role assigned successfully',
    'target_user_id', target_user_id,
    'target_username', target_profile.username
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.assign_league_admin_role(uuid) TO authenticated;

