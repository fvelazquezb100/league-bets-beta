-- Comprehensive UX Improvements and Mobile Fixes
-- This migration consolidates multiple UX and functionality fixes:
-- 1. Fix bet cancellation issues for started matches
-- 2. Fix weekly budget reset case consistency 
-- 3. Improve username generation logic (documented)
-- 4. Implement smart redirect for new users (documented)
-- 5. Fix mobile bet slip drawer freezing issue (documented)

-- ============================================================================
-- PART 1: Add kickoff_time column to match_results table
-- ============================================================================

-- Add kickoff_time column to store the original kickoff date/time for each match
-- This allows the cancel bet functionality to work even after matches have started
ALTER TABLE public.match_results 
ADD COLUMN kickoff_time TIMESTAMP WITH TIME ZONE;

-- Add a comment to document the purpose of this column
COMMENT ON COLUMN public.match_results.kickoff_time IS 'Original kickoff date and time of the match, used for bet cancellation logic';

-- Create indexes for better query performance
CREATE INDEX idx_match_results_kickoff_time ON public.match_results(kickoff_time);
CREATE INDEX idx_match_results_fixture_kickoff ON public.match_results(fixture_id, kickoff_time);

-- ============================================================================
-- PART 2: Update cancel_bet function to use match_results
-- ============================================================================

-- Update cancel bet function to use match_results table instead of match_odds_cache
-- This fixes the issue where the cancel button fails for matches that have already started
-- because started matches are no longer in the odds cache
CREATE OR REPLACE FUNCTION public.cancel_bet(bet_id_param bigint)
RETURNS jsonb AS $$
DECLARE
  v_bet RECORD;
  v_profile RECORD;
  v_earliest_kickoff timestamp with time zone;
  v_current_time timestamp with time zone := now();
  v_cutoff_time timestamp with time zone;
  v_fixture_id integer;
  v_kickoff_time timestamp with time zone;
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

  -- Handle different bet types
  IF v_bet.bet_type = 'single' THEN
    -- Single bet logic
    IF v_bet.fixture_id IS NULL THEN
      RAISE EXCEPTION 'This bet is not linked to a fixture';
    END IF;

    -- Look for fixture kickoff time in match_results table
    SELECT kickoff_time INTO v_kickoff_time
    FROM match_results
    WHERE fixture_id = v_bet.fixture_id;

    IF v_kickoff_time IS NULL THEN
      RAISE EXCEPTION 'Kickoff time not found for this fixture';
    END IF;

    v_earliest_kickoff := v_kickoff_time;

  ELSIF v_bet.bet_type = 'combo' THEN
    -- Combo bet logic
    v_earliest_kickoff := NULL;
    
    -- Get all fixture IDs from bet selections and find earliest kickoff
    FOR v_fixture_id IN 
      SELECT DISTINCT fixture_id 
      FROM bet_selections 
      WHERE bet_id = bet_id_param AND fixture_id IS NOT NULL
    LOOP
      -- Look for fixture kickoff time in match_results table
      SELECT kickoff_time INTO v_kickoff_time
      FROM match_results
      WHERE fixture_id = v_fixture_id;

      IF v_kickoff_time IS NOT NULL THEN
        -- Track earliest kickoff time
        IF v_earliest_kickoff IS NULL OR v_kickoff_time < v_earliest_kickoff THEN
          v_earliest_kickoff := v_kickoff_time;
        END IF;
      END IF;
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 3: Fix reset_budget case consistency
-- ============================================================================

-- Fix reset_budget case consistency
-- Problem: Function reset_weekly_budgets() looks for 'weekly' (lowercase)
-- but create_league_and_join() creates leagues with 'Weekly' (uppercase)
-- Solution: Standardize everything to lowercase

-- Update existing leagues that have 'Weekly' to 'weekly' and 'Daily' to 'daily'
UPDATE public.leagues 
SET reset_budget = 'weekly' 
WHERE reset_budget = 'Weekly';

UPDATE public.leagues 
SET reset_budget = 'daily' 
WHERE reset_budget = 'Daily';

-- Update the create_league_and_join function to use lowercase 'weekly'
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
      -- Insert league with default values (using lowercase 'weekly')
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
        'weekly',  -- Changed from 'Weekly' to 'weekly'
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

-- ============================================================================
-- PART 4: Documentation of Frontend Improvements
-- ============================================================================

-- Username Generation Logic Improvements (implemented in code):
-- - supabase/functions/auth-handler/index.ts: Only add suffix when username exists
-- - src/lib/authBootstrap.ts: Improved logic for client-side fallback
-- - Users now get clean usernames without unnecessary numbers

-- Smart Redirect Implementation (implemented in code):
-- - src/components/SmartRedirect.tsx: New component for intelligent routing
-- - src/App.tsx: Wrapped protected routes with SmartRedirect
-- - src/pages/Home.tsx: Simplified by removing duplicate redirect logic
-- - New users without leagues now go directly to /league-setup

-- Mobile Bet Slip Drawer Fix (implemented in code):
-- - src/components/MobileBetSlip.tsx: Changed from Drawer to Sheet for better stability
-- - Fixed freezing issue when clearing bets or removing last bet
-- - Improved state synchronization between parent and sheet component
-- - Fixed accessibility issues in command.tsx DialogContent

-- ============================================================================
-- PART 4: Remove hardcoded URLs from SQL functions
-- ============================================================================

-- Update cron_process_results function to use dynamic URL
CREATE OR REPLACE FUNCTION public.cron_process_results()
RETURNS void AS $$
DECLARE
  service_key_value text;
  supabase_url_value text;
BEGIN
  -- Securely retrieve the service role key from the Supabase Vault
  SELECT decrypted_secret INTO service_key_value 
  FROM vault.decrypted_secrets 
  WHERE name = 'SUPABASE_SERVICE_ROLE_KEY';

  -- Securely retrieve the Supabase URL from the Supabase Vault
  SELECT decrypted_secret INTO supabase_url_value 
  FROM vault.decrypted_secrets 
  WHERE name = 'SUPABASE_URL';

  -- If the key is not found, raise an error
  IF service_key_value IS NULL THEN
    RAISE EXCEPTION 'Secret "SUPABASE_SERVICE_ROLE_KEY" not found in Supabase Vault.';
  END IF;

  -- If the URL is not found, raise an error
  IF supabase_url_value IS NULL THEN
    RAISE EXCEPTION 'Secret "SUPABASE_URL" not found in Supabase Vault.';
  END IF;

  -- Perform the HTTP POST request using the retrieved values
  PERFORM net.http_post(
    url := supabase_url_value || '/functions/v1/secure-run-process-matchday-results',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key_value
    ),
    body := '{}'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update trigger_auth_handler_on_new_user function to use dynamic URL
CREATE OR REPLACE FUNCTION public.trigger_auth_handler_on_new_user()
RETURNS trigger AS $$
DECLARE
  supabase_url_value text;
BEGIN
  -- Securely retrieve the Supabase URL from the Supabase Vault
  SELECT decrypted_secret INTO supabase_url_value 
  FROM vault.decrypted_secrets 
  WHERE name = 'SUPABASE_URL';

  -- If the URL is not found, raise an error
  IF supabase_url_value IS NULL THEN
    RAISE EXCEPTION 'Secret "SUPABASE_URL" not found in Supabase Vault.';
  END IF;

  -- Perform a POST request to the auth-handler Edge Function using dynamic URL
  PERFORM net.http_post(
    url := supabase_url_value || '/functions/v1/auth-handler',
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'users',
      'schema', 'auth',
      'record', row_to_json(NEW)
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add SUPABASE_URL to vault for current environment
DO $$
DECLARE
  current_project_ref text;
BEGIN
  -- Check if we're in staging or production based on existing function URLs
  SELECT CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p 
      JOIN pg_namespace n ON p.pronamespace = n.oid 
      WHERE n.nspname = 'public' 
      AND p.proname = 'cron_process_results'
      AND pg_get_functiondef(p.oid) LIKE '%lflxrkkzudsecvdfdxwl%'
    ) THEN 'lflxrkkzudsecvdfdxwl'  -- Production
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p 
      JOIN pg_namespace n ON p.pronamespace = n.oid 
      WHERE n.nspname = 'public' 
      AND p.proname = 'cron_process_results'
      AND pg_get_functiondef(p.oid) LIKE '%sbfgxxdpppgtgiclmctc%'
    ) THEN 'sbfgxxdpppgtgiclmctc'  -- Staging
    ELSE 'lflxrkkzudsecvdfdxwl'    -- Default to production
  END INTO current_project_ref;
  
  -- Insert or update the SUPABASE_URL secret
  INSERT INTO vault.secrets (name, secret) 
  VALUES ('SUPABASE_URL', 'https://' || current_project_ref || '.supabase.co')
  ON CONFLICT (name) 
  DO UPDATE SET secret = EXCLUDED.secret;
  
  RAISE NOTICE 'SUPABASE_URL secret set for project: %', current_project_ref;
END $$;

SELECT 'Comprehensive UX improvements, mobile fixes, and security improvements completed' as message;
