import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { X, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBettingSettings } from '@/hooks/useBettingSettings';
import { supabase } from '@/integrations/supabase/client';
import { getBettingTranslation } from '@/utils/bettingTranslations';
import { betSchema, type BetInput } from '@/schemas/validation';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useQueryClient } from '@tanstack/react-query';

interface Bet {
  id: string;
  matchDescription: string;
  market: string;
  selection: string;
  odds: number;
  fixtureId?: number;
  kickoff?: string;
}

interface BetSlipProps {
  selectedBets: Bet[];
  onRemoveBet: (betId: string) => void;
  onClearAll: () => void;
}

const BetSlip = ({ selectedBets, onRemoveBet, onClearAll }: BetSlipProps) => {
  const [stake, setStake] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weeklyBudget, setWeeklyBudget] = useState<number | null>(null);
  const [minBet, setMinBet] = useState<number>(10); // Default minimum bet
  const { toast } = useToast();
  const { cutoffMinutes, maintenanceMode } = useBettingSettings();
  const queryClient = useQueryClient();

  // Helper to adjust stake by 10, allowing values below minBet
  const adjustStakeBy10 = (direction: 'up' | 'down') => {
    const current = parseFloat(stake) || 0;
    const next = direction === 'up' ? current + 10 : Math.max(0, current - 10);
    setStake(next.toString());
  };

  // Intercept native spinner clicks and wheel events
  const handleStakeInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      adjustStakeBy10('up');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      adjustStakeBy10('down');
    }
  };

  const handleStakeInputWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.preventDefault();
    adjustStakeBy10(e.deltaY < 0 ? 'up' : 'down');
  };



  // Check for duplicate fixtures
  const fixtureIds = selectedBets.map(bet => bet.fixtureId).filter(id => id !== undefined);
  const uniqueFixtureIds = new Set(fixtureIds);
  const hasDuplicateFixtures = fixtureIds.length !== uniqueFixtureIds.size;

  const totalOdds = selectedBets.reduce((acc, bet) => acc * bet.odds, 1);
  const potentialWinnings = stake ? (parseFloat(stake.replace(',', '.')) * totalOdds).toFixed(2) : '0.00';

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile with league_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('weekly_budget, league_id')
        .eq('id', user.id)
        .single();

      if (profile) {
        setWeeklyBudget(profile.weekly_budget);

        // Get minimum bet for the league
        if (profile.league_id) {
          const { data: league } = await supabase
            .from('leagues')
            .select('min_bet')
            .eq('id', profile.league_id)
            .single();

          if (league && league.min_bet) {
            setMinBet(Math.floor(league.min_bet)); // Remove decimals
          }
        }
      }
    };

    fetchUserData();
  }, []);

  // Set default stake to minimum bet when minBet changes (only on initial load)
  useEffect(() => {
    if (minBet && !stake) {
      setStake(minBet.toString());
    }
  }, [minBet]); // Removed stake dependency to prevent auto-setting

  const handlePlaceBet = async () => {
    // Check maintenance mode first
    if (maintenanceMode) {
      window.location.reload(); // Force reload to trigger guard redirect
      return;
    }

    if (!stake || parseFloat(stake) <= 0) {
      toast({
        title: 'Error',
        description: 'Por favor, introduce un importe válido.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedBets.length === 0) {
      toast({
        title: 'Error',
        description: 'No hay selecciones en el boleto.',
        variant: 'destructive',
      });
      return;
    }

    // Check for duplicate fixtures when multiple selections
    if (selectedBets.length > 1 && hasDuplicateFixtures) {
      toast({
        title: 'Error',
        description: 'No se pueden incluir múltiples selecciones del mismo partido en un boleto combinado.',
        variant: 'destructive',
      });
      return;
    }

    // Bloqueo por cierre: X minutos antes del inicio (configurable)
    // Skip this restriction for live matches page (/directo) - allow betting on live matches
    const isLivePage = window.location.pathname.includes('/directo');
    
    if (!isLivePage) {
      const isAnyFrozen = selectedBets.some(bet => {
        if (!bet.kickoff) return false;
        const kickoffTime = new Date(bet.kickoff);
        const freeze = new Date(kickoffTime.getTime() - cutoffMinutes * 60 * 1000);
        const now = new Date();
        const isFrozen = now >= freeze;

        return isFrozen;
      });

      if (isAnyFrozen) {
        toast({
          title: 'Selecciones cerradas',
          description: `Al menos una selección está cerrada (${cutoffMinutes} min antes del inicio).`,
          variant: 'destructive',
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: 'Error',
          description: 'Debes iniciar sesión para realizar selecciones.',
          variant: 'destructive',
        });
        return;
      }

      const stakeAmount = parseFloat(stake);

      // Obtener perfil con weekly_budget y league_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('weekly_budget, league_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        toast({
          title: 'Error',
          description: 'No se pudo verificar tu presupuesto.',
          variant: 'destructive',
        });
        return;
      }

      // Validación: mínimo por boleto según la liga
      if (stakeAmount < minBet) {
        toast({
          title: 'Error',
          description: `El boleto mínimo en esta liga es de ${minBet}.`,
          variant: 'destructive',
        });
        return;
      }

      // Nueva validación: máximo por boleto según la liga
      if (profile.league_id) {
        const { data: maxBetLeague, error: maxBetLeagueError } = await supabase
          .from('leagues')
          .select('max_bet')
          .eq('id', profile.league_id)
          .maybeSingle();

        if (maxBetLeagueError) {
          console.error('Error fetching max bet:', maxBetLeagueError);
          // Continue without max bet validation if there's an error
        } else if (maxBetLeague) {
          const maxBet = Number(maxBetLeague.max_bet ?? 0);
          if (stakeAmount > maxBet) {
            toast({
              title: 'Error',
              description: `El boleto máximo en esta liga es de ${maxBet}.`,
              variant: 'destructive',
            });
            return;
          }
        }
      }



      // Validar presupuesto semanal disponible
      if (profile.weekly_budget < stakeAmount) {
        toast({
          title: 'Error',
          description: `Presupuesto insuficiente. Disponible: ptos${profile.weekly_budget}`,
          variant: 'destructive',
        });
        return;
      }

      // Place bet based on type (single or combo)
      if (selectedBets.length === 1) {
        // Single bet - use new RPC function with proper ID sequencing
        const { data: betId, error: betError } = await supabase.rpc('place_single_bet', {
          stake_amount: stakeAmount,
          odds_value: totalOdds,
          market_bets: selectedBets[0].market,
          match_description: selectedBets[0].matchDescription,
          bet_selection: `${selectedBets[0].selection} @ ${selectedBets[0].odds}`,
          fixture_id_param: selectedBets[0].fixtureId
        });

        if (betError) {
          throw betError;
        }
      } else {
        // Combo bet - use RPC function
        const selections = selectedBets.map(bet => ({
          fixture_id: bet.fixtureId,
          market: bet.market,
          selection: bet.selection,
          odds: bet.odds,
          match_description: bet.matchDescription
        }));

        const { data: betId, error: comboError } = await supabase.rpc('place_combo_bet', {
          stake_amount: stakeAmount,
          selections: selections
        });

        if (comboError) {
          throw comboError;
        }
      }

      // Update local weekly budget state
      setWeeklyBudget(profile.weekly_budget - stakeAmount);

      // Invalidate React Query caches for immediate UI updates
      queryClient.invalidateQueries({ queryKey: ['user-bets'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-bet-history'] });

      toast({
        title: '¡Boleto realizado!',
        description: `Boleto ${selectedBets.length > 1 ? 'combinado' : ''} de ${stake} pts realizado con éxito.`,
      });

      // Clear the bet slip
      onClearAll();
      setStake('');

    } catch (error) {
      console.error('Error placing bet:', error);
      toast({
        title: 'Error',
        description: 'No se pudo realizar el boleto. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-xl">Boleto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedBets.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Haz clic en un multiplicador para añadirlo a tu boleto.
          </p>
        ) : (
          <>
            <div className="space-y-3">
              {selectedBets.map((bet) => (
                <div key={bet.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{bet.matchDescription}</p>
                      <p className="text-xs text-muted-foreground">{getBettingTranslation(bet.market)}</p>
                      <p className="text-sm font-semibold">{getBettingTranslation(bet.selection)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary">{bet.odds.toFixed(2)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveBet(bet.id)}
                        className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <Label htmlFor="stake">Importe (pts)</Label>
                <div className="relative">
                  <Input
                    id="bet-amount"
                    type="text"
                    placeholder="0"
                    value={stake}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      setStake(value);
                    }}
                    onKeyDown={handleStakeInputKeyDown}
                    onWheel={handleStakeInputWheel}
                    className="pr-8"
                  />
                  <div className="absolute right-1 top-0 h-full flex flex-col">
                    <button
                      type="button"
                      onClick={() => adjustStakeBy10('up')}
                      className="flex-1 flex items-center justify-center text-xs text-muted-foreground hover:text-foreground"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustStakeBy10('down')}
                      className="flex-1 flex items-center justify-center text-xs text-muted-foreground hover:text-foreground"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>

              {weeklyBudget !== null && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                  <DollarSign className="h-4 w-4" />
                  <span>Presupuesto Semanal: <span className="font-semibold">{weeklyBudget} pts</span></span>
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Multiplicador</span>
                  <span className="font-semibold">{totalOdds.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ganancia Potencial:</span>
                  <span className="font-semibold text-primary">{potentialWinnings} pts</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  id="realizar-apuesta"
                  onClick={handlePlaceBet}
                  disabled={
                    isSubmitting ||
                    !stake ||
                    parseFloat(stake) <= 0 ||
                    (selectedBets.length > 1 && hasDuplicateFixtures) ||
                    (!window.location.pathname.includes('/directo') && selectedBets.some(bet => bet.kickoff ? (new Date() >= new Date(new Date(bet.kickoff).getTime() - cutoffMinutes * 60 * 1000)) : false))
                  }
                  className="w-full"
                >
                  {isSubmitting ? 'Procesando...' : 'Realizar Boletos'}
                </Button>
                <Button
                  variant="outline"
                  onClick={onClearAll}
                  className="w-full bg-white text-black border border-[#FFC72C] hover:bg-[#FFC72C] hover:text-black"
                >
                  Limpiar Boleto
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BetSlip;