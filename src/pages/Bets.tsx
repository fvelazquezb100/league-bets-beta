import { useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import BetSlip from '@/components/BetSlip';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { getBetTypesSorted } from '@/utils/betTypes';
import BetMarketSection from '@/components/BetMarketSection';
import { useIsMobile } from '@/hooks/use-mobile';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { ShoppingCart } from 'lucide-react';
import { getBettingTranslation } from '@/utils/bettingTranslations';

// --- Type Definitions for API-Football Odds Data ---
export interface Team {
  id: number;
  name: string;
  logo: string;
}

export interface Fixture {
  id: number;
  date: string;
}

export interface Teams {
  home: Team;
  away: Team;
}

export interface BetValue {
  value: string;
  odd: string;
}

export interface BetMarket {
  id: number;
  name: string;
  values: BetValue[];
}

export interface Bookmaker {
  id: number;
  name: string;
  bets: BetMarket[];
}

export interface MatchData {
  fixture: Fixture;
  teams: Teams;
  bookmakers: Bookmaker[];
}

export interface CachedOddsData {
  response?: MatchData[];
}

interface UserBet {
  id: number;
  stake: number;
  status: string;
  bet_type: string;
  match_description?: string;
  fixture_id?: number;
  bet_selection?: string;
  bet_selections?: {
    market: string;
    selection: string;
    odds: number;
    fixture_id?: number;
  }[];
}

const Bets = () => {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBets, setSelectedBets] = useState<any[]>([]);
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerShouldRender, setDrawerShouldRender] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchOddsAndBets = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: cacheData, error: cacheError } = await supabase
          .from('match_odds_cache')
          .select('data')
          .maybeSingle();

        if (cacheError) throw new Error('Failed to fetch data from cache.');

        if (!cacheData || !cacheData.data) {
          try {
            const { error: populateError } = await supabase.functions.invoke('secure-run-update-football-cache');
            if (!populateError) {
              const { data: newCacheData, error: retryError } = await supabase
                .from('match_odds_cache')
                .select('data')
                .maybeSingle();
              
              if (!retryError && newCacheData && newCacheData.data) {
                const apiData = newCacheData.data as unknown as CachedOddsData;
                if (apiData && Array.isArray(apiData.response)) {
                  const validMatches = apiData.response.filter(match => match.fixture);
                  setMatches(validMatches);
                } else {
                  setMatches([]);
                }
              } else {
                throw new Error('Cache is still empty after population attempt.');
              }
            } else {
              throw new Error('Failed to populate cache automatically.');
            }
          } catch {
            throw new Error('Cache is empty and auto-population failed. Please try refreshing the page.');
          }
        } else {
          const apiData = cacheData.data as unknown as CachedOddsData;
          if (apiData && Array.isArray(apiData.response)) {
            const validMatches = apiData.response.filter(match => match.fixture);
            setMatches(validMatches);
          } else {
            setMatches([]);
          }
        }

        if (user) {
          const { data: betsData, error: betsError } = await supabase
            .from('bets')
            .select(`
              id,
              stake,
              status,
              bet_type,
              match_description,
              fixture_id,
              bet_selection,
              bet_selections (
                market,
                selection,
                odds,
                fixture_id
              )
            `)
            .eq('user_id', user.id)
            .eq('status', 'pending');

          if (!betsError && betsData) {
            setUserBets(betsData as UserBet[]);
          }
        }

      } catch (err: any) {
        setError('Failed to fetch or parse live betting data. Please try again later.');
        console.error("Error details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOddsAndBets();
  }, [user]);

  // Manage drawer render state to prevent unmounting during transitions
  useEffect(() => {
    if (selectedBets.length > 0) {
      setDrawerShouldRender(true);
    } else if (selectedBets.length === 0 && drawerShouldRender) {
      // Delay hiding the drawer to allow for smooth transition
      const timer = setTimeout(() => {
        setDrawerShouldRender(false);
        setIsDrawerOpen(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedBets.length, drawerShouldRender]);

  const handleAddToSlip = (match: MatchData, marketName: string, selection: BetValue) => {
    const bet = {
      id: `${match.fixture.id}-${marketName}-${selection.value}`,
      matchDescription: `${match.teams?.home?.name ?? 'Local'} vs ${match.teams?.away?.name ?? 'Visitante'}`,
      market: marketName,
      selection: selection.value,
      odds: parseFloat(selection.odd),
      fixtureId: match.fixture.id,
      kickoff: match.fixture.date,
    };

    if (selectedBets.some(b => b.id === bet.id)) {
      toast({
        title: 'Selección ya añadida',
        description: 'Ya has añadido esta selección a tu boleto.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedBets.some(b => b.fixtureId === bet.fixtureId)) {
      toast({
        title: 'Error',
        description: 'Solo puedes añadir una selección por partido en una apuesta combinada.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedBets(prev => [...prev, bet]);
    toast({
      title: 'Selección añadida',
      description: `${selection.value} @ ${selection.odd}`,
    });
  };

  const findMarket = (match: MatchData, marketName: string) => {
    if (!match.bookmakers || match.bookmakers.length === 0) return undefined;
    for (const bookmaker of match.bookmakers) {
      const market = bookmaker.bets.find(bet => bet.name === marketName);
      if (market) return market;
    }
    return undefined;
  };

  const getBetsForFixture = (fixtureId: number) => {
    return userBets.filter(bet => 
      bet.fixture_id === fixtureId || 
      (bet.bet_type === 'combo' && bet.bet_selections?.some(sel => sel.fixture_id === fixtureId))
    );
  };

  const getBetPreview = (fixtureId: number) => {
    const bets = getBetsForFixture(fixtureId);
    if (bets.length === 0) return null;

    return bets.map(bet => {
      if (bet.bet_type === 'combo') {
        return `Combinada €${bet.stake?.toFixed(0)}`;
      } else {
        const selection = bet.bet_selections?.[0];
        const market = selection ? `${selection.market}: ${selection.selection}` : 'Apuesta';
        return `${market} €${bet.stake?.toFixed(0)}`;
      }
    }).join(', ');
  };

  const hasUserBetOnMarket = (fixtureId: number, marketName: string, selection: string) => {
    const bets = getBetsForFixture(fixtureId);
    return bets.some(bet => {
      if (bet.bet_selections && bet.bet_selections.length > 0) {
        return bet.bet_selections.some(sel => 
          sel.fixture_id === fixtureId && sel.market === marketName && sel.selection === selection
        );
      }
      if (bet.bet_type === 'single' && bet.fixture_id === fixtureId && bet.bet_selection) {
        const parts = bet.bet_selection.split(' @ ');
        if (parts.length >= 1) {
          const betSelection = parts[0].trim();
          return betSelection === selection;
        }
      }
      return false;
    });
  };

  // Calculate next Monday at 23:59
  const getNextMondayEndOfDay = () => {
    const now = new Date();
    const nextMonday = new Date(now);
    const daysUntilMonday = (1 + 7 - now.getDay()) % 7; // 0 = Sunday, 1 = Monday
    nextMonday.setDate(now.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));
    nextMonday.setHours(23, 59, 59, 999);
    return nextMonday;
  };

  // Filter matches by date
  const nextMondayEndOfDay = getNextMondayEndOfDay();
  const upcomingMatches = matches.filter(match => new Date(match.fixture.date) <= nextMondayEndOfDay);
  const futureMatches = matches.filter(match => new Date(match.fixture.date) > nextMondayEndOfDay);

  const renderMatchesSection = (matchesToRender: MatchData[], sectionKey: string) => {
    if (matchesToRender.length === 0) {
      return (
        <div className="text-center p-8 bg-card rounded-lg shadow">
          <p className="text-muted-foreground">No hay partidos disponibles en esta sección.</p>
        </div>
      );
    }

    return (
      <Accordion type="single" collapsible className="w-full space-y-4">
        {matchesToRender.map((match) => {
          const kickoff = new Date(match.fixture.date);
          const freezeTime = new Date(kickoff.getTime() - 15 * 60 * 1000);
          const isFrozen = new Date() >= freezeTime;

          return (
            <AccordionItem value={`${sectionKey}-match-${match.fixture.id}`} key={match.fixture.id} className="border rounded-lg p-4 bg-card shadow-sm">
              <AccordionTrigger>
                <div className="text-left w-full">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-lg text-foreground">{match.teams?.home?.name ?? 'Local'} vs {match.teams?.away?.name ?? 'Visitante'}</p>
                      <p className="text-sm text-muted-foreground">{new Date(match.fixture.date).toLocaleString()}</p>
                    </div>
                    {getBetsForFixture(match.fixture.id).length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {getBetsForFixture(match.fixture.id).length} apuesta{getBetsForFixture(match.fixture.id).length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  {getBetPreview(match.fixture.id) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Tus apuestas: {getBetPreview(match.fixture.id)}
                    </p>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6 pt-4">
                  {getBetTypesSorted().map(betType => {
                    const market = findMarket(match, betType.apiName);
                    if (!market) return null;

                    return (
                      <BetMarketSection
                        key={betType.apiName}
                        match={match}
                        betType={betType}
                        market={market}
                        isFrozen={isFrozen}
                        hasUserBetOnMarket={hasUserBetOnMarket}
                        handleAddToSlip={handleAddToSlip}
                      />
                    );
                  })}
                  
                  {getBetTypesSorted().every(betType => !findMarket(match, betType.apiName)) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No hay mercados de apuestas disponibles para este partido.</p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex-grow space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg bg-card shadow-sm">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex-grow text-center p-8 bg-destructive/10 text-destructive rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      );
    }

    if (matches.length === 0) {
      return (
        <div className="flex-grow text-center p-8 bg-card rounded-lg shadow">
          <p className="text-muted-foreground">No hay partidos con cuotas disponibles en este momento.</p>
        </div>
      );
    }

    return (
      <div className="flex-grow space-y-8">
        {/* Main section: matches up to next Monday 23:59 */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">La Liga - Cuotas en Vivo</h2>
          {renderMatchesSection(upcomingMatches, 'upcoming')}
        </div>

        {/* Future matches section: matches after next Monday 23:59 */}
        {futureMatches.length > 0 && (
          <>
            <div className="border-t border-border my-8"></div>
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">La Liga - Próximos Encuentros</h2>
              {renderMatchesSection(futureMatches, 'future')}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">La Liga - Apuestas</h1>
      
      {/* Desktop Layout */}
      {!isMobile ? (
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-grow">
            {renderContent()}
          </div>
          <div className="w-full md:w-1/3 md:sticky md:top-0 md:self-start">
            <BetSlip 
              selectedBets={selectedBets} 
              onRemoveBet={(betId) => setSelectedBets(prev => prev.filter(bet => bet.id !== betId))}
              onClearAll={() => setSelectedBets([])}
            />
          </div>
        </div>
      ) : (
          /* Mobile Layout with Drawer */
        <div className="flex flex-col gap-8">
          <div>
            {renderContent()}
          </div>

          {/* Mobile Bet Slip Drawer */}
          {drawerShouldRender && (
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <DrawerTrigger asChild>
                <Button 
                  className="fixed bottom-4 right-4 rounded-full h-14 w-14 shadow-lg hover:scale-105 transition-transform"
                  size="lg"
                  style={{ display: selectedBets.length > 0 ? 'flex' : 'none' }}
                >
                  <div className="flex flex-col items-center">
                    <ShoppingCart className="h-5 w-5" />
                    <span className="text-xs font-bold">{selectedBets.length}</span>
                  </div>
                </Button>
              </DrawerTrigger>
              <DrawerContent className="max-h-[80vh]">
                <div className="p-4 overflow-y-auto">
                  <BetSlip 
                    selectedBets={selectedBets} 
                    onRemoveBet={(betId) => setSelectedBets(prev => prev.filter(bet => bet.id !== betId))}
                    onClearAll={() => {
                      setSelectedBets([]);
                      // Close drawer after a short delay to allow for smooth transition
                      setTimeout(() => setIsDrawerOpen(false), 100);
                    }}
                  />
                </div>
              </DrawerContent>
            </Drawer>
          )}
        </div>
      )}
    </div>
  );
};

export default Bets;