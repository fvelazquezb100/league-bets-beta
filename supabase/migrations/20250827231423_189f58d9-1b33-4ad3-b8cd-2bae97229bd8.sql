-- Add league_season column to leagues table if it doesn't exist
ALTER TABLE public.leagues 
ADD COLUMN IF NOT EXISTS league_season integer DEFAULT 1;

-- Also add previous_champion and previous_last columns if they don't exist
ALTER TABLE public.leagues 
ADD COLUMN IF NOT EXISTS previous_champion text;

ALTER TABLE public.leagues 
ADD COLUMN IF NOT EXISTS previous_last text;