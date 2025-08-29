-- Add RLS policy to allow authenticated users to view match results
CREATE POLICY "Users can view match results" ON match_results
FOR SELECT TO authenticated
USING (true);