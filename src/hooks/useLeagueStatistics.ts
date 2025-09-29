import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeagueStatistics {
  totalBets: number;
  totalWonBets: number;
  totalLostBets: number;
  winPercentage: number;
  totalStake: number;
  totalPayout: number;
  netProfit: number;
  mostPopularMarket: string;
  mostPopularMarketBets: number;
  mostPopularTeam: string;
  mostPopularTeamBets: number;
  topPlayerByWins: {
    username: string;
    wins: number;
  };
  topPlayerByWinRate: {
    username: string;
    winRate: number;
    totalBets: number;
  };
  topPlayerByBets: {
    username: string;
    bets: number;
  };
  topPlayerByBiggestWin: {
    username: string;
    biggestWin: number;
  };
  topPlayerByHighestOdds: {
    username: string;
    highestOdds: number;
  };
  averageOdds: number;
  totalPlayers: number;
}

// Fetch function for league statistics
const fetchLeagueStatistics = async (leagueId: number): Promise<LeagueStatistics> => {
  try {
    // Get all users in the league
    const { data: leagueUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('league_id', leagueId);

    if (usersError) throw usersError;

    const userIds = leagueUsers?.map(user => user.id) || [];
    if (userIds.length === 0) {
      return {
        totalBets: 0,
        totalWonBets: 0,
        totalLostBets: 0,
        winPercentage: 0,
        totalStake: 0,
        totalPayout: 0,
        netProfit: 0,
        mostPopularMarket: 'N/A',
        mostPopularMarketBets: 0,
        mostPopularTeam: 'N/A',
        mostPopularTeamBets: 0,
        topPlayerByWins: { username: 'N/A', wins: 0 },
        topPlayerByWinRate: { username: 'N/A', winRate: 0, totalBets: 0 },
        topPlayerByBets: { username: 'N/A', bets: 0 },
        topPlayerByBiggestWin: { username: 'N/A', biggestWin: 0 },
        topPlayerByHighestOdds: { username: 'N/A', highestOdds: 0 },
        averageOdds: 0,
        totalPlayers: 0
      };
    }

    // Get all bets from league users (excluding cancelled)
    const { data: allBets, error: betsError } = await supabase
      .from('bets')
      .select('id, user_id, stake, payout, odds, status, match_description')
      .in('user_id', userIds)
      .in('status', ['won', 'lost', 'pending']);

    if (betsError) throw betsError;

    // Get all bet selections for market analysis
    const { data: allSelections, error: selectionsError } = await supabase
      .from('bet_selections')
      .select('bet_id, market, selection, status, match_description')
      .in('bet_id', allBets?.map(bet => bet.id) || [])
      .in('status', ['won', 'lost', 'pending']);

    if (selectionsError) throw selectionsError;

    // Calculate basic statistics
    const settledBets = allBets?.filter(bet => bet.status === 'won' || bet.status === 'lost') || [];
    const wonBets = settledBets.filter(bet => bet.status === 'won');
    const lostBets = settledBets.filter(bet => bet.status === 'lost');

    const totalBets = settledBets.length;
    const totalWonBets = wonBets.length;
    const totalLostBets = lostBets.length;
    const winPercentage = totalBets > 0 ? (totalWonBets / totalBets) * 100 : 0;

    const totalStake = settledBets.reduce((sum, bet) => sum + (bet.stake || 0), 0);
    const totalPayout = wonBets.reduce((sum, bet) => sum + (bet.payout || 0), 0);
    const netProfit = totalPayout - totalStake;

    // Calculate average odds
    const averageOdds = settledBets.length > 0 
      ? settledBets.reduce((sum, bet) => sum + (bet.odds || 0), 0) / settledBets.length 
      : 0;

    // Find most popular market
    const marketCounts: { [key: string]: number } = {};
    allSelections?.forEach(selection => {
      if (selection.market) {
        marketCounts[selection.market] = (marketCounts[selection.market] || 0) + 1;
      }
    });
    const mostPopularMarket = Object.keys(marketCounts).reduce((a, b) => 
      marketCounts[a] > marketCounts[b] ? a : b, 'N/A'
    );
    const mostPopularMarketBets = marketCounts[mostPopularMarket] || 0;

    // Find most popular team (from match descriptions)
    const teamCounts: { [key: string]: number } = {};
    allBets?.forEach(bet => {
      if (bet.match_description) {
        // Extract team names from match description (format: "Team A vs Team B")
        const teams = bet.match_description.split(' vs ');
        teams.forEach(team => {
          const cleanTeam = team.trim();
          if (cleanTeam) {
            teamCounts[cleanTeam] = (teamCounts[cleanTeam] || 0) + 1;
          }
        });
      }
    });
    const mostPopularTeam = Object.keys(teamCounts).reduce((a, b) => 
      teamCounts[a] > teamCounts[b] ? a : b, 'N/A'
    );
    const mostPopularTeamBets = teamCounts[mostPopularTeam] || 0;

    // Find top player by wins
    const playerWins: { [key: string]: { username: string; wins: number } } = {};
    wonBets.forEach(bet => {
      const user = leagueUsers?.find(u => u.id === bet.user_id);
      if (user) {
        if (!playerWins[user.id]) {
          playerWins[user.id] = { username: user.username, wins: 0 };
        }
        playerWins[user.id].wins++;
      }
    });
    const topPlayerByWins = Object.values(playerWins).reduce((a, b) => 
      a.wins > b.wins ? a : b, { username: 'N/A', wins: 0 }
    );

    // Find top player by win rate (minimum 5 bets)
    const playerStats: { [key: string]: { username: string; wins: number; total: number } } = {};
    settledBets.forEach(bet => {
      const user = leagueUsers?.find(u => u.id === bet.user_id);
      if (user) {
        if (!playerStats[user.id]) {
          playerStats[user.id] = { username: user.username, wins: 0, total: 0 };
        }
        playerStats[user.id].total++;
        if (bet.status === 'won') {
          playerStats[user.id].wins++;
        }
      }
    });
    
    const topPlayerByWinRate = Object.values(playerStats)
      .filter(player => player.total >= 5)
      .reduce((a, b) => {
        const aRate = a.total > 0 ? a.wins / a.total : 0;
        const bRate = b.total > 0 ? b.wins / b.total : 0;
        return aRate > bRate ? a : b;
      }, { username: 'N/A', wins: 0, total: 0 });

    const topPlayerWinRate = topPlayerByWinRate.total > 0 
      ? (topPlayerByWinRate.wins / topPlayerByWinRate.total) * 100 
      : 0;

    // Find top player by number of bets
    const topPlayerByBets = Object.values(playerStats).reduce((a, b) => 
      a.total > b.total ? a : b, { username: 'N/A', wins: 0, total: 0 }
    );

    // Find top player by biggest win (payout)
    const playerBiggestWins: { [key: string]: { username: string; biggestWin: number } } = {};
    wonBets.forEach(bet => {
      const user = leagueUsers?.find(u => u.id === bet.user_id);
      if (user) {
        if (!playerBiggestWins[user.id]) {
          playerBiggestWins[user.id] = { username: user.username, biggestWin: 0 };
        }
        if ((bet.payout || 0) > playerBiggestWins[user.id].biggestWin) {
          playerBiggestWins[user.id].biggestWin = bet.payout || 0;
        }
      }
    });
    const topPlayerByBiggestWin = Object.values(playerBiggestWins).reduce((a, b) => 
      a.biggestWin > b.biggestWin ? a : b, { username: 'N/A', biggestWin: 0 }
    );

    // Find top player by highest odds win
    const playerHighestOdds: { [key: string]: { username: string; highestOdds: number } } = {};
    wonBets.forEach(bet => {
      const user = leagueUsers?.find(u => u.id === bet.user_id);
      if (user) {
        if (!playerHighestOdds[user.id]) {
          playerHighestOdds[user.id] = { username: user.username, highestOdds: 0 };
        }
        if ((bet.odds || 0) > playerHighestOdds[user.id].highestOdds) {
          playerHighestOdds[user.id].highestOdds = bet.odds || 0;
        }
      }
    });
    const topPlayerByHighestOdds = Object.values(playerHighestOdds).reduce((a, b) => 
      a.highestOdds > b.highestOdds ? a : b, { username: 'N/A', highestOdds: 0 }
    );

    return {
      totalBets,
      totalWonBets,
      totalLostBets,
      winPercentage,
      totalStake,
      totalPayout,
      netProfit,
      mostPopularMarket,
      mostPopularMarketBets,
      mostPopularTeam,
      mostPopularTeamBets,
      topPlayerByWins,
      topPlayerByWinRate: {
        username: topPlayerByWinRate.username,
        winRate: topPlayerWinRate,
        totalBets: topPlayerByWinRate.total
      },
      topPlayerByBets: {
        username: topPlayerByBets.username,
        bets: topPlayerByBets.total
      },
      topPlayerByBiggestWin,
      topPlayerByHighestOdds,
      averageOdds,
      totalPlayers: leagueUsers?.length || 0
    };
  } catch (error) {
    console.warn('Error fetching league statistics:', error);
    throw error;
  }
};

// Custom hook for league statistics
export const useLeagueStatistics = (leagueId: number | null) => {
  return useQuery({
    queryKey: ['league-statistics', leagueId],
    queryFn: () => fetchLeagueStatistics(leagueId!),
    enabled: !!leagueId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
};
