// Modular bet types configuration for easy extension
export interface BetTypeConfig {
  apiName: string; // Name as it appears in the API data
  displayName: string; // Name to show to users
  category: 'main' | 'halftime' | 'score' | 'combination';
  order: number; // Display order
}

// Configuration for all supported bet types
export const BET_TYPES: Record<string, BetTypeConfig> = {
  // Main bet types (existing)
  MATCH_WINNER: {
    apiName: 'Match Winner',
    displayName: 'Ganador del Partido',
    category: 'main',
    order: 1
  },
  GOALS_OVER_UNDER: {
    apiName: 'Goals Over/Under',
    displayName: 'Goles Más/Menos de',
    category: 'main', 
    order: 2
  },
  BOTH_TEAMS_SCORE: {
    apiName: 'Both Teams To Score',
    displayName: 'Ambos Equipos Marcan',
    category: 'main',
    order: 3
  },
  
  // Half-time bet types (new)
  FIRST_HALF_WINNER: {
    apiName: 'First Half Winner',
    displayName: 'Ganador del 1er Tiempo',
    category: 'halftime',
    order: 4
  },
  SECOND_HALF_WINNER: {
    apiName: 'Second Half Winner', 
    displayName: 'Ganador del 2do Tiempo',
    category: 'halftime',
    order: 5
  },
  
  // Correct Score bets (new)
  CORRECT_SCORE: {
    apiName: 'Correct Score',
    displayName: 'Resultado Exacto',
    category: 'score',
    order: 6
  },
  
  // Combination bets (new)
  DOUBLE_CHANCE: {
    apiName: 'Double Chance',
    displayName: 'Doble Oportunidad',
    category: 'combination',
    order: 7
  },
  HT_FT_DOUBLE: {
    apiName: 'HT/FT Double',
    displayName: 'Medio Tiempo/Final',
    category: 'combination', 
    order: 8
  },
  RESULT_TOTAL_GOALS: {
    apiName: 'Result/Total Goals',
    displayName: 'Resultado/Total Goles',
    category: 'combination',
    order: 9
  },
  RESULT_BOTH_TEAMS_SCORE: {
    apiName: 'Result/Both Teams Score',
    displayName: 'Resultado/Ambos Marcan',
    category: 'combination',
    order: 10
  }
};

// Get bet types sorted by display order
export const getBetTypesSorted = (): BetTypeConfig[] => {
  return Object.values(BET_TYPES).sort((a, b) => a.order - b.order);
};

// Get bet types by category
export const getBetTypesByCategory = (category: BetTypeConfig['category']): BetTypeConfig[] => {
  return Object.values(BET_TYPES)
    .filter(betType => betType.category === category)
    .sort((a, b) => a.order - b.order);
};

// Find bet type config by API name
export const findBetTypeByApiName = (apiName: string): BetTypeConfig | undefined => {
  return Object.values(BET_TYPES).find(betType => betType.apiName === apiName);
};

// Find bet type config by display name
export const findBetTypeByDisplayName = (displayName: string): BetTypeConfig | undefined => {
  return Object.values(BET_TYPES).find(betType => betType.displayName === displayName);
};