-- Fix bet ID sequence to ensure incremental IDs without gaps
-- This migration ensures that new bets always get the highest ID

-- Function to reset the bet sequence to the next available ID
CREATE OR REPLACE FUNCTION public.reset_bet_sequence()
RETURNS void AS $$
DECLARE
  max_id bigint;
BEGIN
  -- Get the maximum ID from the bets table
  SELECT COALESCE(MAX(id), 0) INTO max_id FROM public.bets;
  
  -- Reset the sequence to start from the next available ID
  PERFORM setval('public.bets_id_seq', max_id + 1, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get the next bet ID (ensures no gaps)
CREATE OR REPLACE FUNCTION public.get_next_bet_id()
RETURNS bigint AS $$
DECLARE
  next_id bigint;
BEGIN
  -- Reset sequence to ensure no gaps
  PERFORM public.reset_bet_sequence();
  
  -- Get the next value from the sequence
  SELECT nextval('public.bets_id_seq') INTO next_id;
  
  RETURN next_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reset the sequence to the current maximum ID + 1
SELECT public.reset_bet_sequence();

-- Create a trigger to automatically reset the sequence when bets are deleted
CREATE OR REPLACE FUNCTION public.maintain_bet_sequence()
RETURNS trigger AS $$
BEGIN
  -- After any DELETE operation on bets, reset the sequence
  PERFORM public.reset_bet_sequence();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to maintain sequence after deletions
DROP TRIGGER IF EXISTS trigger_maintain_bet_sequence ON public.bets;
CREATE TRIGGER trigger_maintain_bet_sequence
  AFTER DELETE ON public.bets
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.maintain_bet_sequence();

-- Function to place a single bet with proper ID sequencing
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

  -- Get the next bet ID using our new function
  v_bet_id := public.get_next_bet_id();

  -- Calculate payout
  v_payout := stake_amount * odds_value;

  -- Create single bet with explicit ID
  INSERT INTO bets (
    id, user_id, stake, odds, market_bets, payout, 
    match_description, bet_selection, fixture_id, bet_type, status
  ) VALUES (
    v_bet_id, v_user_id, stake_amount, odds_value, market_bets, v_payout,
    match_description, bet_selection, fixture_id_param, 'single', 'pending'
  );

  -- Deduct budget
  UPDATE profiles
  SET weekly_budget = weekly_budget - stake_amount
  WHERE id = v_user_id;

  RETURN v_bet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the place_combo_bet function to use the new sequence logic
CREATE OR REPLACE FUNCTION public.place_combo_bet(selections jsonb, stake_amount numeric)
RETURNS bigint AS $$
declare
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
begin
  -- Current user
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  -- Budget check
  select weekly_budget into v_budget
  from profiles
  where id = v_user_id
  for update;

  if v_budget is null or v_budget < stake_amount then
    raise exception 'insufficient_budget';
  end if;

  -- Avoid duplicate matches in combo
  if exists (
    select 1
    from (
      select (e->>'fixture_id') as f
      from jsonb_array_elements(selections) e
      where e ? 'fixture_id'
    ) t
    where f is not null
    group by f
    having count(*) > 1
  ) then
    raise exception 'duplicate_fixture_in_combo';
  end if;

  -- Get the next bet ID using our new function
  v_bet_id := public.get_next_bet_id();

  -- Create combo bet with explicit ID
  insert into bets (id, user_id, stake, odds, status, payout, bet_type)
  values (v_bet_id, v_user_id, stake_amount, 1, 'pending', 0, 'combo');

  -- Insert selections (includes match_description)
  for v_sel in select * from jsonb_array_elements(selections)
  loop
    v_fixture_id := nullif((v_sel->>'fixture_id')::bigint, 0);
    v_market := v_sel->>'market';
    v_selection := v_sel->>'selection';
    v_odds := (v_sel->>'odds')::numeric;
    v_match_description := v_sel->>'match_description';

    if v_odds is null then
      raise exception 'selection_missing_odds';
    end if;

    v_total_odds := v_total_odds * v_odds;

    insert into bet_selections (
      bet_id, fixture_id, market, selection, odds, status, match_description, created_at
    ) values (
      v_bet_id, v_fixture_id, v_market, v_selection, v_odds, 'pending', v_match_description, v_now
    );
  end loop;

  -- Update totals in bets
  update bets
  set odds = v_total_odds,
      payout = round(stake_amount * v_total_odds, 2)
  where id = v_bet_id;

  -- Deduct budget
  update profiles
  set weekly_budget = weekly_budget - stake_amount
  where id = v_user_id;

  return v_bet_id;
end;
$$ LANGUAGE plpgsql SECURITY DEFINER;
