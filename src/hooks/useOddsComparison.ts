import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface OddsComparisonData {
  current: any;
  previous: any;
}

export const useOddsComparison = () => {
  console.log('useOddsComparison hook called');
  
  return useQuery({
    queryKey: ['odds-comparison'],
    queryFn: async (): Promise<OddsComparisonData> => {
      console.log('Fetching odds comparison data...');
      
      // Fetch current odds (id=1) and previous odds (id=2)
      const [currentResult, previousResult] = await Promise.all([
        supabase
          .from('match_odds_cache')
          .select('data')
          .eq('id', 1)
          .single(),
        supabase
          .from('match_odds_cache')
          .select('data')
          .eq('id', 2)
          .single()
      ]);

      console.log('Query results:', {
        currentError: currentResult.error,
        previousError: previousResult.error,
        currentData: !!currentResult.data?.data,
        previousData: !!previousResult.data?.data
      });

      if (currentResult.error) {
        throw new Error(`Error fetching current odds: ${currentResult.error.message}`);
      }

      if (previousResult.error) {
        throw new Error(`Error fetching previous odds: ${previousResult.error.message}`);
      }

      const result = {
        current: currentResult.data?.data,
        previous: previousResult.data?.data
      };

      // Debug: Check if we have actual data
      console.log('Odds comparison result:', {
        hasCurrent: !!result.current,
        hasPrevious: !!result.previous,
        currentResponse: (result.current as any)?.response?.length || 0,
        previousResponse: (result.previous as any)?.response?.length || 0
      });

      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
};

// Mapping from Spanish market names to API market names
const MARKET_NAME_MAPPING: Record<string, string> = {
  'Ganador del Partido': 'Match Winner',
  'Doble Oportunidad': 'Double Chance',
  'Ganador del 1er Tiempo': 'First Half Winner',
  'Ganador del 2do Tiempo': 'Second Half Winner',
  'Ambos Equipos Marcan': 'Both Teams Score',
  'Resultado Final': 'Match Winner',
  'Resultado 1er Tiempo': 'First Half Winner',
  'Resultado 2do Tiempo': 'Second Half Winner',
  'Resultado Exacto': 'Exact Score', // Try different name for exact score
  'Goles Más/Menos de': 'Goals Over/Under', // Added mapping for over/under goals
  'Medio Tiempo/Final': 'HT/FT Double', // Added mapping for half time/full time
  'Resultado/Total Goles': 'Result/Total Goals', // Added mapping for result/total goals
  // Additional mappings for other possible market names
  'Match Winner': 'Match Winner',
  'First Half Winner': 'First Half Winner',
  'Second Half Winner': 'Second Half Winner',
  'Home/Away': 'Home/Away',
  'Both Teams Score': 'Both Teams Score',
  'Goals Over/Under': 'Goals Over/Under',
  'Over/Under Goals': 'Over/Under Goals',
  'Total Goals': 'Total Goals',
  'Goals O/U': 'Goals O/U',
  'HT/FT Double': 'HT/FT Double',
  'Result/Total Goals': 'Result/Total Goals',
  'Match Result/Total Goals': 'Match Result/Total Goals',
  'Result & Total Goals': 'Result & Total Goals',
  'Match Result & Total Goals': 'Match Result & Total Goals',
  'Asian Handicap': 'Asian Handicap',
  'Double Chance': 'Double Chance',
  'Correct Score': 'Correct Score'
};

// Helper function to find odds for a specific fixture and market
export const findOddsForComparison = (
  currentData: any,
  previousData: any,
  fixtureId: number,
  marketName: string,
  selection: string
): { current: number | null; previous: number | null } => {
  if (!currentData?.response || !previousData?.response) {
    console.log('Missing data for comparison:', { 
      current: !!currentData?.response, 
      previous: !!previousData?.response 
    });
    return { current: null, previous: null };
  }

  // Map Spanish market name to API market name
  const apiMarketName = MARKET_NAME_MAPPING[marketName] || marketName;

  // For Resultado Exacto, Goles Más/Menos de, and Resultado/Total Goles, try multiple possible market names
  const possibleMarketNames = marketName === 'Resultado Exacto' 
    ? ['Exact Score', 'Score', 'Correct Score', 'Exact Goals']
    : marketName === 'Goles Más/Menos de'
    ? ['Goals Over/Under', 'Over/Under Goals', 'Total Goals', 'Goals O/U']
    : marketName === 'Resultado/Total Goles'
    ? ['Result/Total Goals', 'Match Result/Total Goals', 'Result & Total Goals', 'Match Result & Total Goals']
    : [apiMarketName];

  // Build selection variants for flexible matching in specific markets
  const buildSelectionVariants = (baseSelection: string): string[] => {
    if (marketName !== 'Resultado/Total Goles') {
      return [baseSelection];
    }
    try {
      const [resultPartRaw, ouPartRaw] = baseSelection.split('/');
      const resultPart = (resultPartRaw || '').trim();
      const ouPart = (ouPartRaw || '').trim();
      // Extract Over/Under and threshold number
      const isOver = ouPart.toLowerCase().startsWith('over');
      const isUnder = ouPart.toLowerCase().startsWith('under');
      const thresholdMatch = ouPart.match(/[0-9]+\.?[0-9]*/);
      const threshold = thresholdMatch ? thresholdMatch[0] : '';
      const ouWord = isOver ? 'Over' : isUnder ? 'Under' : ouPart;
      // Result variants (some APIs use "Home Win"/"Away Win")
      const resultVariants = resultPart === 'Home' 
        ? ['Home', 'Home Win'] 
        : resultPart === 'Away' 
        ? ['Away', 'Away Win'] 
        : [resultPart];
      const ouVariants = [
        `${ouWord} ${threshold}`,
        `${ouWord}${threshold}`,
      ];
      const slashVariants = ['/',' / '];
      const variants: string[] = [];
      for (const r of resultVariants) {
        for (const ou of ouVariants) {
          for (const s of slashVariants) {
            variants.push(`${r}${s}${ou}`);
          }
        }
      }
      return variants.filter(Boolean);
    } catch {
      return [baseSelection];
    }
  };

  const selectionCandidates = buildSelectionVariants(selection);

  // Helper to find odds scanning all bookmakers and trying selection variants
  const getOddsFromMatch = (match: any): string | null => {
    if (!match?.bookmakers || match.bookmakers.length === 0) return null;
    for (const bookmaker of match.bookmakers) {
      if (!bookmaker?.bets) continue;
      for (const nameCandidate of possibleMarketNames) {
        const bet = bookmaker.bets.find((b: any) => b?.name === nameCandidate);
        if (!bet?.values) continue;
        for (const sel of selectionCandidates) {
          const val = bet.values.find((v: any) => v?.value === sel);
          if (val?.odd) {
            return val.odd;
          }
        }
      }
    }
    return null;
  };

  // Find current odds (scan all bookmakers)
  const currentMatch = currentData.response.find((match: any) => match.fixture?.id === fixtureId);
  const currentOdds = getOddsFromMatch(currentMatch);

  // Find previous odds (scan all bookmakers)
  const previousMatch = previousData.response.find((match: any) => match.fixture?.id === fixtureId);
  const previousOdds = getOddsFromMatch(previousMatch);

  const result = {
    current: currentOdds ? parseFloat(currentOdds) : null,
    previous: previousOdds ? parseFloat(previousOdds) : null
  };

  // Debug logging for markets that don't have indicators (only log if needed)
  if (result.current === null || result.previous === null) {
    // Log mapping issues for debugging
    if (['Ganador del Partido', 'Ganador del 1er Tiempo', 'Ganador del 2do Tiempo', 'Resultado Exacto', 'Goles Más/Menos de', 'Medio Tiempo/Final'].includes(marketName)) {
      console.log('Missing odds for markets:', { 
        marketName, 
        apiMarketName, 
        current: result.current, 
        previous: result.previous,
        currentOdds,
        previousOdds,
        hasCurrentMatch: !!currentMatch,
        hasPreviousMatch: !!previousMatch,
        selection,
        triedMarketNames: possibleMarketNames,
        triedSelections: selectionCandidates
      });
      
      // For Resultado Exacto, also log available market names
      if (marketName === 'Resultado Exacto' && currentMatch) {
        const availableMarkets = currentMatch.bookmakers?.[0]?.bets?.map((bet: any) => bet.name) || [];
        console.log('Available markets for fixture:', availableMarkets);
      }
    }
  }

  return result;
};
