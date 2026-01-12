import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type LiveFixtureConfig = {
  fixture_id: number;
  kickoff_time: string;
  home_team: string;
  away_team: string;
  league_id?: number;
  league_name?: string;
};

const SETTINGS_KEY = 'live_matches_selected';

export function useLiveMatchesConfig() {
  return useQuery({
    queryKey: ['betting-setting', SETTINGS_KEY],
    queryFn: async (): Promise<LiveFixtureConfig[]> => {
      const { data, error } = await supabase
        .from('betting_settings')
        .select('setting_value')
        .eq('setting_key', SETTINGS_KEY)
        .maybeSingle();
      if (error) throw error;
      const raw = (data as any)?.setting_value;
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    },
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}


