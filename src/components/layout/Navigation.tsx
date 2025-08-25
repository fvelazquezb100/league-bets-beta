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
            
            {/* Tu Liga visible para todos */}
            {renderLink('Tu Liga', '/admin-liga', Award)}

            {isSuperAdmin && renderLink('SuperAdmin', '/superadmin', Shield)}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="md:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-80">
          <div className="flex flex-col h-full">
            {/* User Info */}
            <div className="pb-4 mb-4 border-b">
              {profile && (
                <div className="mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{profile.username || user?.email}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <DollarSign className="h-4 w-4" />
                    <span>{profile.weekly_budget} pts</span>
                  </div>
                  {league && (
                    <div className="flex items-center gap-2 mt-1">
                      <Trophy className="h-4 w-4" />
                      <span>{league.name}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation Links */}
            <div className="flex-1">
              <nav className="space-y-2">
                {navigationItems.map(item => renderLink(item.name, item.href, item.icon))}
                {/* Tu Liga visible para todos */}
                {renderLink('Tu Liga', '/admin-liga', Award)}
                {isSuperAdmin && renderLink('SuperAdmin', '/superadmin', Shield)}
              </nav>
            </div>

            {/* Logout */}
            <div className="pt-4 mt-4 border-t">
              <Button
                onClick={() => {
                  signOut();
                  setIsOpen(false);
                }}
                variant="outline"
                className="w-full gap-2"
              >
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};