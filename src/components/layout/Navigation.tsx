import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, DollarSign, History, Shield, Settings, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const navigationItems = [
  {
    name: 'Inicio',
    href: '/home',
    icon: Home,
  },
  {
    name: 'Clasificacion',
    href: '/clasificacion',
    icon: Trophy,
  },
  {
    name: 'Apostar',
    href: '/bets',
    icon: DollarSign,
  },
  {
    name: 'Historial',
    href: '/bet-history',
    icon: History,
  },
  {
    name: 'Ajustes',
    href: '/settings',
    icon: Settings,
  },
];

export const Navigation = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (!user) { setIsAdmin(false); return; }
      const { data } = await supabase
        .from('profiles')
        .select('role, global_role')
        .eq('id', user.id)
        .single();
      if (!cancelled) setIsAdmin(data?.global_role === 'superadmin' || data?.role === 'admin_league');
    };
    check();
    return () => { cancelled = true; };
  }, [user]);

  return (
    <nav className="bg-card border-b border-border/50 hidden md:block">
      <div className="container mx-auto px-6">
        <div className="flex space-x-8">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-2 py-4 px-2 text-sm font-medium border-b-2 transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              key="Admin"
              to="/admin"
              className={cn(
                'flex items-center gap-2 py-4 px-2 text-sm font-medium border-b-2 transition-colors',
                location.pathname === '/admin'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};