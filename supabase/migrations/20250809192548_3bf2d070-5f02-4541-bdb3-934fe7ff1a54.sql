-- Update fallback cron to run daily instead of every 2 hours
-- 1) Unschedule existing jobs named 'process-matchday-results-every-2h'
DO $$
DECLARE jid INT;
BEGIN
  FOR jid IN SELECT jobid FROM cron.job WHERE jobname = 'process-matchday-results-every-2h'
  LOOP
    PERFORM cron.unschedule(jid);
  END LOOP;
END $$;

-- 2) Schedule the fallback job to run once a day at 03:05 UTC
SELECT cron.schedule(
  'process-matchday-results-every-2h',
  '5 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://jhsjszflscbpcfzuurwq.supabase.co/functions/v1/secure-run-process-matchday-results',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impoc2pzemZsc2NicGNmenV1cndxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTU0NDcsImV4cCI6MjA3MDE5MTQ0N30.Q1rFk03Q60qTkO8DLQg86sEPO20Jz7OFr21wgrDO7yk'
    ),
    body := '{}'::jsonb
  );
  $$
);