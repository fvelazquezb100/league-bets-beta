-- Update generate_block_news to pull proper match names from match_results
CREATE OR REPLACE FUNCTION public.generate_block_news()
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
  FOR league_record IN
    SELECT id, name, week
    FROM public.leagues
  LOOP
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
  END LOOP;

  RETURN jsonb_build_object('inserted_news', inserted_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.generate_block_news() IS 'Generates league-specific news summarizing blocked matches for the current week.';

