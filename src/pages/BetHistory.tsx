import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, TrendingDown, TrendingUp, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export const BetHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bets, setBets] = useState<any[]>([]);
  const [kickoffMap, setKickoffMap] = useState<Record<number, string>>({});
  const [teamNamesMap, setTeamNamesMap] = useState<Record<number, { home: string; away: string }>>({});
  const [now, setNow] = useState<Date>(new Date());
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  


  useEffect(() => {
    const fetchBets = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('bets')
        .select('*, bet_selections(*)')
        .eq('user_id', user.id)
        .order('id', { ascending: false });

      if (error) {
        console.error('Error fetching bets:', error);
      } else if (data) {
        setBets(data);
      }
    };

    fetchBets();
  }, [user]);

  useEffect(() => {
    // Fetch odds cache once to map fixture_id -> kickoff date and team names
    const loadOddsData = async () => {
      const { data, error } = await supabase
        .from('match_odds_cache')
        .select('data')
        .maybeSingle();

      if (!error && data && (data as any).data !== undefined) {
        try {
          const payload: any = (data as any).data;
          let items: any[] = [];
          
          // Handle different cache data structures
          if (Array.isArray(payload)) {
            items = payload;
          } else if (payload?.response && Array.isArray(payload.response)) {
            items = payload.response;
          } else if (payload && typeof payload === 'object') {
            // Gracefully handle object-shaped caches by scanning values
            for (const val of Object.values(payload)) {
              if (Array.isArray(val)) items.push(...val);
              else if (val && typeof val === 'object') items.push(val as any);
            }
          }

          const kickoffMap: Record<number, string> = {};
          const teamNamesMap: Record<number, { home: string; away: string }> = {};
          
          for (const item of items) {
            const id = item?.fixture?.id;
            const date = item?.fixture?.date;
            const homeTeam = item?.teams?.home?.name;
            const awayTeam = item?.teams?.away?.name;
            
            if (typeof id === 'number' && typeof date === 'string') {
              kickoffMap[id] = date;
            }
            
            if (typeof id === 'number' && homeTeam && awayTeam) {
              teamNamesMap[id] = { home: homeTeam, away: awayTeam };
            }
          }
          
          setKickoffMap(kickoffMap);
          setTeamNamesMap(teamNamesMap);
        } catch (e) {
          console.error('Error parsing odds cache:', e);
        }
      } else if (error) {
        console.error('Error loading odds cache:', error);
      }
    };
    loadOddsData();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const isWithinCutoff = (bet: any) => {
    if (bet.bet_type === 'combo' && bet.bet_selections?.length) {
      // For combo bets, check all selections and find the earliest kickoff time
      let earliestKickoff: Date | null = null;
      
      for (const selection of bet.bet_selections) {
        const dateStr = kickoffMap[selection.fixture_id as number];
        if (dateStr) {
          const kickoff = new Date(dateStr);
          if (!earliestKickoff || kickoff < earliestKickoff) {
            earliestKickoff = kickoff;
          }
        }
      }
      
      if (!earliestKickoff) return false;
      const cutoff = new Date(earliestKickoff.getTime() - 15 * 60 * 1000);
      return now > cutoff;
    } else {
      // For single bets, use the existing logic
      const dateStr = kickoffMap[bet.fixture_id as number];
      if (!dateStr) return false;
      const kickoff = new Date(dateStr);
      const cutoff = new Date(kickoff.getTime() - 15 * 60 * 1000);
      return now > cutoff;
    }
  };

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
      
      // Handle the new jsonb response format
      if (data && typeof data === 'object' && 'success' in data) {
        const result = data as { success: boolean; message?: string; error?: string };
        if (result.success) {
          setBets((prev) => prev.filter((b) => b.id !== betId));
          toast({ title: 'Apuesta cancelada', description: result.message || 'Se ha reembolsado tu importe al presupuesto semanal.' });
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

  const wonBets = bets.filter(bet => bet.status === 'won');
  const lostBets = bets.filter(bet => bet.status === 'lost');
  const pendingBets = bets.filter(bet => bet.status === 'pending').length;
  
  const totalBetAmount = bets.reduce((sum, bet) => sum + (parseFloat(bet.stake) || 0), 0);
  const totalPayout = bets.reduce((sum, bet) => sum + (bet.status === 'won' ? (parseFloat(bet.payout) || 0) : 0), 0);
  const netProfit = totalPayout - totalBetAmount;
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
      default: return 'secondary';
    }
  };

  // Helper function to get match name from fixture ID
  const getMatchName = (fixtureId: number): string => {
    const teams = teamNamesMap[fixtureId];
    if (teams) {
      return `${teams.home} vs ${teams.away}`;
    }
    
    // If not in current cache, try to find it in existing bets with the same fixture_id
    const matchingBet = bets.find(bet => 
      bet.fixture_id === fixtureId && 
      bet.match_description && 
      bet.bet_type === 'single'
    );
    
    if (matchingBet?.match_description) {
      return matchingBet.match_description;
    }
    
    return `Fixture ID: ${fixtureId}`;
  };

  // Helper function to format bet display
  const formatBetDisplay = (market: string, selection: string, odds: number): string => {
    return `${selection} @ ${odds.toFixed(2)}`;
  };


  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Mi Historial de Apuestas
        </h1>
        <p className="text-xl text-muted-foreground">
          Revisa tu rendimiento y estadísticas de apuestas
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Apostado</p>
                <p className="text-2xl font-bold">{totalBetAmount}</p>
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
                <p className="text-2xl font-bold text-green-600">{totalPayout}</p>
              </div>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Beneficio Neto</p>
                <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netProfit >= 0 ? '+' : ''}{netProfit}
                </p>
              </div>
              <div className={`h-5 w-5 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netProfit >= 0 ? <TrendingUp /> : <TrendingDown />}
              </div>
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
          <CardDescription>
            Historial completo de todas tus apuestas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partido</TableHead>
                <TableHead>Apuesta</TableHead>
                <TableHead>Importe</TableHead>
                <TableHead>Cuota</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bets.length > 0 ? bets.map((bet) => {
                if (bet.bet_type === 'combo' && bet.bet_selections?.length) {
                  // Calculate total combo odds
                  const totalComboOdds = bet.bet_selections.reduce((total: number, selection: any) => 
                    total * (parseFloat(selection.odds) || 1), 1);
                  
                  return [
                    // Parent row - combo summary
                    <TableRow key={bet.id} className="bg-muted/30">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">COMBO</Badge>
                          <span className="text-sm">Apuesta Combinada</span>
                        </div>
                      </TableCell>
                      <TableCell></TableCell>
                      <TableCell>{parseFloat(bet.stake || 0).toFixed(0)} pts</TableCell>
                      <TableCell>{totalComboOdds.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(bet.status)}>
                          {getStatusText(bet.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {bet.status === 'pending' ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancel(bet.id)}
                            disabled={isWithinCutoff(bet) || cancelingId === bet.id}
                          >
                            {cancelingId === bet.id ? 'Cancelando...' : 'Cancelar Apuesta'}
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>,
                    // Child rows - individual selections
                    ...bet.bet_selections.map((selection: any) => (
                      <TableRow key={`${bet.id}-${selection.id}`} className="bg-muted/10 border-l-2 border-muted">
                        <TableCell className="font-medium pl-8">
                          {getMatchName(selection.fixture_id)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {formatBetDisplay(selection.market, selection.selection, parseFloat(selection.odds || 0))}
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
                    ))
                  ];
                } else {
                  // Render single bet
                  return (
                    <TableRow key={bet.id}>
                      <TableCell className="font-medium">{bet.match_description}</TableCell>
                      <TableCell>{bet.bet_selection}</TableCell>
                      <TableCell>{parseFloat(bet.stake || 0).toFixed(0)} pts</TableCell>
                      <TableCell>{parseFloat(bet.odds || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(bet.status)}>
                          {getStatusText(bet.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {bet.status === 'pending' ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancel(bet.id)}
                            disabled={isWithinCutoff(bet) || cancelingId === bet.id}
                          >
                            {cancelingId === bet.id ? 'Cancelando...' : 'Cancelar Apuesta'}
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                }
              }) : (
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