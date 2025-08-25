-- First, check if budget column exists and add it if missing (this will fail silently if it exists)
ALTER TABLE public.leagues ADD COLUMN IF NOT EXISTS budget integer DEFAULT 1000;

-- Ensure all columns exist with proper defaults
ALTER TABLE public.leagues ADD COLUMN IF NOT EXISTS min_bet numeric DEFAULT 1;
ALTER TABLE public.leagues ADD COLUMN IF NOT EXISTS max_bet numeric DEFAULT 1000;
ALTER TABLE public.leagues ADD COLUMN IF NOT EXISTS reset_budget text DEFAULT 'weekly';