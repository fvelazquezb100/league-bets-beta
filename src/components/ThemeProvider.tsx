import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';

/**
 * ThemeProvider applies the user's theme preference globally
 * This ensures the theme persists across all pages, including those without MainLayout
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { data: userProfile } = useUserProfile(user?.id);

  // Apply theme based on user profile globally
  useEffect(() => {
    const root = document.documentElement;
    const theme = (userProfile?.theme || 'light') as 'light' | 'dark';
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [userProfile?.theme]);

  // Also apply theme on initial load if user is not logged in (default to light)
  useEffect(() => {
    if (!user) {
      const root = document.documentElement;
      root.classList.remove('dark');
    }
  }, [user]);

  return <>{children}</>;
};
