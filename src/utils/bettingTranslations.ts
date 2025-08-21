// Betting translations for Spanish localization
export const BETTING_TRANSLATIONS = {
  // Outcomes
  home: 'Local',
  away: 'Visitante',
  draw: 'Empate',
  Home: 'Local',
  Away: 'Visitante',
  Draw: 'Empate',
  
  // Over/Under values
  'Over 0.5': 'Más de 0.5',
  'Under 0.5': 'Menos de 0.5',
  'Over 1.5': 'Más de 1.5',
  'Under 1.5': 'Menos de 1.5',
  'Over 2.5': 'Más de 2.5',
  'Under 2.5': 'Menos de 2.5',
  'Over 3.5': 'Más de 3.5',
  'Under 3.5': 'Menos de 3.5',
  'Over 4.5': 'Más de 4.5',
  'Under 4.5': 'Menos de 4.5',
  'Over 5.5': 'Más de 5.5',
  'Under 5.5': 'Menos de 5.5',
  'Over 6.5': 'Más de 5.5',
  'Under 6.5': 'Menos de 5.5',
  
  // Both Teams Score
  'Yes': 'Sí',
  'No': 'No',
  
  // Double Chance combinations
  '1X': '1X (Local o Empate)',
  'X2': 'X2 (Empate o Visitante)',
  '12': '12 (Local o Visitante)',
  
  // HT/FT and combination bet values
  'Home/Home': 'Local/Local',
  'Home/Draw': 'Local/Empate',
  'Home/Away': 'Local/Visitante',
  'Draw/Home': 'Empate/Local',
  'Draw/Draw': 'Empate/Empate',
  'Draw/Away': 'Empate/Visitante',
  'Away/Home': 'Visitante/Local',
  'Away/Draw': 'Visitante/Empate',
  'Away/Away': 'Visitante/Visitante',
  
  // Result + Over/Under combinations
  'Home/Over 1.5': 'Local/Más 1.5',
  'Home/Under 1.5': 'Local/Menos 1.5',
  'Draw/Over 1.5': 'Empate/Más 1.5',
  'Draw/Under 1.5': 'Empate/Menos 1.5', 
  'Away/Over 1.5': 'Visitante/Más 1.5',
  'Away/Under 1.5': 'Visitante/Menos 1.5',

    'Home/Over': 'Local/Más',
  'Home/Under': 'Local/Menos',
  'Draw/Over': 'Empate/Más',
  'Draw/Under': 'Empate/Menos', 
  'Away/Over': 'Visitante/Más',
  'Away/Under': 'Visitante/Menos',

    'Home/Over': 'Local/Más',
  'Home/Under': 'Local/Menos',
  'Draw/Over': 'Empate/Más',
  'Draw/Under': 'Empate/Menos', 
  'Away/Over': 'Visitante/Más',
  'Away/Under': 'Visitante/Menos',

    'Home/Over': 'Local/Más',
  'Home/Under': 'Local/Menos',
  'Draw/Over': 'Empate/Más',
  'Draw/Under': 'Empate/Menos', 
  'Away/Over': 'Visitante/Más',
  'Away/Under': 'Visitante/Menos',

    'Home/Over': 'Local/Más',
  'Home/Under': 'Local/Menos',
  'Draw/Over': 'Empate/Más',
  'Draw/Under': 'Empate/Menos', 
  'Away/Over': 'Visitante/Más',
  'Away/Under': 'Visitante/Menos',

    'Home/Over': 'Local/Más',
  'Home/Under': 'Local/Menos',
  'Draw/Over': 'Empate/Más',
  'Draw/Under': 'Empate/Menos', 
  'Away/Over': 'Visitante/Más',
  'Away/Under': 'Visitante/Menos',
  
  // Result + Both Teams Score combinations
  'Home/Yes': 'Local/Sí',
  'Home/No': 'Local/No',
  'Draw/Yes': 'Empate/Sí',
  'Draw/No': 'Empate/No',
  'Away/Yes': 'Visitante/Sí',
  'Away/No': 'Visitante/No',

  
  // Bet Types
  'Match Winner': 'Ganador del Partido',
  'Goals Over/Under': 'Más/Menos Goles',
  'Both Teams To Score': 'Ambos Equipos Marcan',
  'Both Teams Score': 'Ambos Equipos Marcan',
  'First Half Winner': 'Ganador 1ª Parte',
  'Second Half Winner': 'Ganador 2ª Parte',
  'Correct Score': 'Resultado Exacto',
  'Double Chance': 'Doble Oportunidad',
  'HT/FT Double': 'Descanso/Final',
  'Result/Total Goals': 'Resultado & Total de Goles',
  'Result/Both Teams Score': 'Resultado & Ambos Marcan',
  
  // Legacy mappings for existing bet types
  'Over/Under Goals': 'Más/Menos Goles',
  '1st Half Winner': 'Ganador 1ª Parte',
  '2nd Half Winner': 'Ganador 2ª Parte'
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