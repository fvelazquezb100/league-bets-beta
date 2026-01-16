import React, { useEffect, useState } from 'react';
import { Trophy, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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

  // Función para detectar si un boleto tiene boost
  const hasBetBoost = (bet: any): boolean => {
    if (!bet.bet_selections || !Array.isArray(bet.bet_selections)) return false;
    return bet.bet_selections.some((selection: any) => selection.market === 'BOOST');
  };

  // Función para filtrar selecciones excluyendo BOOST (para display)
  const getNonBoostSelections = (betSelections: any[]): any[] => {
    if (!betSelections || !Array.isArray(betSelections)) return [];
    return betSelections.filter((selection: any) => selection.market !== 'BOOST');
  };

  // Función para obtener el multiplicador de boost de una apuesta
  const getBoostMultiplier = (betSelections: any[]): number | null => {
    if (!betSelections || !Array.isArray(betSelections)) return null;
    const boostSelection = betSelections.find((selection: any) => selection.market === 'BOOST');
    if (!boostSelection) return null;
    // El multiplicador está en odds o en selection (como string)
    return parseFloat(boostSelection.odds || boostSelection.selection || '1.25');
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

      {/* Desktop Bet History View - Cards */}
      <div className="hidden sm:block">
          {bets.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Este jugador no tiene apuestas finalizadas (ganadas o perdidas) todavía.
            </p>
          ) : (
          <div className="space-y-4">
            {bets.map((bet) => {
              const hasBoost = hasBetBoost(bet);
              const showBoostStyle = hasBoost && bet.status !== 'cancelled';
              const displaySelections = bet.bet_type === 'combo' ? getNonBoostSelections(bet.bet_selections || []) : [];
              const boostMultiplier = getBoostMultiplier(bet.bet_selections || []);
              
              return (
                <Card key={bet.id} className={`p-4 ${showBoostStyle ? 'bg-yellow-100/50 border-yellow-400 dark:bg-gray-800/50 dark:border-[#FFC72C]' : ''}`}>
                    <div className="space-y-3">
                      {/* Header: Tipo + Semana */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                        {hasBoost ? (
                          <Badge className={`text-xs ${
                            bet.status === 'cancelled' 
                              ? 'bg-white text-gray-600 border-2 border-gray-400 hover:bg-white hover:text-gray-600' 
                              : bet.status === 'lost'
                              ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                              : bet.status === 'pending'
                              ? 'bg-white text-[#FFC72C] border-2 border-[#FFC72C] hover:bg-white'
                              : 'bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500'
                          }`}>
                            SUPER
                          </Badge>
                        ) : (
                          <Badge 
                            variant="outline"
                            className={`text-xs ${getBetTypeBadgeClassName(bet.status)}`}
                          >
                            {bet.bet_type === 'combo' ? 'Combinada' : 'Simple'}
                          </Badge>
                        )}
                          <span className="text-xs text-muted-foreground">
                            Semana {bet.week || 'N/A'}
                          </span>
                        </div>
                      </div>

                    {/* Detalles del boleto */}
                      <div className="space-y-3">
                      {bet.bet_type === 'combo' && displaySelections.length > 0 ? (
                        displaySelections.map((selection: any, index: number) => {
                          const matchResult = selection.fixture_id ? resultsMap[selection.fixture_id] : null;
                          return (
                            <div key={selection.id || `selection-${index}`} className="flex items-center gap-3">
                              {/* Partido, marcador y cuota en la misma línea */}
                              <div className="flex items-center gap-3 flex-1">
                                <span className="text-sm font-medium">{getMatchName(selection.match_description)}</span>
                                {matchResult && (
                                  <span className="text-xs text-muted-foreground">
                                    ({matchResult})
                                  </span>
                                )}
                                <span className="text-sm">
                                  {getBettingTranslation(selection.market)}: {getBettingTranslation(selection.selection) || selection.selection} @ {selection.odds}
                                  {showBoostStyle && boostMultiplier && <span className="text-yellow-600 font-medium"> x{boostMultiplier.toFixed(2).replace('.', ',')}</span>}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : bet.bet_type === 'single' ? (
                        <div className="flex items-center gap-3">
                          {/* Partido, marcador y cuota en la misma línea */}
                          <div className="flex items-center gap-3 flex-1">
                            <span className="text-sm font-medium">{getMatchName(bet.match_description)}</span>
                                  {bet.match_result && (
                              <span className="text-xs text-muted-foreground">
                                      ({bet.match_result})
                              </span>
                                  )}
                            <span className="text-sm">
                                  {(() => {
                                    const market = bet.market_bets || '';
                                    const selectionText = bet.bet_selection?.trim() || '';
                                    
                                    if (selectionText.includes(' @ ')) {
                                      const parts = selectionText.split(' @ ');
                                      const selection = getBettingTranslation(parts[0] || '') || parts[0] || '';
                                      const odds = parts[1] ? parseFloat(parts[1]).toFixed(2) : '';
                                      return `${market}: ${selection} @ ${odds}`;
                                    } else {
                                      const translatedSelection = getBettingTranslation(selectionText) || selectionText;
                                      const odds = bet.odds ? parseFloat(bet.odds).toFixed(2) : '';
                                      return `${market}: ${translatedSelection} @ ${odds}`;
                                    }
                                  })()}
                            </span>
                                </div>
                              </div>
                      ) : null}
                    </div>
                    </div>
                  </Card>
              );
            })}
              </div>
          )}
      </div>


      {/* Mobile Bet History View - Sin marco */}
      <div className="block sm:hidden">
        {bets.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Este jugador no tiene apuestas finalizadas (ganadas o perdidas) todavía.
          </div>
        ) : (
          <div className="space-y-4">
            {bets.map((bet) => {
              const hasBoost = hasBetBoost(bet);
              const showBoostStyle = hasBoost && bet.status !== 'cancelled';
              const displaySelections = bet.bet_type === 'combo' ? getNonBoostSelections(bet.bet_selections || []) : [];
              const boostMultiplier = getBoostMultiplier(bet.bet_selections || []);
              
              return (
              <Card key={bet.id} className={`p-4 ${showBoostStyle ? 'bg-yellow-100/50 border-yellow-400 dark:bg-gray-800/50 dark:border-[#FFC72C]' : ''}`}>
                <div className="space-y-3">
                  {/* Header: Tipo + Semana */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {hasBoost ? (
                        <Badge className={`text-xs ${
                          bet.status === 'cancelled' 
                            ? 'bg-white text-gray-600 border-2 border-gray-400 hover:bg-white hover:text-gray-600' 
                            : bet.status === 'lost'
                            ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                            : bet.status === 'pending'
                            ? 'bg-white text-[#FFC72C] border-2 border-[#FFC72C] hover:bg-white'
                            : 'bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500'
                        }`}>
                          SUPER
                        </Badge>
                      ) : (
                      <Badge 
                        variant="outline"
                        className={`text-xs ${getBetTypeBadgeClassName(bet.status)}`}
                      >
                        {bet.bet_type === 'combo' ? 'Combinada' : 'Simple'}
                      </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Semana {bet.week || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Partido y Apuesta */}
                  <div className="space-y-3">
                    {bet.bet_type === 'combo' && displaySelections.length > 0
                      ? displaySelections.map((sel: any) => (
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
                            <div className={`flex items-center gap-2 text-sm font-medium text-foreground border-l-2 pl-2 ${showBoostStyle ? 'border-yellow-400' : 'border-muted'}`}>
                              {!hasBoost && getStatusIcon(sel.status)}
                              <span>
                                {sel.market}: {getBettingTranslation(sel.selection) || sel.selection} @ {sel.odds}
                                {showBoostStyle && boostMultiplier && <span className="text-yellow-600 font-medium"> x{boostMultiplier.toFixed(2).replace('.', ',')}</span>}
                              </span>
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};