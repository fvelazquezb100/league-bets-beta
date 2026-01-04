import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types for match odds data
export interface Team {
  id: number;
  name: string;
  logo: string;
}

export interface Fixture {
  id: number;
  date: string;
}

export interface Teams {
  home: Team;
  away: Team;
  league_id?: number;
  league_name?: string;
}

export interface BetValue {
  value: string;
  odd: string;
}

export interface BetMarket {
  id: number;
  name: string;
  values: BetValue[];
}

export interface Bookmaker {
  id: number;
  name: string;
  bets: BetMarket[];
}

export interface League {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string;
  season: number;
  round: string;
}

export interface MatchData {
  fixture: Fixture;
  league: League;
  teams: Teams;
  bookmakers: Bookmaker[];
}

export interface CachedOddsData {
  response?: MatchData[];
}

// Fetch function for match odds.
// Id mapping:
// 1 = Ligas (current), 2 = Ligas (previous), 3 = Selecciones (current), 4 = Selecciones (previous), 
// 5 = Copa del Rey (current), 6 = Copa del Rey (previous), 7 = Supercopa España (current), 8 = Supercopa España (previous)
const fetchMatchOdds = async (sourceId: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 = 1): Promise<MatchData[]> => {
  const { data: cacheData, error: cacheError } = await supabase
    .from('match_odds_cache')
    .select('data')
    .eq('id', sourceId)
    .maybeSingle();

  if (cacheError) {
    throw new Error('Failed to fetch data from cache.');
  }

  if (!cacheData || !cacheData.data) {
    // Try to populate cache if empty
    // Selecciones (3,4), Copa del Rey (5,6) and Supercopa (7,8) use selecciones-cache function
    const functionName = (sourceId >= 3 && sourceId <= 8) 
      ? 'secure-run-update-selecciones-cache' 
      : 'secure-run-update-football-cache';
    const { error: populateError } = await supabase.functions.invoke(functionName);

    if (!populateError) {
      // Retry fetching after population
      const { data: newCacheData, error: retryError } = await supabase
        .from('match_odds_cache')
        .select('data')
        .eq('id', sourceId)
        .maybeSingle();

      if (!retryError && newCacheData && newCacheData.data) {
        const apiData = newCacheData.data as unknown as CachedOddsData;
        if (apiData && Array.isArray(apiData.response)) {
          return apiData.response.filter(match => match.fixture);
        }
      }
    }

    throw new Error('Cache is empty and auto-population failed. Please try refreshing the page.');
  }

  const apiData = cacheData.data as unknown as CachedOddsData;
  if (apiData && Array.isArray(apiData.response)) {
    return apiData.response.filter(match => match.fixture);
  }

  return [];
};

// Force update match odds cache
const updateMatchOdds = async () => {
  const { error } = await supabase.functions.invoke('secure-run-update-football-cache');
  if (error) throw error;
  return true;
};

// Custom hook for match odds (parameterized on sourceId)
export const useMatchOdds = (sourceId: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 = 1) => {
  return useQuery({
    queryKey: ['match-odds', sourceId],
    queryFn: () => fetchMatchOdds(sourceId),
    staleTime: 2 * 60 * 1000, // 2 minutes - odds don't change frequently
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Mutation for updating match odds
export const useUpdateMatchOdds = (sourceId: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 = 1) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Selecciones (3,4), Copa del Rey (5,6) and Supercopa (7,8) use selecciones-cache function
      if (sourceId >= 3 && sourceId <= 8) {
        const { error } = await supabase.functions.invoke('secure-run-update-selecciones-cache');
        if (error) throw error;
      } else {
        await updateMatchOdds();
      }
      return true;
    },
    onSuccess: () => {
      // Invalidate and refetch match odds
      queryClient.invalidateQueries({ queryKey: ['match-odds', sourceId] });
    },
  });
};
