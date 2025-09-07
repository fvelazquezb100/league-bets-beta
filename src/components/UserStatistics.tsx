import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, Target, DollarSign, Calendar, Trophy, Users, Zap, TrendingDown, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserStats {
  totalBets: number;
  totalStake: number;
  totalPayout: number;
  successRate: number;
  favoriteMarket: string;
  bestMarket: string;
  favoriteTeam: string;
  bestTeam: string;
  favoriteLeague: string;
  favoriteLeagueBets: number;
  stakeSuccessRate: number;
  biggestWin: number;
  biggestWinMatch: string;
  biggestWinResult: string;
  averageOdds: number;
  averageSelectionsPerCombo: number;
  biggestComboSelections: number;
  weeklyPerformance: Array<{
    week: string;
    profit: number;
    bets: number;
  }>;
  marketStats: Array<{
    market: string;
    bets: number;
    wins: number;
    stake: number;
    payout: number;
    successRate: number;
  }>;
  teamStats: Array<{
    team: string;
    bets: number;
    wins: number;
    stake: number;
    payout: number;
    successRate: number;
  }>;
}

interface UserStatisticsProps {
  isOpen: boolean;
  onClose: () => void;
}

type BetTypeFilter = 'all' | 'single' | 'combo';

export const UserStatistics = ({ isOpen, onClose }: UserStatisticsProps) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [betTypeFilter, setBetTypeFilter] = useState<BetTypeFilter>('all');
  const [matchResults, setMatchResults] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!user || !isOpen) return;
    fetchUserStats();
  }, [user, isOpen, betTypeFilter]);

  const fetchUserStats = async () => {
    try {
      // Only show main loading on initial load, not on filter changes
      if (!stats) {
        setLoading(true);
      } else {
        setFilterLoading(true);
      }
      
      // Fetch all user bets with selections
      const { data: betsData, error: betsError } = await supabase
        .from('bets')
        .select('*, bet_selections(*)')
        .eq('user_id', user.id)
        .order('id', { ascending: false });

      if (betsError) {
        console.error('Error fetching bets:', betsError);
        return;
      }

      if (!betsData) return;

      // Get all unique fixture_ids from bets and bet_selections
      const fixtureIds = new Set<number>();
      betsData.forEach((bet) => {
        if (bet.fixture_id) {
          fixtureIds.add(bet.fixture_id);
        }
        if (bet.bet_selections) {
          bet.bet_selections.forEach((selection: any) => {
            if (selection.fixture_id) {
              fixtureIds.add(selection.fixture_id);
            }
          });
        }
      });

      // Fetch match results and league info for these fixture_ids
      let resultsMap: Record<number, string> = {};
      let leagueMap: Record<number, number> = {};
      if (fixtureIds.size > 0) {
        try {
          const { data: resultsData } = await (supabase as any)
            .from('match_results')
            .select('fixture_id, match_result, league_id')
            .in('fixture_id', Array.from(fixtureIds));
          
          if (resultsData) {
            resultsData.forEach((result: any) => {
              resultsMap[result.fixture_id] = result.match_result;
              if (result.league_id) {
                leagueMap[result.fixture_id] = result.league_id;
              }
            });
          }
        } catch (error) {
          console.error('Error fetching match results:', error);
        }
      }

      setMatchResults(resultsMap);

      // Process statistics
      const processedStats = processUserStats(betsData, resultsMap, leagueMap);
      setStats(processedStats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
      setFilterLoading(false);
    }
  };

  const extractTeamFromMatch = (matchDescription: string): string | null => {
    if (!matchDescription) return null;
    const parts = matchDescription.split(' vs ');
    if (parts.length === 2) {
      return parts[0].trim();
    }
    return null;
  };

  const getLeagueName = (leagueId: number): string => {
    switch (leagueId) {
      case 140: return 'La Liga - Primera';
      case 2: return 'Champions League';
      case 3: return 'Europa League';
      default: return `Liga ${leagueId}`;
    }
  };

  const processUserStats = (bets: any[], matchResults: Record<number, string>, leagueMap: Record<number, number>): UserStats => {
    // Calculate total bets and stakes based on filter
    let totalBets = 0;
    let totalStake = 0;
    let totalPayout = 0;
    let wonBets = 0;
    let lostBets = 0;
    let settledBets = 0;

    if (betTypeFilter === 'single') {
      // Only single bets from bets table
      const singleBets = bets.filter(bet => bet.bet_type === 'single');
      totalBets = singleBets.length;
      totalStake = singleBets.reduce((sum, bet) => sum + (parseFloat(bet.stake) || 0), 0);
      totalPayout = singleBets.reduce((sum, bet) => sum + (bet.status === 'won' ? (parseFloat(bet.payout) || 0) : 0), 0);
      wonBets = singleBets.filter(bet => bet.status === 'won').length;
      lostBets = singleBets.filter(bet => bet.status === 'lost').length;
      settledBets = wonBets + lostBets;
    } else if (betTypeFilter === 'combo') {
      // Only combo bets (not individual selections)
      const comboBets = bets.filter(bet => bet.bet_type === 'combo');
      totalBets = comboBets.length;
      totalStake = comboBets.reduce((sum, bet) => sum + (parseFloat(bet.stake) || 0), 0);
      totalPayout = comboBets.filter(bet => bet.status === 'won').reduce((sum, bet) => sum + (parseFloat(bet.payout) || 0), 0);
      wonBets = comboBets.filter(bet => bet.status === 'won').length;
      lostBets = comboBets.filter(bet => bet.status === 'lost').length;
      settledBets = wonBets + lostBets;
    } else {
      // All bets: single bets from bets table + all bet_selections from combo bets
      const singleBets = bets.filter(bet => bet.bet_type === 'single');
      totalBets = singleBets.length;
      totalStake = singleBets.reduce((sum, bet) => sum + (parseFloat(bet.stake) || 0), 0);
      totalPayout = singleBets.reduce((sum, bet) => sum + (bet.status === 'won' ? (parseFloat(bet.payout) || 0) : 0), 0);
      wonBets = singleBets.filter(bet => bet.status === 'won').length;
      lostBets = singleBets.filter(bet => bet.status === 'lost').length;

      // Add bet_selections from combo bets
      bets.filter(bet => bet.bet_type === 'combo').forEach(bet => {
        if (bet.bet_selections) {
          bet.bet_selections.forEach((selection: any) => {
            totalBets++;
            if (selection.status === 'won') wonBets++;
            else if (selection.status === 'lost') lostBets++;
          });
        }
        // Add combo bet stake and payout to totals
        totalStake += parseFloat(bet.stake) || 0;
        if (bet.status === 'won') {
          totalPayout += parseFloat(bet.payout) || 0;
        }
      });

      settledBets = wonBets + lostBets;
    }

    const successRate = settledBets > 0 ? (wonBets / settledBets) * 100 : 0;

    // Market statistics
    const marketStats: Record<string, { bets: number; wins: number; stake: number; payout: number }> = {};
    const teamStats: Record<string, { bets: number; wins: number; stake: number; payout: number }> = {};
    const leagueStats: Record<string, { bets: number; wins: number; stake: number; payout: number }> = {};

    // Process statistics based on filter
    if (betTypeFilter === 'single') {
      // Only process single bets
      bets.filter(bet => bet.bet_type === 'single').forEach(bet => {
        if (bet.market_bets) {
          const market = bet.market_bets;
          const team = extractTeamFromMatch(bet.match_description);
          const leagueId = bet.fixture_id ? leagueMap[bet.fixture_id] : null;
          const league = leagueId ? getLeagueName(leagueId) : null;
          
          if (!marketStats[market]) {
            marketStats[market] = { bets: 0, wins: 0, stake: 0, payout: 0 };
          }
          marketStats[market].bets++;
          marketStats[market].stake += parseFloat(bet.stake) || 0;
          if (bet.status === 'won') {
            marketStats[market].wins++;
            marketStats[market].payout += parseFloat(bet.payout) || 0;
          }

          if (team) {
            if (!teamStats[team]) {
              teamStats[team] = { bets: 0, wins: 0, stake: 0, payout: 0 };
            }
            teamStats[team].bets++;
            teamStats[team].stake += parseFloat(bet.stake) || 0;
            if (bet.status === 'won') {
              teamStats[team].wins++;
              teamStats[team].payout += parseFloat(bet.payout) || 0;
            }
          }

          if (league) {
            if (!leagueStats[league]) {
              leagueStats[league] = { bets: 0, wins: 0, stake: 0, payout: 0 };
            }
            leagueStats[league].bets++;
            leagueStats[league].stake += parseFloat(bet.stake) || 0;
            if (bet.status === 'won') {
              leagueStats[league].wins++;
              leagueStats[league].payout += parseFloat(bet.payout) || 0;
            }
          }
        }
      });
    } else if (betTypeFilter === 'combo') {
      // Only process bet_selections from combo bets
      bets.filter(bet => bet.bet_type === 'combo').forEach(bet => {
        if (bet.bet_selections) {
          bet.bet_selections.forEach((selection: any) => {
            const market = selection.market || 'Unknown';
            const team = extractTeamFromMatch(selection.match_description);
            const leagueId = selection.fixture_id ? leagueMap[selection.fixture_id] : null;
            const league = leagueId ? getLeagueName(leagueId) : null;
            
            if (!marketStats[market]) {
              marketStats[market] = { bets: 0, wins: 0, stake: 0, payout: 0 };
            }
            marketStats[market].bets++;
            if (selection.status === 'won') {
              marketStats[market].wins++;
            }

            if (team) {
              if (!teamStats[team]) {
                teamStats[team] = { bets: 0, wins: 0, stake: 0, payout: 0 };
              }
              teamStats[team].bets++;
              if (selection.status === 'won') {
                teamStats[team].wins++;
              }
            }

            if (league) {
              if (!leagueStats[league]) {
                leagueStats[league] = { bets: 0, wins: 0, stake: 0, payout: 0 };
              }
              leagueStats[league].bets++;
              if (selection.status === 'won') {
                leagueStats[league].wins++;
              }
            }
          });
        }
      });
    } else {
      // Process both single bets and bet_selections from combo bets
      // Single bets
      bets.filter(bet => bet.bet_type === 'single').forEach(bet => {
        if (bet.market_bets) {
          const market = bet.market_bets;
          const team = extractTeamFromMatch(bet.match_description);
          const leagueId = bet.fixture_id ? leagueMap[bet.fixture_id] : null;
          const league = leagueId ? getLeagueName(leagueId) : null;
          
          if (!marketStats[market]) {
            marketStats[market] = { bets: 0, wins: 0, stake: 0, payout: 0 };
          }
          marketStats[market].bets++;
          marketStats[market].stake += parseFloat(bet.stake) || 0;
          if (bet.status === 'won') {
            marketStats[market].wins++;
            marketStats[market].payout += parseFloat(bet.payout) || 0;
          }

          if (team) {
            if (!teamStats[team]) {
              teamStats[team] = { bets: 0, wins: 0, stake: 0, payout: 0 };
            }
            teamStats[team].bets++;
            teamStats[team].stake += parseFloat(bet.stake) || 0;
            if (bet.status === 'won') {
              teamStats[team].wins++;
              teamStats[team].payout += parseFloat(bet.payout) || 0;
            }
          }

          if (league) {
            if (!leagueStats[league]) {
              leagueStats[league] = { bets: 0, wins: 0, stake: 0, payout: 0 };
            }
            leagueStats[league].bets++;
            leagueStats[league].stake += parseFloat(bet.stake) || 0;
            if (bet.status === 'won') {
              leagueStats[league].wins++;
              leagueStats[league].payout += parseFloat(bet.payout) || 0;
            }
          }
        }
      });

      // Bet_selections from combo bets
      bets.filter(bet => bet.bet_type === 'combo').forEach(bet => {
        if (bet.bet_selections) {
          bet.bet_selections.forEach((selection: any) => {
            const market = selection.market || 'Unknown';
            const team = extractTeamFromMatch(selection.match_description);
            const leagueId = selection.fixture_id ? leagueMap[selection.fixture_id] : null;
            const league = leagueId ? getLeagueName(leagueId) : null;
            
            if (!marketStats[market]) {
              marketStats[market] = { bets: 0, wins: 0, stake: 0, payout: 0 };
            }
            marketStats[market].bets++;
            if (selection.status === 'won') {
              marketStats[market].wins++;
            }

            if (team) {
              if (!teamStats[team]) {
                teamStats[team] = { bets: 0, wins: 0, stake: 0, payout: 0 };
              }
              teamStats[team].bets++;
              if (selection.status === 'won') {
                teamStats[team].wins++;
              }
            }

            if (league) {
              if (!leagueStats[league]) {
                leagueStats[league] = { bets: 0, wins: 0, stake: 0, payout: 0 };
              }
              leagueStats[league].bets++;
              if (selection.status === 'won') {
                leagueStats[league].wins++;
              }
            }
          });
        }
      });
    }

    // Calculate success rates for markets and teams
    const marketStatsArray = Object.entries(marketStats).map(([market, data]) => ({
      market,
      ...data,
      successRate: data.bets > 0 ? (data.wins / data.bets) * 100 : 0
    })).sort((a, b) => b.successRate - a.successRate);

    const teamStatsArray = Object.entries(teamStats).map(([team, data]) => ({
      team,
      ...data,
      successRate: data.bets > 0 ? (data.wins / data.bets) * 100 : 0
    })).sort((a, b) => {
      // First sort by success rate (descending)
      if (b.successRate !== a.successRate) {
        return b.successRate - a.successRate;
      }
      // If success rates are equal, sort by number of bets (descending)
      return b.bets - a.bets;
    });

    // Find favorites and best performers - only if we have data
    const favoriteMarket = marketStatsArray.length > 0 
      ? marketStatsArray.reduce((prev, current) => prev.bets > current.bets ? prev : current)
      : { market: 'N/A', bets: 0, wins: 0, stake: 0, payout: 0, successRate: 0 };

    const bestMarket = marketStatsArray.length > 0 
      ? marketStatsArray.reduce((prev, current) => prev.successRate > current.successRate ? prev : current)
      : { market: 'N/A', bets: 0, wins: 0, stake: 0, payout: 0, successRate: 0 };

    const favoriteTeam = teamStatsArray.length > 0 
      ? teamStatsArray.reduce((prev, current) => prev.bets > current.bets ? prev : current)
      : { team: 'N/A', bets: 0, wins: 0, stake: 0, payout: 0, successRate: 0 };

    const bestTeam = teamStatsArray.length > 0 
      ? teamStatsArray.reduce((prev, current) => prev.successRate > current.successRate ? prev : current)
      : { team: 'N/A', bets: 0, wins: 0, stake: 0, payout: 0, successRate: 0 };

    // Calculate favorite league
    const leagueStatsArray = Object.entries(leagueStats).map(([league, data]) => ({
      league,
      ...data,
      successRate: data.bets > 0 ? (data.wins / data.bets) * 100 : 0
    })).sort((a, b) => b.bets - a.bets);

    const favoriteLeague = leagueStatsArray.length > 0 
      ? leagueStatsArray[0]
      : { league: 'N/A', bets: 0, wins: 0, stake: 0, payout: 0, successRate: 0 };

    // Calculate stake-based success rate
    let wonBetsStake = 0;
    let lostBetsStake = 0;
    
    if (betTypeFilter === 'single') {
      const singleBets = bets.filter(bet => bet.bet_type === 'single');
      wonBetsStake = singleBets.filter(bet => bet.status === 'won').reduce((sum, bet) => sum + (parseFloat(bet.stake) || 0), 0);
      lostBetsStake = singleBets.filter(bet => bet.status === 'lost').reduce((sum, bet) => sum + (parseFloat(bet.stake) || 0), 0);
    } else if (betTypeFilter === 'combo') {
      const comboBets = bets.filter(bet => bet.bet_type === 'combo');
      wonBetsStake = comboBets.filter(bet => bet.status === 'won').reduce((sum, bet) => sum + (parseFloat(bet.stake) || 0), 0);
      lostBetsStake = comboBets.filter(bet => bet.status === 'lost').reduce((sum, bet) => sum + (parseFloat(bet.stake) || 0), 0);
    } else {
      // All bets: single + combo stakes
      const singleBets = bets.filter(bet => bet.bet_type === 'single');
      const comboBets = bets.filter(bet => bet.bet_type === 'combo');
      wonBetsStake = singleBets.filter(bet => bet.status === 'won').reduce((sum, bet) => sum + (parseFloat(bet.stake) || 0), 0) +
                    comboBets.filter(bet => bet.status === 'won').reduce((sum, bet) => sum + (parseFloat(bet.stake) || 0), 0);
      lostBetsStake = singleBets.filter(bet => bet.status === 'lost').reduce((sum, bet) => sum + (parseFloat(bet.stake) || 0), 0) +
                     comboBets.filter(bet => bet.status === 'lost').reduce((sum, bet) => sum + (parseFloat(bet.stake) || 0), 0);
    }
    
    const totalSettledStake = wonBetsStake + lostBetsStake;
    const stakeSuccessRate = totalSettledStake > 0 ? (wonBetsStake / totalSettledStake) * 100 : 0;

    // Calculate combo-specific metrics
    let averageSelectionsPerCombo = 0;
    let biggestComboSelections = 0;
    
    if (betTypeFilter === 'combo') {
      const comboBets = bets.filter(bet => bet.bet_type === 'combo');
      if (comboBets.length > 0) {
        const totalSelections = comboBets.reduce((sum, bet) => sum + (bet.bet_selections?.length || 0), 0);
        averageSelectionsPerCombo = totalSelections / comboBets.length;
        biggestComboSelections = Math.max(...comboBets.map(bet => bet.bet_selections?.length || 0));
      }
    }

    // Find biggest win with match details
    let biggestWin = 0;
    let biggestWinMatch = 'N/A';
    let biggestWinResult = '';
    
    if (betTypeFilter === 'single') {
      bets.filter(bet => bet.bet_type === 'single' && bet.status === 'won').forEach(bet => {
        const payout = parseFloat(bet.payout) || 0;
        if (payout > biggestWin) {
          biggestWin = payout;
          biggestWinMatch = bet.match_description || 'Partido no disponible';
          if (bet.fixture_id && matchResults[bet.fixture_id]) {
            biggestWinResult = matchResults[bet.fixture_id];
          }
        }
      });
    } else if (betTypeFilter === 'combo') {
      bets.filter(bet => bet.bet_type === 'combo' && bet.status === 'won').forEach(bet => {
        const payout = parseFloat(bet.payout) || 0;
        if (payout > biggestWin) {
          biggestWin = payout;
          biggestWinMatch = 'Apuesta Combinada';
          biggestWinResult = '';
        }
      });
    } else {
      // All bets: check both single and combo
      bets.filter(bet => bet.status === 'won').forEach(bet => {
        const payout = parseFloat(bet.payout) || 0;
        if (payout > biggestWin) {
          biggestWin = payout;
          if (bet.bet_type === 'single') {
            biggestWinMatch = bet.match_description || 'Partido no disponible';
            if (bet.fixture_id && matchResults[bet.fixture_id]) {
              biggestWinResult = matchResults[bet.fixture_id];
            }
          } else {
            biggestWinMatch = 'Apuesta Combinada';
            biggestWinResult = '';
          }
        }
      });
    }

    // Calculate average odds
    let totalOdds = 0;
    if (betTypeFilter === 'single') {
      totalOdds = bets.filter(bet => bet.bet_type === 'single').reduce((sum, bet) => sum + (parseFloat(bet.odds) || 0), 0);
    } else if (betTypeFilter === 'combo') {
      // For combo bets, we don't have individual odds in selections, so we use the combo bet odds
      totalOdds = bets.filter(bet => bet.bet_type === 'combo').reduce((sum, bet) => sum + (parseFloat(bet.odds) || 0), 0);
    } else {
      // All bets: single odds + combo odds
      totalOdds = bets.reduce((sum, bet) => sum + (parseFloat(bet.odds) || 0), 0);
    }
    const averageOdds = totalBets > 0 ? totalOdds / totalBets : 0;

    // Weekly performance
    const weeklyStats: Record<string, { profit: number; bets: number }> = {};
    
    if (betTypeFilter === 'single') {
      bets.filter(bet => bet.bet_type === 'single').forEach(bet => {
        const week = `Semana ${bet.week}`;
        if (!weeklyStats[week]) {
          weeklyStats[week] = { profit: 0, bets: 0 };
        }
        weeklyStats[week].bets++;
        if (bet.status === 'won') {
          weeklyStats[week].profit += (parseFloat(bet.payout) || 0) - (parseFloat(bet.stake) || 0);
        } else if (bet.status === 'lost') {
          weeklyStats[week].profit -= (parseFloat(bet.stake) || 0);
        }
      });
    } else if (betTypeFilter === 'combo') {
      bets.filter(bet => bet.bet_type === 'combo').forEach(bet => {
        const week = `Semana ${bet.week}`;
        if (!weeklyStats[week]) {
          weeklyStats[week] = { profit: 0, bets: 0 };
        }
        weeklyStats[week].bets++;
        if (bet.status === 'won') {
          weeklyStats[week].profit += (parseFloat(bet.payout) || 0) - (parseFloat(bet.stake) || 0);
        } else if (bet.status === 'lost') {
          weeklyStats[week].profit -= (parseFloat(bet.stake) || 0);
        }
      });
    } else {
      // All bets: single + combo
      bets.forEach(bet => {
        const week = `Semana ${bet.week}`;
        if (!weeklyStats[week]) {
          weeklyStats[week] = { profit: 0, bets: 0 };
        }
        weeklyStats[week].bets++;
        if (bet.status === 'won') {
          weeklyStats[week].profit += (parseFloat(bet.payout) || 0) - (parseFloat(bet.stake) || 0);
        } else if (bet.status === 'lost') {
          weeklyStats[week].profit -= (parseFloat(bet.stake) || 0);
        }
      });
    }

    const weeklyPerformance = Object.entries(weeklyStats).map(([week, data]) => ({
      week,
      ...data
    })).sort((a, b) => parseInt(a.week.split(' ')[1]) - parseInt(b.week.split(' ')[1]));

    return {
      totalBets,
      totalStake,
      totalPayout,
      successRate,
      favoriteMarket: favoriteMarket.market,
      bestMarket: bestMarket.market,
      favoriteTeam: favoriteTeam.team,
      bestTeam: bestTeam.team,
      favoriteLeague: favoriteLeague.league,
      favoriteLeagueBets: favoriteLeague.bets,
      stakeSuccessRate,
      biggestWin,
      biggestWinMatch,
      biggestWinResult,
      averageOdds,
      averageSelectionsPerCombo,
      biggestComboSelections,
      weeklyPerformance,
      marketStats: marketStatsArray,
      teamStats: teamStatsArray
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">Estadísticas Detalladas</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Cargando estadísticas...</div>
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Resumen General */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <BarChart3 className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                    <div className="text-2xl font-bold">{stats.totalBets}</div>
                    <div className="text-sm text-muted-foreground">Total Apuestas</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-500" />
                    <div className="text-2xl font-bold">{stats.totalStake.toFixed(0)}</div>
                    <div className="text-sm text-muted-foreground">Total Apostado</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                    <div className="text-2xl font-bold">{stats.totalPayout.toFixed(0)}</div>
                    <div className="text-sm text-muted-foreground">Total Ganado</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Target className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                    <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">% Acierto de Apuestas</div>
                  </CardContent>
                </Card>
              </div>

              {/* Filtros de Tipo de Apuesta */}
              <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 mb-6">
                <Button
                  className={`jambol-button px-4 sm:px-6 text-sm sm:text-base ${betTypeFilter === 'all' ? 'bg-[#FFC72C] text-[#2D2D2D]' : ''}`}
                  onClick={() => setBetTypeFilter('all')}
                >
                  Todas las Apuestas
                </Button>
                <Button
                  className={`jambol-button px-4 sm:px-6 text-sm sm:text-base ${betTypeFilter === 'single' ? 'bg-[#FFC72C] text-[#2D2D2D]' : ''}`}
                  onClick={() => setBetTypeFilter('single')}
                >
                  Apuestas Simples
                </Button>
                <Button
                  className={`jambol-button px-4 sm:px-6 text-sm sm:text-base ${betTypeFilter === 'combo' ? 'bg-[#FFC72C] text-[#2D2D2D]' : ''}`}
                  onClick={() => setBetTypeFilter('combo')}
                >
                  Apuestas Combinadas
                </Button>
              </div>

              {/* Indicador de carga del filtro */}
              {filterLoading && (
                <div className="flex justify-center mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    Actualizando estadísticas...
                  </div>
                </div>
              )}

              {/* Estadísticas Destacadas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {betTypeFilter === 'combo' ? (
                  // Tarjetas específicas para combinadas
                  <>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Award className="w-5 h-5 text-orange-500" />
                          Mercado Preferido
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-1">{stats.favoriteMarket}</div>
                        <div className="text-sm text-muted-foreground">
                          {stats.marketStats.find(m => m.market === stats.favoriteMarket)?.bets || 0} apuestas
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-green-500" />
                          Mejor Mercado
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-1">{stats.bestMarket}</div>
                        <div className="text-sm text-muted-foreground">
                          {stats.marketStats.find(m => m.market === stats.bestMarket)?.successRate.toFixed(1) || 0}% acierto
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-blue-500" />
                          Liga Favorita
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-1">{stats.favoriteLeague}</div>
                        <div className="text-sm text-muted-foreground">
                          {stats.favoriteLeagueBets} apuestas
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Users className="w-5 h-5 text-purple-500" />
                          Equipo Favorito
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-1">{stats.favoriteTeam}</div>
                        <div className="text-sm text-muted-foreground">
                          {stats.teamStats.find(t => t.team === stats.favoriteTeam)?.bets || 0} apuestas
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Target className="w-5 h-5 text-indigo-500" />
                          % Acierto Ganancia
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-1">{stats.stakeSuccessRate.toFixed(1)}%</div>
                        <div className="text-sm text-muted-foreground">Basado en stakes</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Zap className="w-5 h-5 text-yellow-500" />
                          Mayor Ganancia
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-1">{stats.biggestWin.toFixed(0)} pts</div>
                        <div className="text-sm text-muted-foreground">
                          {stats.biggestWinMatch}
                          {stats.biggestWinResult && (
                            <span className="text-xs"> ({stats.biggestWinResult})</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-cyan-500" />
                          Media de Apuestas en la Combinada
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-1">{stats.averageSelectionsPerCombo.toFixed(1)}</div>
                        <div className="text-sm text-muted-foreground">Apuestas por combinada</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-red-500" />
                          Mayor Combinada
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-1">{stats.biggestComboSelections}</div>
                        <div className="text-sm text-muted-foreground">Apuestas simples</div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  // Tarjetas para simples y todas las apuestas
                  <>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Award className="w-5 h-5 text-orange-500" />
                          Mercado Preferido
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-1">{stats.favoriteMarket}</div>
                        <div className="text-sm text-muted-foreground">
                          {stats.marketStats.find(m => m.market === stats.favoriteMarket)?.bets || 0} apuestas
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-green-500" />
                          Mejor Mercado
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-1">{stats.bestMarket}</div>
                        <div className="text-sm text-muted-foreground">
                          {stats.marketStats.find(m => m.market === stats.bestMarket)?.successRate.toFixed(1) || 0}% acierto
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-blue-500" />
                          Liga Favorita
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-1">{stats.favoriteLeague}</div>
                        <div className="text-sm text-muted-foreground">
                          {stats.favoriteLeagueBets} apuestas
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Users className="w-5 h-5 text-purple-500" />
                          Equipo Favorito
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-1">{stats.favoriteTeam}</div>
                        <div className="text-sm text-muted-foreground">
                          {stats.teamStats.find(t => t.team === stats.favoriteTeam)?.bets || 0} apuestas
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Target className="w-5 h-5 text-indigo-500" />
                          % Acierto Ganancia
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-1">{stats.stakeSuccessRate.toFixed(1)}%</div>
                        <div className="text-sm text-muted-foreground">Basado en stakes</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Zap className="w-5 h-5 text-yellow-500" />
                          Mayor Ganancia
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-1">{stats.biggestWin.toFixed(0)} pts</div>
                        <div className="text-sm text-muted-foreground">
                          {stats.biggestWinMatch}
                          {stats.biggestWinResult && (
                            <span className="text-xs"> ({stats.biggestWinResult})</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              {/* Estadísticas por Mercado */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Rendimiento por Mercado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.marketStats.slice(0, 5).map((market, index) => (
                      <div key={market.market} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{market.market}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{market.bets} apuestas</Badge>
                            <Badge variant={market.successRate >= 50 ? "default" : "secondary"}>
                              {market.successRate.toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                        <Progress value={market.successRate} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Estadísticas por Equipo */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Rendimiento por Equipo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.teamStats.slice(0, 5).map((team, index) => (
                      <div key={team.team} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{team.team}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{team.bets} apuestas</Badge>
                            <Badge variant={team.successRate >= 50 ? "default" : "secondary"}>
                              {team.successRate.toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                        <Progress value={team.successRate} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Rendimiento Semanal */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Rendimiento Semanal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.weeklyPerformance.map((week) => (
                      <div key={week.week} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <div className="font-medium">{week.week}</div>
                          <div className="text-sm text-muted-foreground">{week.bets} apuestas</div>
                        </div>
                        <div className={`text-lg font-bold ${week.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {week.profit >= 0 ? '+' : ''}{week.profit.toFixed(0)} pts
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay datos suficientes para mostrar estadísticas
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
