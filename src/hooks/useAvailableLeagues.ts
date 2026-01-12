import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Fetch available leagues for user
const fetchAvailableLeagues = async (userId: string): Promise<number[]> => {
  try {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('league_id')
      .eq('id', userId)
      .single();
      
    if (profileError) throw profileError;
    
    const { data: leagueData, error: leagueError } = await supabase
      .from('leagues')
      .select('available_leagues')
      .eq('id', profileData.league_id)
      .single();
      
    if (leagueError) {
      // If column doesn't exist yet, use default leagues
      console.warn('available_leagues column not found, using default leagues');
      return [140, 2, 3, 262, 557, 143, 556];
    }
    
    return (leagueData as any)?.available_leagues || [140, 2, 3, 262, 557, 143, 556];
  } catch (error) {
    console.error('Error fetching available leagues:', error);
    // Default to all leagues if there's an error
    return [140, 2, 3, 262, 557, 143, 556];
  }
};

// Custom hook for available leagues
export const useAvailableLeagues = (userId?: string) => {
  return useQuery({
    queryKey: ['available-leagues', userId],
    queryFn: () => fetchAvailableLeagues(userId!),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes - rarely changes
    retry: 1, // Only retry once since we have fallback logic
  });
};
