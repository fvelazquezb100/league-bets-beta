import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { X } from 'lucide-react';

interface Bet {
  id: string;
  matchDescription: string;
  market: string;
  selection: string;
  odds: number;
  fixtureId?: number;
  kickoff?: string;
}

interface BetSlipDemoProps {
  selectedBets: Bet[];
  onRemoveBet: (betId: string) => void;
  onClearAll: () => void;
}

const BetSlipDemo = ({ selectedBets, onRemoveBet, onClearAll }: BetSlipDemoProps) => {
  const [stake, setStake] = useState<string>('');

  // Auto-fill 100 pts when there are selected bets
  useEffect(() => {
    if (selectedBets.length > 0 && !stake) {
      setStake('100');
    }
  }, [selectedBets, stake]);

  const totalOdds = selectedBets.reduce((acc, bet) => acc * bet.odds, 1);
  const potentialWinnings = stake ? (parseFloat(stake.replace(',', '.')) * totalOdds).toFixed(2) : '0.00';

  if (selectedBets.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">Boleto de Apuestas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Selecciona una cuota para comenzar tu apuesta
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl">Boleto de Apuestas</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedBets.map((bet) => (
          <div key={bet.id} className="border rounded-lg p-3">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <p className="font-medium text-sm">{bet.matchDescription}</p>
                <p className="text-xs text-muted-foreground">{bet.market}</p>
                <p className="text-sm font-semibold">{bet.selection}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveBet(bet.id)}
                className="h-6 w-6 p-0 ml-2"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Cuota:</span>
              <span className="font-semibold">{bet.odds}</span>
            </div>
          </div>
        ))}

        <Separator />

        <div className="space-y-3">
          <div>
            <Label htmlFor="bet-amount">Importe (pts)</Label>
            <Input
              id="bet-amount"
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
              <span className="font-semibold text-primary">{potentialWinnings} pts</span>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              id="realizar-apuesta"
              className="w-full"
              disabled={!stake || parseFloat(stake) <= 0}
            >
              Realizar Apuestas
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
      </CardContent>
    </Card>
  );
};

export default BetSlipDemo;
