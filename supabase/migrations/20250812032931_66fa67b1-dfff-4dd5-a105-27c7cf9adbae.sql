-- Create a secure RPC to cancel a pending bet up to 15 minutes before kickoff
CREATE OR REPLACE FUNCTION public.cancel_bet(bet_id_to_cancel bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid;
  v_bet RECORD;
  v_fixture_date timestamptz;
BEGIN
  -- Ensure the caller is authenticated
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  -- Fetch the bet ensuring it belongs to the current user
  SELECT b.*
  INTO v_bet
  FROM public.bets b
  WHERE b.id = bet_id_to_cancel
    AND b.user_id = v_user_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bet not found or does not belong to current user' USING ERRCODE = '22023';
  END IF;

  -- Only pending bets can be canceled
  IF v_bet.status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'Only pending bets can be canceled' USING ERRCODE = '22023';
  END IF;

  -- The bet must be linked to a fixture
  IF v_bet.fixture_id IS NULL THEN
    RAISE EXCEPTION 'This bet is not linked to a fixture' USING ERRCODE = '22023';
  END IF;

  -- Find the match kickoff time from the odds cache
  SELECT (obj->'fixture'->>'date')::timestamptz
  INTO v_fixture_date
  FROM public.match_odds_cache m,
       LATERAL jsonb_array_elements(m.data) AS obj
  WHERE (obj->'fixture'->>'id')::int = v_bet.fixture_id
  LIMIT 1;

  IF v_fixture_date IS NULL THEN
    RAISE EXCEPTION 'Could not find match start time for the bet' USING ERRCODE = '22023';
  END IF;

  -- Enforce 15-minute cutoff
  IF now() > (v_fixture_date - INTERVAL '15 minutes') THEN
    RAISE EXCEPTION 'Bets can only be canceled up to 15 minutes before kickoff' USING ERRCODE = '22023';
  END IF;

  -- Refund the stake and delete the bet
  UPDATE public.profiles
  SET weekly_budget = COALESCE(weekly_budget, 0) + COALESCE(v_bet.stake, 0)
  WHERE id = v_user_id;

  DELETE FROM public.bets
  WHERE id = v_bet.id
    AND user_id = v_user_id;

  RETURN true;
END;
$function$;