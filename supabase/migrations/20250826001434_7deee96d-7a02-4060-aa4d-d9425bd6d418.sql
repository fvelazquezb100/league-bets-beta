-- Enable Row Level Security on backup tables
ALTER TABLE public.backup_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_bet_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_profiles_points ENABLE ROW LEVEL SECURITY;

-- Policies for backup_bets table
CREATE POLICY "Users can view their own backup bets" 
ON public.backup_bets 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Superadmins can view all backup bets" 
ON public.backup_bets 
FOR SELECT 
USING (is_superadmin());

CREATE POLICY "Service role can manage backup bets" 
ON public.backup_bets 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Policies for backup_bet_selections table
CREATE POLICY "Users can view their own backup bet selections" 
ON public.backup_bet_selections 
FOR SELECT 
USING (bet_id IN (
  SELECT id FROM public.backup_bets WHERE user_id = auth.uid()
));

CREATE POLICY "Superadmins can view all backup bet selections" 
ON public.backup_bet_selections 
FOR SELECT 
USING (is_superadmin());

CREATE POLICY "Service role can manage backup bet selections" 
ON public.backup_bet_selections 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Policies for backup_profiles_points table
CREATE POLICY "Users can view their own backup profile points" 
ON public.backup_profiles_points 
FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "Superadmins can view all backup profile points" 
ON public.backup_profiles_points 
FOR SELECT 
USING (is_superadmin());

CREATE POLICY "Service role can manage backup profile points" 
ON public.backup_profiles_points 
FOR ALL 
USING (true) 
WITH CHECK (true);