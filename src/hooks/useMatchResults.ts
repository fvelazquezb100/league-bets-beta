import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types for match results
export interface MatchResult {
  fixture_id: number;
  match_result: string | null;
  kickoff_time?: string | null;
}

// Fetch match results for specific fixture IDs
const fetchMatchResults = async (fixtureIds: number[]): Promise<Record<number, MatchResult>> => {
  if (fixtureIds.length === 0) {
    return {};
  }

  const { data: resultsData, error } = await supabase
    .from('match_results')
    .select('fixture_id, match_result, kickoff_time')
    .in('fixture_id', fixtureIds);

  if (error) {
    throw new Error(`Failed to fetch match results: ${error.message}`);
  }

  // Convert to map for easy lookup
  const resultsMap: Record<number, MatchResult> = {};
  resultsData?.forEach((result) => {
    resultsMap[result.fixture_id] = result;
  });

  return resultsMap;
};

// Fetch kickoff times from match_odds_cache (fallback)
// Searches ALL rows in match_odds_cache to support multiple cache sources (leagues, selecciones, etc.)
const fetchKickoffTimes = async (fixtureIds: number[]): Promise<Record<number, Date>> => {
  if (fixtureIds.length === 0) {
    return {};
  }

  // Fetch ALL rows from match_odds_cache (not just id=1)
  const { data: cacheRows, error } = await supabase
    .from('match_odds_cache')
    .select('data');

  if (error || !cacheRows || cacheRows.length === 0) {
    return {};
  }

  const kickoffsMap: Record<number, Date> = {};
  
  // Iterate through all cache rows
  cacheRows.forEach((row) => {
    const data = row.data as any;
    if (data?.response) {
      data.response.forEach((match: any) => {
        if (match.fixture?.id && match.fixture?.date && fixtureIds.includes(match.fixture.id)) {
          kickoffsMap[match.fixture.id] = new Date(match.fixture.date);
        }
      });
    }
  });

  return kickoffsMap;
};

// Hook for match results
export const useMatchResults = (fixtureIds: number[]) => {
  return useQuery({
    queryKey: ['match-results', fixtureIds.sort()], // Sort for consistent cache key
    queryFn: () => fetchMatchResults(fixtureIds),
    enabled: fixtureIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes - results don't change once set
  });
};

// Hook for kickoff times (fallback)
export const useKickoffTimes = (fixtureIds: number[]) => {
  return useQuery({
    queryKey: ['kickoff-times', fixtureIds.sort()],
    queryFn: () => fetchKickoffTimes(fixtureIds),
    enabled: fixtureIds.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes - kickoff times are static
  });
};
