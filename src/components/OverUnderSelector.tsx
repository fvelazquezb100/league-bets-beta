import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import type { MatchData, BetValue } from '@/pages/Bets';

interface OverUnderSelectorProps {
  match: MatchData;
  isFrozen: boolean;
  handleAddToSlip: (match: MatchData, marketName: string, selection: BetValue) => void;
}

const OverUnderSelector = ({ match, isFrozen, handleAddToSlip }: OverUnderSelectorProps) => {
  const [threshold, setThreshold] = useState(2.5);
  const [underOdds, setUnderOdds] = useState<string>('0.00');
  const [overOdds, setOverOdds] = useState<string>('0.00');

  // Available thresholds
  const thresholds = [0.5, 1.5, 2.5, 3.5, 4.5];

  // Find odds for current threshold
  useEffect(() => {
    if (!match.bookmakers || match.bookmakers.length === 0) return;

    for (const bookmaker of match.bookmakers) {
      const market = bookmaker.bets.find(bet => 
        bet.name === 'Goals Over/Under' || 
        bet.name === 'Over/Under Goals' || 
        bet.name === 'Total Goals' ||
        bet.name === 'Goals O/U'
      );
      
      if (market) {
        // Find under odds
        const underMatch = market.values.find(value => 
          value.value.toLowerCase().includes('under') && 
          value.value.includes(threshold.toString())
        );
        
        // Find over odds
        const overMatch = market.values.find(value => 
          value.value.toLowerCase().includes('over') && 
          value.value.includes(threshold.toString())
        );
        
        if (underMatch) {
          setUnderOdds(underMatch.odd);
        } else {
          setUnderOdds('0.00');
        }
        
        if (overMatch) {
          setOverOdds(overMatch.odd);
        } else {
          setOverOdds('0.00');
        }
        
        return;
      }
    }
    
    // If no market found, reset odds
    setUnderOdds('0.00');
    setOverOdds('0.00');
  }, [threshold, match.bookmakers]);

  const handleUnderBet = () => {
    if (isFrozen || underOdds === '0.00') return;
    
    const betValue: BetValue = {
      value: `Under ${threshold}`,
      odd: underOdds
    };
    
    handleAddToSlip(match, 'Goles Más/Menos de', betValue);
  };

  const handleOverBet = () => {
    if (isFrozen || overOdds === '0.00') return;
    
    const betValue: BetValue = {
      value: `Over ${threshold}`,
      odd: overOdds
    };
    
    handleAddToSlip(match, 'Goles Más/Menos de', betValue);
  };

  const decrementThreshold = () => {
    const currentIndex = thresholds.indexOf(threshold);
    if (currentIndex > 0) {
      setThreshold(thresholds[currentIndex - 1]);
    }
  };

  const incrementThreshold = () => {
    const currentIndex = thresholds.indexOf(threshold);
    if (currentIndex < thresholds.length - 1) {
      setThreshold(thresholds[currentIndex + 1]);
    }
  };

  return (
    <div className="border-t-2 border-border pt-8 mt-8 first:border-t-0 first:pt-0 first:mt-0">
      <h4 className="font-semibold mb-6 text-foreground text-lg">Goles Más/Menos de</h4>
      <div className="grid grid-cols-3 gap-4 items-center">
        {/* Under Button */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">
            Menos de
          </span>
          <Button
            onClick={handleUnderBet}
            disabled={isFrozen || underOdds === '0.00'}
            variant="outline"
            className={`w-full h-12 transition-all duration-200 hover:scale-[1.02] ${
              underOdds === '0.00' 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-success hover:text-success-foreground hover:border-success'
            }`}
          >
            <span className="text-lg font-bold">{underOdds}</span>
          </Button>
        </div>

        {/* Threshold Selector */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">
            Umbral
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={decrementThreshold}
              disabled={isFrozen || threshold === thresholds[0]}
              className="h-8 w-8 p-0"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="w-16 text-center">
              <span className="text-2xl font-bold text-foreground">{threshold}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={incrementThreshold}
              disabled={isFrozen || threshold === thresholds[thresholds.length - 1]}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Over Button */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">
            Más de
          </span>
          <Button
            onClick={handleOverBet}
            disabled={isFrozen || overOdds === '0.00'}
            variant="outline"
            className={`w-full h-12 transition-all duration-200 hover:scale-[1.02] ${
              overOdds === '0.00' 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-success hover:text-success-foreground hover:border-success'
            }`}
          >
            <span className="text-lg font-bold">{overOdds}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OverUnderSelector;
