-- Create or replace RPC to update league points by adding a delta to a user's total_points
CREATE OR REPLACE FUNCTION public.update_league_points(user_id uuid, points_to_add numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Add the specified points to the user's total_points, treating NULL as 0
  UPDATE public.profiles
  SET total_points = COALESCE(public.profiles.total_points, 0) + COALESCE(points_to_add, 0)
  WHERE id = user_id;
END;
$$;

-- Optional: comment for clarity
COMMENT ON FUNCTION public.update_league_points(uuid, numeric)
IS 'Adds points_to_add to profiles.total_points for the specified user_id. Intended to be called by Edge Functions with service role.';