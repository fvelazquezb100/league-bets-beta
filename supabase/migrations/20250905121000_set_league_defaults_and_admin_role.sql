-- Set default values for new leagues and assign admin role to creator
-- This migration updates the create_league_and_join function to:
-- 1. Set default league parameters: reset_budget=Weekly, budget=1000, min_bet=50, max_bet=1000
-- 2. Assign admin_league role to the league creator

CREATE OR REPLACE FUNCTION public.create_league_and_join(_league_name text, _user_id uuid)
RETURNS void AS $$
DECLARE
  new_league_id bigint;
  code text;
  attempts int := 0;
BEGIN
  -- Only allow the authenticated user to act on themselves
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  -- Try generating a unique 8-character alphanumeric (hex) code
  LOOP
    attempts := attempts + 1;
    code := upper(substring(md5(random()::text), 1, 8));
    BEGIN
      -- Insert league with default values
      INSERT INTO public.leagues (
        name, 
        join_code, 
        reset_budget, 
        budget, 
        min_bet, 
        max_bet
      )
      VALUES (
        _league_name, 
        code, 
        'Weekly', 
        1000, 
        50, 
        1000
      )
      RETURNING id INTO new_league_id;
      EXIT; -- success
    EXCEPTION WHEN unique_violation THEN
      -- Retry a few times if collision occurs
      IF attempts > 5 THEN
        RAISE;
      END IF;
    END;
  END LOOP;

  -- Assign user to the newly created league and set as admin
  UPDATE public.profiles
  SET 
    league_id = new_league_id,
    role = 'admin_league'
  WHERE id = _user_id;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
