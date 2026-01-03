import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { PlayerBetHistory } from '@/components/PlayerBetHistory';
import { LeagueStatisticsModal } from '@/components/LeagueStatisticsModal';
import { useLeagueStatistics } from '@/hooks/useLeagueStatistics';
import { useLeagueStandings, useAvailableWeeks } from '@/hooks/useLeagueStandings';
import { useHistoricalStandings } from '@/hooks/useHistoricalStandings';
import { HistoricalStandingsModal } from '@/components/HistoricalStandingsModal';
import { Award, ArrowDown, BarChart3, Calendar, TrendingUp, Target, DollarSign, Ban } from 'lucide-react';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import { Button } from '@/components/ui/button';
import { BlockMatchesModal } from '@/components/BlockMatchesModal';
import { useUsersDonationStatus } from '@/hooks/useUserDonations';
import { PremiumUpgradeModal } from '@/components/PremiumUpgradeModal';
import { Crown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export const Clasificacion = () => {
  const { user } = useAuth();
  const { consent } = useCookieConsent();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [previousChampionName, setPreviousChampionName] = useState<string | null>(null);
  const [previousLastName, setPreviousLastName] = useState<string | null>(null);
  const [leagueName, setLeagueName] = useState<string>('Jambo');
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: string; name: string } | null>(null);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isLeagueStatsModalOpen, setIsLeagueStatsModalOpen] = useState(false);
  const [isHistoricalStandingsModalOpen, setIsHistoricalStandingsModalOpen] = useState(false);
  const [leagueId, setLeagueId] = useState<number | null>(null);
  const [leagueType, setLeagueType] = useState<'free' | 'premium' | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string>('total');
  const [showWeekFilter, setShowWeekFilter] = useState(false);
  const [playerStats, setPlayerStats] = useState<{ successRate: number; stakeSuccessRate: number } | null>(null);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

  // Get league statistics
  const { data: leagueStats, isLoading: statsLoading } = useLeagueStatistics(leagueId);
  
  // Get league standings with week filter
  const { data: standings, isLoading: standingsLoading } = useLeagueStandings(leagueId, selectedWeek);
  
  // Get available weeks
  const { data: availableWeeks, isLoading: weeksLoading } = useAvailableWeeks(leagueId);
  
  // Get historical standings data
  const { data: historicalStandings, isLoading: historicalLoading } = useHistoricalStandings(leagueId);

  // Get donation status for all users in standings
  const userIds = standings?.map((s: any) => s.id).filter(Boolean) || [];
  const { data: donationStatusMap } = useUsersDonationStatus(userIds);

  const fetchLeagueProfiles = async () => {
    if (!user) return;

    // Obtener el perfil del usuario actual
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('league_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!currentProfile?.league_id) {
      setProfiles([]);
      setLeagueId(null);
      return;
    }

    const leagueId = currentProfile.league_id;
    setLeagueId(leagueId);

    // Obtener todos los perfiles de la misma liga
    const { data: profilesData, error } = await supabase
      .from('profiles')
      .select('id, username, total_points, league_id, last_week_points')
      .eq('league_id', leagueId)
      .order('total_points', { ascending: false });

    if (error) {
      console.error('Error fetching league profiles:', error);
    } else {
      setProfiles(profilesData ?? []);
    }

    // Obtener datos de la liga para mostrar campeón, último, nombre y tipo
    const { data: leagueData, error: leagueError } = await supabase
      .from('leagues')
      .select('name, previous_champion, previous_last, type')
      .eq('id', leagueId)
      .single();

    if (leagueError) {
      console.error('Error fetching league data:', leagueError);
    } else {
      setLeagueName(leagueData?.name ?? 'Jambo');
      setPreviousChampionName(leagueData?.previous_champion ?? null);
      setPreviousLastName(leagueData?.previous_last ?? null);
      setLeagueType(leagueData?.type ?? null);
    }
  };

  useEffect(() => {
    fetchLeagueProfiles();
  }, [user]);

  useEffect(() => {
    const pageTitle = 'Jambol — Clasificación';
    const description = 'Consulta la clasificación actual de tu liga Jambol. Ve las posiciones de todos los jugadores, estadísticas y evolución histórica.';
    const keywords = 'jambol, clasificación, ranking, liga, posiciones, estadísticas, jugadores, puntos';

    document.title = pageTitle;

    const metaDefinitions = [
      {
        selector: 'meta[name="description"]',
        attributes: { name: 'description' },
        content: description,
      },
      {
        selector: 'meta[name="keywords"]',
        attributes: { name: 'keywords' },
        content: keywords,
      },
      {
        selector: 'meta[property="og:title"]',
        attributes: { property: 'og:title' },
        content: pageTitle,
      },
      {
        selector: 'meta[property="og:description"]',
        attributes: { property: 'og:description' },
        content: description,
      },
      {
        selector: 'meta[name="twitter:title"]',
        attributes: { name: 'twitter:title' },
        content: pageTitle,
      },
      {
        selector: 'meta[name="twitter:description"]',
        attributes: { name: 'twitter:description' },
        content: description,
      },
    ];

    const managedMeta = metaDefinitions.map(({ selector, attributes, content }) => {
      let element = document.querySelector(selector) as HTMLMetaElement | null;
      let created = false;

      if (!element) {
        element = document.createElement('meta');
        Object.entries(attributes).forEach(([attribute, value]) => {
          element?.setAttribute(attribute, value);
        });
        document.head.appendChild(element);
        created = true;
      }

      const previousContent = element.getAttribute('content') ?? undefined;
      element.setAttribute('content', content);

      return { element, previousContent, created };
    });

    return () => {
      managedMeta.forEach(({ element, previousContent, created }) => {
        if (created && element.parentNode) {
          element.parentNode.removeChild(element);
        } else if (!created && typeof previousContent === 'string') {
          element.setAttribute('content', previousContent);
        }
      });
    };
  }, []);

  useEffect(() => {
    if (!consent?.analytics) {
      return;
    }

    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = 'https://www.googletagmanager.com/gtag/js?id=G-N8SYMCJED4';
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-N8SYMCJED4');
    `;
    document.head.appendChild(script2);

    return () => {
      if (script1.parentNode) {
        script1.parentNode.removeChild(script1);
      }
      if (script2.parentNode) {
        script2.parentNode.removeChild(script2);
      }
    };
  }, [consent?.analytics]);

  // Close week filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showWeekFilter) {
        const target = event.target as Element;
        if (!target.closest('.week-filter-container')) {
          setShowWeekFilter(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showWeekFilter]);

  const handlePlayerClick = (profile: any) => {
    if (profile.id === user?.id) return;

    setSelectedPlayer({
      id: profile.id,
      name: profile.username || 'Usuario'
    });
    setIsPlayerModalOpen(true);
    
    // Fetch player statistics
    fetchPlayerStats(profile.id);
  };

  const fetchPlayerStats = async (playerId: string) => {
    try {
      // Fetch all bets for the player (won and lost)
      // Note: Supabase has a default limit of 1000 rows, so we need to use range() to get all rows
      const { data: betsData, error: betsError } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', playerId)
        .in('status', ['won', 'lost'])
        .not('week', 'eq', 0)
        .range(0, 999999); // Remove default 1000 limit

      if (betsError) {
        console.error('Error fetching player bets:', betsError);
        setPlayerStats(null);
        return;
      }

      if (!betsData || betsData.length === 0) {
        setPlayerStats({ successRate: 0, stakeSuccessRate: 0 });
        return;
      }

      // Calculate success rate (percentage of won bets)
      const wonBets = betsData.filter(bet => bet.status === 'won').length;
      const successRate = (wonBets / betsData.length) * 100;

      // Calculate stake-based success rate
      const totalStake = betsData.reduce((sum, bet) => sum + (parseFloat(String(bet.stake)) || 0), 0);
      const wonBetsStake = betsData
        .filter(bet => bet.status === 'won')
        .reduce((sum, bet) => sum + (parseFloat(String(bet.stake)) || 0), 0);
      
      const stakeSuccessRate = totalStake > 0 ? (wonBetsStake / totalStake) * 100 : 0;

      setPlayerStats({ successRate, stakeSuccessRate });
    } catch (error) {
      console.error('Error calculating player stats:', error);
      setPlayerStats(null);
    }
  };
  const openBlockModal = () => {
    setIsBlockModalOpen(true);
  };

  const closeBlockModal = () => {
    setIsBlockModalOpen(false);
  };

  useEffect(() => {
    if (!isPlayerModalOpen) {
      setIsBlockModalOpen(false);
    }
  }, [isPlayerModalOpen]);


  const closePlayerModal = () => {
    setIsPlayerModalOpen(false);
    setSelectedPlayer(null);
    setIsBlockModalOpen(false);
  };

  const toggleWeekFilter = () => {
    setShowWeekFilter(!showWeekFilter);
  };

  const openHistoricalModal = () => {
    setIsHistoricalStandingsModalOpen(true);
  };

  const openLeagueStatsModal = () => {
    setIsLeagueStatsModalOpen(true);
  };

  return (
    <div className="w-full px-2 sm:px-4 space-y-6 sm:space-y-8">
      <div className="text-center">
        <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-2 sm:mb-4">
          Clasificación de {leagueName}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">Posiciones actuales de todos los jugadores de la liga</p>
      </div>

      {/* League Standings Table */}
      <Card className="shadow-lg w-full -mx-2 sm:mx-0">
        <CardContent className="p-2 sm:p-6">
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs sm:text-sm">Pos.</TableHead>
                <TableHead className="text-xs sm:text-sm">Jugador</TableHead>
                <TableHead className="text-xs sm:text-sm">
                  {selectedWeek === 'total' ? 'Puntos Totales' : `Puntos de la Semana ${selectedWeek}`}
                </TableHead>
                {selectedWeek === 'total' && (
                  <TableHead className="text-xs sm:text-sm">Última Jornada</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {standingsLoading ? (
                <TableRow>
                  <TableCell colSpan={selectedWeek === 'total' ? 4 : 3} className="text-center py-8 text-muted-foreground">
                    Cargando clasificación...
                  </TableCell>
                </TableRow>
              ) : standings && standings.length > 0 ? (
                standings.map((profile, index) => (
                  <TableRow 
                    key={profile.id} 
                    className={`${profile.id === user?.id ? 'bg-muted/50' : ''} ${profile.id !== user?.id ? 'cursor-pointer hover:bg-muted/30 transition-colors' : ''}`}
                    onClick={() => handlePlayerClick(profile)}
                  >
                    <TableCell className="font-medium text-xs sm:text-sm">{index + 1}</TableCell>
                    <TableCell className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                      <span className="truncate">{profile.username || 'Usuario'}</span>
                      {donationStatusMap?.get(profile.id) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-yellow-500 flex-shrink-0 cursor-help">⭐</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Ha apoyado el proyecto</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {previousChampionName === profile.username && <Award className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 flex-shrink-0" />}
                      {previousLastName === profile.username && <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {selectedWeek === 'total' 
                        ? (Math.ceil(Number(profile.total_points ?? 0) * 10) / 10).toFixed(1)
                        : (Math.ceil(Number(profile.weekly_points ?? 0) * 10) / 10).toFixed(1)
                      }
                    </TableCell>
                    {selectedWeek === 'total' && (
                      <TableCell className="text-xs sm:text-sm">{(Number(profile.last_week_points ?? 0)).toFixed(1)}</TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={selectedWeek === 'total' ? 4 : 3} className="text-center py-8 text-muted-foreground">
                    No hay datos disponibles
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Cards Row - Desktop: 1/3 each, Mobile: stacked */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Historical Standings Card - Solo para ligas premium */}
        {leagueType === 'premium' && (
          <Card 
            className="cursor-pointer transition-all duration-200 hover:bg-primary/10 hover:border-primary/30"
            onClick={openHistoricalModal}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Evolución Histórica</p>
                  <p className="text-lg font-bold">Grafica historia por Semanas</p>
                  <p className="text-xs text-muted-foreground">Ver evolución de posiciones</p>
                </div>
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Week Filter and League Statistics - Solo para ligas premium */}
        {leagueId && leagueType === 'premium' && (
          <>
            {/* Week Filter Card */}
            <div className="relative week-filter-container">
              <Card 
                className="cursor-pointer transition-all duration-200 hover:bg-primary/10 hover:border-primary/30 h-full"
                onClick={toggleWeekFilter}
              >
                <CardContent className="p-4 h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Filtro por Semana</p>
                      <p className="text-lg font-bold">{selectedWeek === 'total' ? 'Clasificación Total' : `Semana ${selectedWeek}`}</p>
                      <p className="text-xs text-muted-foreground">Selecciona una semana</p>
                    </div>
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              
              {showWeekFilter && (
                <div className="absolute top-0 left-0 right-0 bg-background border rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    {(availableWeeks || []).map((week) => (
                      <button
                        key={week.week}
                        onClick={() => {
                          setSelectedWeek(week.week);
                          setShowWeekFilter(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-muted/50 transition-colors ${
                          selectedWeek === week.week ? 'bg-muted/30 font-medium' : ''
                        }`}
                      >
                        {week.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* League Statistics Card */}
            <Card 
              className="cursor-pointer transition-all duration-200 hover:bg-primary/10 hover:border-primary/30 h-full"
              onClick={openLeagueStatsModal}
            >
              <CardContent className="p-4 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Estadísticas de {leagueName}</p>
                    <p className="text-2xl font-bold text-primary">{statsLoading ? '...' : `${leagueStats?.winPercentage.toFixed(1) || '0.0'}%`}</p>
                    <p className="text-xs text-muted-foreground">% de aciertos</p>
                  </div>
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Estadísticas Avanzadas - Solo para ligas free */}
        {leagueId && leagueType === 'free' && (
          <Card className="border-2 border-yellow-400 bg-gradient-to-br from-yellow-50/50 to-amber-50/50 opacity-60">
            <CardContent className="p-4 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>⚠️ Funcionalidad Premium</strong>
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Actualiza a premium para acceder a estadísticas avanzadas
                  </p>
                  <Button
                    onClick={() => setIsPremiumModalOpen(true)}
                    className="w-full jambol-button bg-[#FFC72C] text-black hover:bg-[#FFD54F]"
                    size="sm"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Actualizar a Premium
                  </Button>
                </div>
                <BarChart3 className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>


      {/* Player Bet History Modal */}
      <Dialog open={isPlayerModalOpen} onOpenChange={setIsPlayerModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{selectedPlayer ? `Perfil de ${selectedPlayer.name}` : 'Historial'}</DialogTitle>
          </DialogHeader>
          
          {selectedPlayer && (
            <div className="space-y-4">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => {/* TODO: % Acierto */}}>
                  <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-base flex items-center justify-center gap-2">
                      <Target className="w-4 h-4 text-indigo-500" />
                      % Acierto
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center pb-4">
                    <div className="text-xl font-bold">{playerStats ? `${playerStats.successRate.toFixed(1)}%` : '-'}</div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => {/* TODO: Basado en stakes */}}>
                  <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-base flex items-center justify-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      Basado en Stakes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center pb-4">
                    <div className="text-xl font-bold">{playerStats ? `${playerStats.stakeSuccessRate.toFixed(1)}%` : '-'}</div>
                  </CardContent>
                </Card>

                {selectedPlayer.id !== user?.id && (
                  <Card 
                    className={`flex items-center justify-center min-h-[100px] ${
                      leagueType === 'premium' 
                        ? 'cursor-pointer hover:bg-muted/50 transition-colors' 
                        : 'opacity-60'
                    }`} 
                    onClick={leagueType === 'premium' ? openBlockModal : undefined}
                  >
                    <CardHeader className="pb-2 pt-4">
                      <CardTitle className="text-base flex items-center justify-center gap-2">
                        <Ban className="w-4 h-4 text-red-500" />
                        Bloquear Partidos
                      </CardTitle>
                      {leagueType === 'free' && (
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          ⚠️ Funcionalidad Premium
                        </p>
                      )}
                    </CardHeader>
                  </Card>
                )}
              </div>

              <PlayerBetHistory 
                playerId={selectedPlayer.id} 
                playerName={selectedPlayer.name}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {selectedPlayer && leagueType === 'premium' && (
        <BlockMatchesModal
          isOpen={isBlockModalOpen}
          onClose={closeBlockModal}
          blockedUser={selectedPlayer}
        />
      )}

      {/* League Statistics Modal - Solo para ligas premium */}
      {leagueType === 'premium' && (
        <LeagueStatisticsModal
          isOpen={isLeagueStatsModalOpen}
          onClose={() => setIsLeagueStatsModalOpen(false)}
        statistics={leagueStats || {
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
        }}
        isLoading={statsLoading}
        leagueName={leagueName}
        />
      )}

      {/* Historical Standings Modal */}
      <HistoricalStandingsModal
        isOpen={isHistoricalStandingsModalOpen}
        onClose={() => setIsHistoricalStandingsModalOpen(false)}
        data={historicalStandings || {}}
        isLoading={historicalLoading}
        leagueName={leagueName}
      />

      {/* Premium Upgrade Modal */}
      <PremiumUpgradeModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        onSuccess={() => {
          // Refresh league data
          fetchLeagueProfiles();
        }}
      />
    </div>
  );
};