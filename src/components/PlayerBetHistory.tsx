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
  const [resultsMap, setResultsMap] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchPlayerBets = async () => {
      try {
        setLoading(true);

        // 1. Traemos apuestas
        const { data: betsData, error: betsError } = await supabase
          .from('bets')
          .select(`
            *,
            bet_selections (
              id,
              fixture_id,
              market,
              selection,
              status,
              match_description,
              odds
            )
          `)
          .eq('user_id', playerId)
          .order('id', { ascending: false });

        if (betsError) {
          console.error('Error fetching player bets:', betsError);
          setBets([]);
          return;
        }

        if (!betsData) {
          setBets([]);
          return;
        }

        // 2. Recolectamos fixture_ids
        const fixtureIds = new Set<number>();
        betsData.forEach((bet: any) => {
          if (bet.fixture_id) fixtureIds.add(bet.fixture_id);
          bet.bet_selections?.forEach((sel: any) => {
            if (sel.fixture_id) fixtureIds.add(sel.fixture_id);
          });
        });

        // 3. Traemos resultados
        const { data: resultsData, error: resultsError } = await supabase
          .from('match_results')
          .select('fixture_id, match_result')
          .in('fixture_id', Array.from(fixtureIds));

        if (resultsError) {
          console.error('Error fetching match results:', resultsError);
        }

        const map: Record<number, string> = {};
        resultsData?.forEach((res: any) => {
          map[res.fixture_id] = res.match_result;
        });
        setResultsMap(map);

        // 4. Asignamos resultados a apuestas y selecciones
        const betsWithResults = betsData.map((bet: any) => ({
          ...bet,
          match_result: map[bet.fixture_id] || null,
          bet_selections: bet.bet_selections?.map((sel: any) => ({
            ...sel,
            match_result: map[sel.fixture_id] || null,
          })),
        }));

        setBets(betsWithResults);
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
    return 'Partido no disponible';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="h-8 bg-muted animate-pulse rounded w-1/2 mx-auto"></div>
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

                    {/* Partido con resultado en línea abajo */}
                    <TableCell>
                      {bet.bet_type === 'combo'
                        ? bet.bet_selections?.map((sel: any) => (
                            <div key={sel.id} className="text-sm mb-1">
                              {getMatchName(sel.match_description)}
                              {sel.match_result && (
                                <div className="text-xs text-muted-foreground">{sel.match_result}</div>
                              )}
                            </div>
                          ))
                        : <>
                            {getMatchName(bet.match_description)}
                            {bet.match_result && (
                              <div className="text-xs text-muted-foreground">{bet.match_result}</div>
                            )}
                          </>
                      }
                    </TableCell>

                    {/* Apuesta */}
                    <TableCell>
                      {bet.bet_type === 'combo' ? (
                        <>
                          {bet.bet_selections?.map((sel: any, index: number) => (
                            <div key={sel.id} className={`text-sm ${index < (bet.bet_selections?.length || 0) - 1 ? 'mb-5' : 'mb-2'} text-muted-foreground`}>
                              {sel.market}: {getBettingTranslation(sel.selection) || sel.selection} @ {sel.odds}
                            </div>
                          ))}
                          <div className="text-xs text-muted-foreground">&nbsp;</div>
                        </>
                      ) : (
                        <>
                          <div className="text-sm text-muted-foreground">
                            {(() => {
                              const market = bet.market_bets || '';
                              const selectionText = bet.bet_selection?.trim() || '';
                              
                              // Check if selectionText already contains odds (has @ symbol)
                              if (selectionText.includes(' @ ')) {
                                const parts = selectionText.split(' @ ');
                                const selection = getBettingTranslation(parts[0] || '') || parts[0] || '';
                                const odds = parts[1] ? parseFloat(parts[1]).toFixed(2) : '';
                                return `${market}: ${selection} @ ${odds}`;
                              } else {
                                // If no odds in selectionText, use bet.odds
                                const translatedSelection = getBettingTranslation(selectionText) || selectionText;
                                const odds = bet.odds ? parseFloat(bet.odds).toFixed(2) : '';
                                return `${market}: ${translatedSelection} @ ${odds}`;
                              }
                            })()}
                          </div>
                          <div className="text-xs text-muted-foreground">&nbsp;</div>
                        </>
                      )}
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