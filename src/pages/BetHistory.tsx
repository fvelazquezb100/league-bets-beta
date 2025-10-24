import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Calendar, TrendingDown, TrendingUp, Trophy, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getBettingTranslation } from '@/utils/bettingTranslations';
import { UserStatistics } from '@/components/UserStatistics';
import { useUserBetHistory, useCancelBet } from '@/hooks/useUserBets';
import { useBettingSettings } from '@/hooks/useBettingSettings';
import { useMatchResults, useKickoffTimes } from '@/hooks/useMatchResults';

export const BetHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { cutoffMinutes } = useBettingSettings();
  
  // React Query hooks
  const { data: bets = [], isLoading: betsLoading, refetch: refetchBets } = useUserBetHistory(user?.id);
  const cancelBetMutation = useCancelBet();
  
  // Extract fixture IDs from bets for related data
  const fixtureIds = useMemo(() => {
    const ids = new Set<number>();
    bets.forEach((bet) => {
      if (bet.fixture_id) {
        ids.add(bet.fixture_id);
      }
      if (bet.bet_selections) {
        bet.bet_selections.forEach((selection: any) => {
          if (selection.fixture_id) {
            ids.add(selection.fixture_id);
          }
        });
      }
    });
    return Array.from(ids);
  }, [bets]);
  
  // Fetch related data
  const { data: matchResults = {} } = useMatchResults(fixtureIds);
  const { data: matchKickoffs = {} } = useKickoffTimes(fixtureIds);
  
  // Local UI state
  const [now, setNow] = useState<Date>(new Date());
  const [timeLeft, setTimeLeft] = useState<{ [betId: number]: string }>({});
  const [activeFilter, setActiveFilter] = useState<'all' | 'won' | 'pending'>('all');
  const [showStatistics, setShowStatistics] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [betToCancel, setBetToCancel] = useState<number | null>(null);
  
  // Derive canceling state from mutation
  const cancelingId = cancelBetMutation.isPending ? betToCancel : null;

  // Data fetching is now handled by React Query hooks above
  // Automatic caching, background updates, and error handling!

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000); // Update every second
    return () => clearInterval(t);
  }, []);

  // Update time remaining for each bet
  useEffect(() => {
    const newTimeLeft: { [betId: number]: string } = {};
    
    bets.forEach(bet => {
      if (bet.status === 'pending') {
        const cutoffTime = getBetCutoffTime(bet);
        if (cutoffTime) {
          newTimeLeft[bet.id] = formatTimeRemaining(cutoffTime);
        }
      }
    });
    
    // Only update if there are actual changes
    setTimeLeft(prevTimeLeft => {
      const hasChanges = Object.keys(newTimeLeft).some(
        key => newTimeLeft[parseInt(key)] !== prevTimeLeft[parseInt(key)]
      ) || Object.keys(prevTimeLeft).length !== Object.keys(newTimeLeft).length;
      
      return hasChanges ? newTimeLeft : prevTimeLeft;
    });
  }, [now, bets, matchKickoffs, matchResults]);

  const handleCancelClick = (betId: number) => {
    setBetToCancel(betId);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!betToCancel) return;
    
    try {
      await cancelBetMutation.mutateAsync(betToCancel);
      
      setCancelDialogOpen(false);
      setBetToCancel(null);
      
      toast({
        title: 'Apuesta cancelada',
        description: 'Se ha reembolsado tu importe al presupuesto semanal.',
      });
    } catch (error: any) {
      setCancelDialogOpen(false);
      setBetToCancel(null);
      console.error('Error canceling bet:', error);
      toast({ 
        title: 'Error', 
        description: error?.message || 'Ha ocurrido un error al cancelar la apuesta.',
        variant: 'destructive'
      });
    }
  };

  const handleCancelDialogClose = () => {
    setCancelDialogOpen(false);
    setBetToCancel(null);
  };

  // Filter out cancelled bets from statistics
  const activeBets = bets.filter((bet) => bet.status !== 'cancelled');
  
  const wonBets = activeBets.filter((bet) => bet.status === 'won');
  const lostBets = activeBets.filter((bet) => bet.status === 'lost');
  const pendingBets = activeBets.filter((bet) => bet.status === 'pending').length;

  const totalBetAmount = activeBets.reduce((sum, bet) => sum + (bet.stake || 0), 0);
  const totalPayout = activeBets.reduce(
    (sum, bet) => sum + (bet.status === 'won' ? (bet.payout || 0) : 0),
    0
  );

  const settledBets = wonBets.length + lostBets.length;
  const successPercentage =
    settledBets > 0 ? Math.round((wonBets.length / settledBets) * 100) : 0;

  // Function to get the cutoff time for a bet
  const getBetCutoffTime = (bet: any): Date | null => {
    // For single bets
    if (bet.bet_type === 'single' && bet.fixture_id) {
      // Check if match has already started by looking at match_results
      const matchResult = matchResults[bet.fixture_id];
      if (matchResult) {
        // Check if match has finished
        if (matchResult.match_result) {
          return null; // Match has finished, cannot cancel
        }
        // Use kickoff_time from match_results if available (primary source)
        if (matchResult.kickoff_time) {
          const kickoffTime = new Date(matchResult.kickoff_time);
          if (now >= kickoffTime) {
            return null; // Match has started, cannot cancel
          }
          // Return cutoff time based on match_results kickoff_time
          return new Date(kickoffTime.getTime() - cutoffMinutes * 60 * 1000);
        }
      }
      
      // Fallback to matchKickoffs from cache (for backwards compatibility)
      const kickoff = matchKickoffs[bet.fixture_id];
      if (kickoff) {
        return new Date(kickoff.getTime() - cutoffMinutes * 60 * 1000);
      }
    }
    
    // For combo bets
    if (bet.bet_type === 'combo' && bet.bet_selections) {
      // Check if any selection is already finished (won or lost)
      const hasFinishedSelection = bet.bet_selections.some((selection: any) => 
        selection.status === 'won' || selection.status === 'lost'
      );
      
      if (hasFinishedSelection) {
        return null; // Cannot cancel if any match is already finished
      }
      
      // Check if any match has already started by looking at match_results
      const hasStartedMatch = bet.bet_selections.some((selection: any) => {
        if (selection.fixture_id) {
          const matchResult = matchResults[selection.fixture_id];
          if (matchResult) {
            // Check if match has finished
            if (matchResult.match_result) {
              return true; // Match has finished
            }
            // Check if match has started
            if (matchResult.kickoff_time) {
              const kickoffTime = new Date(matchResult.kickoff_time);
              return now >= kickoffTime; // Match has started
            }
          }
        }
        return false;
      });
      
      if (hasStartedMatch) {
        return null; // Cannot cancel if any match has already started
      }
      
      // Find the earliest kickoff time among all selections
      let earliestKickoff: Date | null = null;
      
      bet.bet_selections.forEach((selection: any) => {
        if (selection.fixture_id) {
          // Try match_results first (primary source)
          const matchResult = matchResults[selection.fixture_id];
          if (matchResult?.kickoff_time) {
            const kickoffTime = new Date(matchResult.kickoff_time);
            if (!earliestKickoff || kickoffTime < earliestKickoff) {
              earliestKickoff = kickoffTime;
            }
          } else {
            // Fallback to matchKickoffs from cache
            const kickoff = matchKickoffs[selection.fixture_id];
            if (kickoff && (!earliestKickoff || kickoff < earliestKickoff)) {
              earliestKickoff = kickoff;
            }
          }
        }
      });
      
      if (earliestKickoff) {
        return new Date(earliestKickoff.getTime() - cutoffMinutes * 60 * 1000); // Use dynamic cutoff minutes
      }
    }
    
    return null;
  };

  // Function to check if a bet can be cancelled (using dynamic cutoff minutes before kickoff and no matches finished)
  const canCancelBet = (bet: any): boolean => {
    if (bet.status !== 'pending') return false;
    
    // For single bets - check if match has already started
    if (bet.bet_type === 'single' && bet.fixture_id) {
      const matchResult = matchResults[bet.fixture_id];
      if (matchResult) {
        // Check if match has finished (has match_result)
        if (matchResult.match_result) {
          return false; // Match has finished, cannot cancel
        }
        // Check if match has started (kickoff_time has passed)
        if (matchResult.kickoff_time) {
          const kickoffTime = new Date(matchResult.kickoff_time);
          if (now >= kickoffTime) {
            return false; // Match has started, cannot cancel
          }
        }
      }
    }
    
    // For combo bets - check if any match has already started
    if (bet.bet_type === 'combo' && bet.bet_selections) {
      // Check if any selection is already finished (won or lost)
      const hasFinishedSelection = bet.bet_selections.some((selection: any) => 
        selection.status === 'won' || selection.status === 'lost'
      );
      
      if (hasFinishedSelection) {
        return false; // Cannot cancel if any match is already finished
      }
      
      // Check if any match has already started by looking at match_results
      const hasStartedMatch = bet.bet_selections.some((selection: any) => {
        if (selection.fixture_id) {
          const matchResult = matchResults[selection.fixture_id];
          if (matchResult) {
            // Check if match has finished
            if (matchResult.match_result) {
              return true; // Match has finished
            }
            // Check if match has started
            if (matchResult.kickoff_time) {
              const kickoffTime = new Date(matchResult.kickoff_time);
              return now >= kickoffTime; // Match has started
            }
          }
        }
        return false;
      });
      
      if (hasStartedMatch) {
        return false; // Cannot cancel if any match has already started
      }
    }
    
    const cutoffTime = getBetCutoffTime(bet);
    return cutoffTime ? now < cutoffTime : false;
  };

  // Function to format time remaining with seconds countdown
  const formatTimeRemaining = (cutoffTime: Date): string => {
    const timeDiff = cutoffTime.getTime() - now.getTime();
    
    if (timeDiff <= 0) {
      return 'Tiempo agotado';
    }
    
    const totalSeconds = Math.floor(timeDiff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'won':
        return 'Ganada';
      case 'lost':
        return 'Perdida';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'won':
        return 'default';
      case 'lost':
        return 'destructive';
      case 'pending':
        return 'secondary';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusClassName = (status: string) => {
    if (status === 'pending') {
      return 'bg-white text-black border-2 border-[#FFC72C] hover:bg-white hover:text-black';
    }
    if (status === 'cancelled') {
      return 'bg-white text-gray-600 border-2 border-gray-400 hover:bg-white hover:text-gray-600';
    }
    return '';
  };

  const getBetTypeBadgeClassName = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-white text-black border-2 border-[#FFC72C] hover:bg-white hover:text-black';
      case 'won':
        return 'bg-[#FFC72C] text-black border-2 border-[#FFC72C] hover:bg-[#FFC72C] hover:text-black';
      case 'lost':
        return 'bg-destructive hover:bg-destructive/90 text-destructive-foreground';
      case 'cancelled':
        return 'bg-white text-gray-600 border-2 border-gray-400 hover:bg-white hover:text-gray-600';
      default:
        return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'won': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'lost': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-gray-500" />;
      case 'pending': return null;
      default: return null;
    }
  };

  const formatBetDisplay = (market: string, selection: string, odds: number): string => {
    return `${market}: ${selection} @ ${odds.toFixed(2)}`;
  };

  // Función para calcular la cuota total de una apuesta combinada
  const calculateComboOdds = (betSelections: any[]): number => {
    if (!betSelections || betSelections.length === 0) return 0;
    
    return betSelections.reduce((total, selection) => {
      const odds = parseFloat(selection.odds || 0);
      return total * odds;
    }, 1);
  };

  // ✅ versión buena: partido arriba, resultado debajo
  const getMatchResultDisplay = (matchDescription: string | null, fixtureId: number | null) => {
    const matchName = matchDescription || 'Partido';
    const result = fixtureId ? matchResults[fixtureId] : null;
    return (
      <div>
        <div>{matchName}</div>
        {result?.match_result && (
          <div className="text-xs text-muted-foreground">{result.match_result}</div>
        )}
      </div>
    );
  };

  const getMatchName = (matchDescription: string | null) => {
    return matchDescription || 'Partido no disponible';
  };

  // Función para filtrar apuestas (excluyendo semana 0)
  const getFilteredBets = () => {
    const nonHistoricalBets = bets.filter(bet => Number(bet.week) !== 0);
    
    switch (activeFilter) {
      case 'won':
        return nonHistoricalBets.filter(bet => bet.status === 'won');
      case 'pending':
        return nonHistoricalBets.filter(bet => bet.status === 'pending');
      default:
        return nonHistoricalBets;
    }
  };

  // Apuestas históricas (semana 0)
  const getHistoricalBets = () => {
    const historicalBets = bets.filter(bet => Number(bet.week) === 0);
    
    switch (activeFilter) {
      case 'won':
        return historicalBets.filter(bet => bet.status === 'won');
      case 'pending':
        return historicalBets.filter(bet => bet.status === 'pending');
      default:
        return historicalBets;
    }
  };

  const filteredBets = getFilteredBets();
  const historicalBets = getHistoricalBets();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">Mi Historial de Apuestas</h1>
        <p className="text-xl text-muted-foreground">Revisa tu rendimiento y estadísticas de apuestas</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:bg-primary/10 hover:border-primary/30 ${
            activeFilter === 'all' ? 'bg-primary/10 border-primary/30' : ''
          }`}
          onClick={() => setActiveFilter('all')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Apostado</p>
                <p className="text-2xl font-bold">{Math.ceil(totalBetAmount)}</p>
              </div>
              <TrendingDown className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-200 hover:bg-primary/10 hover:border-primary/30 ${
            activeFilter === 'won' ? 'bg-primary/10 border-primary/30' : ''
          }`}
          onClick={() => setActiveFilter('won')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Ganado</p>
                <p className="text-2xl font-bold text-green-600">{Math.ceil(totalPayout)}</p>
              </div>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-200 hover:bg-primary/10 hover:border-primary/30 ${
            activeFilter === 'pending' ? 'bg-primary/10 border-primary/30' : ''
          }`}
          onClick={() => setActiveFilter('pending')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Apuestas Pendientes</p>
                <p className="text-2xl font-bold text-primary">{pendingBets}</p>
              </div>
              <Calendar className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-all duration-200 hover:bg-primary/10 hover:border-primary/30"
          onClick={() => setShowStatistics(true)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Estadísticas Personales</p>
                <p className="text-2xl font-bold text-primary">{successPercentage}%</p>
                <p className="text-xs text-muted-foreground">% de aciertos de apuestas</p>
              </div>
              <Trophy className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desktop Bets Table */}
      <Card className="shadow-lg hidden sm:block">
        <CardHeader>
          <CardTitle>Mis Apuestas</CardTitle>
          <CardDescription>Historial completo de todas tus apuestas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partido</TableHead>
                <TableHead>Apuesta</TableHead>
                <TableHead>Importe</TableHead>
                <TableHead>Ganancia</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBets.length > 0 ? (
                filteredBets.map((bet) => {
                  if (bet.bet_type === 'combo' && bet.bet_selections?.length) {
                    return [
                      <TableRow key={bet.id} className="bg-muted/30">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">COMBO</Badge>
                            <span className="text-sm">Apuesta Combinada</span>
                          </div>
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell>
                          {(bet.stake || 0).toFixed(0)} pts @{calculateComboOdds(bet.bet_selections).toFixed(2)}
                        </TableCell>
                        <TableCell>{bet.status === 'cancelled' ? '-' : `${(bet.payout || 0).toFixed(0)} pts`}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(bet.status)} className={getStatusClassName(bet.status)}>{getStatusText(bet.status)}</Badge>
                        </TableCell>
                        <TableCell>
                          {canCancelBet(bet) && (
                            <div className="flex flex-col items-end gap-1">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleCancelClick(bet.id)}
                                disabled={cancelingId === bet.id}
                              >
                                {cancelingId === bet.id ? 'Cancelando...' : 'Cancelar Apuesta'}
                              </Button>
                              <span className={`text-xs font-mono ${
                                timeLeft[bet.id]?.includes('s') && !timeLeft[bet.id]?.includes('m') 
                                  ? 'text-red-500 font-bold animate-pulse' 
                                  : 'text-muted-foreground'
                              }`}>
                                {timeLeft[bet.id] || 'Calculando...'}
                              </span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>,
                      ...bet.bet_selections.map((selection: any, index: number) => (
                         <TableRow key={`${bet.id}-${selection.id || index}`} className="bg-muted/10 border-l-2 border-muted">
                           <TableCell className="font-medium pl-8">
                             {getMatchResultDisplay(selection.match_description, selection.fixture_id)}
                           </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">
                                {formatBetDisplay(
                                  getBettingTranslation(selection.market),
                                  getBettingTranslation(selection.selection),
                                  parseFloat(selection.odds || 0)
                                )}
                              </span>
                              <Badge variant={getStatusVariant(selection.status)} className={`text-xs ${getStatusClassName(selection.status)}`}>
                                {getStatusText(selection.status)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell></TableCell>
                          <TableCell></TableCell>
                          <TableCell></TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      )),
                    ];
                  } else {
                    return (
                       <TableRow key={bet.id}>
                         <TableCell className="font-medium">
                           {getMatchResultDisplay(bet.match_description, bet.fixture_id)}
                         </TableCell>
                        <TableCell>
                          {bet.bet_type === 'single' ? (
                            <>
                              {bet.market_bets ? getBettingTranslation(bet.market_bets) + ': ' : ''}
                              {(() => {
                                const parts = bet.bet_selection?.split(' @ ') || [];
                                const selection = getBettingTranslation(parts[0] || '');
                                const odds = parts[1] ? parseFloat(parts[1]).toFixed(2) : (bet.odds || 0).toFixed(2);
                                return `${selection} @ ${odds}`;
                              })()}
                            </>
                          ) : (
                            bet.bet_selection
                          )}
                        </TableCell>
                        <TableCell>{(bet.stake || 0).toFixed(0)} pts</TableCell>
                        <TableCell>{bet.status === 'cancelled' ? '-' : `${(bet.payout || 0).toFixed(0)} pts`}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(bet.status)} className={getStatusClassName(bet.status)}>{getStatusText(bet.status)}</Badge>
                        </TableCell>
                        <TableCell>
                          {canCancelBet(bet) && (
                            <div className="flex flex-col items-end gap-1">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleCancelClick(bet.id)}
                                disabled={cancelingId === bet.id}
                              >
                                {cancelingId === bet.id ? 'Cancelando...' : 'Cancelar Apuesta'}
                              </Button>
                              <span className={`text-xs font-mono ${
                                timeLeft[bet.id]?.includes('s') && !timeLeft[bet.id]?.includes('m') 
                                  ? 'text-red-500 font-bold animate-pulse' 
                                  : 'text-muted-foreground'
                              }`}>
                                {timeLeft[bet.id] || 'Calculando...'}
                              </span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  }
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {activeFilter === 'won' 
                      ? 'No tienes apuestas ganadas todavía.'
                      : activeFilter === 'pending'
                      ? 'No tienes apuestas pendientes.'
                      : 'No tienes apuestas todavía. ¡Ve a la sección de apuestas para empezar!'
                    }
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile Bets View - Sin marco */}
      <div className="block sm:hidden">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Mis Apuestas</h2>
          <p className="text-muted-foreground">Historial completo de todas tus apuestas</p>
        </div>
        <div className="space-y-4">
            {filteredBets.length > 0 ? (
              filteredBets.map((bet) => (
                <Card key={bet.id} className="p-4">
                  <div className="space-y-3">
                    {/* Header: Tipo + Semana + Botón Cancelar */}
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
                      {canCancelBet(bet) && (
                        <div className="flex flex-col items-end gap-1">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelClick(bet.id)}
                            disabled={cancelingId === bet.id}
                          >
                            {cancelingId === bet.id ? 'Cancelando...' : 'Cancelar'}
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            {timeLeft[bet.id] || 'Calculando...'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Información financiera */}
                    <div className="flex justify-between text-sm">
                      <span>
                        Apostado: <span className="font-medium">
                          {(bet.stake || 0).toFixed(0)} pts
                          {bet.bet_type === 'combo' && bet.bet_selections?.length && (
                            <span className="text-muted-foreground"> @{calculateComboOdds(bet.bet_selections).toFixed(2)}</span>
                          )}
                        </span>
                      </span>
                      <span>Ganancia: <span className="font-medium">{bet.status === 'cancelled' ? '-' : `${(bet.payout || 0).toFixed(0)} pts`}</span></span>
                    </div>

                    {/* Detalles de la apuesta */}
                    <div className="space-y-3">
                      {bet.bet_type === 'combo' && bet.bet_selections?.length ? (
                        bet.bet_selections.map((selection: any, index: number) => (
                          <div key={selection.id || `selection-${index}`} className="space-y-1">
                            {/* Partido con resultado en la misma línea */}
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium">
                                {getMatchName(selection.match_description)}
                              </div>
                              {matchResults[selection.fixture_id]?.match_result && (
                                <div className="text-xs text-muted-foreground">
                                  ({matchResults[selection.fixture_id].match_result})
                                </div>
                              )}
                            </div>
                            {/* Apuesta justo debajo */}
                            <div className="flex items-center gap-2 text-sm font-medium text-foreground border-l-2 border-muted pl-2">
                              {getStatusIcon(selection.status)}
                              <span>{getBettingTranslation(selection.market)}: {getBettingTranslation(selection.selection)} @ {selection.odds}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="space-y-1">
                          {/* Partido con resultado en la misma línea */}
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">
                              {getMatchName(bet.match_description)}
                            </div>
                            {matchResults[bet.fixture_id]?.match_result && (
                              <div className="text-xs text-muted-foreground">
                                ({matchResults[bet.fixture_id].match_result})
                              </div>
                            )}
                          </div>
                          {/* Apuesta justo debajo */}
                          <div className="text-sm font-medium text-foreground border-l-2 border-muted pl-2">
                            {(() => {
                              const parts = bet.bet_selection?.split(' @ ') || [];
                              const selection = getBettingTranslation(parts[0] || '');
                              const odds = parts[1] || bet.odds;
                              return `${getBettingTranslation(bet.market_bets)}: ${selection} @ ${odds}`;
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                {activeFilter === 'won' 
                  ? 'No tienes apuestas ganadas todavía.'
                  : activeFilter === 'pending'
                  ? 'No tienes apuestas pendientes.'
                  : 'No tienes apuestas todavía. ¡Ve a la sección de apuestas para empezar!'
                }
              </div>
            )}
        </div>
      </div>
      {/* Historical Bets Section (Week 0) */}
      {historicalBets.length > 0 && (
        <div className="space-y-4">
          {/* Separator line */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 border-t border-border"></div>
            <div className="px-4 py-2 bg-muted rounded-lg">
              <span className="text-sm font-medium text-muted-foreground">Apuestas Históricas</span>
            </div>
            <div className="flex-1 border-t border-border"></div>
          </div>

          {/* Desktop Historical Bets Table */}
          <Card className="shadow-lg hidden sm:block">
            <CardHeader>
              <CardTitle>Apuestas Históricas (Temporadas Anteriores)</CardTitle>
              <CardDescription>Historial de apuestas de temporadas pasadas</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partido</TableHead>
                    <TableHead>Apuesta</TableHead>
                    <TableHead>Importe</TableHead>
                    <TableHead>Ganancia</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historicalBets.map((bet) => {
                    if (bet.bet_type === 'combo' && bet.bet_selections?.length) {
                      return [
                        <TableRow key={bet.id} className="bg-muted/30">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">COMBO</Badge>
                              <span className="text-sm">Apuesta Combinada</span>
                            </div>
                          </TableCell>
                          <TableCell></TableCell>
                          <TableCell>
                            {(bet.stake || 0).toFixed(0)} pts @{calculateComboOdds(bet.bet_selections).toFixed(2)}
                          </TableCell>
                          <TableCell>{bet.status === 'cancelled' ? '-' : `${(bet.payout || 0).toFixed(0)} pts`}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(bet.status)} className={getStatusClassName(bet.status)}>{getStatusText(bet.status)}</Badge>
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>,
                        ...bet.bet_selections.map((selection: any, index: number) => (
                           <TableRow key={`${bet.id}-${selection.id || index}`} className="bg-muted/10 border-l-2 border-muted">
                             <TableCell className="font-medium pl-8">
                               {getMatchResultDisplay(selection.match_description, selection.fixture_id)}
                             </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-sm">
                                  {formatBetDisplay(
                                    getBettingTranslation(selection.market),
                                    getBettingTranslation(selection.selection),
                                    parseFloat(selection.odds || 0)
                                  )}
                                </span>
                                <Badge variant={getStatusVariant(selection.status)} className={`text-xs ${getStatusClassName(selection.status)}`}>
                                  {getStatusText(selection.status)}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        )),
                      ];
                    } else {
                      return (
                         <TableRow key={bet.id}>
                           <TableCell className="font-medium">
                             {getMatchResultDisplay(bet.match_description, bet.fixture_id)}
                           </TableCell>
                          <TableCell>
                            {bet.bet_type === 'single' ? (
                              <>
                                {bet.market_bets ? getBettingTranslation(bet.market_bets) + ': ' : ''}
                                {(() => {
                                  const parts = bet.bet_selection?.split(' @ ') || [];
                                  const selection = getBettingTranslation(parts[0] || '');
                                  const odds = parts[1] ? parseFloat(parts[1]).toFixed(2) : (bet.odds || 0).toFixed(2);
                                  return `${selection} @ ${odds}`;
                                })()}
                              </>
                            ) : (
                              bet.bet_selection
                            )}
                          </TableCell>
                          <TableCell>{(bet.stake || 0).toFixed(0)} pts</TableCell>
                          <TableCell>{bet.status === 'cancelled' ? '-' : `${(bet.payout || 0).toFixed(0)} pts`}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(bet.status)} className={getStatusClassName(bet.status)}>{getStatusText(bet.status)}</Badge>
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      );
                    }
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Mobile Historical Bets View */}
          <div className="block sm:hidden space-y-4">
            {historicalBets.map((bet) => (
              <Card key={bet.id} className="p-4 opacity-75">
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
                        Histórica
                      </span>
                    </div>
                  </div>

                  {/* Información financiera */}
                  <div className="flex justify-between text-sm">
                    <span>
                      Apostado: <span className="font-medium">
                        {(bet.stake || 0).toFixed(0)} pts
                        {bet.bet_type === 'combo' && bet.bet_selections?.length && (
                          <span className="text-muted-foreground"> @{calculateComboOdds(bet.bet_selections).toFixed(2)}</span>
                        )}
                      </span>
                    </span>
                    <span>Ganancia: <span className="font-medium">{bet.status === 'cancelled' ? '-' : `${(bet.payout || 0).toFixed(0)} pts`}</span></span>
                  </div>

                  {/* Detalles de la apuesta */}
                  <div className="space-y-3">
                    {bet.bet_type === 'combo' && bet.bet_selections?.length ? (
                      bet.bet_selections.map((selection: any, index: number) => (
                        <div key={selection.id || `selection-${index}`} className="space-y-1">
                          {/* Partido con resultado en la misma línea */}
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">
                              {getMatchName(selection.match_description)}
                            </div>
                            {matchResults[selection.fixture_id]?.match_result && (
                              <div className="text-xs text-muted-foreground">
                                ({matchResults[selection.fixture_id].match_result})
                              </div>
                            )}
                          </div>
                          {/* Apuesta justo debajo */}
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground border-l-2 border-muted pl-2">
                            {getStatusIcon(selection.status)}
                            <span>{getBettingTranslation(selection.market)}: {getBettingTranslation(selection.selection)} @ {selection.odds}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="space-y-1">
                        {/* Partido con resultado en la misma línea */}
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">
                            {getMatchName(bet.match_description)}
                          </div>
                          {matchResults[bet.fixture_id]?.match_result && (
                            <div className="text-xs text-muted-foreground">
                              ({matchResults[bet.fixture_id].match_result})
                            </div>
                          )}
                        </div>
                        {/* Apuesta justo debajo */}
                        <div className="text-sm font-medium text-foreground border-l-2 border-muted pl-2">
                          {(() => {
                            const parts = bet.bet_selection?.split(' @ ') || [];
                            const selection = getBettingTranslation(parts[0] || '');
                            const odds = parts[1] || bet.odds;
                            return `${getBettingTranslation(bet.market_bets)}: ${selection} @ ${odds}`;
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Estadísticas */}
      <UserStatistics 
        isOpen={showStatistics} 
        onClose={() => setShowStatistics(false)} 
      />

      {/* Dialog de Confirmación de Cancelación */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={handleCancelDialogClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar cancelación?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres cancelar esta apuesta? Esta acción no se puede deshacer y se reembolsará tu importe al presupuesto semanal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDialogClose}>
              No, mantener apuesta
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelConfirm}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Sí, cancelar apuesta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};