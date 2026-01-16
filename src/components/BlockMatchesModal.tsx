import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAvailableLeagues } from '@/hooks/useAvailableLeagues';
import { useCombinedMatchAvailability, isCombinedLiveBettingEnabled } from '@/hooks/useCombinedMatchAvailability';
import { useMatchOdds, type MatchData } from '@/hooks/useMatchOdds';
import { useBettingSettings } from '@/hooks/useBettingSettings';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Ban, XCircle } from 'lucide-react';

interface BlockMatchesModalProps {
  isOpen: boolean;
  onClose: () => void;
  blockedUser: { id: string; name: string } | null;
}

export const BlockMatchesModal: React.FC<BlockMatchesModalProps> = ({ isOpen, onClose, blockedUser }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: userProfile } = useUserProfile(user?.id);
  const leagueId = userProfile?.league_id ?? null;
  const { cutoffMinutes } = useBettingSettings();

  const { data: matchAvailability = [] } = useCombinedMatchAvailability(leagueId);
  const { data: availableLeagueIds = [] } = useAvailableLeagues(user?.id);

  const [selectedLeagueFilter, setSelectedLeagueFilter] = React.useState<string | 'all'>('all');
  const [selectedFixtureId, setSelectedFixtureId] = React.useState<number | null>(null);
  const [blockDialogOpen, setBlockDialogOpen] = React.useState(false);

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

  const { data: currentWeek } = useQuery({
    queryKey: ['league-week', leagueId],
    enabled: !!leagueId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leagues')
        .select('week')
        .eq('id', leagueId)
        .maybeSingle();
      if (error) throw error;
      return data?.week ?? 1;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: userBlocksAvailable } = useQuery({
    queryKey: ['block-available', user?.id],
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

  const { data: existingBlocks = [], isLoading: existingBlocksLoading } = useQuery<number[]>({
    queryKey: ['blocked-fixtures-target', blockedUser?.id, leagueId, currentWeek],
    enabled: isOpen && !!blockedUser?.id && !!leagueId && !!currentWeek,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_blocks')
        .select('fixture_id')
        .eq('blocked_user_id', blockedUser!.id)
        .eq('league_id', leagueId!)
        .eq('week', currentWeek!)
        .eq('status', 'active');
      if (error) throw error;
      return data?.map(b => b.fixture_id) ?? [];
    },
  });

  // Check if current user has already blocked this user
  const { data: userHasBlocked = false, isLoading: userBlockedLoading } = useQuery({
    queryKey: ['user-has-blocked', user?.id, blockedUser?.id, leagueId, currentWeek],
    enabled: isOpen && !!user?.id && !!blockedUser?.id && !!leagueId && !!currentWeek,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_blocks')
        .select('id')
        .eq('blocker_user_id', user!.id)
        .eq('blocked_user_id', blockedUser!.id)
        .eq('league_id', leagueId!)
        .eq('week', currentWeek!)
        .eq('status', 'active')
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  // Matches from all sources
  const { data: ligasMatches = [], isLoading: ligasLoading } = useMatchOdds(1);
  const { data: seleccionesMatches = [], isLoading: seleccionesLoading } = useMatchOdds(3);
  const { data: copareyMatches = [], isLoading: copareyLoading } = useMatchOdds(5);

  const matches = React.useMemo(() => {
    const allMatches: Array<MatchData & { matchSource: string }> = [];

    (ligasMatches || []).forEach(match => {
      const leagueIdentifier = match.teams?.league_id ? match.teams.league_id.toString() : 'ligas';
      allMatches.push({ ...match, matchSource: leagueIdentifier });
    });

    if (seleccionesEnabled) {
      (seleccionesMatches || []).forEach(match => {
        allMatches.push({ ...match, matchSource: 'selecciones' });
      });
    }

    if (copareyEnabled) {
      (copareyMatches || []).forEach(match => {
        allMatches.push({ ...match, matchSource: 'coparey' });
      });
    }

    return allMatches;
  }, [ligasMatches, seleccionesMatches, copareyMatches, seleccionesEnabled, copareyEnabled]);

  const matchesLoading = ligasLoading || seleccionesLoading || copareyLoading;

  const leagueFilterOptions = React.useMemo(() => {
    const leagues: Array<{ value: string; label: string }> = [
      { value: 'all', label: 'Todas las ligas' },
    ];

    const leagueMap: Record<number, string> = {
      140: 'La Liga',
      2: 'Champions League',
      3: 'Europa League',
      262: 'Liga MX',
    };

    availableLeagueIds.forEach(leagueId => {
      if (leagueMap[leagueId]) {
        leagues.push({ value: leagueId.toString(), label: leagueMap[leagueId] });
      }
    });

    if (seleccionesEnabled) {
      leagues.push({ value: 'selecciones', label: 'Selecciones' });
    }

    if (copareyEnabled) {
      leagues.push({ value: 'coparey', label: 'Copa del Rey' });
    }

    return leagues;
  }, [availableLeagueIds, seleccionesEnabled, copareyEnabled]);

  // All available matches (without league filter) for minimum matches calculation
  const allAvailableMatches = React.useMemo(() => {
    if (!matches.length || !leagueId) return [];
    if (!blockedUser?.id) return [];
    const now = new Date();

    return matches.filter(match => {
      if (!match.fixture?.id || !match.fixture?.date) return false;

      const matchWithSource = match as MatchData & { matchSource?: string };
      const source = matchWithSource.matchSource || '';

      // Filter by available leagues (only if it's a numeric league, not selecciones/coparey)
      if (source !== 'selecciones' && source !== 'coparey') {
        const numericId = parseInt(source, 10);
        if (!isNaN(numericId) && !availableLeagueIds.includes(numericId)) {
          return false;
        }
      }

      const matchDate = new Date(match.fixture.date);

      const isLiveEnabled = isCombinedLiveBettingEnabled(
        match.fixture.date,
        leagueId,
        matchAvailability
      );

      if (!isLiveEnabled) return false;

      const freezeTime = new Date(matchDate.getTime() - (cutoffMinutes || 0) * 60 * 1000);
      if (now >= freezeTime) return false;

      return matchDate > now;
    });
  }, [matches, availableLeagueIds, leagueId, matchAvailability, cutoffMinutes, blockedUser?.id]);

  const availableMatches = React.useMemo(() => {
    if (selectedLeagueFilter === 'all') {
      return allAvailableMatches;
    }

    return allAvailableMatches.filter(match => {
      const matchWithSource = match as MatchData & { matchSource?: string };
      return matchWithSource.matchSource === selectedLeagueFilter;
    });
  }, [allAvailableMatches, selectedLeagueFilter]);

  const { data: blockedUserProfile } = useQuery({
    queryKey: ['blocked-user-profile', blockedUser?.id],
    enabled: isOpen && !!blockedUser?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('blocks_received')
        .eq('id', blockedUser!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const maxBlocksAllowed = blockedUserProfile?.blocks_received ?? 0;

  const blockMutation = useMutation({
    mutationFn: async () => {
      if (!user || !blockedUser || !selectedFixtureId || !leagueId || !currentWeek) {
        throw new Error('Datos incompletos');
      }

      // Check if user has already blocked this user
      const { data: existingUserBlock, error: userBlockError } = await supabase
        .from('match_blocks')
        .select('id')
        .eq('blocker_user_id', user.id)
        .eq('blocked_user_id', blockedUser.id)
        .eq('league_id', leagueId)
        .eq('week', currentWeek)
        .eq('status', 'active')
        .maybeSingle();

      if (userBlockError) throw userBlockError;

      if (existingUserBlock) {
        throw new Error('Ya le has bloqueado 1 partido a este jugador.');
      }

      const { data: blockerProfile } = await supabase
        .from('profiles')
        .select('blocks_available')
        .eq('id', user.id)
        .maybeSingle();

      if (!blockerProfile || (blockerProfile.blocks_available ?? 0) <= 0) {
        throw new Error('No tienes bloqueos disponibles esta semana.');
      }

      if (maxBlocksAllowed > 0) {
        const { count, error: countError } = await supabase
          .from('match_blocks')
          .select('*', { count: 'exact', head: true })
          .eq('blocked_user_id', blockedUser.id)
          .eq('league_id', leagueId)
          .eq('week', currentWeek)
          .eq('status', 'active');

        if (countError) throw countError;

        if ((count ?? 0) >= maxBlocksAllowed) {
          throw new Error('Este usuario ya alcanzó el máximo de bloqueos permitidos esta semana.');
        }
      }

      const { data: existing } = await supabase
        .from('match_blocks')
        .select('id')
        .eq('blocked_user_id', blockedUser.id)
        .eq('fixture_id', selectedFixtureId)
        .eq('league_id', leagueId)
        .eq('week', currentWeek)
        .maybeSingle();

      if (existing) {
        throw new Error('Este partido ya está bloqueado para este usuario.');
      }

      const { error: insertError } = await supabase
        .from('match_blocks')
        .insert({
          blocker_user_id: user.id,
          blocked_user_id: blockedUser.id,
          league_id: leagueId,
          fixture_id: selectedFixtureId,
          week: currentWeek,
          status: 'active',
        });

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ blocks_available: (blockerProfile.blocks_available ?? 0) - 1 })
        .eq('id', user.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast({
        title: 'Bloqueo realizado',
        description: 'El partido ha sido bloqueado correctamente.',
      });
      setSelectedFixtureId(null);
      setBlockDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['user-blocks-available'] });
      queryClient.invalidateQueries({ queryKey: ['block-history'] });
      queryClient.invalidateQueries({ queryKey: ['blocked-fixtures-target'] });
      queryClient.invalidateQueries({ queryKey: ['user-blocks'] });
      queryClient.invalidateQueries({ queryKey: ['blocked-user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-has-blocked'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al bloquear',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleBlockClick = (fixtureId: number) => {
    if (!blockedUser?.id) return;

    if (hasMinimumMatches) {
      toast({
        title: 'Mínimo de partidos alcanzado',
        description: 'El jugador solo tiene 3 partidos, no se le puede bloquear más.',
        variant: 'destructive',
      });
      return;
    }

    if (userHasBlocked) {
      toast({
        title: 'Ya has bloqueado este jugador',
        description: 'Ya le has bloqueado 1 partido a este jugador.',
        variant: 'destructive',
      });
      return;
    }

    if (userBlocksAvailable !== undefined && userBlocksAvailable <= 0) {
      toast({
        title: 'Sin bloqueos disponibles',
        description: 'No tienes bloqueos disponibles esta semana.',
        variant: 'destructive',
      });
      return;
    }

    if (maxBlocksAllowed > 0 && existingBlocks.length >= maxBlocksAllowed) {
      toast({
        title: 'Límite alcanzado',
        description: 'Este usuario ya tiene el máximo de partidos bloqueados esta semana.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFixtureId(fixtureId);
    setBlockDialogOpen(true);
  };

  const isLimitReached = React.useMemo(() => {
    if (!blockedUser?.id || !leagueId || !currentWeek) return false;
    if (maxBlocksAllowed === 0) return false;
    return existingBlocks.length >= maxBlocksAllowed;
  }, [blockedUser?.id, maxBlocksAllowed, existingBlocks.length, leagueId, currentWeek]);

  // Calculate available matches for the blocked user (total matches - already blocked)
  const availableMatchesForBlockedUser = React.useMemo(() => {
    if (!blockedUser?.id) return 0;
    const totalAvailable = allAvailableMatches.length;
    const alreadyBlocked = existingBlocks.length;
    return totalAvailable - alreadyBlocked;
  }, [allAvailableMatches.length, existingBlocks.length, blockedUser?.id]);

  // Check if blocked user has minimum 3 matches available
  const hasMinimumMatches = React.useMemo(() => {
    return availableMatchesForBlockedUser <= 3;
  }, [availableMatchesForBlockedUser]);

  React.useEffect(() => {
    if (!isOpen) {
      setSelectedFixtureId(null);
      setBlockDialogOpen(false);
    }
  }, [isOpen]);

  const renderMatches = () => {
    if (!blockedUser) {
      return (
        <div className="flex items-center justify-center h-32 border border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground">Selecciona un usuario.</p>
        </div>
      );
    }

    if (matchesLoading || existingBlocksLoading || userBlockedLoading) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      );
    }

    if (availableMatches.length === 0) {
      return (
        <div className="flex items-center justify-center h-32 border border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground text-center px-2">
            No hay partidos disponibles en este momento.\nLos partidos deben tener multiplicadores en vivo (live betting habilitado).
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {availableMatches.map(match => {
          const isBlocked = existingBlocks.includes(match.fixture?.id ?? 0);
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
                  <Badge className="gap-1 text-xs bg-[#FFC72C] text-black hover:bg-[#FFC72C]/90 border-[#FFC72C]">
                    <XCircle className="h-3 w-3" />
                    Bloqueado
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleBlockClick(match.fixture?.id ?? 0)}
                    disabled={(userBlocksAvailable !== undefined && userBlocksAvailable <= 0) || isLimitReached || userHasBlocked || hasMinimumMatches}
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
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Ban className="h-5 w-5 text-red-500" />
            Bloquear partidos a {blockedUser?.name || ''}
          </DialogTitle>
          <DialogDescription>
            Selecciona la liga y el partido que deseas bloquear esta semana. Solo se muestran partidos con multiplicadores en vivo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 pr-2">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Disponibles</p>
              <p className="text-sm font-semibold mt-1">{userBlocksAvailable ?? 0}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Recibidos</p>
              <p className="text-sm font-semibold mt-1">{existingBlocks.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Máximo</p>
              <p className="text-sm font-semibold mt-1">{maxBlocksAllowed || '-'}</p>
            </div>
          </div>

          {hasMinimumMatches && (
            <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded p-2">
              El jugador solo tiene 3 partidos, no se le puede bloquear más.
            </div>
          )}

          {userHasBlocked && !hasMinimumMatches && (
            <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded p-2">
              Ya le has bloqueado 1 partido a este jugador.
            </div>
          )}

          {isLimitReached && !userHasBlocked && !hasMinimumMatches && (
            <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded p-2">
              Este usuario ya alcanzó el máximo de partidos bloqueados para esta semana.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <div className="sm:col-span-2">
              {renderMatches()}
            </div>
          </div>
        </div>

        <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar bloqueo</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción consumirá uno de tus bloqueos disponibles y evitará que {blockedUser?.name} apueste en el partido seleccionado.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="!bg-[#F8F9FA] !border-[#FFC72C] !text-[#2D2D2D] hover:!bg-[#FFC72C] hover:!text-[#2D2D2D] border-2 dark:!bg-[#1a1a1a] dark:!border-[#FFC72C] dark:!text-[#FFC72C] dark:hover:!bg-[#FFC72C] dark:hover:!text-[#2D2D2D]">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="jambol-button"
                onClick={() => blockMutation.mutate()}
                disabled={blockMutation.isPending}
              >
                {blockMutation.isPending ? 'Bloqueando...' : 'Confirmar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};

