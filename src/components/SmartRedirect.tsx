import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { APP_CONFIG } from '@/config/app';

interface SmartRedirectProps {
  children: React.ReactNode;
}

export const SmartRedirect: React.FC<SmartRedirectProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setProfileLoading(false);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, league_id')
          .eq('id', user.id)
          .maybeSingle();

        setUserProfile(profile);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setUserProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Show loading while checking auth or profile
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <img 
            src={APP_CONFIG.ASSETS.LOGO} 
            alt="Jambol Logo" 
            className="h-20 jambol-logo-loading"
          />
          <span className="text-lg font-semibold jambol-dark">Cargando...</span>
        </div>
      </div>
    );
  }

  // If no user, let ProtectedRoute handle the redirect to login
  if (!user) {
    return <>{children}</>;
  }

  // If user exists but no profile or no league, redirect to league setup
  if (!userProfile || !userProfile.league_id) {
    return <Navigate to="/league-setup" replace />;
  }

  // User has profile and league, proceed normally
  return <>{children}</>;
};
