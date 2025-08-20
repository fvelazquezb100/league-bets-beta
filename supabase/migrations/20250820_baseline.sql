-- =========================================================
-- Baseline schema for Betadona (idempotent, safe for prod)
-- Creates objects ONLY IF they do not already exist.
-- No drops, no replaces.
-- =========================================================

-- ---------- EXTENSIONS (optional; guarded) ----------
do $$
begin
  if not exists (select 1 from pg_extension where extname = 'pgcrypto') then
    create extension pgcrypto;
  end if;
end$$;

-- ---------- TABLES ----------
-- profiles
create table if not exists public.profiles (
  id uuid primary key default auth.uid(),
  username text not null unique,
  weekly_budget numeric default 1000,
  total_points numeric default 0,
  league_id bigint,
  role text default 'user'
);

-- leagues
create table if not exists public.leagues (
  id bigserial primary key,
  name text not null,
  join_code text unique,
  created_at timestamptz default now()
);

-- bets (parent record)
create table if not exists public.bets (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  bet_type text default 'single',
  stake numeric not null,
  odds numeric,
  status text default 'pending',
  payout numeric,
  fixture_id bigint,
  match_description text,
  bet_selection text
);

-- bet_selections (combo legs)
create table if not exists public.bet_selections (
  id bigserial primary key,
  bet_id bigint references public.bets(id) on delete cascade,
  fixture_id integer,
  market text,
  selection text,
  odds numeric,
  status text default 'pending'
);

-- weekly_performance
create table if not exists public.weekly_performance (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  start_date timestamptz,
  end_date timestamptz,
  net_profit numeric,
  league_id bigint
);

-- match_odds_cache (single row cache)
create table if not exists public.match_odds_cache (
  id smallint primary key default 1,
  data jsonb,
  last_updated timestamp
);

-- helpful indexes (guarded)
create index if not exists idx_bets_user_id on public.bets(user_id);
create index if not exists idx_bet_selections_bet_id on public.bet_selections(bet_id);
create index if not exists idx_profiles_league_id on public.profiles(league_id);
create index if not exists idx_weekly_performance_user_id on public.weekly_performance(user_id);

-- ---------- SECURITY FUNCTION NEEDED BY POLICIES ----------
-- get_current_user_league_id(): returns the league_id of the current user.
-- SECURITY DEFINER + search_path safety so it can be used inside RLS.
do $$
begin
  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'get_current_user_league_id'
  ) then
    execute $fn$
      create function public.get_current_user_league_id()
      returns bigint
      language sql
      stable
      security definer
      set search_path = public
      as $$
        select league_id
        from public.profiles
        where id = auth.uid()
      $$;
    $fn$;
  end if;
end$$;

-- ---------- RLS ENABLE ----------
alter table if exists public.profiles enable row level security;
alter table if exists public.bets enable row level security;
alter table if exists public.bet_selections enable row level security;
alter table if exists public.leagues enable row level security;
alter table if exists public.match_odds_cache enable row level security;
alter table if exists public.weekly_performance enable row level security;

-- ---------- POLICIES (all guarded) ----------

-- profiles: users can read their own profile OR other profiles in same league
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='profiles'
      and policyname='profiles_select_own_or_same_league'
  ) then
    execute $sql$
      create policy profiles_select_own_or_same_league
      on public.profiles
      for select
      using (
        id = auth.uid()
        or league_id is not distinct from public.get_current_user_league_id()
      );
    $sql$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='profiles'
      and policyname='profiles_update_own'
  ) then
    execute $sql$
      create policy profiles_update_own
      on public.profiles
      for update
      using (id = auth.uid())
      with check (id = auth.uid());
    $sql$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='profiles'
      and policyname='profiles_insert_self'
  ) then
    execute $sql$
      create policy profiles_insert_self
      on public.profiles
      for insert
      with check (id = auth.uid());
    $sql$;
  end if;
end$$;

-- bets: full CRUD only on own bets
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='bets'
      and policyname='bets_crud_own'
  ) then
    execute $sql$
      create policy bets_crud_own
      on public.bets
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
    $sql$;
  end if;
end$$;

-- bet_selections: CRUD only for selections belonging to own bets
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='bet_selections'
      and policyname='bet_selections_crud_own'
  ) then
    execute $sql$
      create policy bet_selections_crud_own
      on public.bet_selections
      using (
        exists (
          select 1 from public.bets b
          where b.id = bet_id and b.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1 from public.bets b
          where b.id = bet_id and b.user_id = auth.uid()
        )
      );
    $sql$;
  end if;
end$$;

-- leagues: readable by any authenticated user; writes restricted (service role only)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='leagues'
      and policyname='leagues_select_all_auth'
  ) then
    execute $sql$
      create policy leagues_select_all_auth
      on public.leagues
      for select
      using (auth.role() = 'authenticated');
    $sql$;
  end if;
end$$;

-- match_odds_cache: read for all authenticated; writes by service role only
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='match_odds_cache'
      and policyname='odds_cache_select_all_auth'
  ) then
    execute $sql$
      create policy odds_cache_select_all_auth
      on public.match_odds_cache
      for select
      using (auth.role() = 'authenticated');
    $sql$;
  end if;
end$$;

-- weekly_performance: read own or same league
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='weekly_performance'
      and policyname='weekly_perf_select_own_or_same_league'
  ) then
    execute $sql$
      create policy weekly_perf_select_own_or_same_league
      on public.weekly_performance
      for select
      using (
        user_id = auth.uid()
        or league_id is not distinct from public.get_current_user_league_id()
      );
    $sql$;
  end if;
end$$;

-- OPTIONAL: forbid writes to leagues, match_odds_cache, weekly_performance from anon/auth roles.
-- Supabase RLS is deny-by-default; if you’ve only created SELECT policies above, writes are already blocked.

-- ---------- FINAL NOTES ----------
-- If your app relies on additional RPCs (e.g., place_combo_bet, update_combo_bet_status),
-- keep those migrations in /supabase/migrations for now.
-- After this baseline is live and previews are green, we can fold those RPCs into a second guarded baseline file.
