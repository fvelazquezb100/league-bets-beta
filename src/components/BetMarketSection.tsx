import { Button } from '@/components/ui/button';
import type { BetTypeConfig } from '@/utils/betTypes';
import type { MatchData, BetMarket, BetValue } from '@/pages/Bets';

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
  return (
    <div>
      <h4 className="font-semibold mb-2 text-foreground">{betType.displayName}</h4>
      <div className="flex flex-wrap gap-2">
        {market.values.map(value => {
          const hasUserBet = hasUserBetOnMarket(match.fixture.id, betType.displayName, value.value);
          
          return (
            <Button 
              key={value.value} 
              variant={hasUserBet ? "default" : "outline"} 
              className={`flex flex-col h-auto flex-1 min-w-[120px] transition-all duration-200 hover:scale-[1.02] ${
                hasUserBet ? 'opacity-75 bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground'
              }`} 
              disabled={isFrozen} 
              onClick={() => handleAddToSlip(match, betType.displayName, value)}
            >
              <span className="text-sm">{value.value}</span>
              <span className="font-bold text-base">{value.odd}</span>
              {hasUserBet && <span className="text-xs">✓ Apostado</span>}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default BetMarketSection;