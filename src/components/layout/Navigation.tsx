import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, DollarSign, History, Shield, Settings, Trophy, Award, Menu, LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

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
    {
    name: 'Tu Liga',
    href: '/admin-liga',
    icon: Award,
  },
];

export const Navigation = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [league, setLeague] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchProfile = async () => {
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, weekly_budget, league_id, global_role')
        .eq('id', user.id)
        .maybeSingle();

      if (!cancelled && profileData) {
        setProfile(profileData);
        setIsSuperAdmin(profileData.global_role === 'superadmin');

        if (profileData.league_id) {
          const { data: leagueData } = await supabase
            .from('leagues')
            .select('name')
            .eq('id', profileData.league_id)
            .maybeSingle();

          if (leagueData) setLeague(leagueData);
        }
      }
    };

    fetchProfile();
    return () => { cancelled = true; };
  }, [user]);

  const renderLink = (name: string, href: string, Icon: any) => {
    const isActive = location.pathname === href;
    return (
      <Link
        key={name}
        to={href}
        className={cn(
          'flex items-center gap-2 py-4 px-2 text-sm font-medium border-b-2 transition-colors',
          isActive
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        )}
        onClick={() => setIsOpen(false)}
      >
        <Icon className="h-4 w-4" />
        {name}
      </Link>
    );
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="bg-card border-b border-border/50 hidden md:block">
        <div className="container mx-auto px-6">
          <div className="flex space-x-8">
            {navigationItems.map(item => renderLink(item.name, item.href, item.icon))}
            {isSuperAdmin && renderLink('SuperAdmin', '/superadmin', Shield)}
          </div>
        </div>
      </nav>










      
    </>
  );
};