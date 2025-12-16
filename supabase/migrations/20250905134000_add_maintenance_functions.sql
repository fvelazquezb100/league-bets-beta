-- Create or replace function to enable maintenance mode (UPSERT)
CREATE OR REPLACE FUNCTION enable_maintenance()
RETURNS void AS $$
BEGIN
  INSERT INTO public.betting_settings (setting_key, setting_value, description, updated_at)
  VALUES ('system_maintenance_active', 'true', 'System Maintenance Active Flag', now())
  ON CONFLICT (setting_key)
  DO UPDATE SET
    setting_value = 'true',
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace function to disable maintenance mode (UPSERT)
CREATE OR REPLACE FUNCTION disable_maintenance()
RETURNS void AS $$
BEGIN
  INSERT INTO public.betting_settings (setting_key, setting_value, description, updated_at)
  VALUES ('system_maintenance_active', 'false', 'System Maintenance Active Flag', now())
  ON CONFLICT (setting_key)
  DO UPDATE SET
    setting_value = 'false',
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to authenticated users (SuperAdmins) and service_role (Cron Jobs)
GRANT EXECUTE ON FUNCTION enable_maintenance() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION disable_maintenance() TO authenticated, service_role;

-- Grant to anon just in case (optional, but requested in plan context "easy integration")
GRANT EXECUTE ON FUNCTION enable_maintenance() TO anon;
GRANT EXECUTE ON FUNCTION disable_maintenance() TO anon;

-- NEW FUNCTION: generate_block_news_for_league
-- Generates block news only for the specific league provided
CREATE OR REPLACE FUNCTION public.generate_block_news_for_league(target_league_id BIGINT)
RETURNS jsonb AS $$
DECLARE
  league_record RECORD;
  block_record RECORD;
  news_body text;
  bullet_lines text;
  inserted_count integer := 0;
  league_name text;
  match_title text;
BEGIN
  -- Get the specific league details
  SELECT id, name, week
  INTO league_record
  FROM public.leagues
  WHERE id = target_league_id;

  IF league_record IS NULL THEN
    RETURN jsonb_build_object('error', 'League not found');
  END IF;

  bullet_lines := '';
  league_name := COALESCE(league_record.name, 'Liga sin nombre');

  FOR block_record IN
    SELECT
      b.fixture_id,
      b.created_at,
      blocker.username AS blocker_name,
      blocked.username AS blocked_name,
      mr.match_name,
      mr.home_team,
      mr.away_team
    FROM public.match_blocks b
    LEFT JOIN public.profiles blocker ON blocker.id = b.blocker_user_id
    LEFT JOIN public.profiles blocked ON blocked.id = b.blocked_user_id
    LEFT JOIN public.match_results mr ON mr.fixture_id = b.fixture_id
    WHERE b.league_id = league_record.id
      AND b.week = league_record.week
      AND b.status = 'active'
    ORDER BY b.created_at, blocker_name, blocked_name
  LOOP
    match_title := COALESCE(
      block_record.match_name,
      CASE
        WHEN block_record.home_team IS NOT NULL AND block_record.away_team IS NOT NULL THEN
          block_record.home_team || ' vs ' || block_record.away_team
        ELSE
          'Partido ' || block_record.fixture_id::text
      END
    );

    bullet_lines := bullet_lines || format(
      E'- %s bloqueó el partido %s a %s\n',
      COALESCE(block_record.blocker_name, 'Un usuario'),
      match_title,
      COALESCE(block_record.blocked_name, 'otro usuario')
    );
  END LOOP;

  IF bullet_lines <> '' THEN
    bullet_lines := rtrim(bullet_lines, E'\n');
    news_body := format(
      'Estos son los partidos bloqueados de la semana %s en la liga %s:%s%s%s%s',
      league_record.week,
      league_name,
      E'\n\n',
      bullet_lines,
      E'\n\n',
      'Equipo Oficial de la Liga de Simulación Jambol'
    );

    INSERT INTO public.news (title, content, created_by, is_active, league_id)
    VALUES (
      format('Bloqueos semana %s', league_record.week),
      news_body,
      '00000000-0000-0000-0000-000000000000',
      true,
      league_record.id
    );

    inserted_count := inserted_count + 1;
  END IF;

  RETURN jsonb_build_object('inserted_news', inserted_count, 'league_id', target_league_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.generate_block_news_for_league(BIGINT) IS 'Generates news summarizing blocked matches for the current week for a specific league.';

GRANT EXECUTE ON FUNCTION generate_block_news_for_league(BIGINT) TO authenticated, service_role;
