-- Create bet_selections table for combo bet legs
CREATE TABLE public.bet_selections (
  id bigint NOT NULL DEFAULT nextval('public.bet_selections_id_seq'::regclass) PRIMARY KEY,
  bet_id bigint NOT NULL,
  fixture_id integer,
  market text,
  selection text,
  odds numeric,
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now()
);

-- Create sequence for bet_selections
CREATE SEQUENCE IF NOT EXISTS public.bet_selections_id_seq
  AS bigint
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

-- Set sequence ownership
ALTER SEQUENCE public.bet_selections_id_seq OWNED BY public.bet_selections.id;

-- Add foreign key constraint with CASCADE delete
ALTER TABLE public.bet_selections
ADD CONSTRAINT bet_selections_bet_id_fkey 
FOREIGN KEY (bet_id) REFERENCES public.bets(id) ON DELETE CASCADE;

-- Update bets table structure for combo bet support
ALTER TABLE public.bets 
ADD COLUMN bet_type text DEFAULT 'single';

-- Make existing columns nullable for combo bets
ALTER TABLE public.bets 
ALTER COLUMN fixture_id DROP NOT NULL,
ALTER COLUMN bet_selection DROP NOT NULL,
ALTER COLUMN odds DROP NOT NULL;

-- Enable RLS on bet_selections table
ALTER TABLE public.bet_selections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bet_selections
CREATE POLICY "Users can view their own bet selections" 
ON public.bet_selections 
FOR SELECT 
USING (bet_id IN (SELECT id FROM public.bets WHERE user_id = auth.uid()));

CREATE POLICY "Users can create their own bet selections" 
ON public.bet_selections 
FOR INSERT 
WITH CHECK (bet_id IN (SELECT id FROM public.bets WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own bet selections" 
ON public.bet_selections 
FOR UPDATE 
USING (bet_id IN (SELECT id FROM public.bets WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own bet selections" 
ON public.bet_selections 
FOR DELETE 
USING (bet_id IN (SELECT id FROM public.bets WHERE user_id = auth.uid()));