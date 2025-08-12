-- Drop the insecure policy that allows all authenticated users to view all profiles
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

-- Create a new secure policy that restricts profile visibility
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
    AND league_id = (
      SELECT league_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  )
);