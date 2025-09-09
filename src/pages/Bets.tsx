import React, { useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import BetSlip from '@/components/BetSlip';
import MobileBetSlip from '@/components/MobileBetSlip';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { getBetTypesSorted } from '@/utils/betTypes';
import BetMarketSection from '@/components/BetMarketSection';
import { useIsMobile } from '@/hooks/use-mobile';
import { getBettingTranslation } from '@/utils/bettingTranslations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  league_id?: number;
  league_name?: string;
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
  market_bets?: string;
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
  const [selectedLeague, setSelectedLeague] = useState<'primera' | 'champions' | 'europa' | 'liga-mx'>('primera');
  const [availableLeagues, setAvailableLeagues] = useState<number[]>([]);
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
              market_bets,
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

  // Fetch available leagues for the user's league
  useEffect(() => {
    const fetchAvailableLeagues = async () => {
      if (!user) return;
      
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('league_id')
          .eq('id', user.id)
          .single();
          
        if (profileError) throw profileError;
        
        const { data: leagueData, error: leagueError } = await supabase
          .from('leagues')
          .select('available_leagues')
          .eq('id', profileData.league_id)
          .single();
          
        if (leagueError) {
          // If column doesn't exist yet, use default leagues
          console.warn('available_leagues column not found, using default leagues');
          setAvailableLeagues([140, 2, 3, 262]);
          return;
        }
        
        setAvailableLeagues((leagueData as any)?.available_leagues || [140, 2, 3, 262]);
      } catch (error) {
        console.error('Error fetching available leagues:', error);
        // Default to all leagues if there's an error
        setAvailableLeagues([140, 2, 3, 262]);
      }
    };

    fetchAvailableLeagues();
  }, [user]);


  const handleAddToSlip = (match: MatchData, marketName: string, selection: BetValue) => {
    // Check if match is in the future (outside allowed timeframe) - BLOCK ALL FUTURE MATCHES
    const matchDate = new Date(match.fixture.date);
    const nextMondayEndOfDay = getNextMondayEndOfDay();
    
    // For all leagues, only allow betting until Monday 23:59
    if (matchDate > nextMondayEndOfDay) {
      toast({
        title: 'Apuesta no disponible',
        description: 'Solo se pueden apostar partidos de la semana actual. Las apuestas para este partido no están disponibles aún.',
        variant: 'destructive',
      });
      return;
    }

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
    
    // Try exact match first - search through ALL bookmakers
    for (const bookmaker of match.bookmakers) {
      const market = bookmaker.bets.find(bet => bet.name === marketName);
      if (market) {
        return market;
      }
    }
    
    // Try flexible matching for common market variations
    const marketVariations: Record<string, string[]> = {
      'Both Teams To Score': ['Both Teams To Score', 'Both Teams Score', 'BTTS', 'Both Teams To Score (Yes/No)'],
      'Correct Score': ['Correct Score', 'Exact Score', 'Score', 'Correct Score (0-0)'],
      'Match Winner': ['Match Winner', '1X2', 'Full Time Result', 'Match Result'],
      'Goals Over/Under': ['Goals Over/Under', 'Over/Under Goals', 'Total Goals', 'Goals O/U'],
      'Double Chance': ['Double Chance', '1X2 Double Chance', 'Double Chance (1X)'],
      'First Half Winner': ['First Half Winner', '1st Half Winner', 'Half Time Winner', 'HT Winner'],
      'Second Half Winner': ['Second Half Winner', '2nd Half Winner', 'Second Half Result'],
      'HT/FT Double': ['HT/FT Double', 'Half Time/Full Time', 'HT/FT', 'Half Time Full Time', 'Half Time/Full Time Double', 'HT FT Double'],
      'Result/Total Goals': ['Result/Total Goals', 'Result & Total Goals', 'Match Result & Total Goals'],
      'Result/Both Teams Score': ['Result/Both Teams Score', 'Result & Both Teams Score', 'Match Result & BTTS']
    };
    
    const variations = marketVariations[marketName] || [];
    for (const variation of variations) {
      for (const bookmaker of match.bookmakers) {
        const market = bookmaker.bets.find(bet => bet.name === variation);
        if (market) {
          return market;
        }
      }
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
        return 'Combinada';
      } else {
        // For single bets, use market_bets field
        if (bet.market_bets) {
          return bet.market_bets;
        }
        // For combo bets with selections, use the market from bet_selections
        const selection = bet.bet_selections?.[0];
        return selection ? selection.market : 'Apuesta';
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
      if (bet.bet_type === 'single' && bet.fixture_id === fixtureId && bet.bet_selection && bet.market_bets) {
        const parts = bet.bet_selection.split(' @ ');
        if (parts.length >= 1) {
          const betSelection = parts[0].trim();
          return bet.market_bets === marketName && betSelection === selection;
        }
      }
      return false;
    });
  };

  // Get matches by league
  const getMatchesByLeague = (league: string) => {
    const leagueMap: Record<string, number> = {
      'primera': 140,
      
      'champions': 2,
      'europa': 3,
      'liga-mx': 262
    };
    const leagueId = leagueMap[league];
    
    return matches.filter(match => match.teams?.league_id === leagueId);
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

  // Calculate next Tuesday at 00:00 for European competitions
  const getNextTuesdayStart = () => {
    const now = new Date();
    const nextTuesday = new Date(now);
    const daysUntilTuesday = (2 + 7 - now.getDay()) % 7; // 0 = Sunday, 2 = Tuesday
    nextTuesday.setDate(now.getDate() + (daysUntilTuesday === 0 ? 7 : daysUntilTuesday));
    nextTuesday.setHours(0, 0, 0, 0);
    return nextTuesday;
  };

  // Filter matches by date
  const nextMondayEndOfDay = getNextMondayEndOfDay();
  const nextTuesdayStart = getNextTuesdayStart();
  const leagueMatches = getMatchesByLeague(selectedLeague);
  
  // Declare variables outside the conditional block
  let upcomingMatches: MatchData[];
  let futureMatches: MatchData[];
  
  // For Champions and Europa League: show all matches, separate by betting availability
  if (selectedLeague === 'champions' || selectedLeague === 'europa') {
    upcomingMatches = leagueMatches.filter(match => new Date(match.fixture.date) <= nextMondayEndOfDay);
    futureMatches = leagueMatches.filter(match => new Date(match.fixture.date) >= nextTuesdayStart);
  } else {
    // For other leagues: use original logic
    upcomingMatches = leagueMatches.filter(match => new Date(match.fixture.date) <= nextMondayEndOfDay);
    futureMatches = leagueMatches.filter(match => new Date(match.fixture.date) > nextMondayEndOfDay);
  }

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
            <AccordionItem 
              value={`${sectionKey}-match-${match.fixture.id}`} 
              key={match.fixture.id} 
              className="border rounded-lg p-1 sm:p-4 bg-card shadow-sm w-full max-w-none"
              id={`accordion-${sectionKey}-${match.fixture.id}`}
            >
              <AccordionTrigger>
                <div className="text-left w-full">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm sm:text-lg text-foreground">{match.teams?.home?.name ?? 'Local'} vs {match.teams?.away?.name ?? 'Visitante'}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{new Date(match.fixture.date).toLocaleString()}</p>
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
                <div className="space-y-3 sm:space-y-6 pt-1 sm:pt-4">
                  {/* Check if match is in the future (outside allowed timeframe) */}
                  {(() => {
                    const matchDate = new Date(match.fixture.date);
                    const nextMondayEndOfDay = getNextMondayEndOfDay();
                    const nextTuesdayStart = getNextTuesdayStart();
                    
                    // For Champions and Europa League: show future matches but without betting options
                    if ((selectedLeague === 'champions' || selectedLeague === 'europa') && matchDate >= nextTuesdayStart) {
                      return (
                        <div className="text-center py-8 text-muted-foreground">
                          <p className="text-lg font-medium mb-2">Próximos encuentros</p>
                          <p>Las apuestas para este partido estarán disponibles próximamente.</p>
                        </div>
                      );
                    }
                    
                    // For all leagues: block betting after Monday 23:59
                    if (matchDate > nextMondayEndOfDay) {
                      return (
                        <div className="text-center py-8 text-muted-foreground">
                          <p className="text-lg font-medium mb-2">Apuesta no disponible</p>
                          <p>Solo se pueden apostar partidos de la semana actual.</p>
                        </div>
                      );
                    }
                    
                    // Show normal betting options for current week matches
                    return (
                      <>
                        {getBetTypesSorted().map(betType => {
                          const market = findMarket(match, betType.apiName);
                          
                          // Debug HT/FT Double specifically
                          if (betType.apiName === 'HT/FT Double') {
                            console.log('=== HT/FT DOUBLE DEBUG ===');
                            console.log('Looking for market:', betType.apiName);
                            console.log('Market found:', !!market);
                            if (market) {
                              console.log('Market values:', market.values);
                            } else {
                              console.log('Available markets:', match.bookmakers?.[0]?.bets.map(b => b.name));
                            }
                          }
                          
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
                      </>
                    );
                  })()}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    );
  };

  const renderLeagueContent = () => {
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

    if (leagueMatches.length === 0) {
      return (
        <div className="flex-grow text-center p-8 bg-card rounded-lg shadow">
          <p className="text-muted-foreground">No hay partidos con cuotas disponibles en esta liga en este momento.</p>
        </div>
      );
    }

    return (
      <div className="flex-grow space-y-8">
        {/* Main section: matches up to next Monday 23:59 */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">Cuotas en Vivo</h2>
          {renderMatchesSection(upcomingMatches, 'upcoming')}
        </div>

        {/* Future matches section: matches after next Monday 23:59 */}
        {futureMatches.length > 0 && (
          <>
            <div className="border-t border-border my-8"></div>
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">Próximos Encuentros</h2>
              {renderMatchesSection(futureMatches, 'future')}
            </div>
          </>
        )}
      </div>
    );
  };

  // Function to get available tabs based on available leagues
  const getAvailableTabs = () => {
    const tabs = [];
    
    if (availableLeagues.includes(140)) {
      tabs.push({ value: 'primera', label: 'La Liga - Primera', leagueId: 140 });
    }
    if (availableLeagues.includes(2)) {
      tabs.push({ value: 'champions', label: 'Champions League', leagueId: 2 });
    }
    if (availableLeagues.includes(3)) {
      tabs.push({ value: 'europa', label: 'Europa League', leagueId: 3 });
    }
    if (availableLeagues.includes(262)) {
      tabs.push({ value: 'liga-mx', label: 'Liga MX', leagueId: 262 });
    }
    
    return tabs;
  };

  const renderContent = () => {
    const availableTabs = getAvailableTabs();
    
    // If current selected league is not available, switch to the first available one
    if (availableTabs.length > 0 && !availableTabs.find(tab => tab.value === selectedLeague)) {
      setSelectedLeague(availableTabs[0].value as 'primera' | 'champions' | 'europa' | 'liga-mx');
    }
    
    return (
      <Tabs value={selectedLeague} onValueChange={(value) => setSelectedLeague(value as 'primera' | 'champions' | 'europa' | 'liga-mx')} className="w-full">
        <TabsList className={`grid w-full mb-6 gap-2 h-auto ${availableTabs.length <= 2 ? 'grid-cols-2' : availableTabs.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
          {availableTabs.map((tab) => {
            const getTabStyle = (value: string) => {
              switch (value) {
                case 'primera':
                  return {
                    background: `
                      linear-gradient(45deg, 
                        #C60B1E 0%, #C60B1E 33%, 
                        #FFC400 33%, #FFC400 66%, 
                        #C60B1E 66%, #C60B1E 100%
                      )
                    `,
                    opacity: '0.15'
                  };
                case 'champions':
                  return {
                    background: `
                      linear-gradient(45deg, 
                        #1e40af 0%, #1e40af 33%, 
                        #1e40af 33%, #1e40af 66%, 
                        #ffffff 66%, #ffffff 100%
                      )
                    `,
                    opacity: '0.4'
                  };
                case 'europa':
                  return {
                    background: `
                      linear-gradient(45deg, 
                        #1e40af 0%, #1e40af 33%, 
                        #1e40af 33%, #1e40af 66%, 
                        #10b981 66%, #10b981 100%
                      )
                    `,
                    opacity: '0.4'
                  };
                case 'liga-mx':
                  return {
                    background: `
                      linear-gradient(45deg, 
                        #006847 0%, #006847 33.33%, 
                        #FFFFFF 33.33%, #FFFFFF 66.66%, 
                        #CE1126 66.66%, #CE1126 100%
                      )
                    `,
                    opacity: '0.4'
                  };
                default:
                  return { background: '', opacity: '0.1' };
              }
            };

            const tabStyle = getTabStyle(tab.value);

            return (
              <TabsTrigger 
                key={tab.value}
                value={tab.value} 
                className="relative overflow-hidden data-[state=active]:ring-2 data-[state=active]:ring-[#FFC72C] data-[state=active]:ring-offset-2"
              >
                {/* Franjas de fondo */}
                <div 
                  className="absolute inset-0"
                  style={tabStyle}
                />
                {/* Texto por encima */}
                <span className="relative z-10 text-black font-semibold text-xs sm:text-sm leading-tight">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
        {availableTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-0">
            {renderLeagueContent()}
          </TabsContent>
        ))}
      </Tabs>
    );
  };

  return (
    <div className="w-full px-2 sm:container sm:mx-auto sm:p-4">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Apuestas</h1>
      
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
        <div className="flex flex-col gap-4 sm:gap-8 w-full">
          <div className="w-full overflow-hidden">
            {renderContent()}
          </div>

          {/* Mobile Bet Slip - Fixed Bottom Bar */}
          <MobileBetSlip 
            selectedBets={selectedBets} 
            onRemoveBet={(betId) => setSelectedBets(prev => prev.filter(bet => bet.id !== betId))}
            onClearAll={() => setSelectedBets([])}
          />
        </div>
      )}
    </div>
  );
};

export default Bets;