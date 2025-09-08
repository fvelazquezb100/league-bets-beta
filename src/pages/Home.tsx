import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { NewsBoard } from '@/components/NewsBoard';


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
  const [userProfile, setUserProfile] = useState<any>(null);
  const [upcoming, setUpcoming] = useState<MatchData[]>([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [recentBets, setRecentBets] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  // Fetch user data to check league setup
  const fetchUserData = async () => {
    if (!user) return;

    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('id, league_id')
      .eq('id', user.id)
      .maybeSingle();

    setUserProfile(currentProfile ?? null);

    // If user has no league, redirect to setup
    if (currentProfile && !currentProfile.league_id && window.location.pathname === '/home') {
      navigate('/league-setup', { replace: true });
    }
  };

  useEffect(() => {
    fetchUserData();
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

        // Recent bets (latest 3)
        if (user) {
          const { data: rb } = await supabase
            .from('bets')
            .select('*')
            .eq('user_id', user.id)
            .order('id', { ascending: false })
            .limit(3);
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
    document.title = 'Jambol - Inicio';
  }, []);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Bienvenido a tu Liga
        </h1>
        <p className="text-muted-foreground">Mantente al día con las últimas noticias y partidos</p>
      </div>

      {/* News Board */}
      <NewsBoard />

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
              <Button className="jambol-button w-full mt-4">
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
              <Button className="jambol-button w-full mt-4">
                <History className="h-4 w-4 mr-2" />
                Ver Historial Completo
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};