-- Create update_combo_bet_status RPC function
CREATE OR REPLACE FUNCTION public.update_combo_bet_status(
  bet_id_to_check bigint
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_bet RECORD;
  v_selection RECORD;
  v_lost_count integer := 0;
  v_won_count integer := 0;
  v_pending_count integer := 0;
  v_total_selections integer := 0;
  v_total_odds numeric := 1;
  v_calculated_payout numeric;
BEGIN
  -- Get the main bet record
  SELECT b.* INTO v_bet
  FROM public.bets b
  WHERE b.id = bet_id_to_check
    AND b.bet_type = 'combo';

  -- If bet not found or not a combo bet, exit
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- If bet is already settled (won/lost), don't process again
  IF v_bet.status IN ('won', 'lost') THEN
    RETURN;
  END IF;

  -- Count selections by status and calculate total odds
  FOR v_selection IN 
    SELECT status, odds 
    FROM public.bet_selections 
    WHERE bet_id = bet_id_to_check
  LOOP
    v_total_selections := v_total_selections + 1;
    
    -- Count selections by status
    CASE v_selection.status
      WHEN 'won' THEN
        v_won_count := v_won_count + 1;
        v_total_odds := v_total_odds * COALESCE(v_selection.odds, 1);
      WHEN 'lost' THEN
        v_lost_count := v_lost_count + 1;
      WHEN 'pending' THEN
        v_pending_count := v_pending_count + 1;
      ELSE
        -- For any other status, treat as pending
        v_pending_count := v_pending_count + 1;
    END CASE;
  END LOOP;

  -- If no selections found, exit
  IF v_total_selections = 0 THEN
    RETURN;
  END IF;

  -- Apply combo bet rules
  IF v_lost_count > 0 THEN
    -- Any lost selection makes the entire combo bet lost
    UPDATE public.bets
    SET status = 'lost',
        payout = 0
    WHERE id = bet_id_to_check;

  ELSIF v_won_count = v_total_selections THEN
    -- All selections won - combo bet wins
    v_calculated_payout := COALESCE(v_bet.stake, 0) * v_total_odds;
    
    UPDATE public.bets
    SET status = 'won',
        payout = v_calculated_payout,
        odds = v_total_odds
    WHERE id = bet_id_to_check;

    -- Add points to user for winning combo bet
    PERFORM public.update_league_points(v_bet.user_id, v_calculated_payout - COALESCE(v_bet.stake, 0));

  -- ELSE: If there are pending selections and no lost ones, do nothing (leave as pending)
  END IF;

END;
$$;

-- Grant EXECUTE permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION public.update_combo_bet_status(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_combo_bet_status(bigint) TO service_role;