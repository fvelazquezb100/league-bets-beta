import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LogOut, User, DollarSign, Trophy, Menu, Home, History, Settings, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

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

export const Header = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [league, setLeague] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, weekly_budget, league_id, role, global_role')
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
            .select('name, join_code')
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

  return (
    <header className="bg-card border-b border-border/50 shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/home" className="text-2xl font-bold text-primary">
            Liga de Apuestas
          </Link>
          
          <div className="flex items-center gap-6">
            {/* Desktop: User details (hidden on mobile) */}
            {profile && (
              <div className="hidden md:flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="font-medium">Usuario:</span>
                  <span>{profile.username || user?.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium">Presupuesto Semanal:</span>
                  <span>{profile.weekly_budget} pts</span>
                </div>
                {league && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Trophy className="h-4 w-4" />
                    <span className="font-medium">Liga:</span>
                    <span>{league.name}</span>
                  
                  //  <span className="font-medium">Código:</span>
                  //  <span className="font-mono tracking-wider">{league.join_code}</span>
                 
                  </div>
                )}
              </div>
            )}

            {/* Desktop: Logout button (hidden on mobile) */}
            <Button 
              onClick={signOut}
              variant="outline" 
              size="sm"
              className="hidden md:flex gap-2"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>

            {/* Mobile: Hamburger menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="pb-4 mb-4 border-b">
                    <h2 className="text-lg font-semibold">Navegación</h2>
                    {profile && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{profile.username || user?.email}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <DollarSign className="h-4 w-4" />
                          <span>{profile.weekly_budget || 1000} pts</span>
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
                      {navigationItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
                          >
                            <Icon className="h-4 w-4" />
                            {item.name}
                          </Link>
                        );
                      })}
                      
                      {/* Admin Liga */}
                      {profile?.role === 'admin_league' && (
                        <Link
                          to="/admin-liga"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
                        >
                          <Shield className="h-4 w-4" />
                          Admin Liga
                        </Link>
                      )}

                      {/* SuperAdmin */}
                      {profile?.global_role === 'superadmin' && (
                        <Link
                          to="/superadmin"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
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
          </div>
        </div>
      </div>
    </header>
  );
};