-- Add new global_role column for roles that are independent of leagues
ALTER TABLE public.profiles 
ADD COLUMN global_role text DEFAULT 'user' CHECK (global_role IN ('user', 'superadmin'));

-- Rename existing 'admin' role to 'admin_league' in the league-specific role column
UPDATE public.profiles 
SET role = 'admin_league' 
WHERE role = 'admin';

-- Update the role column constraint to use new names
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('user', 'admin_league'));

-- Create new security definer function for global roles
CREATE OR REPLACE FUNCTION public.get_current_user_global_role()
RETURNS TEXT AS $$
  SELECT global_role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Update existing role function to be more specific about league roles
CREATE OR REPLACE FUNCTION public.get_current_user_league_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Keep the original function for backward compatibility, but make it check league role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create function to check if user has superadmin privileges
CREATE OR REPLACE FUNCTION public.is_superadmin(user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND global_role = 'superadmin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create function to check if user has admin privileges (either superadmin or league admin)
CREATE OR REPLACE FUNCTION public.has_admin_privileges(user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id 
    AND (global_role = 'superadmin' OR role = 'admin_league')
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Update RLS policies to use the new role system
-- Update news table policies to allow both superadmin and league admins
DROP POLICY IF EXISTS "Admins can manage all news" ON public.news;
CREATE POLICY "Admins can manage all news" 
ON public.news 
FOR ALL 
USING (public.has_admin_privileges());

-- Add a more specific policy for superadmins to manage everything
CREATE POLICY "Superadmins can manage all news" 
ON public.news 
FOR ALL 
USING (public.is_superadmin());