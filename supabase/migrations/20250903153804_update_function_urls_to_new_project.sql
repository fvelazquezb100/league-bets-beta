-- Update database functions to use new project URLs
-- This migration updates the hardcoded URLs in database functions to point to the new Supabase project

-- Update the process_matchday_results function to use new project URL
CREATE OR REPLACE FUNCTION public.process_matchday_results()
RETURNS void AS $$
DECLARE
  service_key_value text;
BEGIN
  -- Retrieve the service role key from Supabase Vault
  SELECT decrypted_secret INTO service_key_value
  FROM vault.decrypted_secrets
  WHERE name = 'SUPABASE_SERVICE_ROLE_KEY';

  IF service_key_value IS NULL THEN
    RAISE EXCEPTION 'Secret "SUPABASE_SERVICE_ROLE_KEY" not found in Supabase Vault.';
  END IF;

  -- Perform the HTTP POST request using the retrieved key
  PERFORM net.http_post(
    url := 'https://lflxrkkzudsecvdfdxwl.supabase.co/functions/v1/secure-run-process-matchday-results',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key_value
    ),
    body := '{}'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the auth handler trigger function to use new project URL
CREATE OR REPLACE FUNCTION public.trigger_auth_handler_on_new_user()
RETURNS trigger AS $$
BEGIN
  -- Perform a POST request to the auth-handler Edge Function
  PERFORM net.http_post(
    url := 'https://lflxrkkzudsecvdfdxwl.supabase.co/functions/v1/auth-handler',
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
