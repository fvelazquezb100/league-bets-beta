import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useIsPremiumLeague } from '@/hooks/useLeaguePremium';
import { useMatchOdds, type MatchData } from '@/hooks/useMatchOdds';
import { useCombinedMatchAvailability, isCombinedLiveBettingEnabled } from '@/hooks/useCombinedMatchAvailability';
import { useBettingSettings } from '@/hooks/useBettingSettings';
import { useAvailableLeagues } from '@/hooks/useAvailableLeagues';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Ban, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface LeagueUser {
  id: string;
  username: string;
}

interface MatchBlock {
  id: number;
  blocked_user_id: string;
  fixture_id: number;
  week: number;
  status: string;
  created_at: string;
  match_results?: {
    match_name: string;
    home_team: string;
    away_team: string;
    kickoff_time: string;
  };
  profiles?: {
    username: string;
  };
}

export const Bloqueos = () => {
  const { user } = useAuth();
  const { data: userProfile } = useUserProfile(user?.id);
  const isPremium = useIsPremiumLeague();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { cutoffMinutes } = useBettingSettings();
  const { data: matchAvailability = [] } = useCombinedMatchAvailability(userProfile?.league_id ?? null);
  const { data: availableLeagueIds = [] } = useAvailableLeagues(user?.id);
  
  // Check if Selecciones and Copa del Rey are enabled
  const { data: seleccionesEnabled = false } = useQuery({
    queryKey: ['betting-setting', 'enable_selecciones'],
    queryFn: async () => {
      const { data } = await supabase
        .from('betting_settings')
        .select('setting_value')
        .eq('setting_key', 'enable_selecciones')
        .maybeSingle();
      return ((data?.setting_value || 'false') === 'true');
    },
    staleTime: 60_000,
  });

  const { data: copareyEnabled = false } = useQuery({
    queryKey: ['betting-setting', 'enable_coparey'],
    queryFn: async () => {
      const { data } = await supabase
        .from('betting_settings')
        .select('setting_value')
        .eq('setting_key', 'enable_coparey')
        .maybeSingle();
      return ((data?.setting_value || 'false') === 'true');
    },
    staleTime: 60_000,
  });

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedFixtureId, setSelectedFixtureId] = useState<number | null>(null);
  const [selectedLeagueFilter, setSelectedLeagueFilter] = useState<string | 'all'>('all');
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [confirmBlockDialogOpen, setConfirmBlockDialogOpen] = useState(false);

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

  // Get league users
  const { data: leagueUsers = [], isLoading: usersLoading } = useQuery<LeagueUser[]>({
    queryKey: ['league-users', userProfile?.league_id],
    enabled: !!userProfile?.league_id && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('league_id', userProfile!.league_id)
        .neq('id', user!.id) // Exclude current user
        .order('username');
      if (error) throw error;
      return data ?? [];
    },
  });

  // Get matches from all sources: Ligas (1), Selecciones (3), Copa del Rey (5)
  const { data: ligasMatches = [], isLoading: ligasLoading } = useMatchOdds(1);
  const { data: seleccionesMatches = [], isLoading: seleccionesLoading } = useMatchOdds(3);
  const { data: copareyMatches = [], isLoading: copareyLoading } = useMatchOdds(5);

  // Combine all matches and tag them with their league/source
  const matches = React.useMemo(() => {
    const allMatches: Array<MatchData & { matchSource: string }> = [];
    
    // Tag ligas matches with their league_id
    (ligasMatches || []).forEach(match => {
      const leagueId = match.teams?.league_id;
      allMatches.push({ ...match, matchSource: leagueId ? leagueId.toString() : 'ligas' });
    });
    
    // Tag selecciones matches
    if (seleccionesEnabled) {
      (seleccionesMatches || []).forEach(match => {
        allMatches.push({ ...match, matchSource: 'selecciones' });
      });
    }
    
    // Tag copa del rey matches
    if (copareyEnabled) {
      (copareyMatches || []).forEach(match => {
        allMatches.push({ ...match, matchSource: 'coparey' });
      });
    }
    
    return allMatches;
  }, [ligasMatches, seleccionesMatches, copareyMatches, seleccionesEnabled, copareyEnabled]);

  const matchesLoading = ligasLoading || seleccionesLoading || copareyLoading;

  // Get existing blocks for selected user
  const { data: existingBlocks = [], isLoading: blocksLoading } = useQuery<number[]>({
    queryKey: ['user-blocks', selectedUserId],
    enabled: !!selectedUserId,
    queryFn: async () => {
      if (!selectedUserId || !userProfile?.league_id || !currentWeek) return [];
      const { data, error } = await supabase
        .from('match_blocks')
        .select('fixture_id')
        .eq('blocked_user_id', selectedUserId)
        .eq('league_id', userProfile.league_id)
        .eq('week', currentWeek)
        .eq('status', 'active');
      if (error) throw error;
      return data?.map(b => b.fixture_id) ?? [];
    },
  });

  // Get user's available blocks
  const { data: userBlocksAvailable } = useQuery({
    queryKey: ['user-blocks-available', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('blocks_available')
        .eq('id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data?.blocks_available ?? 0;
    },
  });

  // Create league filter options
  const leagueFilterOptions = React.useMemo(() => {
    const leagues: Array<{ value: string; label: string }> = [
      { value: 'all', label: 'Todas las ligas' },
    ];
    
    // Map league IDs to names
    const leagueMap: Record<number, string> = {
      140: 'La Liga',
      2: 'Champions League',
      3: 'Europa League',
      262: 'Liga MX',
    };
    
    // Add available leagues from configuration
    availableLeagueIds.forEach(leagueId => {
      if (leagueMap[leagueId]) {
        leagues.push({ value: leagueId.toString(), label: leagueMap[leagueId] });
      }
    });
    
    // Add Selecciones if enabled
    if (seleccionesEnabled) {
      leagues.push({ value: 'selecciones', label: 'Selecciones' });
    }
    
    // Add Copa del Rey if enabled
    if (copareyEnabled) {
      leagues.push({ value: 'coparey', label: 'Copa del Rey' });
    }
    
    return leagues;
  }, [availableLeagueIds, seleccionesEnabled, copareyEnabled]);

  // Filter matches that are visible (have live betting enabled for their date and haven't passed cutoff time)
  const availableMatches = React.useMemo(() => {
    if (!matches.length || !userProfile?.league_id) return [];
    const now = new Date();
    
    return matches.filter(match => {
      if (!match.fixture?.id || !match.fixture?.date) return false;
      
      // Apply league filter
      if (selectedLeagueFilter !== 'all') {
        const matchWithSource = match as MatchData & { matchSource?: string };
        if (matchWithSource.matchSource !== selectedLeagueFilter) {
          return false;
        }
      } else {
        // If filter is "all", only show matches from available leagues
        const matchWithSource = match as MatchData & { matchSource?: string };
        const matchSource = matchWithSource.matchSource || '';
        
        // If it's a league ID (number as string), check if it's in available leagues
        if (matchSource !== 'selecciones' && matchSource !== 'coparey') {
          const leagueId = parseInt(matchSource);
          if (!isNaN(leagueId) && !availableLeagueIds.includes(leagueId)) {
            return false;
          }
        }
      }
      
      const matchDate = new Date(match.fixture.date);
      
      // Check if live betting is enabled for this match's date
      const isLiveEnabled = isCombinedLiveBettingEnabled(
        match.fixture.date,
        userProfile.league_id,
        matchAvailability
      );
      
      if (!isLiveEnabled) return false;
      
      // Check if match hasn't passed cutoff time (can still bet on it)
      const freezeTime = new Date(matchDate.getTime() - cutoffMinutes * 60 * 1000);
      const isFrozen = now >= freezeTime;
      
      if (isFrozen) return false;
      
      // Include matches in the future (within the betting week)
      return matchDate > now;
    });
  }, [matches, matchAvailability, userProfile?.league_id, cutoffMinutes, selectedLeagueFilter, availableLeagueIds]);

  // Check if a match is already blocked
  const isMatchBlocked = (fixtureId: number) => {
    return existingBlocks.includes(fixtureId);
  };

  // Handle block button click
  const handleBlockClick = (fixtureId: number) => {
    if (!selectedUserId) return;
    
    // Check if user has blocks available
    if (userBlocksAvailable !== undefined && userBlocksAvailable <= 0) {
      toast({
        title: 'Sin bloqueos disponibles',
        description: 'No tienes bloqueos disponibles esta semana.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFixtureId(fixtureId);
    setBlockDialogOpen(true);
  };

  // Block mutation
  const blockMutation = useMutation({
    mutationFn: async () => {
      if (!user || !selectedUserId || !selectedFixtureId || !userProfile?.league_id || !currentWeek) {
        throw new Error('Datos incompletos');
      }

      // Check user still has blocks available
      const { data: profile } = await supabase
        .from('profiles')
        .select('blocks_available')
        .eq('id', user.id)
        .single();

      if (!profile || (profile.blocks_available ?? 0) <= 0) {
        throw new Error('No tienes bloqueos disponibles');
      }

      // Check if already blocked
      const { data: existing } = await supabase
        .from('match_blocks')
        .select('id')
        .eq('blocked_user_id', selectedUserId)
        .eq('fixture_id', selectedFixtureId!)
        .eq('league_id', userProfile.league_id)
        .eq('week', currentWeek)
        .maybeSingle();

      if (existing) {
        throw new Error('Este partido ya está bloqueado para este usuario');
      }

      // Create block
      const { error: insertError } = await supabase
        .from('match_blocks')
        .insert({
          blocker_user_id: user.id,
          blocked_user_id: selectedUserId,
          league_id: userProfile.league_id,
          fixture_id: selectedFixtureId!,
          week: currentWeek,
          status: 'active',
        });

      if (insertError) throw insertError;

      // Decrement user's blocks_available
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ blocks_available: (profile.blocks_available ?? 0) - 1 })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Increment blocked user's blocks_received
      const { data: blockedProfile } = await supabase
        .from('profiles')
        .select('blocks_received')
        .eq('id', selectedUserId)
        .single();

      if (blockedProfile) {
        const { error: incrementError } = await supabase
          .from('profiles')
          .update({ blocks_received: (blockedProfile.blocks_received ?? 0) + 1 })
          .eq('id', selectedUserId);

        if (incrementError) {
          console.error('Error incrementing blocks_received:', incrementError);
          // Don't throw, the block was created successfully
        }
      }
    },
    onSuccess: () => {
      toast({
        title: 'Bloqueo realizado',
        description: 'El partido ha sido bloqueado correctamente.',
      });
      setBlockDialogOpen(false);
      setConfirmBlockDialogOpen(false);
      setSelectedFixtureId(null);
      queryClient.invalidateQueries({ queryKey: ['user-blocks'] });
      queryClient.invalidateQueries({ queryKey: ['user-blocks-available'] });
      queryClient.invalidateQueries({ queryKey: ['block-history'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al bloquear',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get block history
  const { data: blockHistory = [], isLoading: historyLoading } = useQuery<MatchBlock[]>({
    queryKey: ['block-history', user?.id, userProfile?.league_id],
    enabled: !!user?.id && !!userProfile?.league_id,
    queryFn: async () => {
      // Get blocks
      const { data: blocksData, error: blocksError } = await supabase
        .from('match_blocks')
        .select(`
          id,
          blocked_user_id,
          fixture_id,
          week,
          status,
          created_at,
          profiles!match_blocks_blocked_user_id_fkey(
            username
          )
        `)
        .eq('blocker_user_id', user!.id)
        .eq('league_id', userProfile!.league_id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (blocksError) throw blocksError;
      if (!blocksData || blocksData.length === 0) return [];

      // Get match results for the fixture IDs
      const fixtureIds = blocksData.map(b => b.fixture_id);
      const { data: matchResultsData } = await supabase
        .from('match_results')
        .select('fixture_id, match_name, home_team, away_team, kickoff_time')
        .in('fixture_id', fixtureIds);

      // Create a map for quick lookup
      const matchResultsMap = new Map();
      matchResultsData?.forEach(mr => {
        matchResultsMap.set(mr.fixture_id, mr);
      });

      // Combine blocks with match results
      return blocksData.map(block => ({
        ...block,
        match_results: matchResultsMap.get(block.fixture_id) || null,
      })) as MatchBlock[];
    },
  });

  const selectedMatch = availableMatches.find(m => m.fixture?.id === selectedFixtureId);
  const selectedUser = leagueUsers.find(u => u.id === selectedUserId);

  if (!isPremium) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5" />
              Bloqueo de Partidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 text-muted-foreground">
              <AlertCircle className="h-5 w-5" />
              <p>Esta función solo está disponible para ligas premium.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Bloqueo de Partidos</h1>
        <p className="text-sm text-muted-foreground">
          Puedes bloquear un partido para otro usuario de tu liga. Cuando bloqueas un partido, ese usuario no podrá apostar en ese partido.
        </p>
        {userBlocksAvailable !== undefined && (
          <p className="text-sm font-medium">
            Bloqueos disponibles esta semana: <span className="text-[#FFC72C] font-semibold">{userBlocksAvailable}</span>
          </p>
        )}
      </div>

      {/* User Selector and Matches */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Usuario y Partido</CardTitle>
          <CardDescription>Elige un usuario de tu liga y un partido para bloquear</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            {/* Column 1: User Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Usuario</label>
              {usersLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedUserId ?? ''} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="focus:ring-[#FFC72C] focus:ring-2 focus:ring-offset-2 border-[#FFC72C] hover:border-[#FFC72C]/80">
                    <SelectValue placeholder="Selecciona un usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    {leagueUsers.map(user => (
                      <SelectItem key={user.id} value={user.id} className="focus:bg-[#FFC72C]/20 focus:text-[#2D2D2D]">
                        {user.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {selectedUserId && (
                <p className="text-xs text-muted-foreground mt-2">
                  Seleccionado: {leagueUsers.find(u => u.id === selectedUserId)?.username}
                </p>
              )}
            </div>

            {/* Column 2: League Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Filtrar por Liga</label>
              <Select value={selectedLeagueFilter} onValueChange={(value) => setSelectedLeagueFilter(value as string | 'all')}>
                <SelectTrigger className="focus:ring-[#FFC72C] focus:ring-2 focus:ring-offset-2 border-[#FFC72C] hover:border-[#FFC72C]/80">
                  <SelectValue placeholder="Selecciona una liga" />
                </SelectTrigger>
                <SelectContent>
                  {leagueFilterOptions.map(league => (
                    <SelectItem key={league.value} value={league.value} className="focus:bg-[#FFC72C]/20 focus:text-[#2D2D2D]">
                      {league.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Column 3: Available Matches */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Partidos Disponibles</label>
              {!selectedUserId ? (
                <div className="flex items-center justify-center h-32 border border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground text-center px-2">Selecciona un usuario para ver los partidos</p>
                </div>
              ) : matchesLoading || blocksLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : availableMatches.length === 0 ? (
                <div className="flex items-center justify-center h-32 border border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground text-center px-2">
                    No hay partidos disponibles en este momento.<br />
                    Los partidos deben tener cuotas en vivo (live betting habilitado).
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {availableMatches.map(match => {
                    const isBlocked = isMatchBlocked(match.fixture?.id ?? 0);
                    return (
                      <div
                        key={match.fixture?.id}
                        className={`flex items-center justify-between p-3 border rounded-lg ${
                          isBlocked ? 'bg-muted opacity-60' : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {match.teams?.home?.name} vs {match.teams?.away?.name}
                          </div>
                          {match.fixture?.date && (
                            <div className="text-xs text-muted-foreground">
                              {new Date(match.fixture.date).toLocaleString('es-ES', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          {isBlocked ? (
                            <Badge variant="secondary" className="gap-1 text-xs">
                              <XCircle className="h-3 w-3" />
                              Bloqueado
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleBlockClick(match.fixture?.id ?? 0)}
                              disabled={userBlocksAvailable !== undefined && userBlocksAvailable <= 0}
                              className="jambol-button text-xs"
                            >
                              Bloquear
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Block History */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Bloqueos</CardTitle>
          <CardDescription>Partidos que has bloqueado</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : blockHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No has bloqueado ningún partido aún.</p>
          ) : (
            <div className="space-y-2">
              {blockHistory.map(block => (
                <div key={block.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">
                      {block.match_results?.match_name || 
                        `${block.match_results?.home_team} vs ${block.match_results?.away_team}`}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Usuario: {block.profiles?.username}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Semana {block.week} •{' '}
                      {new Date(block.created_at).toLocaleString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <Badge variant={block.status === 'active' ? 'default' : 'secondary'}>
                    {block.status === 'active' ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Activo
                      </>
                    ) : (
                      'Inactivo'
                    )}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* First Confirmation Dialog */}
      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Bloqueo</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres bloquear este partido para {selectedUser?.username}?
              <br />
              <br />
              <strong>
                {selectedMatch?.teams?.home?.name} vs {selectedMatch?.teams?.away?.name}
              </strong>
              <br />
              {selectedMatch?.fixture?.date && (
                <span className="text-sm">
                  {new Date(selectedMatch.fixture.date).toLocaleString('es-ES')}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#FFC72C] text-[#2D2D2D] hover:bg-[#FFC72C]/10 hover:border-[#FFC72C]/80">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setBlockDialogOpen(false);
                setConfirmBlockDialogOpen(true);
              }}
              className="jambol-button"
            >
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Second Confirmation Dialog */}
      <AlertDialog open={confirmBlockDialogOpen} onOpenChange={setConfirmBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Última Confirmación</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción consumirá uno de tus bloqueos disponibles y {selectedUser?.username} no podrá apostar en este partido.
              <br />
              <br />
              ¿Deseas confirmar el bloqueo?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#FFC72C] text-[#2D2D2D] hover:bg-[#FFC72C]/10 hover:border-[#FFC72C]/80">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => blockMutation.mutate()}
              disabled={blockMutation.isPending}
              className="jambol-button"
            >
              {blockMutation.isPending ? 'Bloqueando...' : 'Confirmar Bloqueo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Bloqueos;

