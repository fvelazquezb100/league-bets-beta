import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';

const THEME_STORAGE_KEY = 'jambol-theme';

/**
 * ThemeProvider applies the user's theme preference globally
 * This ensures the theme persists across all pages, including those without MainLayout
 * Uses localStorage as backup to ensure immediate theme application
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { data: userProfile, isLoading: profileLoading } = useUserProfile(user?.id);
  const themeAppliedRef = useRef(false);

  // Apply theme function
  const applyTheme = (theme: 'light' | 'dark') => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    // Store in localStorage as backup
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    themeAppliedRef.current = true;
  };

  // Apply theme immediately on mount from localStorage (before profile loads)
  useEffect(() => {
    if (themeAppliedRef.current) return;
    
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as 'light' | 'dark' | null;
    if (storedTheme && (storedTheme === 'light' || storedTheme === 'dark')) {
      applyTheme(storedTheme);
    } else {
      // Default to light if no stored theme
      applyTheme('light');
    }
  }, []);

  // Apply theme based on user profile when loaded
  useEffect(() => {
    if (authLoading || profileLoading) return;
    
    if (user && userProfile?.theme) {
      const theme = (userProfile.theme || 'light') as 'light' | 'dark';
      applyTheme(theme);
    } else if (!user) {
      // If user logs out, default to light but keep localStorage value
      applyTheme('light');
    }
  }, [user, authLoading, userProfile?.theme, profileLoading]);

  // Sync localStorage when theme changes in profile
  useEffect(() => {
    if (userProfile?.theme) {
      const theme = (userProfile.theme || 'light') as 'light' | 'dark';
      if (localStorage.getItem(THEME_STORAGE_KEY) !== theme) {
        applyTheme(theme);
      }
    }
  }, [userProfile?.theme]);

  return <>{children}</>;
};
