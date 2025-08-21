import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { X, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

interface League {
  id: number;
  name: string;
  join_code: string;
  type: string;
  week: number;
}

const { data: league, error } = await supabase
  .from<League>('leagues')   // <- aquí tipas explícitamente
  .select('*')
  .eq('id', userLeagueId)
  .single();

if (error) throw error;

// Ahora TypeScript sabe que league.week existe
const currentWeek = league.week;

const BetSlip = ({ selectedBets, onRemoveBet, onClearAll }: BetSlipProps) => {
  const [stake, setStake] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weeklyBudget, setWeeklyBudget] = useState<number | null>(null);
  const { toast } = useToast();

  const fixtureIds = selectedBets.map(bet => bet.fixtureId).filter(id => id !== undefined);
  const uniqueFixtureIds = new Set(fixtureIds);
  const hasDuplicateFixtures = fixtureIds.length !== uniqueFixtureIds.size;

  const totalOdds = selectedBets.reduce((acc, bet) => acc * bet.odds, 1);
  const potentialWinnings = stake ? (parseFloat(stake.replace(',', '.')) * totalOdds).toFixed(2) : '0.00';

  useEffect(() => {
    const fetchWeeklyBudget = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('weekly_budget')
        .eq('id', user.id)
        .single();

      if (profile) setWeeklyBudget(profile.weekly_budget);
    };

    fetchWeeklyBudget();
  }, []);

  const handlePlaceBet = async () => {
    if (!stake || parseFloat(stake) <= 0) {
      toast({ title: 'Error', description: 'Por favor, introduce un importe válido.', variant: 'destructive' });
      return;
    }

    if (selectedBets.length === 0) {
      toast({ title: 'Error', description: 'No hay selecciones en el boleto.', variant: 'destructive' });
      return;
    }

    if (selectedBets.length > 1 && hasDuplicateFixtures) {
      toast({
        title: 'Error',
        description: 'No se pueden incluir múltiples selecciones del mismo partido en una apuesta combinada.',
        variant: 'destructive',
      });
      return;
    }

    const isAnyFrozen = selectedBets.some(bet => {
      if (!bet.kickoff) return false;
      const freeze = new Date(new Date(bet.kickoff).getTime() - 15 * 60 * 1000);
      return new Date() >= freeze;
    });
    if (isAnyFrozen) {
      toast({ title: 'Apuestas cerradas', description: 'Al menos una selección está cerrada (15 min antes del inicio).', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Debes iniciar sesión para realizar apuestas.');

      const stakeAmount = parseFloat(stake);

      // Obtener presupuesto y liga del usuario
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('weekly_budget, league_id')
        .eq('id', user.id)
        .single();
      if (profileError || !profile) throw new Error('No se pudo verificar tu presupuesto.');

      if (profile.weekly_budget < stakeAmount) {
        toast({ title: 'Error', description: `Presupuesto insuficiente. Disponible: €${profile.weekly_budget}`, variant: 'destructive' });
        return;
      }

      // Obtener semana actual de la liga
      const { data: league, error: leagueError } = await supabase
        .from('leagues')
        .select('week')
        .eq('id', profile.league_id)
        .single();
      if (leagueError || !league) throw new Error('No se pudo obtener la liga del usuario.');

      const currentWeek = league.week ?? 1;

      // Insertar apuesta
      if (selectedBets.length === 1) {
        const { error: betError } = await supabase
          .from('bets')
          .insert({
            user_id: user.id,
            stake: stakeAmount,
            odds: totalOdds,
            payout: parseFloat(potentialWinnings),
            match_description: selectedBets[0].matchDescription,
            bet_selection: `${selectedBets[0].selection} @ ${selectedBets[0].odds}`,
            fixture_id: selectedBets[0].fixtureId,
            bet_type: 'single',
            status: 'pending',
            week: currentWeek
          });
        if (betError) throw betError;

        const { error: budgetError } = await supabase
          .from('profiles')
          .update({ weekly_budget: profile.weekly_budget - stakeAmount })
          .eq('id', user.id);
        if (budgetError) throw budgetError;

      } else {
        // Combo bet
        const selections = selectedBets.map(bet => ({
          fixture_id: bet.fixtureId,
          market: bet.market,
          selection: bet.selection,
          odds: bet.odds,
          match_description: bet.matchDescription
        }));

        const { data: betId, error: comboError } = await supabase.rpc('place_combo_bet', {
          stake_amount: stakeAmount,
          selections: selections,
          week: currentWeek // pasa la semana a la función RPC si es necesario
        });
        if (comboError) throw comboError;
      }

      setWeeklyBudget(profile.weekly_budget - stakeAmount);
      toast({ title: '¡Apuesta realizada!', description: `Apuesta ${selectedBets.length > 1 ? 'combinada' : ''} de €${stake} realizada con éxito.` });

      onClearAll();
      setStake('');

    } catch (error) {
      console.error('Error placing bet:', error);
      toast({ title: 'Error', description: 'No se pudo realizar la apuesta. Inténtalo de nuevo.', variant: 'destructive' });
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
                      <p className="text-xs text-muted-foreground">{bet.market}</p>
                      <p className="text-sm font-semibold">{bet.selection}</p>
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
                <Label htmlFor="stake">Importe (€)</Label>
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
                  <span className="font-semibold text-primary">€{potentialWinnings}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handlePlaceBet}
                  disabled={
                    isSubmitting ||
                    !stake ||
                    parseFloat(stake) <= 0 ||
                    (selectedBets.length > 1 && hasDuplicateFixtures) ||
                    selectedBets.some(bet => bet.kickoff ? (new Date() >= new Date(new Date(bet.kickoff).getTime() - 15 * 60 * 1000)) : false)
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
