import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, TrendingDown, TrendingUp, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

export const BetHistory = () => {
  const { user } = useAuth();
  const [bets, setBets] = useState<any[]>([]);

  useEffect(() => {
    const fetchBets = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('bets')
        .select('*')
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

  const wonBets = bets.filter(bet => bet.status === 'won');
  const lostBets = bets.filter(bet => bet.status === 'lost');
  const pendingBets = bets.filter(bet => bet.status === 'pending');
  
  const totalBetAmount = bets.reduce((sum, bet) => sum + (parseFloat(bet.stake) || 0), 0);
  const totalPayout = bets.reduce((sum, bet) => sum + (parseFloat(bet.payout) || 0), 0);
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
                <p className="text-sm text-muted-foreground">Tasa de Acierto</p>
                <p className="text-2xl font-bold text-primary">
                  {bets.length > 0 ? Math.round((wonBets.length / bets.length) * 100) : 0}%
                </p>
              </div>
              <Trophy className="h-5 w-5 text-primary" />
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {bets.length > 0 ? bets.map((bet) => (
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
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
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