-- Add block settings to betting_settings table
INSERT INTO public.betting_settings (setting_key, setting_value, description)
VALUES 
  ('blocks_available_per_user', '1', 'Number of matches each user can block per week'),
  ('blocks_received_max_per_user', '3', 'Maximum number of blocks a user can receive from others')
ON CONFLICT (setting_key) DO NOTHING;

-- Function to reset block counters for all users based on betting_settings
CREATE OR REPLACE FUNCTION public.reset_block_counters()
RETURNS jsonb AS $$
DECLARE
  v_blocks_available INTEGER;
  v_blocks_received INTEGER;
  v_updated_count INTEGER;
  v_result jsonb;
BEGIN
  -- Get settings from betting_settings
  SELECT setting_value::INTEGER INTO v_blocks_available
  FROM public.betting_settings
  WHERE setting_key = 'blocks_available_per_user';
  
  SELECT setting_value::INTEGER INTO v_blocks_received
  FROM public.betting_settings
  WHERE setting_key = 'blocks_received_max_per_user';
  
  -- Use defaults if settings don't exist
  v_blocks_available := COALESCE(v_blocks_available, 1);
  v_blocks_received := COALESCE(v_blocks_received, 3);
  
  -- Update all profiles
  UPDATE public.profiles
  SET 
    blocks_available = v_blocks_available,
    blocks_received = v_blocks_received;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  -- Return success response
  v_result := jsonb_build_object(
    'success', true,
    'message', 'Block counters reset successfully',
    'blocks_available', v_blocks_available,
    'blocks_received', v_blocks_received,
    'updated_profiles', v_updated_count
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

COMMENT ON FUNCTION public.reset_block_counters() IS 'Resets block counters for all users based on values in betting_settings table';

-- Fix RLS policy for match_blocks INSERT to allow blocking future matches
-- The original policy was too restrictive, requiring fixture_id to exist in match_results
-- But future matches may only exist in match_odds_cache (JSONB)
DROP POLICY IF EXISTS "Users can create match blocks in their league" ON public.match_blocks;
CREATE POLICY "Users can create match blocks in their league"
ON public.match_blocks
FOR INSERT
TO authenticated
WITH CHECK (
    blocker_user_id = auth.uid()
    AND league_id = get_current_user_league_id()
    AND blocked_user_id IN (
        SELECT p.id FROM public.profiles p 
        WHERE p.league_id = get_current_user_league_id()
        AND p.id <> auth.uid() -- Cannot block yourself
    )
    -- Allow any fixture_id, as the frontend validates match availability
    -- This allows blocking future matches that may not be in match_results yet
);

-- Remove the restrictive foreign key constraint on fixture_id
-- Future matches may not exist in match_results yet, only in match_odds_cache (JSONB)
ALTER TABLE public.match_blocks
DROP CONSTRAINT IF EXISTS match_blocks_fixture_id_fkey;

