import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import type { MatchData, BetValue } from '@/pages/Bets';

interface ResultTotalGoalsSelectorProps {
  match: MatchData;
  isFrozen: boolean;
  handleAddToSlip: (match: MatchData, marketName: string, selection: BetValue) => void;
}

const ResultTotalGoalsSelector = ({ match, isFrozen, handleAddToSlip }: ResultTotalGoalsSelectorProps) => {
  const [matchResult, setMatchResult] = useState<string>('');
  const [totalGoals, setTotalGoals] = useState<number>(2.5);
  const [overUnder, setOverUnder] = useState<'over' | 'under' | null>(null);
  const [currentOdds, setCurrentOdds] = useState('0.00');

  const results = [
    { value: 'Home', label: match.teams?.home?.name || 'Local', short: 'L' },
    { value: 'Draw', label: 'Empate', short: 'E' },
    { value: 'Away', label: match.teams?.away?.name || 'Visitante', short: 'V' }
  ];

  const thresholds = [1.5, 2.5, 3.5, 4.5];

  useEffect(() => {
    const findOdds = () => {
      const market = match.bookmakers?.[0]?.bets.find(
        (bet) => bet.name === 'Result/Total Goals'
      );
      if (!market || !matchResult || !overUnder) return '0.00';

      // Try different possible formats for the selection
      const overUnderText = overUnder === 'over' ? 'Over' : 'Under';
      const possibleSelections = [
        `${matchResult}/${overUnderText} ${totalGoals}`,
        `${matchResult} / ${overUnderText} ${totalGoals}`,
        `${matchResult}/${overUnderText}${totalGoals}`,
        `${matchResult} / ${overUnderText}${totalGoals}`,
        `${matchResult}/${overUnderText} ${totalGoals}`,
        `${matchResult} / ${overUnderText} ${totalGoals}`
      ];

      for (const selection of possibleSelections) {
        const value = market.values.find(v => v.value === selection);
        if (value) return value.odd;
      }

      return '0.00';
    };
    setCurrentOdds(findOdds());
  }, [matchResult, totalGoals, overUnder, match.bookmakers]);

  const handleAddBet = () => {
    if (currentOdds === '0.00' || !matchResult || !overUnder) return;

    const overUnderText = overUnder === 'over' ? 'Over' : 'Under';
    const betValue: BetValue = {
      value: `${matchResult}/${overUnderText} ${totalGoals}`,
      odd: currentOdds,
    };
    
    handleAddToSlip(match, 'Resultado/Total Goles', betValue);
  };

  const getResultLabel = (result: string) => {
    return results.find(r => r.value === result)?.label || result;
  };

  const currentIndex = thresholds.indexOf(totalGoals);

  const decrementThreshold = () => {
    if (currentIndex > 0) {
      setTotalGoals(thresholds[currentIndex - 1]);
    }
  };

  const incrementThreshold = () => {
    if (currentIndex < thresholds.length - 1) {
      setTotalGoals(thresholds[currentIndex + 1]);
    }
  };

  return (
    <div className="border-t-2 border-border pt-8 mt-8 first:border-t-0 first:pt-0 first:mt-0">
      <h4 className="font-semibold mb-6 text-foreground text-lg">Resultado/Total Goles</h4>
      
      <div className="space-y-4">
        {/* Match Result Selector */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Resultado del Partido</p>
          <div className="grid grid-cols-3 gap-2">
            {results.map((result) => (
              <Button
                key={`result-${result.value}`}
                size="sm"
                onClick={() => setMatchResult(result.value)}
                disabled={isFrozen}
                className={`h-10 transition-all duration-200 ${
                  matchResult === result.value 
                    ? 'bg-primary text-primary-foreground' 
                    : 'jambol-button'
                }`}
              >
                <span className="text-xs">{result.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Total Goals Selector */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Total de Goles</p>
          <div className="grid grid-cols-3 gap-4 items-center">
            {/* Menos de Button */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">
                Menos de
              </span>
              <Button
                size="sm"
                onClick={() => setOverUnder('under')}
                disabled={isFrozen}
                className={`h-10 w-full transition-all duration-200 ${
                  overUnder === 'under' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'jambol-button'
                }`}
              >
                <span className="text-xs">Menos de</span>
              </Button>
            </div>

            {/* Threshold Selector */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">
                Umbral
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={decrementThreshold}
                  disabled={isFrozen || currentIndex === 0}
                  className="h-8 w-8 p-0 jambol-button"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="w-12 text-center">
                  <span className="text-2xl font-bold text-foreground">{totalGoals}</span>
                </div>
                <Button
                  size="sm"
                  onClick={incrementThreshold}
                  disabled={isFrozen || currentIndex === thresholds.length - 1}
                  className="h-8 w-8 p-0 jambol-button"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Más de Button */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">
                Más de
              </span>
              <Button
                size="sm"
                onClick={() => setOverUnder('over')}
                disabled={isFrozen}
                className={`h-10 w-full transition-all duration-200 ${
                  overUnder === 'over' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'jambol-button'
                }`}
              >
                <span className="text-xs">Más de</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Add Bet Button */}
        <Button
          onClick={handleAddBet}
          disabled={isFrozen || currentOdds === '0.00' || !matchResult || !overUnder}
          className={`w-full h-12 transition-all duration-200 hover:scale-[1.02] jambol-button ${
            currentOdds === '0.00' || !matchResult || !overUnder
              ? 'opacity-50 cursor-not-allowed' 
              : ''
          }`}
        >
          <span className="text-lg font-bold">
            {!matchResult ? 'Selecciona el resultado' : 
             !overUnder ? 'Selecciona Más/Menos' : 
             currentOdds === '0.00' ? 'Cuotas no disponibles' : `${currentOdds}`}
          </span>
        </Button>
      </div>
    </div>
  );
};

export default ResultTotalGoalsSelector;
