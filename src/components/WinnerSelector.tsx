import { Button } from '@/components/ui/button';
import type { MatchData, BetValue } from '@/pages/Bets';
import { OddsIndicator } from './OddsIndicator';
import { useOddsComparison, findOddsAuto } from '@/hooks/useOddsComparison';
import { useIsPremiumLeague } from '@/hooks/useLeaguePremium';

interface WinnerSelectorProps {
  match: MatchData;
  isFrozen: boolean;
  hasUserBetOnMarket: (fixtureId: number, marketName: string, selection: string) => boolean;
  handleAddToSlip: (match: MatchData, marketName: string, selection: BetValue) => void;
}

const WinnerSelector = ({ match, isFrozen, hasUserBetOnMarket, handleAddToSlip }: WinnerSelectorProps) => {
  const { data: oddsComparison } = useOddsComparison();
  const isPremium = useIsPremiumLeague();
  
  // Find the three winner markets
  const findMarket = (marketName: string) => {
    if (!match.bookmakers || match.bookmakers.length === 0) return null;
    
    for (const bookmaker of match.bookmakers) {
      const market = bookmaker.bets.find(bet => bet.name === marketName);
      if (market) return market;
    }
    return null;
  };

  const matchWinnerMarket = findMarket('Match Winner');
  const firstHalfMarket = findMarket('First Half Winner');
  const secondHalfMarket = findMarket('Second Half Winner');

  const handleBet = (marketName: string, selection: BetValue) => {
    if (isFrozen) return;
    handleAddToSlip(match, marketName, selection);
  };

  const renderWinnerRow = (title: string, market: any, marketName: string) => {
    if (!market) return null;

    return (
      <div className="flex items-center gap-4 py-2">
        <div className="w-32 text-sm font-medium text-foreground">
          {title}
        </div>
        <div className="flex gap-2 flex-1">
          {market.values.map((value: BetValue) => {
            let displayValue = value.value;
            const hasUserBet = hasUserBetOnMarket(match.fixture.id, marketName, value.value);
            
            // Customize display based on selection
            if (value.value.toLowerCase().includes('home') || value.value === '1') {
              displayValue = 'Local'; // Always use "Local" for mobile optimization
            } else if (value.value.toLowerCase().includes('away') || value.value === '2') {
              displayValue = 'Visitante'; // Always use "Visitante" for mobile optimization
            } else if (value.value.toLowerCase().includes('draw') || value.value === 'X') {
              displayValue = 'Empate';
            }

            // Get odds comparison data
            const oddsData = oddsComparison ? findOddsAuto(
              oddsComparison,
              match.fixture.id,
              marketName,
              value.value
            ) : { current: null, previous: null };

            return (
              <Button
                key={value.value}
                onClick={() => handleBet(marketName, value)}
                disabled={isFrozen}
                className={`flex-1 h-10 transition-all duration-200 hover:scale-[1.02] ${
                  hasUserBet 
                    ? 'bg-[#FFC72C] text-black border-2 border-[#FFC72C] hover:bg-[#FFC72C]/90 font-bold' 
                    : 'jambol-button'
                }`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-xs font-medium">{displayValue}</span>
                              <span className="text-sm font-bold flex items-center">
                    {value.odd}
                                {isPremium && (
                                  <OddsIndicator 
                                    current={oddsData.current} 
                                    previous={oddsData.previous} 
                                  />
                                )}
                  </span>
                </div>
              </Button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="border-t-2 border-border pt-3 sm:pt-8 mt-3 sm:mt-8 first:border-t-0 first:pt-0 first:mt-0">
      <h4 className="font-semibold mb-3 sm:mb-6 text-foreground text-base sm:text-lg">Ganador</h4>
      <div className="space-y-2">
        {renderWinnerRow('Ganador del Partido', matchWinnerMarket, 'Ganador del Partido')}
        {renderWinnerRow('Ganador del 1er Tiempo', firstHalfMarket, 'Ganador del 1er Tiempo')}
        {renderWinnerRow('Ganador del 2do Tiempo', secondHalfMarket, 'Ganador del 2do Tiempo')}
      </div>
    </div>
  );
};

export default WinnerSelector;
