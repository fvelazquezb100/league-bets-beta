import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { LogOut, User, DollarSign, Trophy, Menu, Home, History, Settings, Shield, Award, Activity, Lock, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { APP_CONFIG } from '@/config/app';
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
    name: 'Partidos',
    href: '/bets',
    icon: DollarSign,
  },
  {
    name: 'En directo',
    href: '/directo',
    icon: Activity,
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

export const Header = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [league, setLeague] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, weekly_budget, league_id, role, global_role, blocks_available')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }
      
      if (profileData) {
        setProfile(profileData);
        
        if (profileData.league_id) {
          const { data: leagueData, error: leagueError } = await supabase
            .from('leagues')
            .select('name, join_code, week, boost_max_stake, type')
            .eq('id', profileData.league_id)
            .maybeSingle();
          
          if (leagueError) {
            console.error('Error fetching league:', leagueError);
          } else if (leagueData) {
            setLeague(leagueData);
          }
        }
      }
    };

    fetchProfile();
  }, [user]);

  // Query for boosts_per_week setting
  const { data: boostsPerWeek = 1 } = useQuery({
    queryKey: ['boosts-per-week'],
    queryFn: async () => {
      const { data } = await supabase
        .from('betting_settings')
        .select('setting_value')
        .eq('setting_key', 'boosts_per_week')
        .maybeSingle();
      return parseInt(data?.setting_value ?? '1', 10) || 1;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Query for current week and boosts used
  const currentWeek = league?.week ?? 1;
  const { data: boostsUsedThisWeek = 0 } = useQuery({
    queryKey: ['boosts-used-this-week', currentWeek, user?.id],
    queryFn: async () => {
      if (!user) return 0;
      // Get all bets from this week that have a BOOST selection
      const { data: bets, error } = await supabase
        .from('bets')
        .select('id')
        .eq('user_id', user.id)
        .eq('week', currentWeek.toString())
        .neq('status', 'cancelled');
      if (error || !bets || bets.length === 0) return 0;
      const betIds = bets.map(b => b.id);
      // Count BOOST selections
      const { count, error: countError } = await supabase
        .from('bet_selections')
        .select('*', { count: 'exact', head: true })
        .in('bet_id', betIds)
        .eq('market', 'BOOST');
      if (countError) return 0;
      return count ?? 0;
    },
    enabled: !!user && !!league,
    staleTime: 30 * 1000,
  });

  const boostsAvailable = boostsPerWeek - boostsUsedThisWeek;
  const isPremium = league?.type === 'premium';
  const displayBlocks = isPremium ? (profile?.blocks_available ?? 0) : 0;
  const displayBoosts = isPremium ? boostsAvailable : 0;

  return (
    <header className="bg-card border-b border-border/50 shadow-sm bg-background">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-3">
            <img 
              src={APP_CONFIG.ASSETS.LOGO} 
              alt="Jambol Logo" 
              className="h-10 jambol-logo"
            />
            <span className="text-2xl font-bold jambol-dark">
              Jambol
            </span>
          </Link>
          
          <div className="flex items-center gap-6">
            {/* Desktop: User details (hidden on mobile) */}
            {profile && (
              <div className="hidden md:flex items-center gap-4 text-sm">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 text-muted-foreground cursor-help">
                      <User className="h-4 w-4" />
                      <span>{profile.username || user?.email}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Nombre de tu usuario</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 text-muted-foreground cursor-help">
                      <DollarSign className="h-4 w-4" />
                      <span>{profile.weekly_budget} pts</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Presupuesto semanal disponible</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 text-muted-foreground cursor-help">
                      <Lock className="h-4 w-4" />
                      <span>{displayBlocks} bloqueos</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Bloquea partidos a otros jugadores</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 text-muted-foreground cursor-help">
                      <Zap className="h-4 w-4" />
                      <span>{displayBoosts} boost{displayBoosts !== 1 ? 's' : ''} - {league?.boost_max_stake ?? 200} pts</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Incrementa el multiplicador de tu boleto</p>
                  </TooltipContent>
                </Tooltip>
                {league && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 text-muted-foreground cursor-help">
                        <Trophy className="h-4 w-4" />
                        <span>{league.name}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Nombre de tu liga</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}

            {/* Desktop: Logout button (hidden on mobile) */}
            <Button 
              onClick={signOut}
              size="sm"
              className="hidden md:flex gap-2 jambol-button"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>

            {/* Mobile: Hamburger menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden border-[#FFC72C] text-[#FFC72C] hover:bg-[#FFC72C] hover:text-black">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <VisuallyHidden>
                  <SheetTitle>Menú de navegación</SheetTitle>
                  <SheetDescription>
                    Accede a todas las secciones de tu liga
                  </SheetDescription>
                </VisuallyHidden>
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="pb-4 mb-4 border-b">
                    <h2 className="text-lg font-semibold">Tu Liga</h2>
                    {profile && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 cursor-help">
                              <User className="h-4 w-4" />
                              <span>{profile.username || user?.email}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Nombre de tu usuario</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 mt-1 cursor-help">
                              <DollarSign className="h-4 w-4" />
                              <span>{profile.weekly_budget} pts</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Presupuesto semanal disponible</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 mt-1 cursor-help">
                              <Lock className="h-4 w-4" />
                              <span>{displayBlocks} bloqueos</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Bloquea partidos a otros jugadores</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 mt-1 cursor-help">
                              <Zap className="h-4 w-4" />
                              <span>{displayBoosts} boost{displayBoosts !== 1 ? 's' : ''} - {league?.boost_max_stake ?? 200} pts</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Incrementa el multiplicador de tu boleto</p>
                          </TooltipContent>
                        </Tooltip>
                        {league && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2 mt-1 cursor-help">
                                <Trophy className="h-4 w-4" />
                                <span>{league.name}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Nombre de tu liga</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Navigation Links */}
                  <div className="flex-1">
                    <nav className="space-y-2">
                      {navigationItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                              isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            {item.name}
                          </Link>
                        );
                      })}

                      {/* SuperAdmin */}
                      {profile?.global_role === 'superadmin' && (
                        <Link
                          to="/superadmin"
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                            location.pathname === '/superadmin'
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <Shield className="h-4 w-4" />
                          SuperAdmin
                        </Link>
                      )}
                    </nav>
                  </div>

                  {/* Logout Button */}
                  <div className="pt-4 mt-4 border-t">
                    <Button 
                      onClick={() => {
                        signOut();
                        setIsOpen(false);
                      }}
                      className="w-full gap-2 jambol-button"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar Sesión
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            
          </div>
        </div>
      </div>
    </header>
  );
};