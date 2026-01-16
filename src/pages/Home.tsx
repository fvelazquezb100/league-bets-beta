import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { History } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { NewsBoard } from '@/components/NewsBoard';
import { useMatchOdds, type MatchData } from '@/hooks/useMatchOdds';
import { useUserBetHistory } from '@/hooks/useUserBets';
import { useUserProfile } from '@/hooks/useUserProfile';



// Types imported from hooks - no need to redefine

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


  // React Query hooks for data fetching
  const { data: userProfile } = useUserProfile(user?.id);
  const { data: allMatches = [], isLoading: matchesLoading } = useMatchOdds();
  const { data: allBets = [], isLoading: betsLoading } = useUserBetHistory(user?.id);

  // Derived data
  const upcoming = allMatches.slice(0, 2); // Top 2 matches
  const recentBets = allBets.slice(0, 3); // Latest 3 bets

  // Loading states
  const loadingUpcoming = matchesLoading;
  const loadingActivity = betsLoading;

  // Data fetching is now handled by React Query hooks above
  // No more manual useEffect needed!

  useEffect(() => {
    const pageTitle = 'Jambol — Inicio';
    const description = 'Panel principal de tu liga Jambol. Mantente al día con las últimas noticias, partidos disponibles y tu actividad reciente.';
    const keywords = 'jambol, inicio, liga, noticias, partidos, actividad, dashboard';

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
        <Card className="shadow-lg bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Próximos Partidos</CardTitle>
            <CardDescription className="text-muted-foreground">
              Encuentra los mejores partidos para participar hoy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingUpcoming ? (
              <>
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <Skeleton className="h-5 w-2/3 mb-2 bg-muted" />
                  <Skeleton className="h-4 w-1/3 bg-muted" />
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <Skeleton className="h-5 w-2/3 mb-2 bg-muted" />
                  <Skeleton className="h-4 w-1/3 bg-muted" />
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
                  <div key={match.fixture.id} className="flex justify-between items-center p-4 bg-muted/50 rounded-lg border border-border hover:bg-muted/70 transition-colors">
                    <div>
                      <p className="font-semibold text-foreground">{match.teams?.home?.name} vs {match.teams?.away?.name}</p>
                      <p className="text-sm text-muted-foreground">{new Date(match.fixture.date).toLocaleString('es-ES')}</p>
                    </div>
                    <div className="text-sm font-medium">
                      <span className="text-[#FFC72C] font-bold">{home}</span> | <span className="text-[#FFC72C] font-bold">{draw}</span> | <span className="text-[#FFC72C] font-bold">{away}</span>
                    </div>
                  </div>
                );
              })
            )}
            <Link to="/bets">
              <Button
                className="w-full mt-4 bg-[#FFC72C] text-[#2D2D2D] hover:bg-[#FFC72C]/90 font-semibold border-2 border-[#FFC72C] transition-colors"
              >
                Ver Todos los Partidos
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Actividad Reciente</CardTitle>
            <CardDescription className="text-muted-foreground">
              Tus últimas boletos y resultados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingActivity ? (
              <>
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <Skeleton className="h-5 w-2/3 mb-2 bg-muted" />
                  <Skeleton className="h-4 w-1/3 bg-muted" />
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <Skeleton className="h-5 w-2/3 mb-2 bg-muted" />
                  <Skeleton className="h-4 w-1/3 bg-muted" />
                </div>
              </>
            ) : recentBets.length === 0 ? (
              <p className="text-muted-foreground">Aún no has realizado ningún boleto.</p>
            ) : (
              recentBets.map((bet) => {
                const status = String(bet.status || 'pending');
                const stake = Number(bet.stake ?? 0);
                const payout = bet.payout ?? 0;
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
                  <div key={bet.id} className="flex justify-between items-center p-4 bg-muted/50 rounded-lg border border-border hover:bg-muted/70 transition-colors">
                    <div>
                      <p className={`font-semibold ${isWon ? 'text-[#FFC72C]' : isLost ? 'text-destructive' : 'text-foreground'}`}>{betDescription}</p>
                      <p className="text-sm text-muted-foreground">{isWon ? 'Ganaste' : isLost ? 'Perdiste' : 'Boleto pendiente'}</p>
                    </div>
                    <div className={`font-bold ${isWon ? 'text-[#FFC72C]' : isLost ? 'text-destructive' : 'text-foreground'}`}>
                      {isWon ? `+${net.toFixed(2)}` : isLost ? `-${stake.toFixed(2)}` : '—'}
                    </div>
                  </div>
                );
              })
            )}
            <Link to="/bet-history">
              <Button
                className="w-full mt-4 bg-[#FFC72C] text-[#2D2D2D] hover:bg-[#FFC72C]/90 font-semibold border-2 border-[#FFC72C] transition-colors"
              >
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