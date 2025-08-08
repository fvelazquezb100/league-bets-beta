-- Create the schedule_one_time_http_call function that the edge function is expecting
CREATE OR REPLACE FUNCTION public.schedule_one_time_http_call(
  job_name TEXT,
  schedule TEXT,
  url TEXT,
  auth_header TEXT,
  body TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  job_id TEXT;
BEGIN
  -- Use pg_cron to schedule a one-time HTTP call
  SELECT cron.schedule(
    job_name,
    schedule,
    format(
      'SELECT net.http_post(url := %L, headers := %L, body := %L);',
      url,
      format('{"Authorization": "%s", "Content-Type": "application/json"}', auth_header)::jsonb,
      body::jsonb
    )
  ) INTO job_id;
  
  RETURN job_id::TEXT;
END;
$$;