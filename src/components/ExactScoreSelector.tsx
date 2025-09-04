import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import type { MatchData, BetValue } from '@/pages/Bets';

interface ExactScoreSelectorProps {
  match: MatchData;
  isFrozen: boolean;
  handleAddToSlip: (match: MatchData, marketName: string, selection: BetValue) => void;
}

const ExactScoreSelector = ({ match, isFrozen, handleAddToSlip }: ExactScoreSelectorProps) => {
  const [homeGoals, setHomeGoals] = useState(0);
  const [awayGoals, setAwayGoals] = useState(0);
  const [currentOdds, setCurrentOdds] = useState<string>('0.00');

  // Find the exact score market and get odds for current selection
  useEffect(() => {
    if (!match.bookmakers || match.bookmakers.length === 0) return;

    const scoreString = `${homeGoals}:${awayGoals}`;
    
    for (const bookmaker of match.bookmakers) {
      const market = bookmaker.bets.find(bet => 
        bet.name === 'Correct Score' || 
        bet.name === 'Exact Score' || 
        bet.name === 'Score'
      );
      
      if (market) {
        const exactMatch = market.values.find(value => 
          value.value === scoreString || 
          value.value === `${homeGoals}-${awayGoals}` ||
          value.value === `${homeGoals} - ${awayGoals}`
        );
        
        if (exactMatch) {
          setCurrentOdds(exactMatch.odd);
          return;
        }
      }
    }
    
    // If no exact match found, set to 0.00
    setCurrentOdds('0.00');
  }, [homeGoals, awayGoals, match.bookmakers]);

  const handleAddBet = () => {
    if (isFrozen || currentOdds === '0.00') return;
    
    const scoreString = `${homeGoals}:${awayGoals}`;
    const betValue: BetValue = {
      value: scoreString,
      odd: currentOdds
    };
    
    handleAddToSlip(match, 'Resultado Exacto', betValue);
  };

  const incrementHome = () => {
    if (homeGoals < 4) setHomeGoals(prev => prev + 1);
  };

  const decrementHome = () => {
    if (homeGoals > 0) setHomeGoals(prev => prev - 1);
  };

  const incrementAway = () => {
    if (awayGoals < 4) setAwayGoals(prev => prev + 1);
  };

  const decrementAway = () => {
    if (awayGoals > 0) setAwayGoals(prev => prev - 1);
  };

  return (
    <div className="border-t-2 border-border pt-4 sm:pt-8 mt-4 sm:mt-8 first:border-t-0 first:pt-0 first:mt-0">
      <h4 className="font-semibold mb-4 sm:mb-6 text-foreground text-base sm:text-lg">Resultado Exacto</h4>
      <div className="grid grid-cols-3 gap-2 sm:gap-4 items-center">
        {/* Home Team Goals Selector */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium text-center">
            {match.teams?.home?.name || 'Local'}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={decrementHome}
              disabled={isFrozen || homeGoals === 0}
              className="h-8 w-8 p-0"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="w-12 text-center">
              <span className="text-2xl font-bold text-foreground">{homeGoals}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={incrementHome}
              disabled={isFrozen || homeGoals === 4}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* VS Separator */}
        <div className="text-center">
          <span className="text-muted-foreground font-semibold text-lg">vs</span>
        </div>

        {/* Away Team Goals Selector */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium text-center">
            {match.teams?.away?.name || 'Visitante'}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={decrementAway}
              disabled={isFrozen || awayGoals === 0}
              className="h-8 w-8 p-0"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="w-12 text-center">
              <span className="text-2xl font-bold text-foreground">{awayGoals}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={incrementAway}
              disabled={isFrozen || awayGoals === 4}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Odds Button - Full width below */}
      <div className="mt-4">
        <Button
          onClick={handleAddBet}
          disabled={isFrozen || currentOdds === '0.00'}
          variant="outline"
          className={`w-full h-12 transition-all duration-200 hover:scale-[1.02] ${
            currentOdds === '0.00' 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-green-500 hover:text-white hover:border-green-500'
          }`}
        >
          <span className="text-lg font-bold">{currentOdds}</span>
        </Button>
      </div>
    </div>
  );
};

export default ExactScoreSelector;
