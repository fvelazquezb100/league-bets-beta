import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeagueStanding {
  id: string;
  username: string;
  total_points: number;
  last_week_points: number;
  weekly_points?: number; // For filtered weeks
}

export interface WeekOption {
  week: string;
  label: string;
}

// Fetch function for league standings
const fetchLeagueStandings = async (leagueId: number, weekFilter?: string): Promise<LeagueStanding[]> => {
  try {
    if (weekFilter && weekFilter !== 'total') {
      // Get standings for specific week
      const { data, error } = await supabase
        .from('bets')
        .select(`
          user_id,
          payout,
          profiles!inner(
            id,
            username,
            league_id
          )
        `)
        .eq('profiles.league_id', leagueId)
        .eq('week', weekFilter)
        .eq('status', 'won');

      if (error) throw error;

      // Group by user and calculate weekly points
      const userPoints: { [key: string]: { username: string; points: number } } = {};
      
      data?.forEach((bet: any) => {
        const userId = bet.user_id;
        const username = bet.profiles.username;
        const payout = bet.payout || 0;
        
        if (!userPoints[userId]) {
          userPoints[userId] = { username, points: 0 };
        }
        userPoints[userId].points += payout;
      });

      // Get all users in the league to include those with 0 points
      const { data: allUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('league_id', leagueId);

      if (usersError) throw usersError;

      // Create standings array
      const standings: LeagueStanding[] = allUsers?.map(user => ({
        id: user.id,
        username: user.username,
        total_points: 0,
        last_week_points: 0,
        weekly_points: userPoints[user.id]?.points || 0
      })) || [];

      // Sort by weekly points descending
      return standings.sort((a, b) => (b.weekly_points || 0) - (a.weekly_points || 0));
    } else {
      // Get total standings (default)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, total_points, last_week_points')
        .eq('league_id', leagueId)
        .order('total_points', { ascending: false });

      if (error) throw error;

      return data?.map(profile => ({
        id: profile.id,
        username: profile.username,
        total_points: profile.total_points || 0,
        last_week_points: profile.last_week_points || 0
      })) || [];
    }
  } catch (error) {
    console.warn('Error fetching league standings:', error);
    throw error;
  }
};

// Fetch available weeks
const fetchAvailableWeeks = async (leagueId: number): Promise<WeekOption[]> => {
  try {
    // Get all unique weeks from bets in this league using a join
    const { data, error } = await supabase
      .from('bets')
      .select(`
        week,
        profiles!inner(league_id)
      `)
      .eq('profiles.league_id', leagueId)
      .not('week', 'is', null)
      .order('week', { ascending: false });

    if (error) throw error;

    // Get unique weeks and create options
    const uniqueWeeks = [...new Set(data?.map(bet => bet.week).filter(Boolean))];
    
    // Sort weeks numerically in descending order
    uniqueWeeks.sort((a, b) => Number(b) - Number(a));
    
    const weekOptions: WeekOption[] = [
      { week: 'total', label: 'Clasificación Total' }
    ];

    uniqueWeeks.forEach(week => {
      weekOptions.push({
        week,
        label: `Semana ${week}`
      });
    });

    return weekOptions;
  } catch (error) {
    console.warn('Error fetching available weeks:', error);
    return [{ week: 'total', label: 'Clasificación Total' }];
  }
};

// Custom hook for league standings
export const useLeagueStandings = (leagueId: number | null, weekFilter?: string) => {
  return useQuery({
    queryKey: ['league-standings', leagueId, weekFilter],
    queryFn: () => fetchLeagueStandings(leagueId!, weekFilter),
    enabled: !!leagueId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

// Custom hook for available weeks
export const useAvailableWeeks = (leagueId: number | null) => {
  return useQuery({
    queryKey: ['available-weeks', leagueId],
    queryFn: () => fetchAvailableWeeks(leagueId!),
    enabled: !!leagueId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
