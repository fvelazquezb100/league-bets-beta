import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PairData {
  current: any;
  previous: any;
}

interface OddsComparisonAll {
  main: PairData;          // 1 vs 2
  selecciones: PairData;    // 3 vs 4
  coparey: PairData;       // 5 vs 6
}

export const useOddsComparison = () => {
  console.log('useOddsComparison hook called');

  return useQuery({
    queryKey: ['odds-comparison-all'],
    queryFn: async (): Promise<OddsComparisonAll> => {
      console.log('Fetching odds comparison data for all leagues...');

      const fetchPair = async (currentId: number, previousId: number) => {
        const [currentResult, previousResult] = await Promise.all([
          supabase
            .from('match_odds_cache')
            .select('data')
            .eq('id', currentId)
            .single(),
          supabase
            .from('match_odds_cache')
            .select('data')
            .eq('id', previousId)
            .single()
        ]);

        if (currentResult.error) {
          throw new Error(`Error fetching current odds (id=${currentId}): ${currentResult.error.message}`);
        }

        if (previousResult.error) {
          throw new Error(`Error fetching previous odds (id=${previousId}): ${previousResult.error.message}`);
        }

        return {
          current: currentResult.data?.data,
          previous: previousResult.data?.data
        };
      };

      // Fetch all pairs in parallel
      const [main, selecciones, coparey] = await Promise.all([
        fetchPair(1, 2),    // Main leagues
        fetchPair(3, 4),     // Selecciones
        fetchPair(5, 6),     // Copa del Rey
      ]);

      const result = { main, selecciones, coparey };

      // Debug: Check if we have actual data
      console.log('Odds comparison result:', {
        main: {
          hasCurrent: !!result.main.current,
          hasPrevious: !!result.main.previous,
          currentResponse: (result.main.current as any)?.response?.length || 0,
          previousResponse: (result.main.previous as any)?.response?.length || 0
        },
        selecciones: {
          hasCurrent: !!result.selecciones.current,
          hasPrevious: !!result.selecciones.previous,
          currentResponse: (result.selecciones.current as any)?.response?.length || 0,
          previousResponse: (result.selecciones.previous as any)?.response?.length || 0
        },
        coparey: {
          hasCurrent: !!result.coparey.current,
          hasPrevious: !!result.coparey.previous,
          currentResponse: (result.coparey.current as any)?.response?.length || 0,
          previousResponse: (result.coparey.previous as any)?.response?.length || 0
        }
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
  'Correct Score': 'Correct Score',
  'To Qualify': 'To Qualify'
};

// Helper function to get possible market names for flexible matching
const getPossibleMarketNames = (marketName: string): string[] => {
  const apiMarketName = MARKET_NAME_MAPPING[marketName] || marketName;

  if (marketName === 'Resultado Exacto') {
    return ['Exact Score', 'Score', 'Correct Score', 'Exact Goals'];
  }
  if (marketName === 'Goles Más/Menos de') {
    return ['Goals Over/Under', 'Over/Under Goals', 'Total Goals', 'Goals O/U'];
  }
  if (marketName === 'Resultado/Total Goles') {
    return ['Result/Total Goals', 'Match Result/Total Goals', 'Result & Total Goals', 'Match Result & Total Goals'];
  }

  return [apiMarketName];
};

// Helper function to build selection variants for flexible matching
const buildSelectionVariants = (marketName: string, baseSelection: string): string[] => {
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

    const slashVariants = ['/', ' / '];
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

// Helper to find odds from a match scanning all bookmakers and trying variants
const getOddsFromMatch = (match: any, marketName: string, selection: string): string | null => {
  if (!match?.bookmakers || match.bookmakers.length === 0) return null;

  const possibleMarketNames = getPossibleMarketNames(marketName);
  const selectionCandidates = buildSelectionVariants(marketName, selection);

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

// NEW: Auto-detect which cache pair contains the fixture and return odds comparison
export const findOddsAuto = (
  allData: OddsComparisonAll | undefined,
  fixtureId: number,
  marketName: string,
  selection: string
): { current: number | null; previous: number | null } => {
  if (!allData) {
    return { current: null, previous: null };
  }

  // Helper to try finding odds in a specific pair
  const tryPair = (pair: PairData): { current: number | null; previous: number | null } | null => {
    if (!pair.current?.response || !pair.previous?.response) {
      return null;
    }

    const currentMatch = pair.current.response.find((match: any) => match.fixture?.id === fixtureId);
    const previousMatch = pair.previous.response.find((match: any) => match.fixture?.id === fixtureId);

    // If neither match exists in this pair, return null
    if (!currentMatch && !previousMatch) {
      return null;
    }

    const currentOdds = currentMatch ? getOddsFromMatch(currentMatch, marketName, selection) : null;
    const previousOdds = previousMatch ? getOddsFromMatch(previousMatch, marketName, selection) : null;

    return {
      current: currentOdds ? parseFloat(currentOdds) : null,
      previous: previousOdds ? parseFloat(previousOdds) : null
    };
  };

  // Try pairs in order: Copa del Rey (5/6), Selecciones (3/4), Main leagues (1/2)
  const result = tryPair(allData.coparey) ||
    tryPair(allData.selecciones) ||
    tryPair(allData.main) ||
    { current: null, previous: null };

  // Debug logging for missing odds
  if (result.current === null || result.previous === null) {
    const debugMarkets = ['Ganador del Partido', 'Ganador del 1er Tiempo', 'Ganador del 2do Tiempo',
      'Resultado Exacto', 'Goles Más/Menos de', 'Medio Tiempo/Final'];

    if (debugMarkets.includes(marketName)) {
      console.log('Missing odds for market:', {
        marketName,
        fixtureId,
        current: result.current,
        previous: result.previous,
        selection,
        triedMarketNames: getPossibleMarketNames(marketName),
        triedSelections: buildSelectionVariants(marketName, selection)
      });
    }
  }

  return result;
};

// Legacy function for backward compatibility (deprecated)
export const findOddsForComparison = (
  currentData: any,
  previousData: any,
  fixtureId: number,
  marketName: string,
  selection: string
): { current: number | null; previous: number | null } => {
  console.warn('findOddsForComparison is deprecated. Use findOddsAuto instead.');

  if (!currentData?.response || !previousData?.response) {
    return { current: null, previous: null };
  }

  const currentMatch = currentData.response.find((match: any) => match.fixture?.id === fixtureId);
  const previousMatch = previousData.response.find((match: any) => match.fixture?.id === fixtureId);

  const currentOdds = currentMatch ? getOddsFromMatch(currentMatch, marketName, selection) : null;
  const previousOdds = previousMatch ? getOddsFromMatch(previousMatch, marketName, selection) : null;

  return {
    current: currentOdds ? parseFloat(currentOdds) : null,
    previous: previousOdds ? parseFloat(previousOdds) : null
  };
};
