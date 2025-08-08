import { useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import BetSlip from '@/components/BetSlip';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

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

const Bets = () => {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBets, setSelectedBets] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchOdds = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: cacheData, error: cacheError } = await supabase
          .from('match_odds_cache')
          .select('data')
          .single();

        if (cacheError || !cacheData || !cacheData.data) {
          throw new Error('Failed to fetch data from cache or cache is empty.');
        }

        const apiData = cacheData.data as unknown as CachedOddsData;
        
        // CRITICAL DEBUGGING STEP: This will show you the raw data in the browser console.
        console.log("Data from cache:", apiData);

        if (apiData && Array.isArray(apiData.response)) {
          const validMatches = apiData.response.filter(match => 
            match.fixture && match.teams?.home && match.teams?.away
          );
          setMatches(validMatches);
        } else {
          setMatches([]);
        }

      } catch (err: any) {
        setError('Failed to fetch or parse live betting data. Please try again later.');
        console.error("Error details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOdds();
  }, []);

  const handleAddToSlip = (match: MatchData, marketName: string, selection: BetValue) => {
    const bet = {
      id: `${match.fixture.id}-${marketName}-${selection.value}`,
      matchDescription: `${match.teams.home.name} vs ${match.teams.away.name}`,
      market: marketName,
      selection: selection.value,
      odds: parseFloat(selection.odd),
    };

    if (selectedBets.some(b => b.id === bet.id)) {
      toast({
        title: 'Bet already in slip',
        description: 'You have already added this selection to your bet slip.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedBets(prev => [...prev, bet]);
    toast({
      title: 'Bet added to slip!',
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

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex-grow space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg bg-card">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Recargar</Button>
          </div>
        </div>
      );
    }

    if (!matches || matches.length === 0) {
      return (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-muted-foreground">No hay partidos disponibles en este momento.</p>
        </div>
      );
    }

    return (
      <div className="flex-grow space-y-4">
        <Accordion type="single" collapsible className="w-full">
          {matches.map((match) => (
            <AccordionItem key={match.fixture.id} value={match.fixture.id.toString()}>
              <AccordionTrigger className="text-left">
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">
                    {match.teams?.home?.name || 'Equipo Local'} vs {match.teams?.away?.name || 'Equipo Visitante'}
                  </span>
                  <span className="text-sm text-muted-foreground mr-4">
                    {new Date(match.fixture.date).toLocaleString('es-ES')}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6 p-4">
                  {/* Ganador del Partido */}
                  {(() => {
                    const matchWinnerMarket = findMarket(match, 'Match Winner');
                    if (matchWinnerMarket && matchWinnerMarket.values?.length > 0) {
                      return (
                        <div>
                          <h4 className="font-semibold mb-3 text-primary">Ganador del Partido</h4>
                          <div className="grid grid-cols-3 gap-2">
                            {matchWinnerMarket.values.map((value, idx) => (
                              <Button
                                key={idx}
                                variant="outline"
                                className="flex flex-col p-3 h-auto hover:bg-primary hover:text-primary-foreground"
                                onClick={() => handleAddToSlip(match, 'Ganador del Partido', value)}
                              >
                                <span className="text-xs font-medium">
                                  {value.value === 'Home' ? match.teams?.home?.name || 'Local' :
                                   value.value === 'Away' ? match.teams?.away?.name || 'Visitante' :
                                   'Empate'}
                                </span>
                                <span className="text-lg font-bold">{value.odd}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Goles Más/Menos de */}
                  {(() => {
                    const overUnderMarket = findMarket(match, 'Goals Over/Under');
                    if (overUnderMarket && overUnderMarket.values?.length > 0) {
                      return (
                        <div>
                          <h4 className="font-semibold mb-3 text-primary">Goles Más/Menos de</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {overUnderMarket.values.map((value, idx) => (
                              <Button
                                key={idx}
                                variant="outline"
                                className="flex flex-col p-3 h-auto hover:bg-primary hover:text-primary-foreground"
                                onClick={() => handleAddToSlip(match, 'Goles Más/Menos de', value)}
                              >
                                <span className="text-xs font-medium">{value.value}</span>
                                <span className="text-lg font-bold">{value.odd}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Ambos Equipos Marcan */}
                  {(() => {
                    const bttsMarket = findMarket(match, 'Both Teams Score');
                    if (bttsMarket && bttsMarket.values?.length > 0) {
                      return (
                        <div>
                          <h4 className="font-semibold mb-3 text-primary">Ambos Equipos Marcan</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {bttsMarket.values.map((value, idx) => (
                              <Button
                                key={idx}
                                variant="outline"
                                className="flex flex-col p-3 h-auto hover:bg-primary hover:text-primary-foreground"
                                onClick={() => handleAddToSlip(match, 'Ambos Equipos Marcan', value)}
                              >
                                <span className="text-xs font-medium">
                                  {value.value === 'Yes' ? 'Sí' : 'No'}
                                </span>
                                <span className="text-lg font-bold">{value.odd}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 flex gap-6 min-h-screen">
      <div className="flex-1">
        <h1 className="text-3xl font-bold mb-6 text-primary">UK Championship - Cuotas en Vivo</h1>
        {renderContent()}
      </div>
      <div className="w-80">
        <BetSlip
          selectedBets={selectedBets}
          onRemoveBet={(betId) => setSelectedBets(prev => prev.filter(bet => bet.id !== betId))}
          onClearAll={() => setSelectedBets([])}
        />
      </div>
    </div>
  );
};

export default Bets;