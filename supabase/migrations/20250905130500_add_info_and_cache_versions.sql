-- Add an info column to describe the cache row purpose and contents
ALTER TABLE IF EXISTS public.match_odds_cache
ADD COLUMN IF NOT EXISTS info text;

-- Ensure rows for current and previous snapshots exist
-- 1: Leagues (current)
-- 2: Leagues (previous)
-- 3: Selecciones (current)
-- 4: Selecciones (previous)
INSERT INTO public.match_odds_cache (id, data, info)
VALUES
  (1, '{}'::jsonb, 'Leagues - current odds snapshot'),
  (2, '{}'::jsonb, 'Leagues - previous odds snapshot'),
  (3, '{}'::jsonb, 'Selecciones - current odds snapshot'),
  (4, '{}'::jsonb, 'Selecciones - previous odds snapshot'),
  (5, '{}'::jsonb, 'Copa del Rey - current odds snapshot'),
  (6, '{}'::jsonb, 'Copa del Rey - previous odds snapshot')
ON CONFLICT (id) DO NOTHING;


