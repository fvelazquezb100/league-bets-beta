-- Simplify init_availability_on_new_league to use the immediate next Monday
-- instead of "today + 7 days + advance to Monday"
--
-- This ensures new leagues get availability from today until the next Monday (inclusive),
-- which aligns better with the weekly Tuesday reset cycle.
--
-- Examples:
--   Created on Thursday → Thu, Fri, Sat, Sun, Mon (5 days)
--   Created on Tuesday  → Tue, Wed, Thu, Fri, Sat, Sun, Mon (7 days)
--   Created on Monday   → Mon (1 day, reset happens next day)

CREATE OR REPLACE FUNCTION public.init_availability_on_new_league()
RETURNS trigger AS $$
DECLARE
  v_current_date DATE := CURRENT_DATE;
  v_next_monday DATE := CURRENT_DATE;
BEGIN
  -- Find the next Monday (or today if today is Monday)
  -- PostgreSQL DOW: 0=Sunday, 1=Monday, 2=Tuesday, ..., 6=Saturday
  WHILE EXTRACT(DOW FROM v_next_monday) != 1 LOOP
    v_next_monday := v_next_monday + INTERVAL '1 day';
  END LOOP;

  -- Insert or update availability for NEW league from today until next Monday (inclusive)
  PERFORM public.initialize_match_availability(
    v_current_date,
    v_next_monday,
    true,
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The trigger trg_init_availability_on_new_league already exists and 
-- will use this updated function automatically.
