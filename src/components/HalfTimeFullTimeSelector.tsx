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

  // Debug: Log the match data when component mounts
  useEffect(() => {
    console.log('=== HT/FT COMPONENT MOUNTED ===');
    console.log('Match data:', match);
    console.log('Match bookmakers:', match.bookmakers);
    if (match.bookmakers && match.bookmakers.length > 0) {
      console.log('First bookmaker data:', match.bookmakers[0]);
    }
  }, [match]);

  const results = [
    { value: 'Home', label: match.teams?.home?.name || 'Local', short: 'L' },
    { value: 'Draw', label: 'Empate', short: 'E' },
    { value: 'Away', label: match.teams?.away?.name || 'Visitante', short: 'V' }
  ];

  useEffect(() => {
    const findOdds = () => {
      if (!match.bookmakers || match.bookmakers.length === 0 || !halfTimeResult || !fullTimeResult) {
        return '0.00';
      }

      // Debug: Log the exact structure we're working with
      console.log('=== HT/FT DEBUG ===');
      console.log('Match:', match.teams?.home?.name, 'vs', match.teams?.away?.name);
      console.log('Bookmakers count:', match.bookmakers.length);
      
      // Search through all bookmakers for HT/FT Double market
      let htftMarket = null;
      let foundBookmaker = null;
      
      console.log('Searching through all bookmakers for HT/FT Double...');
      
      for (let i = 0; i < match.bookmakers.length; i++) {
        const bookmaker = match.bookmakers[i];
        console.log(`Bookmaker ${i + 1}: ${bookmaker.name} (${bookmaker.bets.length} markets)`);
        
        const market = bookmaker.bets.find(bet => bet.name === 'HT/FT Double');
        if (market) {
          htftMarket = market;
          foundBookmaker = bookmaker;
          console.log(`✅ Found HT/FT Double in bookmaker: ${bookmaker.name}`);
          break;
        }
      }
      
      if (!htftMarket) {
        console.log('❌ HT/FT Double market not found');
        
        // Look for similar markets that might contain HT/FT data
        const similarMarkets = match.bookmakers.flatMap(bookmaker => 
          bookmaker.bets.filter(bet => 
            bet.name.toLowerCase().includes('ht') || 
            bet.name.toLowerCase().includes('half') ||
            bet.name.toLowerCase().includes('time')
          )
        );
        
        if (similarMarkets.length > 0) {
          console.log('🔍 Found similar markets:');
          similarMarkets.forEach(market => {
            console.log(`  - "${market.name}" with values:`, market.values.map(v => v.value));
          });
        } else {
          console.log('❌ No similar HT/FT markets found');
        }
        
        return '0.00';
      }

      console.log('✅ Found HT/FT Double market');
      console.log('HT/FT market values:', htftMarket.values);

      // Create the selection string exactly as it should be
      const selection = `${halfTimeResult}/${fullTimeResult}`;
      console.log('Looking for selection:', selection);
      
      // Find the exact match
      const value = htftMarket.values.find(v => v.value === selection);
      
      if (value) {
        console.log('✅ Found odds for', selection, ':', value.odd);
        return value.odd;
      } else {
        console.log('❌ Selection not found:', selection);
        console.log('Available selections:', htftMarket.values.map(v => v.value));
        return '0.00';
      }
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