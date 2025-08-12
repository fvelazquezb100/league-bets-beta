import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, DollarSign, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

export const Header = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [league, setLeague] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, weekly_budget, league_id')
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
            {profile && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="font-medium">Usuario:</span>
                  <span>{profile.username || user?.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium">Presupuesto Semanal:</span>
                  <span>{profile.weekly_budget || 1000} pts</span>
                </div>
                {league && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Trophy className="h-4 w-4" />
                    <span className="font-medium">Liga:</span>
                    <span>{league.name}</span>
                  </div>
                )}
              </div>
            )}
            <Button 
              onClick={signOut}
              variant="outline" 
              size="sm"
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};