import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SuperAdminRouteProps {
  children: React.ReactNode;
}

export const SuperAdminRoute: React.FC<SuperAdminRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [checkingRole, setCheckingRole] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        setIsSuperAdmin(false);
        setCheckingRole(false);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('global_role')
        .eq('id', user.id)
        .single();
      setIsSuperAdmin(data?.global_role === 'superadmin');
      setCheckingRole(false);
    };
    checkRole();
  }, [user]);

  if (loading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <img 
            src="https://sbfgxxdpppgtgiclmctc.supabase.co/storage/v1/object/public/media/jambollogo.png" 
            alt="Jambol Logo" 
            className="h-20 jambol-logo-loading"
          />
          <span className="text-lg font-semibold jambol-dark">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isSuperAdmin) return <Navigate to="/home" replace />;

  return <>{children}</>;
};