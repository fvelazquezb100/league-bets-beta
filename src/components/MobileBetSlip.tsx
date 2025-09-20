import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { X, DollarSign, ChevronUp, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
}

const MobileBetSlip = ({ selectedBets, onRemoveBet, onClearAll }: MobileBetSlipProps) => {
  const [stake, setStake] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weeklyBudget, setWeeklyBudget] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  // Load weekly budget on component mount
  useEffect(() => {
    const loadWeeklyBudget = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('weekly_budget')
          .eq('id', user.id)
          .single();

        if (profile) {
          setWeeklyBudget(profile.weekly_budget);
        }
      }
    };
    loadWeeklyBudget();
  }, []);

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

    // Bloqueo por cierre: 15 minutos antes del inicio
    const isAnyFrozen = selectedBets.some(bet => {
      if (!bet.kickoff) return false;
      const freeze = new Date(new Date(bet.kickoff).getTime() - 15 * 60 * 1000);
      return new Date() >= freeze;
    });
    if (isAnyFrozen) {
      toast({
        title: 'Apuestas cerradas',
        description: 'Al menos una selección está cerrada (15 min antes del inicio).',
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
    setIsExpanded(false);
  };

  const handleRemoveBet = (betId: string) => {
    onRemoveBet(betId);
    
    // If this was the last bet, close sheet
    if (selectedBets.length === 1) {
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
      onOpenChange={setIsExpanded}
    >
      {/* Fixed Bottom Bar - Always Visible */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg">
        <SheetTrigger asChild>
          <div className="px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors">
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
                <Input
                  id="stake"
                  type="number"
                  placeholder="0.00"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  min="0"
                  step="0.01"
                />
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
              className="jambol-button w-full"
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