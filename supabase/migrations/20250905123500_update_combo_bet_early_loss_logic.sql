-- Update combo bet status function with early loss detection
-- If any selection is lost, immediately mark the combo as lost
-- No need to wait for all selections to be resolved

CREATE OR REPLACE FUNCTION public.update_combo_bet_status(bet_id_to_check bigint)
RETURNS void AS $$
DECLARE
  v_bet           public.bets%ROWTYPE;
  v_pending_cnt   int;
  v_lost_cnt      int;
  v_won_cnt       int;
  v_combined_odds numeric;
  v_payout        numeric;
BEGIN
  -- Load parent bet
  SELECT * INTO v_bet
  FROM public.bets
  WHERE id = bet_id_to_check
    AND bet_type = 'combo';

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Count leg statuses
  SELECT
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END),
    SUM(CASE WHEN status = 'lost'    THEN 1 ELSE 0 END),
    SUM(CASE WHEN status = 'won'     THEN 1 ELSE 0 END)
  INTO v_pending_cnt, v_lost_cnt, v_won_cnt
  FROM public.bet_selections
  WHERE bet_id = v_bet.id;

  -- NEW LOGIC: If any leg lost → immediately mark combo as lost
  -- No need to wait for pending selections to be resolved
  IF v_lost_cnt > 0 THEN
    UPDATE public.bets
    SET status = 'lost',
        payout = 0,
        odds   = NULL
    WHERE id = v_bet.id;
    RETURN;
  END IF;

  -- If no legs lost but some still pending, keep parent pending
  IF v_pending_cnt > 0 THEN
    RETURN;
  END IF;

  -- All legs settled and none lost → combo won
  -- Combined odds = product of leg odds
  SELECT COALESCE(EXP(SUM(LN(NULLIF(odds, 0)))), 0)
  INTO v_combined_odds
  FROM public.bet_selections
  WHERE bet_id = v_bet.id;

  v_payout := COALESCE(v_bet.stake, 0) * COALESCE(v_combined_odds, 0);

  UPDATE public.bets
  SET status = 'won',
      payout = v_payout,
      odds   = v_combined_odds
  WHERE id = v_bet.id;

  -- Credit points equal to payout
  PERFORM public.update_league_points(v_bet.user_id, v_payout);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
