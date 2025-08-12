-- First, create a security definer function to get the current user's league_id
-- This avoids the infinite recursion issue
CREATE OR REPLACE FUNCTION public.get_current_user_league_id()
RETURNS BIGINT AS $$
  SELECT league_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view own profile or league members" ON public.profiles;

-- Create a new policy using the security definer function
CREATE POLICY "Users can view own profile or league members" 
ON public.profiles 
FOR SELECT 
USING (
  -- User can view their own profile
  id = auth.uid() 
  OR 
  -- User can view profiles of users in the same league (if league_id is not NULL)
  (
    league_id IS NOT NULL 
    AND league_id = public.get_current_user_league_id()
  )
);