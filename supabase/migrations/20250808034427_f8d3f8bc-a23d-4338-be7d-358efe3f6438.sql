-- Create a function to handle new user signups and create their profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, weekly_budget, total_points)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)), 1000, 0);
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create some sample leagues
INSERT INTO public.leagues (id, name) VALUES 
(1, 'Liga Premier'),
(2, 'Liga Championship'),
(3, 'Liga Nacional')
ON CONFLICT (id) DO NOTHING;

-- Create a weekly cron job to update football cache
SELECT cron.schedule(
  'update-football-cache-weekly',
  '0 9 * * 1', -- Every Monday at 9 AM
  $$
  SELECT net.http_post(
    url := 'https://jhsjszflscbpcfzuurwq.supabase.co/functions/v1/secure-run-update-football-cache',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impoc2pzemZsc2NicGNmenV1cndxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTU0NDcsImV4cCI6MjA3MDE5MTQ0N30.Q1rFk03Q60qTkO8DLQg86sEPO20Jz7OFr21wgrDO7yk"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;