-- 1) Add join_code to leagues with unique constraint
ALTER TABLE public.leagues
  ADD COLUMN IF NOT EXISTS join_code TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'leagues_join_code_key'
      AND conrelid = 'public.leagues'::regclass
  ) THEN
    ALTER TABLE public.leagues
      ADD CONSTRAINT leagues_join_code_key UNIQUE (join_code);
  END IF;
END$$;

-- 2) Create RPC: check_username_availability(username_to_check text)
-- Returns TRUE if the username already exists in profiles, FALSE otherwise
CREATE OR REPLACE FUNCTION public.check_username_availability(username_to_check text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.username = username_to_check
  );
$$;

-- Ensure execution permissions
GRANT EXECUTE ON FUNCTION public.check_username_availability(text) TO authenticated;

-- 3) Create RPC: create_league_and_join(user_id uuid, league_name text)
-- Creates a league with an 8-char alphanumeric join_code and assigns the user to it
CREATE OR REPLACE FUNCTION public.create_league_and_join(_user_id uuid, _league_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
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
      INSERT INTO public.leagues (name, join_code)
      VALUES (_league_name, code)
      RETURNING id INTO new_league_id;
      EXIT; -- success
    EXCEPTION WHEN unique_violation THEN
      -- Retry a few times if collision occurs
      IF attempts > 5 THEN
        RAISE;
      END IF;
    END;
  END LOOP;

  -- Assign user to the newly created league
  UPDATE public.profiles
  SET league_id = new_league_id
  WHERE id = _user_id;

  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_league_and_join(uuid, text) TO authenticated;

-- 4) Create RPC: join_league_with_code(user_id uuid, join_code text)
-- Joins the user to the league matching the provided join code. Returns TRUE if successful.
CREATE OR REPLACE FUNCTION public.join_league_with_code(_user_id uuid, _join_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  target_league_id bigint;
  joined boolean := false;
BEGIN
  -- Only allow the authenticated user to act on themselves
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  -- Find league by join code
  SELECT l.id INTO target_league_id
  FROM public.leagues l
  WHERE l.join_code = _join_code
  LIMIT 1;

  IF target_league_id IS NULL THEN
    RETURN false; -- no league found
  END IF;

  -- Update user's profile to join the league
  UPDATE public.profiles
  SET league_id = target_league_id
  WHERE id = _user_id;

  joined := true;
  RETURN joined;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_league_with_code(uuid, text) TO authenticated;