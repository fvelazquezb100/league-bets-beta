-- Fix search path for existing functions that lack proper security settings
CREATE OR REPLACE FUNCTION public.check_username_availability(username_to_check text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.username = username_to_check
  );
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_league_id()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT league_id FROM public.profiles WHERE id = auth.uid();
$$;