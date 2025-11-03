-- Add league_id column to news table for league-specific announcements
ALTER TABLE IF EXISTS public.news
  ADD COLUMN IF NOT EXISTS league_id bigint;

-- Ensure existing rows default to 0 (global news)
UPDATE public.news
SET league_id = 0
WHERE league_id IS NULL;

-- Set default and not-null constraint
ALTER TABLE IF EXISTS public.news
  ALTER COLUMN league_id SET DEFAULT 0,
  ALTER COLUMN league_id SET NOT NULL;

-- Add index to speed up league-filtered queries
CREATE INDEX IF NOT EXISTS news_league_id_idx ON public.news (league_id);

-- Document that 0 represents global news
COMMENT ON COLUMN public.news.league_id IS 'League identifier for the news item. 0 indicates the news is visible to all leagues.';

-- Function to generate weekly news about blocked matches per league
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
    news_body := NULL;
    bullet_lines := '';
    league_name := COALESCE(league_record.name, 'Liga sin nombre');

    FOR block_record IN
      SELECT
        blocker.username AS blocker_name,
        blocked.username AS blocked_name,
        COALESCE(
          mr.match_name,
          CASE
            WHEN mr.home_team IS NOT NULL AND mr.away_team IS NOT NULL THEN mr.home_team || ' vs ' || mr.away_team
            ELSE 'Partido ' || b.fixture_id::text
          END
        ) AS match_name
      FROM public.match_blocks b
      LEFT JOIN public.profiles blocker ON blocker.id = b.blocker_user_id
      LEFT JOIN public.profiles blocked ON blocked.id = b.blocked_user_id
      LEFT JOIN public.match_results mr ON mr.fixture_id = b.fixture_id
        AND mr.league_id = b.league_id
      WHERE b.league_id = league_record.id
        AND b.week = league_record.week
        AND b.status = 'active'
      ORDER BY blocker_name, match_name, blocked_name
    LOOP
      match_title := COALESCE(block_record.match_name, 'Partido ' || league_record.id::text);
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

