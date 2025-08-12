-- Drop the insecure policy that allows all users to view all leagues
DROP POLICY IF EXISTS "Public can view leagues" ON public.leagues;

-- Create a secure policy that only allows users to view leagues they belong to
CREATE POLICY "Users can only view their own league" 
ON public.leagues 
FOR SELECT 
USING (
  -- User can only see the league they belong to
  id = (
    SELECT league_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Allow users to insert leagues (for creating new leagues)
CREATE POLICY "Users can create leagues" 
ON public.leagues 
FOR INSERT 
WITH CHECK (true);

-- Allow updates only for leagues the user belongs to (future functionality)
CREATE POLICY "Users can update their own league" 
ON public.leagues 
FOR UPDATE 
USING (
  id = (
    SELECT league_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
) 
WITH CHECK (
  id = (
    SELECT league_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);