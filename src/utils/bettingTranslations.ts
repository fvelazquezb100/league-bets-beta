// Betting translations for Spanish localization
export const BETTING_TRANSLATIONS = {
  // Outcomes
  home: 'Local',
  away: 'Visitante',
  draw: 'Empate',
  
  // Bet Types
  'Match Winner': 'Ganador del Partido',
  'Over/Under Goals': 'Más/Menos Goles',
  'Both Teams Score': 'Ambos Equipos Marcan',
  '1st Half Winner': 'Ganador 1ª Parte',
  '2nd Half Winner': 'Ganador 2ª Parte',
  'Correct Score': 'Resultado Exacto',
  'Double Chance': 'Doble Oportunidad',
  'HT/FT Double': 'Descanso/Final',
  'Result/Total Goals': 'Resultado & Total de Goles',
  'Result/Both Teams Score': 'Resultado & Ambos Marcan'
} as const;

// Type definitions for strong typing
export type BettingTranslationKey = keyof typeof BETTING_TRANSLATIONS;
export type BettingTranslationValue = typeof BETTING_TRANSLATIONS[BettingTranslationKey];

// Helper function to get translation with fallback
export const getBettingTranslation = (key: string): string => {
  return BETTING_TRANSLATIONS[key as BettingTranslationKey] || key;
};

// Type guard to check if a key exists in translations
export const isBettingTranslationKey = (key: string): key is BettingTranslationKey => {
  return key in BETTING_TRANSLATIONS;
};