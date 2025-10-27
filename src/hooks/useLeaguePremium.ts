import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';

export const useIsPremiumLeague = () => {
  const { user } = useAuth();
  const { data: profile } = useUserProfile(user?.id);
  const leagueId = profile?.league_id ?? null;

  const { data: isPremium = false } = useQuery({
    queryKey: ['league-type', leagueId],
    enabled: !!leagueId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leagues')
        .select('type')
        .eq('id', leagueId)
        .maybeSingle();
      if (error) return false;
      return (data?.type === 'premium');
    },
    staleTime: 5 * 60 * 1000,
  });

  return isPremium;
};


