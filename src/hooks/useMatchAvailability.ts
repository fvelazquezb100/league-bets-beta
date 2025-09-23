import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MatchAvailabilityData {
  date: string;
  is_live_betting_enabled: boolean;
}

// Fetch function for match availability
const fetchMatchAvailability = async (): Promise<MatchAvailabilityData[]> => {
  try {
    const { data, error } = await supabase
      .from('match_availability_control' as any)
      .select('date, is_live_betting_enabled')
      .gte('date', new Date().toISOString().split('T')[0])
      .lte('date', new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('date');

    if (error) {
      console.warn('Failed to fetch match availability data:', error);
      return []; // Return empty array instead of throwing
    }

    return (data as any) || [];
  } catch (error) {
    console.warn('Error fetching match availability data:', error);
    return []; // Return empty array instead of throwing
  }
};

// Custom hook for match availability
export const useMatchAvailability = () => {
  return useQuery({
    queryKey: ['match-availability'],
    queryFn: fetchMatchAvailability,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

// Helper function to check if a specific date has live betting enabled
export const useIsLiveBettingEnabled = (date: string) => {
  const { data: availabilityData } = useMatchAvailability();
  
  const isEnabled = availabilityData?.find(item => item.date === date)?.is_live_betting_enabled ?? false;
  
  return isEnabled;
};

