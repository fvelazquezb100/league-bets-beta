import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [checkingRole, setCheckingRole] = useState(true);
  const [isLeagueAdmin, setIsLeagueAdmin] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        setIsLeagueAdmin(false);
        setCheckingRole(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error al comprobar rol:', error);
        setIsLeagueAdmin(false);
      } else {
        setIsLeagueAdmin(data?.role === 'admin_league');
      }

      setCheckingRole(false);
    };

    checkRole();
  }, [user]);

  if (loading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isLeagueAdmin) return <Navigate to="/home" replace />;

  return <>{children}</>;
};