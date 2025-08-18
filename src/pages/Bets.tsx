import { useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import BetSlip from '@/components/BetSlip';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

// --- Final, Corrected Type Definitions for API-Football Odds Data ---
interface Team {
  id: number;
  name: string;
  logo: string;
}

interface Fixture {
  id: number;
  date: string;
}

interface Teams {
  home: Team;
  away: Team;
}

interface BetValue {
  value: string;
  odd: string;
}

interface BetMarket {
  id: number;
  name: string;
  values: BetValue[];
}

interface Bookmaker {
  id: number;
  name: string;
  bets: BetMarket[];
}

interface MatchData {
  fixture: Fixture;
  teams: Teams;
  bookmakers: Bookmaker[];
}

interface CachedOddsData {
  response?: MatchData[];
}

interface UserBet {
  id: number;
  stake: number;
  status: string;
  bet_type: string;
  match_description?: string;
  fixture_id?: number;
  bet_selection?: string; // For single bets
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
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchOddsAndBets = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch cached odds data
        const { data: cacheData, error: cacheError } = await supabase
          .from('match_odds_cache')
          .select('data')
          .maybeSingle();

        if (cacheError) {
          throw new Error('Failed to fetch data from cache.');
        }

        // If cache is empty, try to populate it automatically
        if (!cacheData || !cacheData.data) {
          console.log('Cache is empty, attempting to populate...');
          try {
            const { error: populateError } = await supabase.functions.invoke('secure-run-update-football-cache');
            if (!populateError) {
              // Try fetching again after population
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
          } catch (autoPopulateError) {
            throw new Error('Cache is empty and auto-population failed. Please try refreshing the page.');
          }
        } else {
          const apiData = cacheData.data as unknown as CachedOddsData;
          
          console.log("Data from cache:", apiData);
          console.log("First match data:", apiData?.response?.[0]);

          if (apiData && Array.isArray(apiData.response)) {
            const validMatches = apiData.response.filter(match => match.fixture);
            console.log("Valid matches:", validMatches);
            console.log("First valid match teams:", validMatches[0]?.teams);
            setMatches(validMatches);
          } else {
            setMatches([]);
          }
        }

        // Fetch user's existing bets if authenticated
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

    // Check if this exact selection is already in the slip
    if (selectedBets.some(b => b.id === bet.id)) {
      toast({
        title: 'Selección ya añadida',
        description: 'Ya has añadido esta selección a tu boleto.',
        variant: 'destructive',
      });
      return;
    }

    // Check if there's already a bet from the same fixture
    if (selectedBets.some(b => b.fixtureId === bet.fixtureId)) {
      toast({
        title: 'Error',
        description: 'Solo puedes añadir una selección por partido en una apuesta combinada.',
        variant: 'destructive',
      });
      return;
    }

    // Add the new bet to the slip
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
      (bet.bet_type === 'combo' && bet.bet_selections?.some(sel => 
        sel.fixture_id === fixtureId
      ))
    );
  };

  const getBetPreview = (fixtureId: number) => {
    const bets = getBetsForFixture(fixtureId);
    if (bets.length === 0) return null;

    return bets.map(bet => {
      if (bet.bet_type === 'combo') {
        return `Combinada €${bet.stake?.toFixed(0)}`;
      } else {
        // For single bets, try to get market info from bet_selections if available
        const selection = bet.bet_selections?.[0];
        const market = selection ? `${selection.market}: ${selection.selection}` : 'Apuesta';
        return `${market} €${bet.stake?.toFixed(0)}`;
      }
    }).join(', ');
  };

  const hasUserBetOnMarket = (fixtureId: number, marketName: string, selection: string) => {
    const bets = getBetsForFixture(fixtureId);
    console.log(`Checking market ${marketName} selection ${selection} for fixture ${fixtureId}`);
    console.log('Available bets:', bets);
    
    return bets.some(bet => {
      console.log(`Processing bet type: ${bet.bet_type}, fixture_id: ${bet.fixture_id}`);
      
      // Check combo bets
      if (bet.bet_selections && bet.bet_selections.length > 0) {
        const comboMatch = bet.bet_selections.some(sel => 
          sel.fixture_id === fixtureId && sel.market === marketName && sel.selection === selection
        );
        console.log('Combo bet match:', comboMatch);
        return comboMatch;
      }
      
      // Check single bets
      if (bet.bet_type === 'single' && bet.fixture_id === fixtureId && bet.bet_selection) {
        console.log('Checking single bet:', bet.bet_selection);
        // Parse the bet_selection string (e.g., "Under 2.5 @ 1.7" or "Home @ 1.85")
        const parts = bet.bet_selection.split(' @ ');
        if (parts.length >= 1) {
          const betSelection = parts[0].trim();
          console.log(`Comparing "${betSelection}" with "${selection}"`);
          
          // Check if the selection matches
          const singleMatch = betSelection === selection;
          console.log('Single bet match:', singleMatch);
          return singleMatch;
        }
      }
      
      console.log('No match found for this bet');
      return false;
    });
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex-grow space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg bg-white shadow-sm">
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
        <div className="flex-grow text-center p-8 bg-red-100 text-red-700 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      );
    }

    if (matches.length > 0) {
      return (
        <Accordion type="single" collapsible className="w-full space-y-4">
          {matches.map((match) => {
            const matchWinnerMarket = findMarket(match, 'Match Winner');
            const goalsMarket = findMarket(match, 'Goals Over/Under');
            const bttsMarket = findMarket(match, 'Both Teams To Score');
            const kickoff = new Date(match.fixture.date);
            const freezeTime = new Date(kickoff.getTime() - 15 * 60 * 1000);
            const isFrozen = new Date() >= freezeTime;

            return (
              <AccordionItem value={`match-${match.fixture.id}`} key={match.fixture.id} className="border rounded-lg p-4 bg-white shadow-sm">
                <AccordionTrigger>
                  <div className="text-left w-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-lg">{match.teams?.home?.name ?? 'Local'} vs {match.teams?.away?.name ?? 'Visitante'}</p>
                        <p className="text-sm text-gray-500">{new Date(match.fixture.date).toLocaleString()}</p>
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
                  <div className="space-y-4 pt-4">
                    {matchWinnerMarket ? (
                      <div>
                        <h4 className="font-semibold mb-2">Ganador del Partido</h4>
                        <div className="flex flex-wrap gap-2">
                          {matchWinnerMarket.values.map(value => {
                            const hasUserBet = hasUserBetOnMarket(match.fixture.id, 'Ganador del Partido', value.value);
                            return (
                              <Button 
                                key={value.value} 
                                variant={hasUserBet ? "default" : "outline"} 
                                className={`flex flex-col h-auto flex-1 min-w-[120px] ${hasUserBet ? 'opacity-75' : ''}`} 
                                disabled={isFrozen} 
                                onClick={() => handleAddToSlip(match, 'Ganador del Partido', value)}
                              >
                                <span>{value.value}</span>
                                <span className="font-bold">{value.odd}</span>
                                {hasUserBet && <span className="text-xs">✓ Apostado</span>}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                    {bttsMarket ? (
                       <div>
                        <h4 className="font-semibold mb-2">Ambos Equipos Marcan</h4>
                        <div className="flex flex-wrap gap-2">
                          {bttsMarket.values.map(value => {
                            const hasUserBet = hasUserBetOnMarket(match.fixture.id, 'Ambos Equipos Marcan', value.value);
                            return (
                              <Button 
                                key={value.value} 
                                variant={hasUserBet ? "default" : "outline"} 
                                className={`flex flex-col h-auto flex-1 min-w-[120px] ${hasUserBet ? 'opacity-75' : ''}`} 
                                disabled={isFrozen} 
                                onClick={() => handleAddToSlip(match, 'Ambos Equipos Marcan', value)}
                              >
                                <span>{value.value}</span>
                                <span className="font-bold">{value.odd}</span>
                                {hasUserBet && <span className="text-xs">✓ Apostado</span>}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                    {goalsMarket ? (
                      <div>
                        <h4 className="font-semibold mb-2">Goles Más/Menos de</h4>
                         <div className="flex flex-wrap gap-2">
                          {goalsMarket.values.map(value => {
                            const hasUserBet = hasUserBetOnMarket(match.fixture.id, 'Goles Más/Menos de', value.value);
                            return (
                              <Button 
                                key={value.value} 
                                variant={hasUserBet ? "default" : "outline"} 
                                className={`flex flex-col h-auto flex-1 min-w-[120px] ${hasUserBet ? 'opacity-75' : ''}`} 
                                disabled={isFrozen} 
                                onClick={() => handleAddToSlip(match, 'Goles Más/Menos de', value)}
                              >
                                <span>{value.value}</span>
                                <span className="font-bold">{value.odd}</span>
                                {hasUserBet && <span className="text-xs">✓ Apostado</span>}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      );
    }

    return (
      <div className="flex-grow text-center p-8 bg-white rounded-lg shadow">
        <p>No hay partidos con cuotas disponibles en este momento.</p>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">La Liga - Cuotas en Vivo</h1>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-grow">
          {renderContent()}
        </div>
        <div className="w-full md:w-1/3">
          <BetSlip 
            selectedBets={selectedBets} 
            onRemoveBet={(betId) => setSelectedBets(prev => prev.filter(bet => bet.id !== betId))}
            onClearAll={() => setSelectedBets([])}
          />
        </div>
      </div>
    </div>
  );
};

export default Bets;
