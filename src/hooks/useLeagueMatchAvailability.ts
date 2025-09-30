import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeagueMatchAvailabilityData {
  date: string;
  is_live_betting_enabled: boolean;
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
const fetchLeagueMatchAvailability = async (leagueId: number): Promise<LeagueMatchAvailabilityData[]> => {
  try {
    const { data, error } = await supabase
      .from('match_availability_control')
      .select('date, is_live_betting_enabled')
      .eq('league_id', leagueId)
      .gte('date', new Date().toISOString().split('T')[0])
      .lte('date', getNextMonday())
      .order('date') as { data: { date: string; is_live_betting_enabled: boolean }[] | null; error: any };

    if (error) {
      console.warn('Failed to fetch league match availability:', error);
      return [];
    }

    return (data as LeagueMatchAvailabilityData[]) || [];
  } catch (error) {
    console.warn('Error fetching league match availability:', error);
    return [];
  }
};

// Toggle availability for a specific date and league
const toggleLeagueAvailability = async (leagueId: number, date: string, isEnabled: boolean): Promise<void> => {
  try {
    // First try to update existing record
    const { data: existingData, error: selectError } = await supabase
      .from('match_availability_control')
      .select('id')
      .eq('date', date)
      .eq('league_id', leagueId)
      .single() as { data: { id: number } | null; error: any };

    if (selectError && selectError.code !== 'PGRST116') {
      throw selectError;
    }

    let error;
    if (existingData) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('match_availability_control')
        .update({
          is_live_betting_enabled: isEnabled,
          updated_at: new Date().toISOString()
        })
        .eq('date', date)
        .eq('league_id', leagueId);
      error = updateError;
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('match_availability_control')
        .insert({
          date,
          is_live_betting_enabled: isEnabled,
          league_id: leagueId,
          updated_at: new Date().toISOString()
        });
      error = insertError;
    }

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error toggling league availability:', error);
    throw error;
  }
};

// Custom hook for league match availability
export const useLeagueMatchAvailability = (leagueId: number | null) => {
  return useQuery({
    queryKey: ['league-match-availability', leagueId],
    queryFn: () => fetchLeagueMatchAvailability(leagueId!),
    enabled: !!leagueId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

// Custom hook for toggling league availability
export const useToggleLeagueAvailability = (leagueId: number | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ date, isEnabled }: { date: string; isEnabled: boolean }) =>
      toggleLeagueAvailability(leagueId!, date, isEnabled),
    onSuccess: () => {
      // Invalidate and refetch league availability
      queryClient.invalidateQueries({
        queryKey: ['league-match-availability', leagueId]
      });
    },
  });
};

// Helper function to check if live betting is enabled for a specific date and league
export const isLeagueLiveBettingEnabled = (
  matchDate: string, 
  leagueId: number | null, 
  availabilityData: LeagueMatchAvailabilityData[]
): boolean => {
  try {
    // Validate inputs
    if (!matchDate || typeof matchDate !== 'string' || !leagueId) {
      return false;
    }
    
    const date = new Date(matchDate);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date provided to isLeagueLiveBettingEnabled:', matchDate);
      return false;
    }
    
    const dateStr = date.toISOString().split('T')[0];
    const availability = availabilityData.find(item => item.date === dateStr);
    return availability?.is_live_betting_enabled ?? false;
  } catch (error) {
    console.error('Error in isLeagueLiveBettingEnabled:', error, 'matchDate:', matchDate, 'leagueId:', leagueId);
    return false;
  }
};
