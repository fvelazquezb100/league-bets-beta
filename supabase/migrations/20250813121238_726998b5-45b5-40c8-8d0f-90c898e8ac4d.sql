-- Create place_combo_bet RPC function
CREATE OR REPLACE FUNCTION public.place_combo_bet(
  stake_amount numeric,
  selections jsonb
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_user_id uuid;
  v_current_budget numeric;
  v_bet_id bigint;
  v_selection jsonb;
  v_fixture_ids integer[];
  v_unique_fixture_ids integer[];
BEGIN
  -- Check if user is authenticated
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated' USING ERRCODE = '28000';
  END IF;

  -- Validate stake amount
  IF stake_amount IS NULL OR stake_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid stake amount' USING ERRCODE = '22023';
  END IF;

  -- Validate selections array
  IF selections IS NULL OR jsonb_array_length(selections) < 2 THEN
    RAISE EXCEPTION 'Combo bet must have at least 2 selections' USING ERRCODE = '22023';
  END IF;

  -- Extract all fixture_ids from selections
  SELECT array_agg((sel->>'fixture_id')::integer)
  INTO v_fixture_ids
  FROM jsonb_array_elements(selections) AS sel;

  -- Get unique fixture_ids
  SELECT array_agg(DISTINCT fixture_id)
  INTO v_unique_fixture_ids
  FROM unnest(v_fixture_ids) AS fixture_id;

  -- Check if all fixture_ids are unique (no duplicates from same fixture)
  IF array_length(v_fixture_ids, 1) != array_length(v_unique_fixture_ids, 1) THEN
    RAISE EXCEPTION 'No se pueden incluir múltiples selecciones del mismo partido en una apuesta combinada.' USING ERRCODE = '22023';
  END IF;

  -- Check user's current budget
  SELECT weekly_budget INTO v_current_budget
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_current_budget IS NULL THEN
    RAISE EXCEPTION 'User profile not found' USING ERRCODE = '22023';
  END IF;

  IF v_current_budget < stake_amount THEN
    RAISE EXCEPTION 'Insufficient budget' USING ERRCODE = '22023';
  END IF;

  -- Create parent bet record
  INSERT INTO public.bets (
    user_id,
    stake,
    bet_type,
    status
  ) VALUES (
    v_user_id,
    stake_amount,
    'combo',
    'pending'
  ) RETURNING id INTO v_bet_id;

  -- Insert each selection into bet_selections table
  FOR v_selection IN SELECT * FROM jsonb_array_elements(selections)
  LOOP
    INSERT INTO public.bet_selections (
      bet_id,
      fixture_id,
      market,
      selection,
      odds,
      status
    ) VALUES (
      v_bet_id,
      (v_selection->>'fixture_id')::integer,
      v_selection->>'market',
      v_selection->>'selection',
      (v_selection->>'odds')::numeric,
      'pending'
    );
  END LOOP;

  -- Deduct stake from user's weekly budget
  UPDATE public.profiles
  SET weekly_budget = weekly_budget - stake_amount
  WHERE id = v_user_id;

  -- Return the bet ID
  RETURN v_bet_id;
END;
$$;

-- Grant EXECUTE permission to authenticated users
GRANT EXECUTE ON FUNCTION public.place_combo_bet(numeric, jsonb) TO authenticated;