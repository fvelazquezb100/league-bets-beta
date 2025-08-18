import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { History } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PlayerBetHistory } from '@/components/PlayerBetHistory';


// Types for odds cache minimal usage
interface Team { id: number; name: string; logo: string }
interface Fixture { id: number; date: string }
interface Teams { home: Team; away: Team }
interface BetValue { value: string; odd: string }
interface BetMarket { id: number; name: string; values: BetValue[] }
interface Bookmaker { id: number; name: string; bets: BetMarket[] }
interface MatchData { fixture: Fixture; teams: Teams; bookmakers: Bookmaker[] }
interface CachedOddsData { response?: MatchData[] }

const findMarket = (match: MatchData, marketName: string) => {
  if (!match.bookmakers || match.bookmakers.length === 0) return undefined;
  for (const bookmaker of match.bookmakers) {
    const market = bookmaker.bets.find(bet => bet.name === marketName);
    if (market) return market;
  }
  return undefined;
};

export const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userBets, setUserBets] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<MatchData[]>([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [recentBets, setRecentBets] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: string; name: string } | null>(null);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);

  // Refactored data fetching functions
  const fetchUserData = async () => {
    if (!user) return;

    // Fetch current user's profile to get league_id
    const { data: currentProfile, error: currentProfileError } = await supabase
      .from('profiles')
      .select('id, username, total_points, league_id')
      .eq('id', user.id)
      .maybeSingle();

    if (currentProfileError) {
      console.error('Error fetching current user profile:', currentProfileError);
      setUserProfile(null);
      setProfiles([]);
      return;
    }

    setUserProfile(currentProfile ?? null);

    // If user has no profile, show empty state but don't redirect
    if (!currentProfile) {
      setProfiles([]);
      return;
    }

    // If user has no league, redirect to setup only once
    if (!currentProfile.league_id) {
      setProfiles([]);
      // Only redirect if we're currently on home page to avoid loops
      if (window.location.pathname === '/home') {
        navigate('/league-setup', { replace: true });
      }
      return;
    }

    // User has a league: fetch only profiles in that league
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, total_points, league_id')
      .eq('league_id', currentProfile.league_id)
      .order('total_points', { ascending: false });

    if (profilesError) {
      console.error('Error fetching league profiles:', profilesError);
    } else {
      setProfiles(profilesData ?? []);
    }
  };

  const fetchUserBets = async () => {
    if (!user) return;

    // Fetch user's recent bets
    const { data: betsData, error: betsError } = await supabase
      .from('bets')
      .select('*')
      .eq('user_id', user.id)
      .order('id', { ascending: false })
      .limit(5);

    if (betsError) {
      console.error('Error fetching user bets:', betsError);
    } else if (betsData) {
      setUserBets(betsData);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchUserBets();
  }, [user]);

  // Add focus-based refresh for bet data
  useEffect(() => {
    const handleFocus = () => {
      fetchUserBets();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUserBets();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoadingUpcoming(true);
        setLoadingActivity(true);

        // Upcoming matches from odds cache (take top 2)
        const { data: cacheData } = await supabase
          .from('match_odds_cache')
          .select('data')
          .single();

        const apiData = (cacheData?.data ?? {}) as unknown as CachedOddsData;
        const matches = Array.isArray(apiData.response)
          ? apiData.response.filter((m: any) => m?.fixture).slice(0, 2)
          : [];
        setUpcoming(matches as MatchData[]);

        // Recent bets (latest 2)
        if (user) {
          const { data: rb } = await supabase
            .from('bets')
            .select('*')
            .eq('user_id', user.id)
            .order('id', { ascending: false })
            .limit(2);
          setRecentBets(rb ?? []);
        } else {
          setRecentBets([]);
        }
      } catch {
        setUpcoming([]);
        setRecentBets([]);
      } finally {
        setLoadingUpcoming(false);
        setLoadingActivity(false);
      }
    };

    fetchHomeData();
  }, [user]);

  useEffect(() => {
    document.title = 'Inicio | Apuestas Simuladas';
  }, []);

  const handlePlayerClick = (profile: any) => {
    // Don't open modal for current user - they have their own bet history page
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
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Clasificación de la Liga
        </h1>
      </div>

      {/* League Standings Table */}
      <Card className="shadow-lg">
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pos.</TableHead>
                <TableHead>Jugador</TableHead>
                <TableHead>Puntos Totales</TableHead>
                <TableHead>Última Jornada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.slice(0, 20).map((profile, index) => (
                <TableRow 
                  key={profile.id} 
                  className={`${profile.id === user?.id ? 'bg-muted/50' : ''} ${profile.id !== user?.id ? 'cursor-pointer hover:bg-muted/30 transition-colors' : ''}`}
                  onClick={() => handlePlayerClick(profile)}
                >
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{profile.username || 'Usuario'}</TableCell>
                  <TableCell>{(Math.ceil(Number(profile.total_points ?? 0) * 10) / 10).toFixed(1)}</TableCell>
                  <TableCell className="text-muted-foreground">-</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Próximos Partidos</CardTitle>
            <CardDescription>
              Encuentra los mejores partidos para apostar hoy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingUpcoming ? (
              <>
                <div className="p-4 rounded-lg bg-muted/50">
                  <Skeleton className="h-5 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <Skeleton className="h-5 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </>
            ) : upcoming.length === 0 ? (
              <p className="text-muted-foreground">No hay partidos disponibles en este momento.</p>
            ) : (
              upcoming.map((match) => {
                const mw = findMarket(match, 'Match Winner');
                const home = mw?.values.find(v => v.value.toLowerCase().includes('home'))?.odd ?? '-';
                const draw = mw?.values.find(v => v.value.toLowerCase().includes('draw'))?.odd ?? '-';
                const away = mw?.values.find(v => v.value.toLowerCase().includes('away'))?.odd ?? '-';
                return (
                  <div key={match.fixture.id} className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-semibold">{match.teams?.home?.name} vs {match.teams?.away?.name}</p>
                      <p className="text-sm text-muted-foreground">{new Date(match.fixture.date).toLocaleString('es-ES')}</p>
                    </div>
                    <div className="text-sm font-medium">
                      <span className="text-primary">{home}</span> | <span className="text-primary">{draw}</span> | <span className="text-primary">{away}</span>
                    </div>
                  </div>
                );
              })
            )}
            <Link to="/bets">
              <Button className="w-full mt-4">
                Ver Todos los Partidos
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>
              Tus últimas apuestas y resultados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingActivity ? (
              <>
                <div className="p-4 rounded-lg bg-muted/50">
                  <Skeleton className="h-5 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <Skeleton className="h-5 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </>
            ) : recentBets.length === 0 ? (
              <p className="text-muted-foreground">Aún no has realizado ninguna apuesta.</p>
            ) : (
              recentBets.map((bet) => {
                const status = String(bet.status || 'pending');
                const stake = Number(bet.stake ?? 0);
                const payout = Number(bet.payout ?? 0);
                const net = payout - stake;
                const isWon = status === 'won';
                const isLost = status === 'lost';
                
                // Get bet description based on type and stake
                let betDescription;
                if (bet.bet_type === 'combo') {
                  betDescription = `Combinada @ €${stake.toFixed(0)}`;
                } else {
                  betDescription = `${bet.match_description || 'Partido'} @ €${stake.toFixed(0)}`;
                }
                
                return (
                  <div key={bet.id} className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className={`font-semibold ${isWon ? 'text-primary' : isLost ? 'text-destructive' : ''}`}>{betDescription}</p>
                      <p className="text-sm text-muted-foreground">{isWon ? 'Ganaste' : isLost ? 'Perdiste' : 'Apuesta pendiente'}</p>
                    </div>
                    <div className={`font-bold ${isWon ? 'text-primary' : isLost ? 'text-destructive' : 'text-foreground'}`}>
                      {isWon ? `+${net.toFixed(2)}` : isLost ? `-${stake.toFixed(2)}` : '—'}
                    </div>
                  </div>
                );
              })
            )}
            <Link to="/bet-history">
              <Button variant="outline" className="w-full mt-4">
                <History className="h-4 w-4 mr-2" />
                Ver Historial Completo
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Player Bet History Modal */}
      <Dialog open={isPlayerModalOpen} onOpenChange={setIsPlayerModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Historial de Apuestas</DialogTitle>
          </DialogHeader>
          {selectedPlayer && (
            <PlayerBetHistory 
              playerId={selectedPlayer.id} 
              playerName={selectedPlayer.name}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};