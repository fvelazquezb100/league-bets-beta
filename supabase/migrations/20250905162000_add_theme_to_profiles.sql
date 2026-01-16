-- ============================================================================
-- Add theme column to profiles table
-- ============================================================================
-- This migration adds a theme column to store user's preferred theme
-- Options: 'light' or 'dark'
-- Default: 'light'

-- Add theme column to profiles table with CHECK constraint
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'light' NOT NULL;

-- Add CHECK constraint to ensure theme is either 'light' or 'dark'
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_theme_check CHECK (theme IN ('light', 'dark'));

-- Add comment to explain the column
COMMENT ON COLUMN public.profiles.theme IS 'User preferred theme: light or dark. Default is light.';

-- Update existing profiles to have 'light' theme (they already have it due to DEFAULT, but ensuring consistency)
UPDATE public.profiles
SET theme = 'light'
WHERE theme IS NULL;

-- ============================================================================
-- Update legacy handle_new_user function to include theme
-- ============================================================================
-- This ensures that if the legacy function is used, it also sets the theme
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, theme)
  VALUES (NEW.id, 'user_' || substr(NEW.id::text, 1, 8), 'light')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
