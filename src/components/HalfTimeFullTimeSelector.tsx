import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { MatchData, BetValue } from '@/pages/Bets';

interface HalfTimeFullTimeSelectorProps {
  match: MatchData;
  isFrozen: boolean;
  handleAddToSlip: (match: MatchData, marketName: string, selection: BetValue) => void;
}

const HalfTimeFullTimeSelector = ({ match, isFrozen, handleAddToSlip }: HalfTimeFullTimeSelectorProps) => {
  const [halfTimeResult, setHalfTimeResult] = useState<string>('');
  const [fullTimeResult, setFullTimeResult] = useState<string>('');
  const [currentOdds, setCurrentOdds] = useState('0.00');

  const results = [
    { value: 'Home', label: match.teams?.home?.name || 'Local', short: 'L' },
    { value: 'Draw', label: 'Empate', short: 'E' },
    { value: 'Away', label: match.teams?.away?.name || 'Visitante', short: 'V' }
  ];

  useEffect(() => {
    const findOdds = () => {
      // Debug: Log the entire match structure
      console.log('Full match data:', match);
      console.log('Bookmakers:', match.bookmakers);
      
      if (!match.bookmakers || match.bookmakers.length === 0) {
        console.log('No bookmakers found');
        return '0.00';
      }

      // Try to find the HT/FT Double market in any bookmaker
      let market = null;
      for (const bookmaker of match.bookmakers) {
        console.log('Checking bookmaker:', bookmaker.name, 'bets:', bookmaker.bets);
        market = bookmaker.bets?.find((bet) => bet.name === 'HT/FT Double');
        if (market) {
          console.log('Found HT/FT market in bookmaker:', bookmaker.name);
          break;
        }
      }
      
      if (!market || !halfTimeResult || !fullTimeResult) {
        console.log('Market not found or selections incomplete');
        return '0.00';
      }

      // The selection format should be exactly "Home/Draw", "Away/Home", etc.
      const selection = `${halfTimeResult}/${fullTimeResult}`;
      
      console.log('Looking for HT/FT selection:', selection);
      console.log('Available values:', market.values.map(v => v.value));
      
      const value = market.values.find(v => v.value === selection);
      if (value) {
        console.log('Found odds:', value.odd);
        return value.odd;
      }

      console.log('No odds found for selection:', selection);
      return '0.00';
    };
    setCurrentOdds(findOdds());
  }, [halfTimeResult, fullTimeResult, match.bookmakers]);

  const handleAddBet = () => {
    if (currentOdds === '0.00' || !halfTimeResult || !fullTimeResult) return;

    const betValue: BetValue = {
      value: `${halfTimeResult}/${fullTimeResult}`,
      odd: currentOdds,
    };
    
    handleAddToSlip(match, 'Medio Tiempo/Final', betValue);
  };

  return (
    <div className="border-t-2 border-border pt-8 mt-8 first:border-t-0 first:pt-0 first:mt-0">
      <h4 className="font-semibold mb-6 text-foreground text-lg">Medio Tiempo/Final</h4>
      
      <div className="space-y-4">
        {/* Medio Tiempo Selector */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Resultado al Medio Tiempo</p>
          <div className="grid grid-cols-3 gap-2">
            {results.map((result) => (
              <Button
                key={`ht-${result.value}`}
                size="sm"
                onClick={() => setHalfTimeResult(result.value)}
                disabled={isFrozen}
                className={`h-10 transition-all duration-200 ${
                  halfTimeResult === result.value 
                    ? 'bg-primary text-primary-foreground' 
                    : 'jambol-button'
                }`}
              >
                <span className="text-xs">{result.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Full Time Selector */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Resultado Final</p>
          <div className="grid grid-cols-3 gap-2">
            {results.map((result) => (
              <Button
                key={`ft-${result.value}`}
                size="sm"
                onClick={() => setFullTimeResult(result.value)}
                disabled={isFrozen}
                className={`h-10 transition-all duration-200 ${
                  fullTimeResult === result.value 
                    ? 'bg-primary text-primary-foreground' 
                    : 'jambol-button'
                }`}
              >
                <span className="text-xs">{result.label}</span>
              </Button>
            ))}
          </div>
        </div>


        {/* Add Bet Button */}
        <Button
          onClick={handleAddBet}
          disabled={isFrozen || currentOdds === '0.00' || !halfTimeResult || !fullTimeResult}
          className={`w-full h-12 transition-all duration-200 hover:scale-[1.02] jambol-button ${
            currentOdds === '0.00' || !halfTimeResult || !fullTimeResult
              ? 'opacity-50 cursor-not-allowed' 
              : ''
          }`}
        >
          <span className="text-lg font-bold">
            {currentOdds === '0.00' ? 'Selecciona ambas opciones' : `${currentOdds}`}
          </span>
        </Button>
      </div>
    </div>
  );
};

export default HalfTimeFullTimeSelector;