import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, TrendingDown, TrendingUp, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getBettingTranslation } from '@/utils/bettingTranslations';

export const BetHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bets, setBets] = useState<any[]>([]);
  const [now, setNow] = useState<Date>(new Date());
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [matchResults, setMatchResults] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchBets = async () => {
      if (!user) return;

      const { data: betsData, error: betsError } = await supabase
        .from('bets')
        .select('*, bet_selections(*)')
        .eq('user_id', user.id)
        .order('id', { ascending: false });

      if (betsError) {
        console.error('Error fetching bets:', betsError);
        return;
      }

      if (betsData) {
        setBets(betsData);

        // Get all unique fixture_ids from bets and bet_selections
        const fixtureIds = new Set<number>();
        betsData.forEach((bet) => {
          if (bet.fixture_id) {
            fixtureIds.add(bet.fixture_id);
          }
          if (bet.bet_selections) {
            bet.bet_selections.forEach((selection: any) => {
              if (selection.fixture_id) {
                fixtureIds.add(selection.fixture_id);
              }
            });
          }
        });

        // Fetch match results for these fixture_ids
        if (fixtureIds.size > 0) {
          try {
            const { data: resultsData } = await (supabase as any)
              .from('match_results')
              .select('fixture_id, match_result')
              .in('fixture_id', Array.from(fixtureIds));
            
            if (resultsData) {
              const resultsMap: Record<number, string> = {};
              resultsData.forEach((result: any) => {
                resultsMap[result.fixture_id] = result.match_result;
              });
              setMatchResults(resultsMap);
            }
          } catch (error) {
            console.error('Error fetching match results:', error);
          }
        }
      }
    };

    fetchBets();
  }, [user]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const handleCancel = async (betId: number) => {
    try {
      setCancelingId(betId);
      const { data, error } = await supabase.rpc('cancel_bet', { bet_id_param: betId });
      setCancelingId(null);

      if (error) {
        console.error('Error canceling bet:', error);
        toast({ title: 'No se pudo cancelar', description: error.message });
        return;
      }

      if (data && typeof data === 'object' && 'success' in data) {
        const result = data as { success: boolean; message?: string; error?: string };
        if (result.success) {
          setBets((prev) => prev.filter((b) => b.id !== betId));
          toast({
            title: 'Apuesta cancelada',
            description: result.message || 'Se ha reembolsado tu importe al presupuesto semanal.',
          });
        } else {
          toast({ title: 'No se pudo cancelar', description: result.error || 'Error desconocido' });
        }
      }
    } catch (e: any) {
      setCancelingId(null);
      console.error('Unexpected error canceling bet:', e);
      toast({ title: 'Error', description: 'Ha ocurrido un error al cancelar la apuesta.' });
    }
  };

  const wonBets = bets.filter((bet) => bet.status === 'won');
  const lostBets = bets.filter((bet) => bet.status === 'lost');
  const pendingBets = bets.filter((bet) => bet.status === 'pending').length;

  const totalBetAmount = bets.reduce((sum, bet) => sum + (parseFloat(bet.stake) || 0), 0);
  const totalPayout = bets.reduce(
    (sum, bet) => sum + (bet.status === 'won' ? (parseFloat(bet.payout) || 0) : 0),
    0
  );

  const wonBetsStake = wonBets.reduce((sum, bet) => sum + (parseFloat(bet.stake) || 0), 0);
  const lostBetsStake = lostBets.reduce((sum, bet) => sum + (parseFloat(bet.stake) || 0), 0);
  const totalSettledStake = wonBetsStake + lostBetsStake;
  const successPercentage =
    totalSettledStake > 0 ? Math.round((wonBetsStake / totalSettledStake) * 100) : 0;

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'won':
        return 'Ganada';
      case 'lost':
        return 'Perdida';
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
      default:
        return 'secondary';
    }
  };

  const formatBetDisplay = (market: string, selection: string, odds: number): string => {
    return `${market}: ${selection} @ ${odds.toFixed(2)}`;
  };

  // ✅ versión buena: partido arriba, resultado debajo
  const getMatchResultDisplay = (matchDescription: string | null, fixtureId: number | null) => {
    const matchName = matchDescription || 'Partido';
    const result = fixtureId ? matchResults[fixtureId] : null;
    return (
      <div>
        <div>{matchName}</div>
        {result && (
          <div className="text-xs text-muted-foreground">{result}</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">Mi Historial de Apuestas</h1>
        <p className="text-xl text-muted-foreground">Revisa tu rendimiento y estadísticas de apuestas</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
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

        <Card>
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

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Porcentaje de Acierto</p>
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
                <p className="text-sm text-muted-foreground">Apuestas Pendientes</p>
                <p className="text-2xl font-bold text-primary">{pendingBets}</p>
              </div>
              <Calendar className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bets Table */}
      <Card className="shadow-lg">
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
              {bets.length > 0 ? (
                bets.map((bet) => {
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
                        <TableCell>{parseFloat(bet.stake || 0).toFixed(0)} pts</TableCell>
                        <TableCell>{parseFloat(bet.payout || 0).toFixed(0)} pts</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(bet.status)}>{getStatusText(bet.status)}</Badge>
                        </TableCell>
                        <TableCell>
                          {bet.bet_type === 'combo' && bet.bet_selections?.length
                            ? bet.bet_selections.every((sel: any) => sel.status === 'pending') && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleCancel(bet.id)}
                                  disabled={cancelingId === bet.id}
                                >
                                  {cancelingId === bet.id ? 'Cancelando...' : 'Cancelar Apuesta'}
                                </Button>
                              )
                            : bet.status === 'pending' && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleCancel(bet.id)}
                                  disabled={cancelingId === bet.id}
                                >
                                  {cancelingId === bet.id ? 'Cancelando...' : 'Cancelar Apuesta'}
                                </Button>
                              )}
                        </TableCell>
                      </TableRow>,
                      ...bet.bet_selections.map((selection: any) => (
                         <TableRow key={`${bet.id}-${selection.id}`} className="bg-muted/10 border-l-2 border-muted">
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
                              <Badge variant={getStatusVariant(selection.status)} className="text-xs">
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
                                const odds = parts[1] ? parseFloat(parts[1]).toFixed(2) : parseFloat(bet.odds || 0).toFixed(2);
                                return `${selection} @ ${odds}`;
                              })()}
                            </>
                          ) : (
                            bet.bet_selection
                          )}
                        </TableCell>
                        <TableCell>{parseFloat(bet.stake || 0).toFixed(0)} pts</TableCell>
                        <TableCell>{parseFloat(bet.payout || 0).toFixed(0)} pts</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(bet.status)}>{getStatusText(bet.status)}</Badge>
                        </TableCell>
                        <TableCell>
                          {bet.status === 'pending' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleCancel(bet.id)}
                              disabled={cancelingId === bet.id}
                            >
                              {cancelingId === bet.id ? 'Cancelando...' : 'Cancelar Apuesta'}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  }
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No tienes apuestas todavía. ¡Ve a la sección de apuestas para empezar!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};