import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
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
import { Award, ArrowDown, BarChart3, Calendar, TrendingUp } from 'lucide-react';

export const Clasificacion = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [previousChampionName, setPreviousChampionName] = useState<string | null>(null);
  const [previousLastName, setPreviousLastName] = useState<string | null>(null);
  const [leagueName, setLeagueName] = useState<string>('Jambo');
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: string; name: string } | null>(null);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [isLeagueStatsModalOpen, setIsLeagueStatsModalOpen] = useState(false);
  const [isHistoricalStandingsModalOpen, setIsHistoricalStandingsModalOpen] = useState(false);
  const [leagueId, setLeagueId] = useState<number | null>(null);
  const [leagueType, setLeagueType] = useState<'free' | 'premium' | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string>('total');
  const [showWeekFilter, setShowWeekFilter] = useState(false);

  // Get league statistics
  const { data: leagueStats, isLoading: statsLoading } = useLeagueStatistics(leagueId);
  
  // Get league standings with week filter
  const { data: standings, isLoading: standingsLoading } = useLeagueStandings(leagueId, selectedWeek);
  
  // Get available weeks
  const { data: availableWeeks, isLoading: weeksLoading } = useAvailableWeeks(leagueId);
  
  // Get historical standings data
  const { data: historicalStandings, isLoading: historicalLoading } = useHistoricalStandings(leagueId);

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
    document.title = 'Jambol - Clasificación';
  }, []);

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
  };

  const closePlayerModal = () => {
    setIsPlayerModalOpen(false);
    setSelectedPlayer(null);
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
        {/* Historical Standings Card */}
        <Card 
          className="cursor-pointer transition-all duration-200 hover:bg-primary/10 hover:border-primary/30"
          onClick={() => setIsHistoricalStandingsModalOpen(true)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Evolución Histórica</p>
                <p className="text-lg font-bold">Clasificación por Semanas</p>
                <p className="text-xs text-muted-foreground">Ver evolución de posiciones</p>
              </div>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        {/* Week Filter and League Statistics - Solo para ligas premium */}
        {leagueId && leagueType === 'premium' && (
          <>
            {/* Week Filter Card */}
            <div className="relative week-filter-container">
              <Card 
                className="cursor-pointer transition-all duration-200 hover:bg-primary/10 hover:border-primary/30 h-full"
                onClick={() => setShowWeekFilter(!showWeekFilter)}
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
              onClick={() => setIsLeagueStatsModalOpen(true)}
            >
              <CardContent className="p-4 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Estadísticas de {leagueName}</p>
                    <p className="text-2xl font-bold text-primary">{statsLoading ? '...' : `${leagueStats?.winPercentage.toFixed(1) || '0.0'}%`}</p>
                    <p className="text-xs text-muted-foreground">% de aciertos de apuestas</p>
                  </div>
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>


      {/* Player Bet History Modal */}
      <Dialog open={isPlayerModalOpen} onOpenChange={setIsPlayerModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Historial de Apuestas</DialogTitle>
          </DialogHeader>
          {selectedPlayer && (
            <PlayerBetHistory 
              playerId={selectedPlayer.id} 
              playerName={selectedPlayer.name}
            />
          )}
        </DialogContent>
      </Dialog>

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
    </div>
  );
};