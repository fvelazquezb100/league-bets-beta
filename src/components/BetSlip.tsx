import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Bet {
  id: string;
  matchDescription: string;
  market: string;
  selection: string;
  odds: number;
  fixtureId?: number;
}

interface BetSlipProps {
  selectedBets: Bet[];
  onRemoveBet: (betId: string) => void;
  onClearAll: () => void;
}

const BetSlip = ({ selectedBets, onRemoveBet, onClearAll }: BetSlipProps) => {
  const [stake, setStake] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const totalOdds = selectedBets.reduce((acc, bet) => acc * bet.odds, 1);
  const potentialWinnings = stake ? (parseFloat(stake) * totalOdds).toFixed(2) : '0.00';

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

      // Check if user has enough budget
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('weekly_budget')
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

      if (profile.weekly_budget < stakeAmount) {
        toast({
          title: 'Error',
          description: `Presupuesto insuficiente. Disponible: €${profile.weekly_budget}`,
          variant: 'destructive',
        });
        return;
      }

      // Place the bet and update budget in a transaction
      const { error: betError } = await supabase
        .from('bets')
        .insert({
          user_id: user.id,
          stake: stakeAmount,
          odds: totalOdds,
          payout: parseFloat(potentialWinnings),
          match_description: selectedBets.map(bet => bet.matchDescription).join(' + '),
          bet_selection: selectedBets.map(bet => `${bet.selection} @ ${bet.odds}`).join(' + '),
          fixture_id: selectedBets.length > 0 ? selectedBets[0].fixtureId : null,
          status: 'pending'
        });

      if (betError) {
        throw betError;
      }

      // Update user's weekly budget
      const { error: budgetError } = await supabase
        .from('profiles')
        .update({ 
          weekly_budget: profile.weekly_budget - stakeAmount 
        })
        .eq('id', user.id);

      if (budgetError) {
        throw budgetError;
      }

      toast({
        title: '¡Apuesta realizada!',
        description: `Apuesta de €${stake} realizada con éxito.`,
      });

      // Clear the bet slip
      onClearAll();
      setStake('');

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
                  disabled={isSubmitting || !stake || parseFloat(stake) <= 0}
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