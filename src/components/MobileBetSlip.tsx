import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { X, DollarSign, ChevronUp, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBettingSettings } from '@/hooks/useBettingSettings';
import { supabase } from '@/integrations/supabase/client';
import { getBettingTranslation } from '@/utils/bettingTranslations';

interface Bet {
  id: string;
  matchDescription: string;
  market: string;
  selection: string;
  odds: number;
  fixtureId?: number;
  kickoff?: string;
}

interface MobileBetSlipProps {
  selectedBets: Bet[];
  onRemoveBet: (betId: string) => void;
  onClearAll: () => void;
  forceOpen?: boolean;
}

const MobileBetSlip = ({ selectedBets, onRemoveBet, onClearAll, forceOpen = false }: MobileBetSlipProps) => {
  const [stake, setStake] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weeklyBudget, setWeeklyBudget] = useState<number | null>(null);
  const [minBet, setMinBet] = useState<number>(10); // Default minimum bet
  const [isExpanded, setIsExpanded] = useState(false);

  // Effect to handle forceOpen prop
  useEffect(() => {
    if (forceOpen) {
      setIsExpanded(true);
    }
  }, [forceOpen]);
  const { toast } = useToast();
  const { cutoffMinutes } = useBettingSettings();

  // Helper to adjust stake by 10, respecting minBet
  const adjustStakeBy10 = (direction: 'up' | 'down') => {
    const current = parseFloat(stake) || 0;
    const next = direction === 'up' ? current + 10 : Math.max(minBet, current - 10);
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


  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
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
      }
    };
    loadUserData();
  }, []);

  // Set default stake to minimum bet when minBet changes
  useEffect(() => {
    if (minBet && !stake) {
      setStake(minBet.toString());
    }
  }, [minBet, stake]);

  // No automatic drawer management - handle manually to avoid conflicts

  // Check for duplicate fixtures
  const fixtureIds = selectedBets.map(bet => bet.fixtureId).filter(id => id !== undefined);
  const uniqueFixtureIds = new Set(fixtureIds);
  const hasDuplicateFixtures = fixtureIds.length !== uniqueFixtureIds.size;

  const totalOdds = selectedBets.reduce((acc, bet) => acc * bet.odds, 1);
  const potentialWinnings = stake ? (parseFloat(stake.replace(',', '.')) * totalOdds).toFixed(2) : '0.00';

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

      // Validación: mínimo por apuesta según la liga
      if (stakeAmount < minBet) {
        toast({
          title: 'Error',
          description: `La apuesta mínima en esta liga es de ${minBet}.`,
          variant: 'destructive',
        });
        return;
      }  

      // Nueva validación: maximo por apuesta según la liga
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
              description: `La apuesta máxima en esta liga es de ${maxBet}.`,
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

      toast({
        title: '¡Apuesta realizada!',
        description: `Apuesta ${selectedBets.length > 1 ? 'combinada' : ''} de ${stake} pts realizada con éxito.`,
      });

      // Clear the bet slip and close sheet
      onClearAll();
      setStake('');
      setIsExpanded(false);

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

  const handleClearAll = () => {
    onClearAll();
    setStake('');
    // Don't close if forceOpen is active
    if (!forceOpen) {
      setIsExpanded(false);
    }
  };

  const handleRemoveBet = (betId: string) => {
    onRemoveBet(betId);
    
    // If this was the last bet, close sheet (unless forceOpen is active)
    if (selectedBets.length === 1 && !forceOpen) {
      setIsExpanded(false);
    }
  };

  // Don't render if no bets selected
  if (selectedBets.length === 0) {
    return null;
  }

  return (
    <Sheet 
      open={isExpanded} 
      onOpenChange={(open) => {
        // Don't allow any changes when forceOpen is active
        if (forceOpen) {
          return;
        }
        setIsExpanded(open);
      }}
    >
      {/* Fixed Bottom Bar - Always Visible */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg">
        <SheetTrigger asChild>
          <div className={`px-4 py-3 ${forceOpen ? 'cursor-default' : 'cursor-pointer hover:bg-muted/50'} transition-colors`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Boleto</span>
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                    {selectedBets.length}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Cuota: {totalOdds.toFixed(2)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {stake && (
                  <div className="text-sm font-medium">
                    Ganancia: {potentialWinnings} pts
                  </div>
                )}
                <ChevronUp className="h-4 w-4" />
              </div>
            </div>
          </div>
        </SheetTrigger>
      </div>

      {/* Sheet Content */}
      <SheetContent side="bottom" className="max-h-[85vh] flex flex-col p-0">
        <SheetTitle className="sr-only">Boleto de Apuestas</SheetTitle>
        {/* Overlay to block interactions when forceOpen is active */}
        {forceOpen && (
          <div 
            className="absolute inset-0 z-10 bg-transparent"
            style={{ pointerEvents: 'none' }}
          />
        )}
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-4">
          <div className="space-y-4 py-4">
            {/* Selected Bets */}
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
                        size="sm"
                        onClick={() => handleRemoveBet(bet.id)}
                        className="jambol-button h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Betting Form */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="stake">Importe (pts)</Label>
                <div className="relative">
                  <Input
                    id="stake"
                    type="text"
                    placeholder="0"
                    value={stake}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
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

              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                <DollarSign className="h-4 w-4" />
                <span>Presupuesto Semanal: <span className="font-semibold">{weeklyBudget !== null ? `${weeklyBudget} pts` : 'Cargando...'}</span></span>
              </div>

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
            </div>
          </div>
        </div>

        {/* Fixed Bottom Actions */}
        <div className="px-4 pb-4 pt-2 border-t bg-background flex-shrink-0">
          <div className="space-y-2">
            <Button
              className="jambol-button w-full"
              onClick={handlePlaceBet}
              disabled={
                isSubmitting || 
                !stake || 
                parseFloat(stake) <= 0 || 
                (selectedBets.length > 1 && hasDuplicateFixtures) ||
                selectedBets.some(bet => bet.kickoff ? (new Date() >= new Date(new Date(bet.kickoff).getTime() - 15 * 60 * 1000)) : false)
              }
            >
              {isSubmitting ? 'Procesando...' : 'Realizar Apuestas'}
            </Button>
            <Button
              variant="outline"
              className="w-full bg-white text-black border border-[#FFC72C] hover:bg-[#FFC72C] hover:text-black"
              onClick={handleClearAll}
            >
              Limpiar Boleto
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileBetSlip;