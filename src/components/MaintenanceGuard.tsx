import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useBettingSettings } from '@/hooks/useBettingSettings';
import { useQueryClient } from '@tanstack/react-query';

export const MaintenanceGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading: authLoading } = useAuth();
    const { maintenanceMode, isLoading: settingsLoading } = useBettingSettings();
    const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
    const [checkingRole, setCheckingRole] = useState(true);
    const location = useLocation();
    const queryClient = useQueryClient();

    // Check maintenance status on every navigation
    useEffect(() => {
        queryClient.invalidateQueries({ queryKey: ['maintenance-mode'] });
    }, [location.pathname, queryClient]);

    useEffect(() => {
        const checkRole = async () => {
            if (!user) {
                setIsSuperAdmin(false);
                setCheckingRole(false);
                return;
            }

            try {
                // First check metadata
                const metadata = user.user_metadata;
                if (metadata?.role === 'superadmin') {
                    setIsSuperAdmin(true);
                    setCheckingRole(false);
                    return;
                }

                // Double check with database for security
                const { data, error } = await supabase
                    .from('profiles')
                    .select('global_role')
                    .eq('id', user.id)
                    .single();

                if (error || !data) {
                    console.error('Error verifying role:', error);
                    setIsSuperAdmin(false);
                } else {
                    setIsSuperAdmin(data.global_role === 'superadmin');
                }
            } catch (error) {
                console.error('Error checking role:', error);
                setIsSuperAdmin(false);
            } finally {
                setCheckingRole(false);
            }
        };

        if (!authLoading) {
            checkRole();
        }
    }, [user, authLoading]);

    // Loading state
    if (authLoading || settingsLoading || checkingRole) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Logic: 
    // 1. If maintenance active AND user NOT superadmin -> Redirect to /maintenance
    // 2. If maintenance active AND user IS superadmin -> 
    //    - If accessing /superadmin* -> Allow
    //    - If accessing other pages -> Redirect to /superadmin (Strict mode requested by user)

    if (maintenanceMode) {
        if (!isSuperAdmin) {
            if (location.pathname === '/maintenance') {
                return <>{children}</>;
            }
            return <Navigate to="/maintenance" replace />;
        } else {
            // User IS SuperAdmin
            // Allow access to /superadmin routes
            if (location.pathname.startsWith('/superadmin')) {
                return <>{children}</>;
            }

            // Allow access to /maintenance (optional, but good for testing)
            if (location.pathname === '/maintenance') {
                return <>{children}</>;
            }

            // Redirect SuperAdmin from /home, /bets, etc. to /superadmin
            return <Navigate to="/superadmin" replace />;
        }
    }

    // If maintenance is NOT active, but user tries to go to /maintenance -> Redirect to home
    if (!maintenanceMode && location.pathname === '/maintenance') {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};
