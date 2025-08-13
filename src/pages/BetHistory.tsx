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
    // Fetch odds cache once to map fixture_id -> kickoff date
    const loadKickoffMap = async () => {
      const { data, error } = await supabase
        .from('match_odds_cache')
        .select('data')
        .maybeSingle();

      if (!error && data && (data as any).data !== undefined) {
        try {
          const payload: any = (data as any).data;
          let items: any[] = [];
          if (Array.isArray(payload)) {
            items = payload;
          } else if (payload && typeof payload === 'object') {
            // Gracefully handle object-shaped caches by scanning values
            for (const val of Object.values(payload)) {
              if (Array.isArray(val)) items.push(...val);
              else if (val && typeof val === 'object') items.push(val as any);
            }
          }

          const map: Record<number, string> = {};
          for (const item of items) {
            const id = item?.fixture?.id;
            const date = item?.fixture?.date;
            if (typeof id === 'number' && typeof date === 'string') {
              map[id] = date;
            }
          }
          setKickoffMap(map);
        } catch (e) {
          console.error('Error parsing odds cache:', e);
        }
      } else if (error) {
        console.error('Error loading odds cache:', error);
      }
    };
    loadKickoffMap();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const isWithinCutoff = (bet: any) => {
    const dateStr = kickoffMap[bet.fixture_id as number];
    if (!dateStr) return false;
    const kickoff = new Date(dateStr);
    const cutoff = new Date(kickoff.getTime() - 15 * 60 * 1000);
    return now > cutoff;
  };

  const handleCancel = async (betId: number) => {
    try {
      setCancelingId(betId);
      const { data, error } = await supabase.rpc('cancel_bet', { bet_id_to_cancel: betId });
      setCancelingId(null);
      if (error) {
        console.error('Error canceling bet:', error);
        toast({ title: 'No se pudo cancelar', description: error.message });
        return;
      }
      // Success
      setBets((prev) => prev.filter((b) => b.id !== betId));
      toast({ title: 'Apuesta cancelada', description: 'Se ha reembolsado tu importe al presupuesto semanal.' });
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
                if (bet.bet_type === 'combo') {
                  // Render combo bet with multiple rows for each selection
                  return bet.bet_selections?.map((selection: any, index: number) => (
                    <TableRow key={`${bet.id}-${selection.id}`}>
                      <TableCell className="font-medium">
                        {index === 0 && (
                          <div className="mb-1">
                            <Badge variant="outline" className="text-xs">COMBO</Badge>
                          </div>
                        )}
                        <div className="text-sm">Fixture ID: {selection.fixture_id}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div><strong>{selection.market}</strong></div>
                          <div>{selection.selection}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {index === 0 ? `${parseFloat(bet.stake || 0).toFixed(0)} pts` : ''}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Leg: {parseFloat(selection.odds || 0).toFixed(2)}</div>
                          {index === 0 && bet.odds && (
                            <div className="text-xs text-muted-foreground">
                              Total: {parseFloat(bet.odds).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant={getStatusVariant(selection.status)} className="text-xs">
                            {getStatusText(selection.status)}
                          </Badge>
                          {index === 0 && (
                            <div>
                              <Badge variant={getStatusVariant(bet.status)}>
                                {getStatusText(bet.status)}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {index === 0 && bet.status === 'pending' ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancel(bet.id)}
                            disabled={cancelingId === bet.id}
                          >
                            {cancelingId === bet.id ? 'Cancelando...' : 'Cancelar Apuesta'}
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  )) || [];
                } else {
                  // Render single bet (existing logic)
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
              }).flat() : (
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