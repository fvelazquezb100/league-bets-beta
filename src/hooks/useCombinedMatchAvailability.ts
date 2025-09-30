import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CombinedMatchAvailabilityData {
  date: string;
  is_live_betting_enabled: boolean;
  source: 'global' | 'league';
}

// Helper function to get next Monday
const getNextMonday = (): string => {
  const today = new Date();
  const nextMonday = new Date(today);
  
  // Find next Monday
  const daysUntilMonday = (1 - today.getDay() + 7) % 7;
  nextMonday.setDate(today.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));
  
  return nextMonday.toISOString().split('T')[0];
};

// Fetch league-specific match availability
const fetchLeagueMatchAvailability = async (leagueId: number | null): Promise<CombinedMatchAvailabilityData[]> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const nextMonday = getNextMonday();
    
    // If no league specified, return empty array
    if (!leagueId) {
      return [];
    }

    // Fetch league-specific availability
    const { data: leagueData, error: leagueError } = await supabase
      .from('match_availability_control' as any)
      .select('date, is_live_betting_enabled')
      .eq('league_id', leagueId)
      .gte('date', today)
      .lte('date', nextMonday)
      .order('date');

    if (leagueError) {
      console.warn('Failed to fetch league match availability:', leagueError);
      return [];
    }

    return (leagueData || []).map((item: any) => ({
      ...item,
      source: 'league' as const
    }));
  } catch (error) {
    console.warn('Error fetching league match availability:', error);
    return [];
  }
};

// Custom hook for league match availability
export const useCombinedMatchAvailability = (leagueId: number | null) => {
  return useQuery({
    queryKey: ['league-match-availability', leagueId],
    queryFn: () => fetchLeagueMatchAvailability(leagueId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

// Helper function to check if live betting is enabled for a specific date and league
export const isCombinedLiveBettingEnabled = (
  matchDate: string, 
  leagueId: number | null, 
  availabilityData: CombinedMatchAvailabilityData[]
): boolean => {
  try {
    // Validate inputs
    if (!matchDate || typeof matchDate !== 'string' || !leagueId) {
      return false;
    }
    
    const date = new Date(matchDate);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date provided to isCombinedLiveBettingEnabled:', matchDate);
      return false;
    }
    
    const dateStr = date.toISOString().split('T')[0];
    const availability = availabilityData.find(item => item.date === dateStr);
    return availability?.is_live_betting_enabled ?? false;
  } catch (error) {
    console.error('Error in isCombinedLiveBettingEnabled:', error, 'matchDate:', matchDate, 'leagueId:', leagueId);
    return false;
  }
};
