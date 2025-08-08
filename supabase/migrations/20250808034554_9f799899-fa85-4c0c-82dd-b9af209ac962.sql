-- Create profile for the current user
INSERT INTO public.profiles (id, username, weekly_budget, total_points, league_id) 
VALUES ('a37e71d0-a60d-4efa-a4b0-e2ec448cd199', 'fvelazquezb', 1000, 250, 1) 
ON CONFLICT (id) DO UPDATE SET 
  username = EXCLUDED.username, 
  league_id = EXCLUDED.league_id, 
  total_points = EXCLUDED.total_points;