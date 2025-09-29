import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LastProcessedMatch {
  fixture_id: number;
  match_name: string;
  home_team: string;
  away_team: string;
  home_goals: number;
  away_goals: number;
  match_result: string;
  finished_at: string;
  league_id: number;
}

// Fetch function for last processed match
const fetchLastProcessedMatch = async (): Promise<LastProcessedMatch | null> => {
  try {
    const { data, error } = await supabase
      .from('match_results')
      .select('fixture_id, match_name, home_team, away_team, home_goals, away_goals, match_result, finished_at, league_id')
      .not('match_name', 'is', null)
      .order('finished_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null;
      }
      console.warn('Failed to fetch last processed match:', error);
      return null;
    }

    return data as LastProcessedMatch;
  } catch (error) {
    console.warn('Error fetching last processed match:', error);
    return null;
  }
};

// Custom hook for last processed match
export const useLastProcessedMatch = () => {
  return useQuery({
    queryKey: ['last-processed-match'],
    queryFn: fetchLastProcessedMatch,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};
