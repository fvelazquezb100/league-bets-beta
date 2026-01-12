import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WeekStatistics {
  week: number;
  totalWon: number;
  winPercentage: number;
  totalBets: number;
  wonBets: number;
}

// Fetch function for week statistics
const fetchWeekStatistics = async (leagueId: number): Promise<WeekStatistics[]> => {
  try {
    // Get current week from league
    const { data: leagueData, error: leagueError } = await supabase
      .from('leagues')
      .select('week')
      .eq('id', leagueId)
      .single();

    if (leagueError) throw leagueError;
    if (!leagueData?.week) return [];

    const currentWeek = leagueData.week;
    
    // Get all users in the league with their weekly_points_history
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, weekly_points_history')
      .eq('league_id', leagueId);

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) return [];

    // Get all user IDs
    const userIds = profiles.map(p => p.id);

    // Get all bets from league users grouped by week
    const userBatchSize = 1000;
    const pageSize = 1000;
    const allBetsData: any[] = [];
    
    // Process users in batches
    for (let userBatchIdx = 0; userBatchIdx < userIds.length; userBatchIdx += userBatchSize) {
      const userBatch = userIds.slice(userBatchIdx, userBatchIdx + userBatchSize);
      
      let hasMore = true;
      let page = 0;
      
      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        const { data: batchBets, error: betsError } = await supabase
          .from('bets')
          .select('id, week, status')
          .in('user_id', userBatch)
          .in('status', ['won', 'lost'])
          .not('week', 'eq', '0')
          .range(from, to);

        if (betsError) throw betsError;
        
        if (batchBets && batchBets.length > 0) {
          allBetsData.push(...batchBets);
          hasMore = batchBets.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }
    }

    // Generate all weeks from 1 to currentWeek - 1
    const weeks = Array.from({ length: currentWeek - 1 }, (_, i) => i + 1);
    
    // Calculate statistics for each week
    const weekStats: WeekStatistics[] = weeks.map(week => {
      const weekStr = week.toString();
      
      // Calculate total won from weekly_points_history
      let totalWon = 0;
      profiles.forEach(profile => {
        const weeklyHistory = profile.weekly_points_history as Record<string, number> | null;
        if (weeklyHistory && typeof weeklyHistory === 'object' && weeklyHistory[weekStr]) {
          totalWon += Number(weeklyHistory[weekStr]) || 0;
        }
      });

      // Calculate bets statistics for this week
      const weekBets = allBetsData.filter(bet => bet.week === weekStr);
      const wonBets = weekBets.filter(bet => bet.status === 'won');
      const totalBets = weekBets.length;
      const winPercentage = totalBets > 0 ? (wonBets.length / totalBets) * 100 : 0;

      return {
        week,
        totalWon,
        winPercentage,
        totalBets,
        wonBets: wonBets.length
      };
    });

    // Sort by week ascending (week 1 first)
    return weekStats.sort((a, b) => a.week - b.week);
  } catch (error) {
    console.warn('Error fetching week statistics:', error);
    throw error;
  }
};

// Custom hook for week statistics
export const useWeekStatistics = (leagueId: number | null) => {
  return useQuery({
    queryKey: ['week-statistics', leagueId],
    queryFn: () => fetchWeekStatistics(leagueId!),
    enabled: !!leagueId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
