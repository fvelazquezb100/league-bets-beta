import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const SETTINGS_KEY = 'live_matches_enabled';

export function useLiveMatchesEnabled() {
  return useQuery({
    queryKey: ['betting-setting', SETTINGS_KEY],
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from('betting_settings')
        .select('setting_value')
        .eq('setting_key', SETTINGS_KEY)
        .maybeSingle();
      if (error) throw error;
      return (((data as any)?.setting_value || 'false') === 'true');
    },
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}


