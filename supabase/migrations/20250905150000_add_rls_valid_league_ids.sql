-- ============================================================================
-- Add Row Level Security (RLS) to valid_league_ids table
-- ============================================================================
-- This migration adds RLS policies to the valid_league_ids reference table
-- following the same pattern as betting_settings:
-- - Everyone can read (it's a reference/catalog table)
-- - Only superadmins can modify (insert/update/delete)

-- Enable RLS on valid_league_ids table
ALTER TABLE public.valid_league_ids ENABLE ROW LEVEL SECURITY;

-- Policy 1: Everyone can read valid_league_ids (needed for frontend and validation functions)
CREATE POLICY "Anyone can read valid league IDs" 
ON public.valid_league_ids
FOR SELECT 
TO public
USING (true);

-- Policy 2: Only superadmins can insert/update/delete valid_league_ids
CREATE POLICY "Only superadmins can modify valid league IDs" 
ON public.valid_league_ids
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = (select auth.uid())
    AND global_role = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = (select auth.uid())
    AND global_role = 'superadmin'
  )
);
