import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useCombinedMatchAvailability } from '@/hooks/useCombinedMatchAvailability';
import { useBettingSettings } from '@/hooks/useBettingSettings';
import { supabase } from '@/integrations/supabase/client';
import { MagicCard } from '@/components/ui/MagicCard';
import BetSlip from '@/components/BetSlip';
import MobileBetSlip from '@/components/MobileBetSlip';
import BetMarketSection from '@/components/BetMarketSection';
import { getBetTypesSorted } from '@/utils/betTypes';
import { getBettingTranslation } from '@/utils/bettingTranslations';
import { useLiveSupercopaCache } from '@/hooks/useLiveSupercopaCache';
import { type MatchData, type BetValue } from '@/hooks/useMatchOdds';
import { useUserBets, type UserBet } from '@/hooks/useUserBets';
import { useLiveMatchesConfig } from '@/hooks/useLiveMatchesConfig';
import { useLiveMatchesEnabled } from '@/hooks/useLiveMatchesEnabled';
import { recordLiveMatchesCall } from '@/hooks/useLiveMatchesMonitoring';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const LiveBets = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { cutoffMinutes, developerMode } = useBettingSettings();
  const [openTooltipId, setOpenTooltipId] = useState<string | null>(null);

  const [selectedBets, setSelectedBets] = useState<any[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    document.title = 'Jambol — Partidos en directo';
  }, []);

  const { data: userProfile } = useUserProfile(user?.id);

  const { data: liveEnabled = false, isLoading: enabledLoading } = useLiveMatchesEnabled();

  // Redirect if live matches are disabled
  const navigate = useNavigate();
  useEffect(() => {
    if (!enabledLoading && !liveEnabled) {
      navigate('/home', { replace: true });
    }
  }, [liveEnabled, enabledLoading, navigate]);
  const { data: liveConfig = [], isLoading: configLoading } = useLiveMatchesConfig();
  // Base list: selected fixtures configured by SuperAdmin
  const baseMatches: MatchData[] = useMemo(() => {
    return (liveConfig || [])
      .filter((c) => c?.fixture_id && c?.kickoff_time && c?.home_team && c?.away_team)
      .map((c: any) => ({
        fixture: { id: c.fixture_id, date: c.kickoff_time } as any,
        league: c.league_id || c.league_name ? ({ id: c.league_id, name: c.league_name } as any) : (undefined as any),
        teams: {
          home: { id: 0, name: c.home_team, logo: '' },
          away: { id: 0, name: c.away_team, logo: '' },
          league_id: c.league_id,
          league_name: c.league_name,
        } as any,
        bookmakers: [],
      }))
      .sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime());
  }, [liveConfig]);
  // Live overlay: live odds snapshot from match_odds_cache (id=9), updated by a single leader client
  const { matches: liveMatches = [] } = useLiveSupercopaCache();
  const { data: userBets = [], isLoading: userBetsLoading } = useUserBets(user?.id);

  const { data: matchAvailability = [], isLoading: availabilityLoading } = useCombinedMatchAvailability(
    userProfile?.league_id,
    10,
  );

  const availabilityMap = useMemo(() => {
    const map = new Map<string, boolean>();
    (matchAvailability || []).forEach(item => {
      if (item?.date) {
        map.set(item.date, item.is_live_betting_enabled);
      }
    });
    return map;
  }, [matchAvailability]);

  // Same availability logic as Bets.tsx
  const isLiveBettingEnabled = (matchDate: string): boolean => {
    try {
      const date = new Date(matchDate);
      if (isNaN(date.getTime())) return false;
      const dateStr = date.toISOString().split('T')[0];
      if (!availabilityMap.has(dateStr)) return false;
      return (availabilityMap.get(dateStr) ?? false) || developerMode;
    } catch {
      return false;
    }
  };

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

  const loading = enabledLoading || configLoading || userBetsLoading || availabilityLoading;

  // Scroll to specific accordion item
  const scrollToItem = (id: number) => {
    const element = document.getElementById(`accordion-item-${id}`);
    if (element) {
      const header = document.querySelector('header');
      const headerHeight = header ? header.offsetHeight + 40 : 140;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({ top: elementPosition - headerHeight, behavior: 'smooth' });
    }
  };

  const toggle = (id: number) => {
    setOpenId(prev => {
      if (prev === id) return null;
      setTimeout(() => scrollToItem(id), 50);
      return id;
    });
  };

  // ---------------------------------------------------------------------------
  // Leader election: only ONE connected client invokes the Edge Function every 20s.
  // Others only read from match_odds_cache (id=9) via realtime.
  // No users connected => no polling => no API calls.
  // ---------------------------------------------------------------------------
  const presenceKey = useMemo(() => {
    const rnd =
      (globalThis as any)?.crypto?.randomUUID?.() ??
      `${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
    return `${user?.id ?? 'anon'}:${rnd}`;
  }, [user?.id]);

  const [isLeader, setIsLeader] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    if (!liveEnabled) {
      setIsLeader(false);
      return;
    }

    const channel = supabase.channel('presence-live-matches', {
      config: {
        presence: { key: presenceKey },
      },
    });

    const recomputeLeader = () => {
      const state = channel.presenceState() as Record<string, any>;
      const keys = Object.keys(state);
      if (keys.length === 0) {
        setIsLeader(false);
        return;
      }
      // Choose earliest "online_at" meta if present; else deterministic by key.
      const candidates = keys.map((k) => {
        const meta = state[k]?.[0] ?? state[k]?.metas?.[0] ?? null;
        const onlineAt = meta?.online_at ?? meta?.phx_ref ?? '';
        return { key: k, onlineAt: String(onlineAt) };
      });
      candidates.sort((a, b) => {
        if (a.onlineAt < b.onlineAt) return -1;
        if (a.onlineAt > b.onlineAt) return 1;
        return a.key.localeCompare(b.key);
      });
      setIsLeader(candidates[0].key === presenceKey);
    };

    channel
      .on('presence', { event: 'sync' }, recomputeLeader)
      .on('presence', { event: 'join' }, recomputeLeader)
      .on('presence', { event: 'leave' }, recomputeLeader);

    channel.subscribe(async (status) => {
      if (status !== 'SUBSCRIBED') return;
      await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
      recomputeLeader();
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, presenceKey, liveEnabled]);

  useEffect(() => {
    if (!isLeader) return;
    if (!liveEnabled) return;
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let wasLiveSeen = false;

    const tick = async () => {
      if (cancelled) return;
      // Only poll when there's at least one configured match within 5 hours (or already started)
      const now = Date.now();
      const hasWatchTarget = (liveConfig || []).some((c: any) => {
        const t = new Date(c?.kickoff_time).getTime();
        if (!Number.isFinite(t)) return false;
        const diff = t - now;
        return diff <= 5 * 60 * 60 * 1000; // within 5h or already started
      });
      if (!hasWatchTarget) return;

      // Only the leader invokes the Edge Function. It will update match_odds_cache (id=9/10).
      const res = await supabase.functions.invoke('live-matches-odds').catch(() => null);
      const liveFixtureIds = (res as any)?.data?.live_fixture_ids;

      // Record the call for monitoring
      if (Array.isArray(liveFixtureIds)) {
        recordLiveMatchesCall(liveFixtureIds);
      }

      // Only consider live fixtures among the ones configured in the SuperAdmin panel
      if (Array.isArray(liveFixtureIds) && liveFixtureIds.length > 0) {
        wasLiveSeen = true;
      }

      // Stop immediately when there are no live fixtures AFTER we already had a live fixture
      if (Array.isArray(liveFixtureIds) && liveFixtureIds.length === 0 && wasLiveSeen && intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    // run immediately, then every 20s
    tick();
    intervalId = setInterval(tick, 20_000);
    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
  }, [isLeader, liveEnabled, liveConfig]);

  // Tick so countdown can update
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const formatCountdown = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const handleAddToSlip = (match: MatchData, marketName: string, selection: BetValue) => {
    // Live page: allow placing bets even if match already started (no kickoff freeze)
    if (!isLiveBettingEnabled(match.fixture.date)) {
      toast({
        title: 'Partido no disponible',
        description: 'Este partido no está habilitado hoy según la disponibilidad de partidos.',
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

    const existingBet = selectedBets.find(b => b.id === bet.id);
    if (existingBet) {
      setSelectedBets(prev => prev.filter(b => b.id !== bet.id));
      toast({ title: 'Selección eliminada', description: `${selection.value} eliminada del boleto` });
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
    toast({ title: 'Selección añadida', description: `${selection.value} @ ${selection.odd}` });
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
    return (userBets as UserBet[]).filter(bet =>
      bet.fixture_id === fixtureId ||
      (bet.bet_type === 'combo' && bet.bet_selections?.some(sel => sel.fixture_id === fixtureId))
    );
  };

  const formatDoubleChanceSelection = (selection: string, market: string, homeTeam?: string, awayTeam?: string): string => {
    if (market?.toLowerCase() !== 'doble oportunidad' && market?.toLowerCase() !== 'double chance') {
      return '';
    }
    
    const selectionLower = selection.toLowerCase();
    
    // Handle different formats: "home/draw", "local/empate", "1X", etc.
    if (selectionLower.includes('/')) {
      const parts = selection.split('/').map(p => p.trim());
      const result: string[] = [];
      
      for (const part of parts) {
        const partLower = part.toLowerCase();
        if (partLower.includes('home') || partLower.includes('local') || partLower === '1') {
          result.push(homeTeam || 'Local');
        } else if (partLower.includes('away') || partLower.includes('visitante') || partLower === '2') {
          result.push(awayTeam || 'Visitante');
        } else if (partLower.includes('draw') || partLower.includes('empate') || partLower === 'x') {
          result.push('Empate');
        } else {
          result.push(getBettingTranslation(part));
        }
      }
      
      return result.join(' o ');
    }
    
    // Handle "1X", "X2", "12" format
    if (selectionLower === '1x' || selectionLower === 'x1') {
      return `${homeTeam || 'Local'} o Empate`;
    } else if (selectionLower === 'x2' || selectionLower === '2x') {
      return `Empate o ${awayTeam || 'Visitante'}`;
    } else if (selectionLower === '12' || selectionLower === '21') {
      return `${homeTeam || 'Local'} o ${awayTeam || 'Visitante'}`;
    }
    
    return '';
  };

  const formatResultTotalGoalsSelection = (selection: string, homeTeam?: string, awayTeam?: string): string => {
    if (!selection.includes('/')) {
      return '';
    }
    
    const parts = selection.split('/').map(p => p.trim());
    if (parts.length !== 2) {
      return '';
    }
    
    const [resultPart, overUnderPart] = parts;
    const resultPartLower = resultPart.toLowerCase();
    const overUnderPartLower = overUnderPart.toLowerCase();
    
    // Format result part
    let resultText = '';
    if (resultPartLower.includes('home') || resultPartLower.includes('local')) {
      resultText = homeTeam || 'Local';
    } else if (resultPartLower.includes('away') || resultPartLower.includes('visitante')) {
      resultText = awayTeam || 'Visitante';
    } else if (resultPartLower.includes('draw') || resultPartLower.includes('empate')) {
      resultText = 'Empate';
    } else {
      resultText = getBettingTranslation(resultPart);
    }
    
    // Format over/under part
    let overUnderText = '';
    if (overUnderPartLower.includes('over') || overUnderPartLower.includes('más')) {
      const thresholdMatch = overUnderPart.match(/([0-9]+(?:\.[0-9]+)?)/);
      if (thresholdMatch) {
        overUnderText = `Más de ${thresholdMatch[1]}`;
      } else {
        overUnderText = getBettingTranslation(overUnderPart);
      }
    } else if (overUnderPartLower.includes('under') || overUnderPartLower.includes('menos')) {
      const thresholdMatch = overUnderPart.match(/([0-9]+(?:\.[0-9]+)?)/);
      if (thresholdMatch) {
        overUnderText = `Menos de ${thresholdMatch[1]}`;
      } else {
        overUnderText = getBettingTranslation(overUnderPart);
      }
    } else {
      overUnderText = getBettingTranslation(overUnderPart);
    }
    
    return `${resultText} / ${overUnderText}`;
  };

  const formatHTFTSelection = (selection: string, homeTeam?: string, awayTeam?: string): string => {
    if (!selection.includes('/')) {
      return '';
    }
    
    const parts = selection.split('/').map(p => p.trim());
    if (parts.length !== 2) {
      return '';
    }
    
    const [htPart, ftPart] = parts;
    const htPartLower = htPart.toLowerCase();
    const ftPartLower = ftPart.toLowerCase();
    
    // Format halftime result
    let htText = '';
    if (htPartLower.includes('home') || htPartLower.includes('local')) {
      htText = homeTeam || 'Local';
    } else if (htPartLower.includes('away') || htPartLower.includes('visitante')) {
      htText = awayTeam || 'Visitante';
    } else if (htPartLower.includes('draw') || htPartLower.includes('empate')) {
      htText = 'Empate';
    } else {
      htText = getBettingTranslation(htPart);
    }
    
    // Format fulltime result
    let ftText = '';
    if (ftPartLower.includes('home') || ftPartLower.includes('local')) {
      ftText = homeTeam || 'Local';
    } else if (ftPartLower.includes('away') || ftPartLower.includes('visitante')) {
      ftText = awayTeam || 'Visitante';
    } else if (ftPartLower.includes('draw') || ftPartLower.includes('empate')) {
      ftText = 'Empate';
    } else {
      ftText = getBettingTranslation(ftPart);
    }
    
    return `${htText} / ${ftText}`;
  };

  const getBetTooltip = (bet: any, fixtureId: number, homeTeam?: string, awayTeam?: string): string => {
    if (bet.bet_type === 'combo') {
      // For combo bets, show the selection for this specific fixture
      const selection = bet.bet_selections?.find((sel: any) => sel.fixture_id === fixtureId);
      if (selection) {
        const market = getBettingTranslation(selection.market);
        const marketLower = selection.market?.toLowerCase() || '';
        
        // Handle HT/FT Double specially
        if (marketLower.includes('medio tiempo/final') || marketLower.includes('ht/ft') || marketLower.includes('htft')) {
          const htftText = formatHTFTSelection(selection.selection || '', homeTeam, awayTeam);
          if (htftText) {
            return `${market}: ${htftText}`;
          }
        }
        
        // Handle Result/Total Goals specially
        if (marketLower.includes('resultado/total') || marketLower.includes('result/total')) {
          const resultTotalText = formatResultTotalGoalsSelection(selection.selection || '', homeTeam, awayTeam);
          if (resultTotalText) {
            return `${market}: ${resultTotalText}`;
          }
        }
        
        // Handle Double Chance specially
        if (marketLower.includes('doble oportunidad') || marketLower.includes('double chance')) {
          const doubleChanceText = formatDoubleChanceSelection(selection.selection || '', selection.market || '', homeTeam, awayTeam);
          if (doubleChanceText) {
            return `${market}: ${doubleChanceText}`;
          }
        }
        
        // Extract team name if selection is Home/Away/Draw (for other markets)
        if (selection.selection?.toLowerCase().includes('home') || selection.selection?.toLowerCase().includes('local')) {
          return `${market}: ${homeTeam || 'Local'}`;
        } else if (selection.selection?.toLowerCase().includes('away') || selection.selection?.toLowerCase().includes('visitante')) {
          return `${market}: ${awayTeam || 'Visitante'}`;
        } else if (selection.selection?.toLowerCase().includes('draw') || selection.selection?.toLowerCase().includes('empate')) {
          return `${market}: Empate`;
        }
        const selectionText = getBettingTranslation(selection.selection);
        return `${market}: ${selectionText}`;
      }
      return 'Combinada';
    } else {
      // For single bets
      if (bet.market_bets && bet.bet_selection) {
        const market = getBettingTranslation(bet.market_bets);
        const marketLower = bet.market_bets?.toLowerCase() || '';
        
        // Extract clean selection (remove odds if present)
        let selection = bet.bet_selection;
        if (selection.includes(' @ ')) {
          selection = selection.split(' @ ')[0].trim();
        }
        
        // Handle HT/FT Double specially
        if (marketLower.includes('medio tiempo/final') || marketLower.includes('ht/ft') || marketLower.includes('htft')) {
          const htftText = formatHTFTSelection(selection, homeTeam, awayTeam);
          if (htftText) {
            return `${market}: ${htftText}`;
          }
        }
        
        // Handle Result/Total Goals specially
        if (marketLower.includes('resultado/total') || marketLower.includes('result/total')) {
          const resultTotalText = formatResultTotalGoalsSelection(selection, homeTeam, awayTeam);
          if (resultTotalText) {
            return `${market}: ${resultTotalText}`;
          }
        }
        
        // Handle Double Chance specially
        if (marketLower.includes('doble oportunidad') || marketLower.includes('double chance')) {
          const doubleChanceText = formatDoubleChanceSelection(selection, bet.market_bets || '', homeTeam, awayTeam);
          if (doubleChanceText) {
            return `${market}: ${doubleChanceText}`;
          }
        }
        
        // Check if it's Home/Away/Draw to show team name (for other markets)
        if (selection?.toLowerCase().includes('home') || selection?.toLowerCase().includes('local')) {
          return `${market}: ${homeTeam || 'Local'}`;
        } else if (selection?.toLowerCase().includes('away') || selection?.toLowerCase().includes('visitante')) {
          return `${market}: ${awayTeam || 'Visitante'}`;
        } else if (selection?.toLowerCase().includes('draw') || selection?.toLowerCase().includes('empate')) {
          return `${market}: Empate`;
        }
        const selectionText = getBettingTranslation(selection);
        return `${market}: ${selectionText}`;
      }
      if (bet.market_bets) {
        return getBettingTranslation(bet.market_bets);
      }
      return 'Boleto';
    }
  };

  const getBetPreview = (fixtureId: number, match?: MatchData): Array<{ label: string; tooltip: string }> | null => {
    const bets = getBetsForFixture(fixtureId);
    if (bets.length === 0) return null;
    
    const homeTeam = match?.teams?.home?.name;
    const awayTeam = match?.teams?.away?.name;
    
    return bets.map(bet => {
      let label: string;
      if (bet.bet_type === 'combo') {
        label = 'Combinada';
      } else {
        if (bet.market_bets) {
          label = getBettingTranslation(bet.market_bets);
        } else {
          const selection = bet.bet_selections?.[0];
          label = selection ? getBettingTranslation(selection.market) : 'Boleto';
        }
      }
      return {
        label,
        tooltip: getBetTooltip(bet, fixtureId, homeTeam, awayTeam)
      };
    });
  };

  const hasUserBetOnMarket = (fixtureId: number, marketName: string, selection: string) => {
    return selectedBets.some(bet => bet.fixtureId === fixtureId && bet.market === marketName && bet.selection === selection);
  };

  // Merge base fixtures with live odds overlay (by fixture id)
  const mergedMatches: MatchData[] = useMemo(() => {
    const byId = new Map<number, MatchData>();
    const now = Date.now();

    (baseMatches || []).forEach((m) => {
      if (m?.fixture?.id) byId.set(m.fixture.id, m);
    });

    (liveMatches || []).forEach((m: any) => {
      if (!m?.fixture?.id) return;
      const existing = byId.get(m.fixture.id);
      // Prefer live payload for status/is_live + bookmakers when present
      byId.set(m.fixture.id, { ...(existing as any), ...(m as any) });
    });

    return Array.from(byId.values())
      .filter((m) => {
        if (!m?.fixture?.id || !m?.fixture?.date) return false;
        
        const kickoffMs = new Date(m.fixture.date).getTime();
        const isLive = !!((m as any)?.teams?.is_live || (m as any)?.fixture?.is_live);
        
        // Filter out finished matches:
        // If kickoff was more than 3 hours ago AND it's not marked as live, it's probably finished
        const threeHoursAgo = now - (3 * 60 * 60 * 1000);
        if (kickoffMs < threeHoursAgo && !isLive) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime());
  }, [baseMatches, liveMatches]);

  // Separate matches:
  // In "En directo" page, we allow betting on live matches (matches that have started).
  // No freeze time restrictions - the whole point is to bet on matches that are already in play.
  const renderMatches = (matchesToRender: MatchData[]) => {
    return (
      <div className="w-full space-y-4">
        {matchesToRender.map(match => {
          const kickoff = new Date(match.fixture.date);
          const kickoffMs = kickoff.getTime();
          // In "En directo", we never freeze bets - allow betting on live matches
          const isFrozen = false;
          const isLiveFlag = !!((match as any)?.teams?.is_live || (match as any)?.fixture?.is_live);
          // Consider match "in play" if: API says it's live OR kickoff was in the past (match has started)
          const hasStarted = kickoffMs <= nowTick;
          const isLive = isLiveFlag || hasStarted;
          const enabledToday = isLiveBettingEnabled(match.fixture.date);
          // Expandable if: match has started (or is live) AND has bookmakers (odds available) AND enabled today
          const hasOdds = !!(match.bookmakers && match.bookmakers.length > 0);
          const isExpandable = isLive && hasOdds && enabledToday;
          const isUpcoming = !isExpandable;

          const msUntilKickoff = kickoffMs - nowTick;
          const within5h = msUntilKickoff > 0 && msUntilKickoff <= 5 * 60 * 60 * 1000;

          // Handle click on match card
          const handleMatchClick = () => {
            if (!isExpandable) {
              if (!enabledToday) {
                toast({
                  title: 'Partido no habilitado',
                  description: 'Este partido no está habilitado hoy según la disponibilidad de partidos.',
                  variant: 'default',
                });
              } else if (isLive && !hasOdds) {
                toast({
                  title: 'Cuotas no disponibles',
                  description: 'Las cuotas en directo aparecerán cuando el partido esté en juego y haya cuotas disponibles.',
                  variant: 'default',
                });
              } else if (!isLive) {
                toast({
                  title: 'Partido no iniciado',
                  description: 'Este partido aún no ha comenzado. Las apuestas en directo estarán disponibles cuando empiece.',
                  variant: 'default',
                });
              }
              return;
            }
            toggle(match.fixture.id);
          };

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
              className={`border rounded-lg p-1 sm:p-4 shadow-sm w-full max-w-none ${
                isUpcoming ? 'bg-muted/40 opacity-70' : 'bg-card'
              }`}
              style={{ '--match-id': match.fixture.id } as React.CSSProperties}
            >
              <div id={`accordion-item-${match.fixture.id}`}>
                <button
                  onClick={handleMatchClick}
                  disabled={!isExpandable}
                  className={`w-full text-left flex items-center justify-between p-2 rounded-md transition-colors ${
                    isExpandable ? 'hover:bg-muted/50' : 'cursor-not-allowed'
                  }`}
                >
                  <div className="text-left w-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm sm:text-lg text-foreground">
                          {match.teams?.home?.name ?? 'Local'} vs {match.teams?.away?.name ?? 'Visitante'}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {new Date(match.fixture.date).toLocaleString()}
                        </p>
                        {within5h && (
                          <p className="text-xs sm:text-sm mt-1 text-amber-900">
                            Empieza en <span className="font-mono font-semibold">{formatCountdown(msUntilKickoff)}</span>
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getBetsForFixture(match.fixture.id).length > 0 && (
                          <Badge
                            className="ml-2 bg-white dark:bg-card border-2 border-[#FFC72C] text-black dark:text-foreground hover:bg-white dark:hover:bg-card focus:bg-white dark:focus:bg-card focus:ring-0 focus:ring-offset-0 cursor-default pointer-events-none"
                          >
                            {getBetsForFixture(match.fixture.id).length} boleto
                            {getBetsForFixture(match.fixture.id).length > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {isExpandable && (
                          <svg
                            className={`w-4 h-4 transition-transform duration-200 ${openId === match.fixture.id ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    {getBetPreview(match.fixture.id, match) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Tus boletos:{' '}
                        <TooltipProvider delayDuration={isMobile ? 0 : 700}>
                          {getBetPreview(match.fixture.id, match)?.map((bet, index, array) => {
                            const tooltipId = `${match.fixture.id}-${index}`;
                            const isOpen = openTooltipId === tooltipId;
                            return (
                              <React.Fragment key={index}>
                                <Tooltip open={isMobile ? isOpen : undefined} onOpenChange={isMobile ? undefined : undefined}>
                                  <TooltipTrigger asChild>
                                    <span 
                                      className="cursor-help underline decoration-dotted underline-offset-2"
                                      onClick={(e) => {
                                        if (isMobile) {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setOpenTooltipId(isOpen ? null : tooltipId);
                                        }
                                      }}
                                    >
                                      {bet.label}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent 
                                    side="top"
                                    onClick={(e) => {
                                      if (isMobile) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setOpenTooltipId(null);
                                      }
                                    }}
                                  >
                                    <p className="text-xs">{bet.tooltip}</p>
                                  </TooltipContent>
                                </Tooltip>
                                {index < array.length - 1 && <span>, </span>}
                              </React.Fragment>
                            );
                          })}
                        </TooltipProvider>
                      </p>
                    )}
                  </div>
                </button>

                {isExpandable && openId === match.fixture.id && (
                  <div className="space-y-3 sm:space-y-6 pt-1 sm:pt-4 animate-in slide-in-from-top-2 duration-200">
                    {(() => {
                      if (blockedFixtures.includes(match.fixture.id)) {
                        return (
                          <div className="text-center py-8 text-muted-foreground">
                            <p className="text-lg font-medium mb-2 text-red-500">Te han bloqueado este partido</p>
                            <p>No puedes hacer selecciones en este partido porque otro usuario de tu liga lo ha bloqueado.</p>
                          </div>
                        );
                      }

                      // Only show odds when bookmakers are present (live match with odds)
                      if (!match.bookmakers || match.bookmakers.length === 0) {
                        return (
                          <div className="text-center py-8 text-muted-foreground">
                            <p>No hay cuotas en directo disponibles todavía para este partido.</p>
                          </div>
                        );
                      }

                      return (
                        <>
                          {getBetTypesSorted().map(betType => {
                            const market = findMarket(match, betType.apiName);

                            // Special case for Result/Total Goals - always show even if market not found
                            if (betType.apiName === 'Result/Total Goals') {
                              return (
                                <BetMarketSection
                                  key={betType.apiName}
                                  match={match as any}
                                  betType={betType}
                                  market={(market as any) || { id: 0, name: 'Result/Total Goals', values: [] }}
                                  isFrozen={isFrozen}
                                  hasUserBetOnMarket={hasUserBetOnMarket}
                                  handleAddToSlip={handleAddToSlip}
                                  isLiveMatch={isLive}
                                />
                              );
                            }

                            if (!market) return null;

                            return (
                              <BetMarketSection
                                key={betType.apiName}
                                match={match as any}
                                betType={betType}
                                market={market as any}
                                isFrozen={isFrozen}
                                hasUserBetOnMarket={hasUserBetOnMarket}
                                handleAddToSlip={handleAddToSlip}
                                isLiveMatch={isLive}
                              />
                            );
                          })}

                          {getBetTypesSorted().every(bt => !findMarket(match, bt.apiName)) && (
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
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full px-2 sm:container sm:mx-auto sm:p-4">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Partidos en directo</h1>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg bg-card shadow-sm">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!liveEnabled) {
    return (
      <div className="w-full px-2 sm:container sm:mx-auto sm:p-4">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Partidos en directo</h1>
        <div className="text-center p-8 bg-card rounded-lg shadow">
          <p className="text-muted-foreground">La funcionalidad de Partidos en directo está desactivada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-2 sm:container sm:mx-auto sm:p-4">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Partidos en directo</h1>

      {/* Desktop Layout (same proportions as Bets page) */}
      {!isMobile ? (
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-grow">
            {renderMatches(mergedMatches)}
          </div>
          <div className="w-full md:w-1/3 md:sticky md:top-32 md:self-start z-40">
            <BetSlip
              selectedBets={selectedBets}
              onRemoveBet={(betId: string) => setSelectedBets(prev => prev.filter(bet => bet.id !== betId))}
              onClearAll={() => setSelectedBets([])}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 sm:gap-8 w-full">
          <div className="w-full overflow-hidden">
            {renderMatches(mergedMatches)}
          </div>
          <MobileBetSlip
            selectedBets={selectedBets}
            onRemoveBet={(betId: string) => setSelectedBets(prev => prev.filter(bet => bet.id !== betId))}
            onClearAll={() => setSelectedBets([])}
          />
        </div>
      )}
    </div>
  );
};

export default LiveBets;


