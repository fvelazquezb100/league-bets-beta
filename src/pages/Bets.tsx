import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { useMatchOdds, type MatchData, type BetValue } from '@/hooks/useMatchOdds';
import { useUserBets, type UserBet } from '@/hooks/useUserBets';
import { useAvailableLeagues } from '@/hooks/useAvailableLeagues';
import { useCombinedMatchAvailability } from '@/hooks/useCombinedMatchAvailability';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useBettingSettings } from '@/hooks/useBettingSettings';
import { MagicCard } from '@/components/ui/MagicCard';
import { supabase } from '@/integrations/supabase/client';
import { useCookieConsent } from '@/hooks/useCookieConsent';

// Re-export types from hooks for compatibility
export type { Team, Fixture, Teams, BetValue, BetMarket, Bookmaker, MatchData, CachedOddsData } from '@/hooks/useMatchOdds';
export type { UserBet } from '@/hooks/useUserBets';

const Bets = () => {
  // Local UI state
  const [selectedBets, setSelectedBets] = useState<any[]>([]);
  const { cutoffMinutes, developerMode } = useBettingSettings();
  const [selectedLeague, setSelectedLeague] = useState<'primera' | 'champions' | 'europa' | 'liga-mx' | 'selecciones' | 'coparey' | 'supercopa'>('primera');
  const [openId, setOpenId] = useState<number | null>(null);
  const { consent } = useCookieConsent();

  useEffect(() => {
    const pageTitle = 'Jambol — Partidos';
    const description = 'Explora los mejores partidos disponibles en Jambol. Participa en partidos de La Liga, Champions League, Europa League y más ligas.';
    const keywords = 'jambol, partidos, ligas, la liga, champions league, europa league, liga mx, selecciones, copa del rey, participar';

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

  // Hooks
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { data: userProfile } = useUserProfile(user?.id);

  // React Query hooks for data fetching
  const isSelecciones = selectedLeague === 'selecciones';
  const isCoparey = selectedLeague === 'coparey';
  const isSupercopa = selectedLeague === 'supercopa';
  // Selecciones uses id=3, Copa del Rey uses id=5, Supercopa uses id=7, main leagues use id=1
  const getSourceId = (): 1 | 3 | 5 | 7 => {
    if (isSelecciones) return 3;
    if (isCoparey) return 5;
    if (isSupercopa) return 7;
    return 1;
  };
  const { data: matches = [], isLoading: matchesLoading, error: matchesError } = useMatchOdds(getSourceId());
  const { data: userBets = [], isLoading: userBetsLoading } = useUserBets(user?.id);
  const { data: availableLeagues = [], isLoading: leaguesLoading } = useAvailableLeagues(user?.id);
  const { data: matchAvailability = [], isLoading: availabilityLoading } = useCombinedMatchAvailability(
    userProfile?.league_id,
    isSelecciones ? null : 10
  );

  // Get current week from league
  const { data: currentWeek } = useQuery({
    queryKey: ['league-week', userProfile?.league_id],
    enabled: !!userProfile?.league_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leagues')
        .select('week')
        .eq('id', userProfile!.league_id)
        .maybeSingle();
      if (error) throw error;
      return data?.week ?? 1;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Get blocked fixtures for current user
  const { data: blockedFixtures = [] } = useQuery<number[]>({
    queryKey: ['blocked-fixtures', user?.id, userProfile?.league_id, currentWeek],
    enabled: !!user?.id && !!userProfile?.league_id && !!currentWeek,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_blocks')
        .select('fixture_id')
        .eq('blocked_user_id', user!.id)
        .eq('league_id', userProfile!.league_id)
        .eq('week', currentWeek!)
        .eq('status', 'active');
      if (error) throw error;
      return data?.map(b => b.fixture_id) ?? [];
    },
  });

  // Load SuperAdmin toggle to control Selecciones tab visibility
  const { data: seleccionesEnabled = false, isLoading: seleccionesLoading } = useQuery({
    queryKey: ['betting-setting', 'enable_selecciones'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('betting_settings' as any)
        .select('setting_value' as any)
        .eq('setting_key', 'enable_selecciones')
        .maybeSingle();
      return (((data as any)?.setting_value || 'false') === 'true');
    },
    staleTime: 60_000,
  });

  // Load SuperAdmin toggle to control Copa del Rey tab visibility
  const { data: copareyEnabled = false, isLoading: copareyLoading } = useQuery({
    queryKey: ['betting-setting', 'enable_coparey'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('betting_settings' as any)
        .select('setting_value' as any)
        .eq('setting_key', 'enable_coparey')
        .maybeSingle();
      return (((data as any)?.setting_value || 'false') === 'true');
    },
    staleTime: 60_000,
  });

  // Load SuperAdmin toggle to control Supercopa de España tab visibility
  const { data: supercopaEnabled = false, isLoading: supercopaLoading } = useQuery({
    queryKey: ['betting-setting', 'enable_supercopa'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('betting_settings' as any)
        .select('setting_value' as any)
        .eq('setting_key', 'enable_supercopa')
        .maybeSingle();
      return (((data as any)?.setting_value || 'false') === 'true');
    },
    staleTime: 60_000,
  });

  // Derived loading and error states
  const loading = matchesLoading || userBetsLoading || leaguesLoading || availabilityLoading;
  const error = matchesError ? 'Failed to fetch or parse live betting data. Please try again later.' : null;

  const availabilityMap = useMemo(() => {
    const map = new Map<string, boolean>();
    (matchAvailability || []).forEach(item => {
      if (item?.date) {
        map.set(item.date, item.is_live_betting_enabled);
      }
    });
    return map;
  }, [matchAvailability]);

  // Helper function to check if live betting is enabled for a specific date
  const isLiveBettingEnabled = (matchDate: string): boolean => {
    try {
      // Validate the date string first
      if (!matchDate || typeof matchDate !== 'string') {
        return false;
      }

      const date = new Date(matchDate);

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date provided to isLiveBettingEnabled:', matchDate);
        return false;
      }

      const dateStr = date.toISOString().split('T')[0];
      if (!availabilityMap.has(dateStr)) {
        return false;
      }
      return availabilityMap.get(dateStr) ?? false;
    } catch (error) {
      console.error('Error in isLiveBettingEnabled:', error, 'matchDate:', matchDate);
      return false;
    }
  };

  // Toggle accordion with scroll control
  const toggle = (id: number) => {
    setOpenId(prev => {
      if (prev === id) {
        // Closing current item
        return null;
      } else {
        // Opening new item - close previous and scroll to new one
        if (prev !== null) {
          // Close previous item first
          setOpenId(null);
          // Wait a bit then open new one and scroll
          setTimeout(() => {
            setOpenId(id);
            scrollToItem(id);
          }, 100);
          return null;
        } else {
          // No previous item, just open and scroll
          setTimeout(() => scrollToItem(id), 50);
          return id;
        }
      }
    });
  };

  // Scroll to specific accordion item
  const scrollToItem = (id: number) => {
    const element = document.getElementById(`accordion-item-${id}`);
    if (element) {
      // Intentar obtener la altura real del header
      const header = document.querySelector('header');
      const headerHeight = header ? header.offsetHeight + 40 : 140; // +40px de margen extra

      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - headerHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  // Data fetching is now handled by React Query hooks above
  // No more manual useEffect needed!


  const handleAddToSlip = (match: MatchData, marketName: string, selection: BetValue) => {
    // For Selecciones, Copa del Rey and Supercopa, allow all matches without date restrictions
    if (selectedLeague === 'selecciones' || selectedLeague === 'coparey' || selectedLeague === 'supercopa') {
      // No date restrictions for Selecciones, Copa del Rey and Supercopa
    } else {
      // Check if match is in the future (outside allowed timeframe) - BLOCK ALL FUTURE MATCHES
      const matchDate = new Date(match.fixture.date);
      const nextMondayEndOfDay = getNextMondayEndOfDay();

      // For all other leagues, only allow betting until Monday 23:59
      // OR if developer mode is active, allow it regardless of time
      if (matchDate > nextMondayEndOfDay && !developerMode) {
        toast({
          title: 'Partido no disponible',
          description: 'Solo se pueden participar en partidos de la semana actual. Las opciones para este partido no están disponibles aún.',
          variant: 'destructive',
        });
        return;
      }
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

    // Check if this bet is already selected in the slip
    const existingBet = selectedBets.find(b => b.id === bet.id);
    if (existingBet) {
      // Remove from slip (toggle off)
      setSelectedBets(prev => prev.filter(b => b.id !== bet.id));
      toast({
        title: 'Selección eliminada',
        description: `${selection.value} eliminada del boleto`,
      });
      return;
    }

    if (selectedBets.some(b => b.fixtureId === bet.fixtureId)) {
      toast({
        title: 'Error',
        description: 'Solo puedes añadir una selección por partido en un boleto combinado.',
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
          return getBettingTranslation(bet.market_bets);
        }
        // For combo bets with selections, use the market from bet_selections
        const selection = bet.bet_selections?.[0];
        return selection ? getBettingTranslation(selection.market) : 'Boleto';
      }
    }).join(', ');
  };

  const hasUserBetOnMarket = (fixtureId: number, marketName: string, selection: string) => {
    // Only check if this selection is in the current slip (selectedBets)
    // Do NOT check placed bets from database
    return selectedBets.some(bet =>
      bet.fixtureId === fixtureId && bet.market === marketName && bet.selection === selection
    );
  };

  // Get matches by league
  const getMatchesByLeague = (league: string) => {
    const leagueMap: Record<string, number> = {
      'primera': 140,

      'champions': 2,
      'europa': 3,
      'liga-mx': 262,
      'selecciones': 557,
      'coparey': 143,
      'supercopa': 556
    };
    const leagueId = leagueMap[league];
    if (!leagueId) return matches;
    
    // For Selecciones, Copa del Rey and Supercopa, we can't filter by league_id in match.teams
    // because they might not have a consistent league_id. So we return all matches
    // The filtering is handled by availableLeagues check in getAvailableTabs()
    if (league === 'selecciones' || league === 'coparey' || league === 'supercopa') {
      return matches;
    }
    
    return matches.filter(match => match.teams?.league_id === leagueId);
  };

  // Calculate next Monday at 23:59 (end of betting week)
  const getNextMondayEndOfDay = () => {
    const now = new Date();
    const nextMonday = new Date(now);
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Calculate days until next Monday
    let daysUntilMonday;
    if (currentDay === 0) { // Sunday
      daysUntilMonday = 1; // Next day is Monday
    } else if (currentDay === 1) { // Monday
      daysUntilMonday = 0; // Today is Monday
    } else { // Tuesday to Saturday
      daysUntilMonday = (8 - currentDay) % 7; // Days until next Monday
    }

    nextMonday.setDate(now.getDate() + daysUntilMonday);
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

  // Filter matches by availability control
  const leagueMatches = getMatchesByLeague(selectedLeague);

  // Separate matches by live betting availability
  const liveBettingMatches: MatchData[] = [];
  const upcomingMatches: MatchData[] = [];

  leagueMatches.forEach(match => {
    const date = new Date(match.fixture.date);
    if (isNaN(date.getTime())) {
      return;
    }

    const dateStr = date.toISOString().split('T')[0];
    const hasAvailability = availabilityMap.has(dateStr);
    const isEnabled = availabilityMap.get(dateStr) ?? false;

    // All leagues use the same availability logic:
    // - Show in "Partidos disponibles" if date is enabled OR developer mode is active
    // - Show in "Próximos encuentros" if date is not enabled
    if (isEnabled || developerMode) {
      liveBettingMatches.push(match);
    } else {
      upcomingMatches.push(match);
    }
  });

  const renderMatchesSection = (matchesToRender: MatchData[], sectionKey: string, showOdds: boolean = true) => {
    if (matchesToRender.length === 0) {
      return (
        <div className="text-center p-8 bg-card rounded-lg shadow">
          <p className="text-muted-foreground">No hay partidos disponibles en esta sección.</p>
        </div>
      );
    }

    return (
      <div className="w-full space-y-4">
        {matchesToRender.map((match) => {
          const kickoff = new Date(match.fixture.date);
          const freezeTime = new Date(kickoff.getTime() - cutoffMinutes * 60 * 1000);
          const isFrozen = developerMode ? false : new Date() >= freezeTime;


          return (
            <MagicCard
              key={match.fixture.id}
              enableStars={true}
              enableSpotlight={true}
              enableBorderGlow={true}
              enableTilt={false}
              clickEffect={false}
              enableMagnetism={false}
              particleCount={6}
              glowColor="255, 199, 44"
              className="border rounded-lg p-1 sm:p-4 bg-card shadow-sm w-full max-w-none"
              style={{ '--match-id': match.fixture.id } as React.CSSProperties}
            >
              <div id={`accordion-item-${match.fixture.id}`}>
                <button
                  onClick={() => toggle(match.fixture.id)}
                  className="w-full text-left flex items-center justify-between p-2 hover:bg-muted/50 rounded-md transition-colors"
                >
                  <div className="text-left w-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm sm:text-lg text-foreground">{match.teams?.home?.name ?? 'Local'} vs {match.teams?.away?.name ?? 'Visitante'}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">{new Date(match.fixture.date).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getBetsForFixture(match.fixture.id).length > 0 && (
                          <Badge variant="secondary" className="ml-2 bg-white text-black border-2 border-[#FFC72C] hover:bg-white focus:bg-white focus:ring-0 focus:ring-offset-0 cursor-default pointer-events-none">
                            {getBetsForFixture(match.fixture.id).length} boleto{getBetsForFixture(match.fixture.id).length > 1 ? 's' : ''}
                          </Badge>
                        )}
                        <svg
                          className={`w-4 h-4 transition-transform duration-200 ${openId === match.fixture.id ? 'rotate-180' : ''
                            }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {getBetPreview(match.fixture.id) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Tus boletos: {getBetPreview(match.fixture.id)}
                      </p>
                    )}
                  </div>
                </button>

                {openId === match.fixture.id && (
                  <div className="space-y-3 sm:space-y-6 pt-1 sm:pt-4 animate-in slide-in-from-top-2 duration-200">
                    {/* Check if live betting is enabled for this match */}
                    {(() => {
                      // If showOdds is false, show upcoming matches without betting options
                      if (!showOdds) {
                        return (
                          <div className="text-center py-8 text-muted-foreground">
                            <p className="text-lg font-medium mb-2">Próximos encuentros</p>
                            <p>Las opciones para este partido estarán disponibles próximamente.</p>
                          </div>
                        );
                      }

                      // Check if this match is blocked for the user
                      if (blockedFixtures.includes(match.fixture.id)) {
                        return (
                          <div className="text-center py-8 text-muted-foreground">
                            <p className="text-lg font-medium mb-2 text-red-500">Te han bloqueado este partido</p>
                            <p>No puedes hacer selecciones en este partido porque otro usuario de tu liga lo ha bloqueado.</p>
                          </div>
                        );
                      }

                      // Check if lower level blocking (live betting check) applies
                      // If Developer Mode is ON, we bypass this check to show everything
                      if (!developerMode && !isLiveBettingEnabled(match.fixture.date)) {
                        return (
                          <div className="text-center py-8 text-muted-foreground">
                            <p className="text-lg font-medium mb-2">Próximos encuentros</p>
                            <p>Las opciones para este partido estarán disponibles próximamente.</p>
                          </div>
                        );
                      }

                      // Show normal betting options for current week matches
                      // Check if there are any bookmakers available
                      if (!match.bookmakers || match.bookmakers.length === 0) {
                        return (
                          <div className="text-center py-8 text-muted-foreground">
                            <p>No hay opciones disponibles para este partido.</p>
                          </div>
                        );
                      }

                      return (
                        <>
                          {getBetTypesSorted().map(betType => {
                            const market = findMarket(match, betType.apiName);

                            // Special case for Result/Total Goals - always show even if market not found
                            // The component will calculate odds internally
                            if (betType.apiName === 'Result/Total Goals') {
                              return (
                                <BetMarketSection
                                  key={betType.apiName}
                                  match={match}
                                  betType={betType}
                                  market={market || { id: 0, name: 'Result/Total Goals', values: [] }}
                                  isFrozen={isFrozen}
                                  hasUserBetOnMarket={hasUserBetOnMarket}
                                  handleAddToSlip={handleAddToSlip}
                                />
                              );
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
                              <p>No hay opciones disponibles para este partido.</p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </MagicCard>
          )
        })}
      </div>
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
          <p className="text-muted-foreground">No hay partidos disponibles en esta liga en este momento.</p>
        </div>
      );
    }

    return (
      <div className="flex-grow space-y-8">
        {/* Main section: matches up to next Monday 23:59 */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">Partidos disponibles</h2>
          {renderMatchesSection(liveBettingMatches, 'live-betting', true)}
        </div>

        {/* Upcoming matches section: matches without live betting */}
        {upcomingMatches.length > 0 && (
          <>
            <div className="border-t border-border my-8"></div>
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">Próximos Encuentros</h2>
              {renderMatchesSection(upcomingMatches, 'upcoming', false)}
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
    // Add Selecciones tab only if enabled via betting_settings AND available_leagues includes it
    if (seleccionesEnabled && availableLeagues.includes(557)) {
      tabs.push({ value: 'selecciones', label: 'Selecciones', leagueId: 557 });
    }
    // Add Copa del Rey tab only if enabled via betting_settings AND available_leagues includes it
    if (copareyEnabled && availableLeagues.includes(143)) {
      tabs.push({ value: 'coparey', label: 'Copa del Rey', leagueId: 143 });
    }
    // Add Supercopa de España tab only if enabled via betting_settings AND available_leagues includes it
    if (supercopaEnabled && availableLeagues.includes(556)) {
      tabs.push({ value: 'supercopa', label: 'Supercopa España', leagueId: 556 });
    }

    return tabs;
  };

  const renderContent = () => {
    const availableTabs = getAvailableTabs();

    // Don't render tabs until leagues are loaded
    if (leaguesLoading || seleccionesLoading || copareyLoading || supercopaLoading || availableTabs.length === 0) {
      return (
        <div className="w-full">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      );
    }

    // If current selected league is not available, switch to the first available one
    if (availableTabs.length > 0 && !availableTabs.find(tab => tab.value === selectedLeague)) {
      setSelectedLeague(availableTabs[0].value as 'primera' | 'champions' | 'europa' | 'liga-mx' | 'selecciones' | 'coparey' | 'supercopa');
    }

    return (
      <Tabs value={selectedLeague} onValueChange={(value) => setSelectedLeague(value as 'primera' | 'champions' | 'europa' | 'liga-mx' | 'selecciones' | 'coparey' | 'supercopa')} className="w-full">
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
                case 'selecciones':
                  return {
                    background: `
                      linear-gradient(45deg,
                        #004C99 0%, #004C99 66.66%,
                        #FFD200 66.66%, #FFD200 100%
                      )
                    `,
                    opacity: '0.4'
                  };
                case 'coparey':
                  return {
                    background: `
                      linear-gradient(45deg,
                        #CE1126 0%, #CE1126 33.33%,
                        #FFD200 33.33%, #FFD200 66.66%,
                        #CE1126 66.66%, #CE1126 100%
                      )
                    `,
                    opacity: '0.4'
                  };
                case 'supercopa':
                  return {
                    background: `
                      linear-gradient(45deg,
                        #CE1126 0%, #CE1126 33.33%,
                        #FFD200 33.33%, #FFD200 66.66%,
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
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Ligas</h1>

      {/* Desktop Layout */}
      {!isMobile ? (
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-grow">
            {renderContent()}
          </div>
          <div className="w-full md:w-1/3 md:sticky md:top-32 md:self-start z-40">
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