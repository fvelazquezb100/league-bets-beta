import { useEffect, useState } from 'react';
import { Trophy, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { getBettingTranslation } from '@/utils/bettingTranslations';

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
              status,
              match_description
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

  const getMatchName = (matchDescription?: string) => {
    if (matchDescription) return matchDescription;
    return 'Partidos no disponible';
  };

  const formatBetDisplay = (bet: any) => {
    const selections = bet.bet_selections || [];

    if (bet.bet_type === 'combo' && selections.length > 0) {
      return selections.map((selection: any, index: number) => (
        <div key={selection.id} className={index > 0 ? 'mt-2 pt-2 border-t' : ''}>
          <div className="text-sm">
            <span className="font-medium">{getMatchName(selection.match_description)}</span>
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

  // Función para controlar si se puede mostrar el botón de cancelar
  const canCancelBet = (bet: any) => {
    if (bet.status !== 'pending') return false;
    if (bet.bet_type === 'combo' && bet.bet_selections?.length) {
      return bet.bet_selections.every((sel: any) => sel.status === 'pending');
    }
    return true;
  };

  // Estadísticas básicas
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
      <TableHead>Partido</TableHead>
      <TableHead>Apuesta</TableHead>
      <TableHead>Estado</TableHead>
      <TableHead>Semana</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {bets.map((bet) => (
      <TableRow key={bet.id}>
        {/* Tipo */}
        <TableCell>
          <Badge variant="outline">
            {bet.bet_type === 'combo' ? 'Combinada' : 'Simple'}
          </Badge>
        </TableCell>

        {/* Partido */}
        <TableCell>
          {bet.bet_type === 'combo'
            ? bet.bet_selections?.map((sel: any) => (
                <div key={sel.id} className="text-sm mb-1">
                  {getMatchName(sel.match_description)}
                </div>
              ))
            : getMatchName(bet.match_description)}
        </TableCell>

        {/* Apuesta */}
        <TableCell>
          {bet.bet_type === 'combo'
            ? bet.bet_selections?.map((sel: any) => (
                <div key={sel.id} className="text-sm mb-1 text-muted-foreground">
                  {sel.market}: {getBettingTranslation(sel.selection)} @ {sel.odds}
                </div>
              ))
            : `${bet.market_bet || ''}: ${bet.bet_selection || ''} @ ${bet.odds || ''}`}
        </TableCell>

        {/* Estado */}
        <TableCell>
          <Badge variant={getStatusVariant(bet.status)}>
            {getStatusText(bet.status)}
          </Badge>
        </TableCell>

        {/* Semana */}
        <TableCell className="text-muted-foreground">
          {bet.week || '-'}
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
















