import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { MatchData, BetValue } from '@/pages/Bets';
import { OddsIndicator } from './OddsIndicator';
import { useOddsComparison, findOddsForComparison } from '@/hooks/useOddsComparison';
import { useIsPremiumLeague } from '@/hooks/useLeaguePremium';

interface HalfTimeFullTimeSelectorProps {
  match: MatchData;
  isFrozen: boolean;
  hasUserBetOnMarket: (fixtureId: number, marketName: string, selection: string) => boolean;
  handleAddToSlip: (match: MatchData, marketName: string, selection: BetValue) => void;
}

const HalfTimeFullTimeSelector = ({ match, isFrozen, hasUserBetOnMarket, handleAddToSlip }: HalfTimeFullTimeSelectorProps) => {
  const { data: oddsComparison } = useOddsComparison();
  const isPremium = useIsPremiumLeague();
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
      if (!match.bookmakers || match.bookmakers.length === 0) {
        return '0.00';
      }

      // Search through all bookmakers for HT/FT Double market
      for (const bookmaker of match.bookmakers) {
        const market = bookmaker.bets.find(bet => bet.name === 'HT/FT Double');
        if (market) {
          const selection = `${halfTimeResult}/${fullTimeResult}`;
          const oddsValue = market.values.find(v => v.value === selection);
          return oddsValue ? oddsValue.odd : '0.00';
        }
      }
      
      return '0.00';
    };

    if (halfTimeResult && fullTimeResult) {
      setCurrentOdds(findOdds());
    } else {
      setCurrentOdds('0.00');
    }
  }, [match, halfTimeResult, fullTimeResult]);

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
          <span className="text-lg font-bold flex items-center justify-center">
            {currentOdds === '0.00' ? 'Selecciona ambas opciones' : (
              <>
                {currentOdds}
                {isPremium && currentOdds !== '0.00' && oddsComparison && (
                  <OddsIndicator 
                    current={oddsComparison ? findOddsForComparison(
                      oddsComparison.current,
                      oddsComparison.previous,
                      match.fixture.id,
                      'Medio Tiempo/Final',
                      `${halfTimeResult}/${fullTimeResult}`
                    ).current : null}
                    previous={oddsComparison ? findOddsForComparison(
                      oddsComparison.current,
                      oddsComparison.previous,
                      match.fixture.id,
                      'Medio Tiempo/Final',
                      `${halfTimeResult}/${fullTimeResult}`
                    ).previous : null}
                  />
                )}
              </>
            )}
          </span>
        </Button>
      </div>
    </div>
  );
};

export default HalfTimeFullTimeSelector;