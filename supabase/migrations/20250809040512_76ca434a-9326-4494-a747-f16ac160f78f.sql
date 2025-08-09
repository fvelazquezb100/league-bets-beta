-- Unschedule existing weekly jobs
select cron.unschedule('weekly_update_football_cache');
select cron.unschedule('update-football-cache-weekly');

-- Recreate jobs to run every 2 hours (0 */2 * * *)
select cron.schedule(
  'weekly_update_football_cache',
  '0 */2 * * *',
  $$
  select net.http_post(
    url:='https://jhsjszflscbpcfzuurwq.supabase.co/functions/v1/secure-run-update-football-cache',
    headers:='{"Content-Type":"application/json"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);

select cron.schedule(
  'update-football-cache-weekly',
  '0 */2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://jhsjszflscbpcfzuurwq.supabase.co/functions/v1/secure-run-update-football-cache',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impoc2pzemZsc2NicGNmenV1cndxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTU0NDcsImV4cCI6MjA3MDE5MTQ0N30.Q1rFk03Q60qTkO8DLQg86sEPO20Jz7OFr21wgrDO7yk"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);