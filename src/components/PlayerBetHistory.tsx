import React, { useEffect, useState } from 'react';
import { Trophy, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
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

        // 1. Traemos apuestas (solo ganadas o perdidas, excluyendo semana 0)
        // Note: Supabase has a default limit of 1000 rows, so we need to use range() to get all rows
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
          .in('status', ['won', 'lost'])
          .not('week', 'eq', 0) // Exclude week 0 (historical bets)
          .range(0, 999999); // Remove default 1000 limit

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

        // 5. Ordenar apuestas: por semana (desc) > fecha encuentro (desc) > ID (desc)
        const sortedBets = betsWithResults.sort((a, b) => {
          const weekA = Number(a.week) || 0;
          const weekB = Number(b.week) || 0;
          
          // First sort by week (descending: latest week first)
          if (weekA !== weekB) {
            return weekB - weekA;
          }
          
          // Within same week, sort by earliest match kickoff time
          const getEarliestKickoff = (bet: any): Date => {
            let earliestDate = new Date('2099-12-31'); // Far future as default
            
            // For single bets
            if (bet.fixture_id && map[bet.fixture_id]) {
              // We don't have kickoff times here, use a fallback
              earliestDate = new Date('2000-01-01'); // Past date to indicate we have data
            }
            
            // For combo bets, check if any selection has data
            if (bet.bet_selections) {
              bet.bet_selections.forEach((selection: any) => {
                if (selection.fixture_id && map[selection.fixture_id]) {
                  earliestDate = new Date('2000-01-01'); // Past date to indicate we have data
                }
              });
            }
            
            return earliestDate;
          };

          const dateA = getEarliestKickoff(a);
          const dateB = getEarliestKickoff(b);
          
          // If both have match data, they're equivalent for date sorting
          // Fall back to bet ID sorting
          if (dateA.getTime() !== new Date('2099-12-31').getTime() && 
              dateB.getTime() !== new Date('2099-12-31').getTime()) {
            return b.id - a.id; // Newer bets first
          }
          
          // If no match data available, sort by bet ID (descending: newest first)
          return b.id - a.id;
        });

        setBets(sortedBets);
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

  const getBetTypeBadgeClassName = (status: string) => {
    switch (status) {
      case 'won':
        return 'bg-[#FFC72C] text-black border-2 border-[#FFC72C]';
      case 'lost':
        return 'bg-destructive hover:bg-destructive/90 text-destructive-foreground';
      default:
        return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'won': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'lost': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending': return null;
      default: return null;
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
      <div className="text-left">
        <h2 className="text-lg font-semibold text-foreground">
          Historial de {playerName}
        </h2>
      </div>

      {/* Desktop Bet History Table */}
      <Card className="hidden sm:block">
        <CardContent>
          {bets.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Este jugador no tiene apuestas finalizadas (ganadas o perdidas) todavía.
            </p>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden sm:block">
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
              </div>

              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-4">
                {bets.map((bet) => (
                  <Card key={bet.id} className="p-4">
                    <div className="space-y-3">
                      {/* Header: Tipo + Semana */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline"
                            className={`text-xs ${getBetTypeBadgeClassName(bet.status)}`}
                          >
                            {bet.bet_type === 'combo' ? 'Combinada' : 'Simple'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Semana {bet.week || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Partido y Apuesta */}
                      <div className="space-y-3">
                        {bet.bet_type === 'combo'
                          ? bet.bet_selections?.map((sel: any) => (
                              <div key={sel.id} className="space-y-1">
                                {/* Partido con resultado en la misma línea */}
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-medium">
                                    {getMatchName(sel.match_description)}
                                  </div>
                                  {sel.match_result && (
                                    <div className="text-xs text-muted-foreground">
                                      ({sel.match_result})
                                    </div>
                                  )}
                                </div>
                                {/* Apuesta justo debajo */}
                                <div className="flex items-center gap-2 text-sm font-medium text-foreground border-l-2 border-muted pl-2">
                                  {getStatusIcon(sel.status)}
                                  <span>{sel.market}: {getBettingTranslation(sel.selection) || sel.selection} @ {sel.odds}</span>
                                </div>
                              </div>
                            ))
                          : (
                              <div className="space-y-1">
                                {/* Partido con resultado en la misma línea */}
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-medium">
                                    {getMatchName(bet.match_description)}
                                  </div>
                                  {bet.match_result && (
                                    <div className="text-xs text-muted-foreground">
                                      ({bet.match_result})
                                    </div>
                                  )}
                                </div>
                                {/* Apuesta justo debajo */}
                                <div className="text-sm font-medium text-foreground border-l-2 border-muted pl-2">
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
                              </div>
                            )
                        }
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Mobile Bet History View - Sin marco */}
      <div className="block sm:hidden">
        {bets.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Este jugador no tiene apuestas finalizadas (ganadas o perdidas) todavía.
          </div>
        ) : (
          <div className="space-y-4">
            {bets.map((bet) => (
              <Card key={bet.id} className="p-4">
                <div className="space-y-3">
                  {/* Header: Tipo + Semana */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline"
                        className={`text-xs ${getBetTypeBadgeClassName(bet.status)}`}
                      >
                        {bet.bet_type === 'combo' ? 'Combinada' : 'Simple'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Semana {bet.week || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Partido y Apuesta */}
                  <div className="space-y-3">
                    {bet.bet_type === 'combo'
                      ? bet.bet_selections?.map((sel: any) => (
                          <div key={sel.id} className="space-y-1">
                            {/* Partido con resultado en la misma línea */}
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium">
                                {getMatchName(sel.match_description)}
                              </div>
                              {sel.match_result && (
                                <div className="text-xs text-muted-foreground">
                                  ({sel.match_result})
                                </div>
                              )}
                            </div>
                            {/* Apuesta justo debajo */}
                            <div className="flex items-center gap-2 text-sm font-medium text-foreground border-l-2 border-muted pl-2">
                              {getStatusIcon(sel.status)}
                              <span>{sel.market}: {getBettingTranslation(sel.selection) || sel.selection} @ {sel.odds}</span>
                            </div>
                          </div>
                        ))
                      : (
                          <div className="space-y-1">
                            {/* Partido con resultado en la misma línea */}
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium">
                                {getMatchName(bet.match_description)}
                              </div>
                              {bet.match_result && (
                                <div className="text-xs text-muted-foreground">
                                  ({bet.match_result})
                                </div>
                              )}
                            </div>
                            {/* Apuesta justo debajo */}
                            <div className="text-sm font-medium text-foreground border-l-2 border-muted pl-2">
                              {(() => {
                                const parts = bet.bet_selection?.split(' @ ') || [];
                                const selection = getBettingTranslation(parts[0] || '');
                                const odds = parts[1] || bet.odds;
                                return `${bet.market_bets}: ${selection} @ ${odds}`;
                              })()}
                            </div>
                          </div>
                        )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};