-- Add is_frozen column to news table
ALTER TABLE public.news ADD COLUMN is_frozen BOOLEAN NOT NULL DEFAULT false;