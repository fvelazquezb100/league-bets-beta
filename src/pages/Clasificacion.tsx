import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { PlayerBetHistory } from '@/components/PlayerBetHistory';

export const Clasificacion = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: string; name: string } | null>(null);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);

  const fetchLeagueProfiles = async () => {
    if (!user) return;

    // Fetch current user's profile to get league_id
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('league_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!currentProfile?.league_id) {
      setProfiles([]);
      return;
    }

    // Fetch all profiles in the same league
    const { data: profilesData, error } = await supabase
      .from('profiles')
      .select('id, username, total_points, league_id, last_week_points')
      .eq('league_id', currentProfile.league_id)
      .order('total_points', { ascending: false });

    if (error) {
      console.error('Error fetching league profiles:', error);
    } else {
      setProfiles(profilesData ?? []);
    }
  };

  useEffect(() => {
    fetchLeagueProfiles();
  }, [user]);

  useEffect(() => {
    document.title = 'Clasificación | Apuestas Simuladas';
  }, []);

  const handlePlayerClick = (profile: any) => {
    // Don't open modal for current user - they have their own bet history page
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
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Clasificación de la Liga
        </h1>
        <p className="text-muted-foreground">Posiciones actuales de todos los jugadores de la liga</p>
      </div>

      {/* League Standings Table */}
      <Card className="shadow-lg">
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pos.</TableHead>
                <TableHead>Jugador</TableHead>
                <TableHead>Puntos Totales</TableHead>
                <TableHead>Última Jornada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile, index) => (
                <TableRow 
                  key={profile.id} 
                  className={`${profile.id === user?.id ? 'bg-muted/50' : ''} ${profile.id !== user?.id ? 'cursor-pointer hover:bg-muted/30 transition-colors' : ''}`}
                  onClick={() => handlePlayerClick(profile)}
                >
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{profile.username || 'Usuario'}</TableCell>
                  <TableCell>{(Math.ceil(Number(profile.total_points ?? 0) * 10) / 10).toFixed(1)}</TableCell>
                  <TableCell>
  {(Number(profile.last_week_points ?? 0)).toFixed(2)}
</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Player Bet History Modal */}
      <Dialog open={isPlayerModalOpen} onOpenChange={setIsPlayerModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Historial de Apuestas</DialogTitle>
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