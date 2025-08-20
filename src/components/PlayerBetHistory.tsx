
import { useEffect, useState } from 'react';
import { Trophy, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';

interface PlayerBetHistoryProps {
  playerId: string;
  playerName: string;
}

export const PlayerBetHistory: React.FC<PlayerBetHistoryProps> = ({ playerId, playerName }) => {
  const [bets, setBets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [kickoffTimes, setKickoffTimes] = useState<{ [key: number]: string }>({});
  const [teamNames, setTeamNames] = useState<{ [key: number]: { home: string; away: string } }>({});

  useEffect(() => {
    const fetchPlayerBets = async () => {
      try {
        setLoading(true);
        console.log('Fetching bets for player:', playerId);
        
        // Fetch player's bets with bet selections
        const { data: betsData, error: betsError } = await supabase
          .from('bets')
          .select(`
            *,
            bet_selections (
              id,
              fixture_id,
              market,
              selection,
              odds,
              status
            )
          `)
          .eq('user_id', playerId)
          .order('id', { ascending: false });

        if (betsError) {
          console.error('Error fetching player bets:', betsError);
          setBets([]);
          return;
        }

        console.log('Fetched bets data:', betsData);

        // Fetch odds cache for fixture info
        const { data: cacheData } = await supabase
          .from('match_odds_cache')
          .select('data')
          .single();

        if (cacheData?.data) {
          const oddsCache = cacheData.data as any;
          const kickoffMap: { [key: number]: string } = {};
          const teamMap: { [key: number]: { home: string; away: string } } = {};

          if (Array.isArray(oddsCache.response)) {
            oddsCache.response.forEach((match: any) => {
              if (match?.fixture?.id) {
                const fixtureId = parseInt(match.fixture.id);
                kickoffMap[fixtureId] = match.fixture.date;
                if (match.teams) {
                  teamMap[fixtureId] = {
                    home: match.teams.home?.name || 'Local',
                    away: match.teams.away?.name || 'Visitante'
                  };
                }
              }
            });
          }

          setKickoffTimes(kickoffMap);
          setTeamNames(teamMap);
        }

        setBets(betsData || []);
      } catch (error) {
        console.error('Error fetching player bet history:', error);
        setBets([]);
      } finally {
        setLoading(false);
      }
    };

    if (playerId) {
      fetchPlayerBets();
    }
  }, [playerId]);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'won': return 'Ganada';
      case 'lost': return 'Perdida';
      default: return status;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'won': return 'default';
      case 'lost': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  const getMatchName = (fixtureId: number | null | undefined) => {
    if (!fixtureId || !teamNames[fixtureId]) return 'Partido no disponible';
    const teams = teamNames[fixtureId];
    return `${teams.home} vs ${teams.away}`;
  };

  /*
  const formatBetDisplay = (bet: any) => {
    const selections = bet.bet_selections || [];
    
    if (bet.bet_type === 'combo' && selections.length > 0) {
      return selections.map((selection: any, index: number) => (
        <div key={selection.id} className={index > 0 ? 'mt-2 pt-2 border-t' : ''}>
          <div className="text-sm">
            <span className="font-medium">{getMatchName(selection.fixture_id)}</span>
            <br />
            <span className="text-muted-foreground">
              {selection.market}: {selection.selection} @ {selection.odds}
            </span>
          </div>
        </div>
      ));
    } else {
      return (
        <div className="text-sm">
          <span className="font-medium">{bet.match_description || getMatchName(bet.fixture_id)}</span>
          <br />
          <span className="text-muted-foreground">
            {bet.bet_selection} @ {bet.odds}
          </span>
        </div>
      );
    }
  };
*/

  // nueva forma de sacar el nombre en las combinadas
const formatBetDisplay = (bet: any) => {
  const selections = bet.bet_selections || [];
  
  if (bet.bet_type === 'combo' && selections.length > 0) {
    return selections.map((selection: any, index: number) => {
      const matchName = selection.match_description || getMatchName(selection.fixture_id);

      return (
        <div key={selection.id} className={index > 0 ? 'mt-2 pt-2 border-t' : ''}>
          <div className="text-sm">
            <span className="font-medium">{matchName}</span>
            <br />
            <span className="text-muted-foreground">
              {selection.market}: {selection.selection} @ {selection.odds}
            </span>
          </div>
        </div>
      );
    });
  } else {
    return (
      <div className="text-sm">
        <span className="font-medium">{bet.match_description || getMatchName(bet.fixture_id)}</span>
        <br />
        <span className="text-muted-foreground">
          {bet.bet_selection} @ {bet.odds}
        </span>
      </div>
    );
  }
};


  
  // Calculate basic stats (no stakes shown for privacy)
  const wonBets = bets.filter(bet => bet.status === 'won');
  const lostBets = bets.filter(bet => bet.status === 'lost');
  const pendingBets = bets.filter(bet => bet.status === 'pending');
  
  const totalBets = wonBets.length + lostBets.length;
  const successPercentage = totalBets > 0 ? Math.round((wonBets.length / totalBets) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="h-8 bg-muted animate-pulse rounded w-1/2 mx-auto"></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-12 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">
          Historial de {playerName}
        </h2>
        <p className="text-muted-foreground mt-1">
          Apuestas visibles: ganadas, perdidas y próximas a iniciar
        </p>
      </div>

      {/* Basic Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Apuestas Ganadas</p>
                <p className="text-2xl font-bold text-primary">{wonBets.length}</p>
              </div>
              <Trophy className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">% de Acierto</p>
                <p className="text-2xl font-bold text-primary">{successPercentage}%</p>
              </div>
              <Trophy className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold">{pendingBets.length}</p>
              </div>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bet History Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Historial de Apuestas</h3>
        </CardHeader>
        <CardContent>
          {bets.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No se encontraron apuestas visibles para este jugador.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Apuesta</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bets.map((bet) => (
                  <TableRow key={bet.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {bet.bet_type === 'combo' ? 'Combinada' : 'Simple'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatBetDisplay(bet)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(bet.status)}>
                        {getStatusText(bet.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(bet.created_at).toLocaleDateString('es-ES')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
