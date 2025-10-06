-- Initialize 7 days of match availability (all true) when a new league is created

-- 1) Trigger function: init availability on new league insert
CREATE OR REPLACE FUNCTION public.init_availability_on_new_league()
RETURNS trigger AS $$
DECLARE
  v_current_date DATE := CURRENT_DATE;
  v_next_monday DATE := CURRENT_DATE + INTERVAL '1 week';
BEGIN
  -- Move v_next_monday to the next Monday
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

-- 2) Trigger on leagues table
DROP TRIGGER IF EXISTS trg_init_availability_on_new_league ON public.leagues;
CREATE TRIGGER trg_init_availability_on_new_league
AFTER INSERT ON public.leagues
FOR EACH ROW
EXECUTE FUNCTION public.init_availability_on_new_league();

-- 3) Add betting setting to enable Selecciones feature (default false)
INSERT INTO public.betting_settings (setting_key, setting_value, description)
VALUES ('enable_selecciones', 'false', 'Enable Selecciones view and features in app')
ON CONFLICT (setting_key) DO NOTHING;


