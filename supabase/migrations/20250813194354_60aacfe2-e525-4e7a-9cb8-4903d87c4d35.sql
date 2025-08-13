-- Fix the cancel_bet function to properly handle the cache data structure
CREATE OR REPLACE FUNCTION cancel_bet(bet_id_param bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bet RECORD;
  v_profile RECORD;
  v_earliest_kickoff timestamp with time zone;
  v_current_time timestamp with time zone := now();
  v_cutoff_time timestamp with time zone;
  v_cache_data jsonb;
  v_fixture_id integer;
  v_kickoff_str text;
  v_kickoff_time timestamp with time zone;
  v_response_item jsonb;
BEGIN
  -- Get the bet details
  SELECT * INTO v_bet
  FROM bets
  WHERE id = bet_id_param AND user_id = auth.uid();

  -- Check if bet exists and belongs to user
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bet not found or you do not have permission to cancel it';
  END IF;

  -- Check if bet is still pending
  IF v_bet.status != 'pending' THEN
    RAISE EXCEPTION 'Only pending bets can be cancelled';
  END IF;

  -- Get cache data
  SELECT data INTO v_cache_data
  FROM match_odds_cache
  WHERE id = 1;

  IF v_cache_data IS NULL THEN
    RAISE EXCEPTION 'Match odds cache not found';
  END IF;

  -- Handle different bet types
  IF v_bet.bet_type = 'single' THEN
    -- Single bet logic (existing)
    IF v_bet.fixture_id IS NULL THEN
      RAISE EXCEPTION 'This bet is not linked to a fixture';
    END IF;

    -- Look for fixture in the response array
    FOR v_response_item IN SELECT * FROM jsonb_array_elements(v_cache_data->'response')
    LOOP
      IF (v_response_item->'fixture'->>'id')::integer = v_bet.fixture_id THEN
        v_kickoff_str := v_response_item->'fixture'->>'date';
        IF v_kickoff_str IS NOT NULL THEN
          v_kickoff_time := v_kickoff_str::timestamp with time zone;
          v_earliest_kickoff := v_kickoff_time;
          EXIT; -- Found it, break out of loop
        END IF;
      END IF;
    END LOOP;

    IF v_earliest_kickoff IS NULL THEN
      RAISE EXCEPTION 'Kickoff time not found for this fixture';
    END IF;

  ELSIF v_bet.bet_type = 'combo' THEN
    -- Combo bet logic (new)
    v_earliest_kickoff := NULL;
    
    -- Get all fixture IDs from bet selections and find earliest kickoff
    FOR v_fixture_id IN 
      SELECT DISTINCT fixture_id 
      FROM bet_selections 
      WHERE bet_id = bet_id_param AND fixture_id IS NOT NULL
    LOOP
      -- Look for fixture in the response array
      FOR v_response_item IN SELECT * FROM jsonb_array_elements(v_cache_data->'response')
      LOOP
        IF (v_response_item->'fixture'->>'id')::integer = v_fixture_id THEN
          v_kickoff_str := v_response_item->'fixture'->>'date';
          IF v_kickoff_str IS NOT NULL THEN
            v_kickoff_time := v_kickoff_str::timestamp with time zone;
            
            -- Track earliest kickoff time
            IF v_earliest_kickoff IS NULL OR v_kickoff_time < v_earliest_kickoff THEN
              v_earliest_kickoff := v_kickoff_time;
            END IF;
            EXIT; -- Found this fixture, move to next
          END IF;
        END IF;
      END LOOP;
    END LOOP;

    -- Check if we found any valid kickoff times
    IF v_earliest_kickoff IS NULL THEN
      RAISE EXCEPTION 'No valid fixture data found for this combo bet';
    END IF;

  ELSE
    RAISE EXCEPTION 'Unknown bet type: %', v_bet.bet_type;
  END IF;

  -- Calculate cutoff time (15 minutes before earliest kickoff)
  v_cutoff_time := v_earliest_kickoff - INTERVAL '15 minutes';

  -- Check if current time is past the cutoff
  IF v_current_time > v_cutoff_time THEN
    RAISE EXCEPTION 'Cannot cancel bet - less than 15 minutes until kickoff';
  END IF;

  -- Get user profile
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Refund the stake to weekly budget
  UPDATE profiles
  SET weekly_budget = weekly_budget + v_bet.stake
  WHERE id = auth.uid();

  -- Delete the bet (this will cascade delete bet_selections)
  DELETE FROM bets WHERE id = bet_id_param;

  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Bet cancelled successfully',
    'refunded_amount', v_bet.stake,
    'earliest_kickoff', v_earliest_kickoff,
    'cutoff_time', v_cutoff_time
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Return error response
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;