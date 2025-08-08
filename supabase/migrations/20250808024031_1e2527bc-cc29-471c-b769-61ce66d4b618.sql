-- Backend & Auth setup for Betadona
-- 1) Ensure required extensions
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- 2) Create signup trigger: handle_new_user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, 'user_' || substr(new.id::text, 1, 8))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3) Tighten RLS: Users can only access their own profiles
-- Remove the broad select policy if it exists
drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;

-- Create owner-only select policy
create policy if not exists "Users can view their own profile"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

-- 4) Bets schema improvement for result processing
alter table public.bets
  add column if not exists fixture_id bigint;

-- 5) Helper RPCs for scheduling via pg_cron and points increment
create or replace function public.schedule_one_time_http_call(
  job_name text,
  schedule text,
  url text,
  auth_header text,
  body jsonb
) returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  job_id int;
  cmd text;
begin
  cmd := format('select net.http_post(\n    url := %L,\n    headers := %L::jsonb,\n    body := %L::jsonb\n  );',
    url,
    jsonb_build_object('Content-Type','application/json','Authorization',auth_header)::text,
    coalesce(body, '{}'::jsonb)::text
  );
  select cron.schedule(job_name, schedule, cmd) into job_id;
  return job_id;
end;
$$;

grant execute on function public.schedule_one_time_http_call(text, text, text, text, jsonb) to authenticated;

drop function if exists public.unschedule_job(text);
create or replace function public.unschedule_job(job_name text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  perform cron.unschedule(job_name);
end;
$$;

grant execute on function public.unschedule_job(text) to authenticated;

create or replace function public.increment_user_points(_user uuid, _delta numeric)
returns void
language sql
security definer
as $$
  update public.profiles
  set total_points = coalesce(total_points, 0) + coalesce(_delta, 0)
  where id = _user;
$$;

grant execute on function public.increment_user_points(uuid, numeric) to authenticated;

-- 6) Secure weekly cron job to kick off odds caching every Friday at 10:00 UTC
-- Remove old if exists, then create fresh
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
    url:='https://jhsjszflscbpcfzuurwq.supabase.co/functions/v1/update-football-cache',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impoc2pzemZsc2NicGNmenV1cndxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTU0NDcsImV4cCI6MjA3MDE5MTQ0N30.Q1rFk03Q60qTkO8DLQg86sEPO20Jz7OFr21wgrDO7yk"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);
