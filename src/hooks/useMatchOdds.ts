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

export interface MatchData {
  fixture: Fixture;
  teams: Teams;
  bookmakers: Bookmaker[];
}

export interface CachedOddsData {
  response?: MatchData[];
}

// Fetch function for match odds
const fetchMatchOdds = async (): Promise<MatchData[]> => {
  const { data: cacheData, error: cacheError } = await supabase
    .from('match_odds_cache')
    .select('data')
    .maybeSingle();

  if (cacheError) {
    throw new Error('Failed to fetch data from cache.');
  }

  if (!cacheData || !cacheData.data) {
    // Try to populate cache if empty
    const { error: populateError } = await supabase.functions.invoke('secure-run-update-football-cache');
    
    if (!populateError) {
      // Retry fetching after population
      const { data: newCacheData, error: retryError } = await supabase
        .from('match_odds_cache')
        .select('data')
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

// Custom hook for match odds
export const useMatchOdds = () => {
  return useQuery({
    queryKey: ['match-odds'],
    queryFn: fetchMatchOdds,
    staleTime: 2 * 60 * 1000, // 2 minutes - odds don't change frequently
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Mutation for updating match odds
export const useUpdateMatchOdds = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateMatchOdds,
    onSuccess: () => {
      // Invalidate and refetch match odds
      queryClient.invalidateQueries({ queryKey: ['match-odds'] });
    },
  });
};
