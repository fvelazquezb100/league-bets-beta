/**
 * Centralized application configuration
 * All environment-dependent values should be defined here
 */

export const APP_CONFIG = {
  SUPABASE: {
    URL: import.meta.env.VITE_SUPABASE_URL,
    STORAGE_URL: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public`,
  },
  ASSETS: {
    LOGO: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/media/jambollogo.png`,
    FAVICON: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/media/jambol_favicon.png`,
    HEADER_LOGO: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/media/headerlogocort.png`,
  },
  VALIDATION: {
    MIN_USERNAME_LENGTH: 3,
    MAX_USERNAME_LENGTH: 20,
    MIN_PASSWORD_LENGTH: 6,
    USERNAME_REGEX: /^[a-zA-Z0-9_]+$/,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  BETTING: {
    FREEZE_TIME_MINUTES: 15,
    MAX_SELECTIONS_PER_BET: 10,
  },
  UI: {
    TOAST_DURATION: 5000,
    DEBOUNCE_DELAY: 400,
  }
} as const;

export type AppConfig = typeof APP_CONFIG;
