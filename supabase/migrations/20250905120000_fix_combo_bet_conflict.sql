-- Fix combo bet function to handle conflicts and improve robustness
-- This migration is idempotent and can be run multiple times safely

-- Create or replace the place_combo_bet function with better error handling
CREATE OR REPLACE FUNCTION public.place_combo_bet(selections jsonb, stake_amount numeric)
RETURNS bigint AS $$
DECLARE
  v_user_id uuid;
  v_bet_id bigint;
  v_total_odds numeric := 1;
  v_sel jsonb;
  v_fixture_id bigint;
  v_market text;
  v_selection text;
  v_odds numeric;
  v_match_description text;
  v_now timestamptz := now();
  v_budget numeric;
  v_max_id bigint;
BEGIN
  -- Current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Budget check with row-level locking
  SELECT weekly_budget INTO v_budget
  FROM profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_budget IS NULL OR v_budget < stake_amount THEN
    RAISE EXCEPTION 'insufficient_budget';
  END IF;

  -- Validate selections
  IF selections IS NULL OR jsonb_array_length(selections) = 0 THEN
    RAISE EXCEPTION 'no_selections_provided';
  END IF;

  -- Avoid duplicate matches in combo
  IF EXISTS (
    SELECT 1
    FROM (
      SELECT (e->>'fixture_id') as f
      FROM jsonb_array_elements(selections) e
      WHERE e ? 'fixture_id'
    ) t
    WHERE f IS NOT NULL
    GROUP BY f
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'duplicate_fixture_in_combo';
  END IF;

  -- Get next ID safely without using the problematic get_next_bet_id function
  LOCK TABLE bets IN EXCLUSIVE MODE;
  SELECT COALESCE(MAX(id), 0) + 1 INTO v_max_id FROM public.bets;
  v_bet_id := v_max_id;

  -- Create combo bet with explicit ID
  INSERT INTO bets (id, user_id, stake, odds, status, payout, bet_type, created_at)
  VALUES (v_bet_id, v_user_id, stake_amount, 1, 'pending', 0, 'combo', v_now);

  -- Insert selections and calculate total odds
  FOR v_sel IN SELECT * FROM jsonb_array_elements(selections)
  LOOP
    v_fixture_id := NULLIF((v_sel->>'fixture_id')::bigint, 0);
    v_market := v_sel->>'market';
    v_selection := v_sel->>'selection';
    v_odds := (v_sel->>'odds')::numeric;
    v_match_description := v_sel->>'match_description';

    -- Validate required fields
    IF v_odds IS NULL THEN
      RAISE EXCEPTION 'selection_missing_odds';
    END IF;

    IF v_market IS NULL OR v_selection IS NULL THEN
      RAISE EXCEPTION 'selection_missing_market_or_selection';
    END IF;

    v_total_odds := v_total_odds * v_odds;

    INSERT INTO bet_selections (
      bet_id, fixture_id, market, selection, odds, status, match_description, created_at
    ) VALUES (
      v_bet_id, v_fixture_id, v_market, v_selection, v_odds, 'pending', v_match_description, v_now
    );
  END LOOP;

  -- Update totals in bets
  UPDATE bets
  SET odds = v_total_odds,
      payout = ROUND(stake_amount * v_total_odds, 2)
  WHERE id = v_bet_id;

  -- Deduct budget
  UPDATE profiles
  SET weekly_budget = weekly_budget - stake_amount
  WHERE id = v_user_id;

  -- Update sequence to prevent future conflicts
  PERFORM setval('public.bets_id_seq', v_bet_id, true);

  RETURN v_bet_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error for debugging
    RAISE NOTICE 'Error in place_combo_bet: %', SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also fix the place_single_bet function to be consistent
CREATE OR REPLACE FUNCTION public.place_single_bet(
  stake_amount numeric,
  odds_value numeric,
  market_bets text,
  match_description text,
  bet_selection text,
  fixture_id_param integer
)
RETURNS bigint AS $$
DECLARE
  v_user_id uuid;
  v_bet_id bigint;
  v_budget numeric;
  v_payout numeric;
  v_max_id bigint;
BEGIN
  -- Current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Budget check
  SELECT weekly_budget INTO v_budget
  FROM profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_budget IS NULL OR v_budget < stake_amount THEN
    RAISE EXCEPTION 'insufficient_budget';
  END IF;

  -- Get next ID safely
  LOCK TABLE bets IN EXCLUSIVE MODE;
  SELECT COALESCE(MAX(id), 0) + 1 INTO v_max_id FROM public.bets;
  v_bet_id := v_max_id;

  -- Calculate payout
  v_payout := stake_amount * odds_value;

  -- Create single bet with explicit ID
  INSERT INTO bets (
    id, user_id, stake, odds, market_bets, payout, 
    match_description, bet_selection, fixture_id, bet_type, status, created_at
  ) VALUES (
    v_bet_id, v_user_id, stake_amount, odds_value, market_bets, v_payout,
    match_description, bet_selection, fixture_id_param, 'single', 'pending', now()
  );

  -- Deduct budget
  UPDATE profiles
  SET weekly_budget = weekly_budget - stake_amount
  WHERE id = v_user_id;

  -- Update sequence to prevent future conflicts
  PERFORM setval('public.bets_id_seq', v_bet_id, true);

  RETURN v_bet_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error for debugging
    RAISE NOTICE 'Error in place_single_bet: %', SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
