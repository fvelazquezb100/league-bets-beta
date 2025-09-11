import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { PlayerBetHistory } from '@/components/PlayerBetHistory';
import { Award, ArrowDown } from 'lucide-react';

export const Clasificacion = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [previousChampionName, setPreviousChampionName] = useState<string | null>(null);
  const [previousLastName, setPreviousLastName] = useState<string | null>(null);
  const [leagueName, setLeagueName] = useState<string>('Jambo');
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: string; name: string } | null>(null);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);

  const fetchLeagueProfiles = async () => {
    if (!user) return;

    // Obtener el perfil del usuario actual
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('league_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!currentProfile?.league_id) {
      setProfiles([]);
      return;
    }

    const leagueId = currentProfile.league_id;

    // Obtener todos los perfiles de la misma liga
    const { data: profilesData, error } = await supabase
      .from('profiles')
      .select('id, username, total_points, league_id, last_week_points')
      .eq('league_id', leagueId)
      .order('total_points', { ascending: false });

    if (error) {
      console.error('Error fetching league profiles:', error);
    } else {
      setProfiles(profilesData ?? []);
    }

    // Obtener datos de la liga para mostrar campeón, último y nombre
    const { data: leagueData, error: leagueError } = await supabase
      .from('leagues')
      .select('name, previous_champion, previous_last')
      .eq('id', leagueId)
      .single();

    if (leagueError) {
      console.error('Error fetching league data:', leagueError);
    } else {
      setLeagueName(leagueData?.name ?? 'Jambo');
      setPreviousChampionName(leagueData?.previous_champion ?? null);
      setPreviousLastName(leagueData?.previous_last ?? null);
    }
  };

  useEffect(() => {
    fetchLeagueProfiles();
  }, [user]);

  useEffect(() => {
    document.title = 'Jambol - Clasificación';
  }, []);

  const handlePlayerClick = (profile: any) => {
    if (profile.id === user?.id) return;

    setSelectedPlayer({
      id: profile.id,
      name: profile.username || 'Usuario'
    });
    setIsPlayerModalOpen(true);
  };

  const closePlayerModal = () => {
    setIsPlayerModalOpen(false);
    setSelectedPlayer(null);
  };

  return (
    <div className="w-full px-2 sm:px-4 space-y-6 sm:space-y-8">
      <div className="text-center">
        <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-2 sm:mb-4">
          Clasificación. {leagueName}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">Posiciones actuales de todos los jugadores de la liga</p>
      </div>

      {/* League Standings Table */}
      <Card className="shadow-lg w-full -mx-2 sm:mx-0">
        <CardContent className="p-2 sm:p-6">
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs sm:text-sm">Pos.</TableHead>
                <TableHead className="text-xs sm:text-sm">Jugador</TableHead>
                <TableHead className="text-xs sm:text-sm">Puntos Totales</TableHead>
                <TableHead className="text-xs sm:text-sm">Última Jornada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile, index) => (
                <TableRow 
                  key={profile.id} 
                  className={`${profile.id === user?.id ? 'bg-muted/50' : ''} ${profile.id !== user?.id ? 'cursor-pointer hover:bg-muted/30 transition-colors' : ''}`}
                  onClick={() => handlePlayerClick(profile)}
                >
                  <TableCell className="font-medium text-xs sm:text-sm">{index + 1}</TableCell>
                  <TableCell className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    <span className="truncate">{profile.username || 'Usuario'}</span>
                    {previousChampionName === profile.username && <Award className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 flex-shrink-0" />}
                    {previousLastName === profile.username && <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />}
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm">{(Math.ceil(Number(profile.total_points ?? 0) * 10) / 10).toFixed(1)}</TableCell>
                  <TableCell className="text-xs sm:text-sm">{(Number(profile.last_week_points ?? 0)).toFixed(1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Player Bet History Modal */}
      <Dialog open={isPlayerModalOpen} onOpenChange={setIsPlayerModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Historial de Apuestas</DialogTitle>
          </DialogHeader>
          {selectedPlayer && (
            <PlayerBetHistory 
              playerId={selectedPlayer.id} 
              playerName={selectedPlayer.name}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};