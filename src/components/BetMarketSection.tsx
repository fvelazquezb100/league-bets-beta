import { Button } from '@/components/ui/button';
import type { BetTypeConfig } from '@/utils/betTypes';
import type { MatchData, BetMarket, BetValue } from '@/pages/Bets';
import { getBettingTranslation } from '@/utils/bettingTranslations';
import ExactScoreSelector from './ExactScoreSelector';
import OverUnderSelector from './OverUnderSelector';
import WinnerSelector from './WinnerSelector';
import HalfTimeFullTimeSelector from './HalfTimeFullTimeSelector';
import ResultTotalGoalsSelector from './ResultTotalGoalsSelector';

interface BetMarketSectionProps {
  match: MatchData;
  betType: BetTypeConfig;
  market: BetMarket;
  isFrozen: boolean;
  hasUserBetOnMarket: (fixtureId: number, marketName: string, selection: string) => boolean;
  handleAddToSlip: (match: MatchData, marketName: string, selection: BetValue) => void;
}

const BetMarketSection = ({
  match,
  betType,
  market,
  isFrozen,
  hasUserBetOnMarket,
  handleAddToSlip
}: BetMarketSectionProps) => {
  // Use special selector for exact score
  if (betType.displayName === 'Resultado Exacto') {
    return (
      <ExactScoreSelector
        match={match}
        isFrozen={isFrozen}
        handleAddToSlip={handleAddToSlip}
      />
    );
  }

  // Use special selector for over/under
  if (betType.displayName === 'Goles Más/Menos de') {
    return (
      <OverUnderSelector
        match={match}
        isFrozen={isFrozen}
        handleAddToSlip={handleAddToSlip}
      />
    );
  }

  // Use special selector for winner markets (only show for the first one)
  if (betType.displayName === 'Ganador del Partido') {
    return (
      <WinnerSelector
        match={match}
        isFrozen={isFrozen}
        handleAddToSlip={handleAddToSlip}
      />
    );
  }

  // Hide individual winner markets since they're now unified
  if (betType.displayName === 'Ganador del 1er Tiempo' || betType.displayName === 'Ganador del 2do Tiempo') {
    return null;
  }

  // Use special selector for HT/FT Double
  if (betType.displayName === 'Medio Tiempo/Final') {
    return (
      <HalfTimeFullTimeSelector
        match={match}
        isFrozen={isFrozen}
        handleAddToSlip={handleAddToSlip}
      />
    );
  }

  // Use special selector for Result/Total Goals
  if (betType.displayName === 'Resultado/Total Goles') {
    return (
      <ResultTotalGoalsSelector
        match={match}
        isFrozen={isFrozen}
        handleAddToSlip={handleAddToSlip}
      />
    );
  }

  // Calculate optimal number of columns based on number of options and screen size
  const getOptimalColumns = (count: number) => {
    // For mobile, use fewer columns
    if (count <= 2) return 2;
    if (count <= 3) return 3;
    if (count <= 4) return 2; // 2 columns on mobile for better touch targets
    if (count <= 6) return 2; // 2 columns on mobile
    return 2; // Default to 2 columns on mobile for better usability
  };

  const optimalColumns = getOptimalColumns(market.values.length);

  return (
    <div className="border-t-2 border-border pt-3 sm:pt-8 mt-3 sm:mt-8 first:border-t-0 first:pt-0 first:mt-0">
      <h4 className="font-semibold mb-3 sm:mb-6 text-foreground text-base sm:text-lg">{betType.displayName}</h4>
      <div 
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${optimalColumns}, 1fr)`
        }}
      >
        {market.values.map(value => {
          const hasUserBet = hasUserBetOnMarket(match.fixture.id, betType.displayName, value.value);
          
          // Special handling for "Doble Oportunidad" in mobile
          const isDoubleChance = betType.displayName === 'Doble Oportunidad';
          const displayText = getBettingTranslation(value.value);
          
          return (
            <Button 
              key={value.value} 
              className={`flex flex-col h-auto min-h-[60px] sm:min-h-[80px] transition-all duration-200 hover:scale-[1.02] jambol-button ${
                hasUserBet ? 'opacity-75 bg-primary text-primary-foreground' : ''
              }`} 
              disabled={isFrozen} 
              onClick={() => handleAddToSlip(match, betType.displayName, value)}
            >
              {isDoubleChance ? (
                <div className="flex flex-col items-center">
                  <span className="text-xs sm:text-sm leading-tight">
                    {displayText.includes('/') ? displayText.split('/').map((part, index) => (
                      <span key={index}>
                        {part.trim()}
                        {index === 0 && <br />}
                      </span>
                    )) : displayText}
                  </span>
                  <span className="font-bold text-sm sm:text-base">{value.odd}</span>
                  {hasUserBet && <span className="text-xs">✓ Apostado</span>}
                </div>
              ) : (
                <>
                  <span className="text-xs sm:text-sm">{displayText}</span>
                  <span className="font-bold text-sm sm:text-base">{value.odd}</span>
                  {hasUserBet && <span className="text-xs">✓ Apostado</span>}
                </>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default BetMarketSection;