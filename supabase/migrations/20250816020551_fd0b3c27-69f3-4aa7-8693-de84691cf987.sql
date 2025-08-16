-- Allow league members to view each other's settled and frozen bets
CREATE POLICY "League members can view others settled and frozen bets" 
ON public.bets 
FOR SELECT 
USING (
  -- Always allow users to see their own bets
  user_id = auth.uid() 
  OR 
  -- Allow league members to see other members' bets that are:
  -- 1. Won or lost (settled)
  -- 2. Pending but within 15 minutes of kickoff (frozen)
  (
    -- Check if the viewer is in the same league as the bet owner
    (SELECT league_id FROM public.profiles WHERE id = auth.uid()) = 
    (SELECT league_id FROM public.profiles WHERE id = user_id)
    AND
    (
      -- Show won/lost bets
      status IN ('won', 'lost')
      OR
      -- Show frozen pending bets (within 15 minutes of kickoff)
      (
        status = 'pending'
        AND (
          -- For single bets, check fixture kickoff time
          (bet_type = 'single' AND fixture_id IS NOT NULL AND
           EXISTS (
             SELECT 1 FROM public.match_odds_cache
             WHERE id = 1 
             AND jsonb_extract_path_text(data, 'response') IS NOT NULL
             AND EXISTS (
               SELECT 1 
               FROM jsonb_array_elements(data->'response') AS match
               WHERE (match->'fixture'->>'id')::integer = fixture_id
               AND (match->'fixture'->>'date')::timestamp with time zone <= now() + INTERVAL '15 minutes'
             )
           ))
          OR
          -- For combo bets, check if earliest fixture is within 15 minutes
          (bet_type = 'combo' AND
           EXISTS (
             SELECT 1 FROM public.bet_selections bs
             JOIN public.match_odds_cache moc ON moc.id = 1
             WHERE bs.bet_id = bets.id
             AND bs.fixture_id IS NOT NULL
             AND EXISTS (
               SELECT 1 
               FROM jsonb_array_elements(moc.data->'response') AS match
               WHERE (match->'fixture'->>'id')::integer = bs.fixture_id
               AND (match->'fixture'->>'date')::timestamp with time zone <= now() + INTERVAL '15 minutes'
             )
           ))
        )
      )
    )
  )
);

-- Allow league members to view bet selections for visible bets
CREATE POLICY "League members can view others bet selections for visible bets" 
ON public.bet_selections 
FOR SELECT 
USING (
  bet_id IN (
    SELECT id FROM public.bets 
    WHERE 
      -- Always allow users to see their own bet selections
      user_id = auth.uid() 
      OR 
      -- Allow league members to see selections for visible bets
      (
        (SELECT league_id FROM public.profiles WHERE id = auth.uid()) = 
        (SELECT league_id FROM public.profiles WHERE id = user_id)
        AND
        (
          status IN ('won', 'lost')
          OR
          (
            status = 'pending'
            AND (
              (bet_type = 'single' AND fixture_id IS NOT NULL AND
               EXISTS (
                 SELECT 1 FROM public.match_odds_cache
                 WHERE id = 1 
                 AND jsonb_extract_path_text(data, 'response') IS NOT NULL
                 AND EXISTS (
                   SELECT 1 
                   FROM jsonb_array_elements(data->'response') AS match
                   WHERE (match->'fixture'->>'id')::integer = fixture_id
                   AND (match->'fixture'->>'date')::timestamp with time zone <= now() + INTERVAL '15 minutes'
                 )
               ))
              OR
              (bet_type = 'combo' AND
               EXISTS (
                 SELECT 1 FROM public.bet_selections bs2
                 JOIN public.match_odds_cache moc ON moc.id = 1
                 WHERE bs2.bet_id = bets.id
                 AND bs2.fixture_id IS NOT NULL
                 AND EXISTS (
                   SELECT 1 
                   FROM jsonb_array_elements(moc.data->'response') AS match
                   WHERE (match->'fixture'->>'id')::integer = bs2.fixture_id
                   AND (match->'fixture'->>'date')::timestamp with time zone <= now() + INTERVAL '15 minutes'
                 )
               ))
            )
          )
        )
      )
  )
);