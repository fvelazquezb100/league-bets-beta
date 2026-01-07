import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { MatchData } from '@/hooks/useMatchOdds';

const LIVE_SUPERCOPA_CURRENT_CACHE_ID = 9;

type CacheRow = {
  data: any;
  last_updated: string | null;
};

export function useLiveSupercopaCache() {
  const queryClient = useQueryClient();
  const [realtimeReady, setRealtimeReady] = useState(false);

  // Subscribe to cache updates so clients refresh instantly (no polling needed).
  useEffect(() => {
    const channel = supabase
      .channel('match-odds-cache-live-supercopa')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_odds_cache',
          filter: `id=eq.${LIVE_SUPERCOPA_CURRENT_CACHE_ID}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['live-odds-cache', 'supercopa'] });
        },
      )
      .subscribe((status) => {
        setRealtimeReady(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const query = useQuery({
    queryKey: ['live-odds-cache', 'supercopa'],
    queryFn: async (): Promise<{ matches: MatchData[]; lastUpdated: string | null }> => {
      const { data, error } = await supabase
        .from('match_odds_cache')
        .select('data, last_updated')
        .eq('id', LIVE_SUPERCOPA_CURRENT_CACHE_ID)
        .maybeSingle();
      if (error) throw error;
      const row = data as CacheRow | null;
      const matches = Array.isArray(row?.data?.response) ? (row!.data.response as MatchData[]) : [];
      return { matches, lastUpdated: row?.last_updated ?? null };
    },
    // Fallback polling if realtime isn't available for some reason
    staleTime: 0,
    refetchInterval: realtimeReady ? false : 20_000,
    refetchIntervalInBackground: true,
    retry: 1,
  });

  const result = useMemo(
    () => ({
      ...query,
      matches: query.data?.matches ?? [],
      lastUpdated: query.data?.lastUpdated ?? null,
    }),
    [query],
  );

  return result;
}


