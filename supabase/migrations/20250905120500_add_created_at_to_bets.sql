-- Add created_at column to bets table
-- This migration adds the missing created_at column that the updated functions require
-- Created: 2025-09-05 12:05 UTC

-- Add created_at column to bets table
ALTER TABLE public.bets 
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Update existing records to have created_at timestamp
UPDATE public.bets 
SET created_at = now() 
WHERE created_at IS NULL;

-- Fix bet_selections sequence to prevent ID conflicts
-- Reset the sequence to the current maximum ID + 1
SELECT setval('public.bet_selections_id_seq', 
    COALESCE((SELECT MAX(id) FROM public.bet_selections), 0) + 1, 
    false);
