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
  const { cutoffMinutes } = useBettingSettings();
  const queryClient = useQueryClient();

  // Check for duplicate fixtures
  const fixtureIds = selectedBets.map(bet => bet.fixtureId).filter(id => id !== undefined);
  const uniqueFixtureIds = new Set(fixtureIds);
  const hasDuplicateFixtures = fixtureIds.length !== uniqueFixtureIds.size;

  const totalOdds = selectedBets.reduce((acc, bet) => acc * bet.odds, 1);
  const potentialWinnings = stake ? (parseFloat(stake.replace(',', '.')) * totalOdds).toFixed(2) : '0.00';

  // Handle stake input - only allow integers
  const handleStakeChange = (value: string) => {
    // Remove any non-numeric characters except for the first character
    const numericValue = value.replace(/[^0-9]/g, '');
    setStake(numericValue);
  };

  // Handle increment/decrement by 10
  const handleIncrement = () => {
    const currentValue = parseInt(stake) || 0;
    const newValue = currentValue + 10;
    setStake(newValue.toString());
  };

  const handleDecrement = () => {
    const currentValue = parseInt(stake) || 0;
    const newValue = Math.max(minBet, currentValue - 10);
    setStake(newValue.toString());
  };

  // Handle spinner arrows (up/down keys and mouse wheel)
  const handleSpinnerChange = (direction: 'up' | 'down') => {
    const currentValue = parseInt(stake) || 0;
    const delta = direction === 'up' ? 10 : -10;
    const newValue = Math.max(minBet, currentValue + delta);
    setStake(newValue.toString());
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('weekly_budget, league_id')
        .eq('id', user.id)
        .single();

      if (profile) {
        setWeeklyBudget(profile.weekly_budget);
        
        // Get league minimum bet amount
        if (profile.league_id) {
          const { data: league } = await supabase
            .from('leagues')
            .select('min_bet')
            .eq('id', profile.league_id)
            .single();

          if (league?.min_bet) {
            setMinBet(Number(league.min_bet));
            // Set default stake to minimum bet amount
            setStake(league.min_bet.toString());
          }
        }
      }
    };

    fetchUserData();
  }, []);

  // Handle keyboard arrow keys
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleSpinnerChange('up');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleSpinnerChange('down');
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleStakeChange(e.target.value);
  };


  // Reset stake to minimum when bet slip is cleared
  useEffect(() => {
    if (selectedBets.length === 0 && stake !== minBet.toString()) {
      setStake(minBet.toString());
    }
  }, [selectedBets.length, minBet, stake]);

  const handlePlaceBet = async () => {
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
        description: 'No se pueden incluir múltiples selecciones del mismo partido en una apuesta combinada.',
        variant: 'destructive',
      });
      return;
    }

    // Bloqueo por cierre: X minutos antes del inicio (configurable)
    const isAnyFrozen = selectedBets.some(bet => {
      if (!bet.kickoff) return false;
      const freeze = new Date(new Date(bet.kickoff).getTime() - cutoffMinutes * 60 * 1000);
      return new Date() >= freeze;
    });
    if (isAnyFrozen) {
      toast({
        title: 'Apuestas cerradas',
        description: `Al menos una selección está cerrada (${cutoffMinutes} min antes del inicio).`,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Error',
          description: 'Debes iniciar sesión para realizar apuestas.',
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
 // Nueva validación: mínimo por apuesta según la liga
      const { data: league, error: leagueError } = await supabase
        .from('leagues')
        .select('min_bet')
        .eq('id', profile.league_id)
        .maybeSingle();

      if (leagueError || !league) {
        toast({
          title: 'Error',
          description: 'No se pudo validar la liga.',
          variant: 'destructive',
        });
        return;
      }  
      const minimumBet = Number((league as any)?.min_bet ?? 0);
      if (stakeAmount < minimumBet) {
        toast({
          title: 'Error',
          description: `La apuesta mínima en esta liga es de ${minimumBet}.`,
          variant: 'destructive',
        });
        return;
      }  

  // Nueva validación: maximo por apuesta según la liga
      const { data: maxBetLeague, error: maxBetLeagueError } = await supabase
        .from('leagues')
        .select('max_bet')
        .eq('id', profile.league_id)
        .maybeSingle();

      if (maxBetLeagueError || !maxBetLeague) {
        toast({
          title: 'Error',
          description: 'No se pudo validar la liga.',
          variant: 'destructive',
        });
        return;
      }  
      const maxBet = Number((maxBetLeague as any)?.max_bet ?? 0);
      if (stakeAmount > maxBet) {
        toast({
          title: 'Error',
          description: `La apuesta máxima en esta liga es de ${maxBet}.`,
          variant: 'destructive',
        });
        return;
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

      // Invalidate React Query cache to refresh data immediately
      queryClient.invalidateQueries({ queryKey: ['user-bets'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });

      toast({
        title: '¡Apuesta realizada!',
        description: `Apuesta ${selectedBets.length > 1 ? 'combinada' : ''} de ${stake} pts realizada con éxito.`,
      });

      // Clear the bet slip and reset stake to minimum
      onClearAll();
      setStake(minBet.toString());

    } catch (error) {
      console.error('Error placing bet:', error);
      toast({
        title: 'Error',
        description: 'No se pudo realizar la apuesta. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-xl">Boleto de Apuestas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedBets.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Haz clic en una cuota para añadirla a tu boleto.
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
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onWheel={(e) => {
                      e.preventDefault();
                      const delta = e.deltaY > 0 ? -10 : 10;
                      const currentValue = parseInt(stake) || 0;
                      const newValue = Math.max(minBet, currentValue + delta);
                      setStake(newValue.toString());
                    }}
                    className="pr-8"
                  />
                  <div className="absolute right-1 top-0 bottom-0 flex flex-col">
                    <button
                      type="button"
                      onClick={() => handleSpinnerChange('up')}
                      className="flex-1 flex items-center justify-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                      style={{ fontSize: '10px', lineHeight: '1' }}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSpinnerChange('down')}
                      className="flex-1 flex items-center justify-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                      style={{ fontSize: '10px', lineHeight: '1' }}
                    >
                      ▼
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Mínimo: {minBet} pts • Usa las flechas para incrementar de 10 en 10
                </p>
              </div>

              {weeklyBudget !== null && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                  <DollarSign className="h-4 w-4" />
                  <span>Presupuesto Semanal: <span className="font-semibold">{weeklyBudget} pts</span></span>
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Cuota Total:</span>
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
                    selectedBets.some(bet => bet.kickoff ? (new Date() >= new Date(new Date(bet.kickoff).getTime() - cutoffMinutes * 60 * 1000)) : false)
                  }
                  className="w-full"
                >
                  {isSubmitting ? 'Procesando...' : 'Realizar Apuestas'}
                </Button>
                <Button
                  variant="outline"
                  onClick={onClearAll}
                  className="w-full"
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