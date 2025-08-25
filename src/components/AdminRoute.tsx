import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [checkingUser, setCheckingUser] = useState(true);

  useEffect(() => {
    // Simplemente verificamos si hay usuario logueado
    setCheckingUser(false);
  }, []);

  if (loading || checkingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // No comprobamos rol, cualquier usuario puede acceder
  return <>{children}</>;
};