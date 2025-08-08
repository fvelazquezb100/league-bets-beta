-- Secure weekly scheduler migration to call wrapper without secrets
-- Ensure required extensions
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Replace existing weekly job with secure wrapper call
DO $$
BEGIN
  IF exists (select 1 from cron.job where jobname = 'weekly_update_football_cache') THEN
    perform cron.unschedule('weekly_update_football_cache');
  END IF;
END $$;

select cron.schedule(
  'weekly_update_football_cache',
  '0 10 * * FRI',
  $$
  select net.http_post(
    url:='https://jhsjszflscbpcfzuurwq.supabase.co/functions/v1/secure-run-update-football-cache',
    headers:='{"Content-Type":"application/json"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);
