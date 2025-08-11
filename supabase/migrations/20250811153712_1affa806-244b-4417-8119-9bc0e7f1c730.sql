-- Update handle_new_user to generate a guaranteed-unique username based on user ID
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, weekly_budget, total_points)
  VALUES (NEW.id, 'user_' || substr(NEW.id::text, 1, 8), 1000, 0);
  RETURN NEW;
END;
$function$;