import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, TrendingDown, TrendingUp, Trophy } from 'lucide-react';

const mockBetHistory = [
  {
    id: 1,
    homeTeam: 'Valencia',
    awayTeam: 'Sevilla',
    date: '2024-01-10',
    betOutcome: 'home',
    actualOutcome: 'home',
    betAmount: 100,
    odds: 2.5,
    payout: 250,
    status: 'won',
    league: 'La Liga'
  },
  {
    id: 2,
    homeTeam: 'Milan',
    awayTeam: 'Inter',
    date: '2024-01-08',
    betOutcome: 'away',
    actualOutcome: 'home',
    betAmount: 150,
    odds: 2.1,
    payout: 0,
    status: 'lost',
    league: 'Serie A'
  },
  {
    id: 3,
    homeTeam: 'Manchester City',
    awayTeam: 'Chelsea',
    date: '2024-01-06',
    betOutcome: 'draw',
    actualOutcome: 'draw',
    betAmount: 75,
    odds: 3.2,
    payout: 240,
    status: 'won',
    league: 'Premier League'
  },
  {
    id: 4,
    homeTeam: 'Atletico Madrid',
    awayTeam: 'Real Sociedad',
    date: '2024-01-04',
    betOutcome: 'home',
    actualOutcome: 'away',
    betAmount: 200,
    odds: 1.8,
    payout: 0,
    status: 'lost',
    league: 'La Liga'
  }
];

export const BetHistory = () => {
  const wonBets = mockBetHistory.filter(bet => bet.status === 'won');
  const lostBets = mockBetHistory.filter(bet => bet.status === 'lost');
  
  const totalBetAmount = mockBetHistory.reduce((sum, bet) => sum + bet.betAmount, 0);
  const totalPayout = mockBetHistory.reduce((sum, bet) => sum + bet.payout, 0);
  const netProfit = totalPayout - totalBetAmount;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getOutcomeText = (outcome: string, homeTeam: string, awayTeam: string) => {
    switch (outcome) {
      case 'home': return homeTeam;
      case 'away': return awayTeam;
      case 'draw': return 'Empate';
      default: return outcome;
    }
  };

  const BetCard = ({ bet }: { bet: any }) => (
    <Card className="shadow-md hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              {bet.homeTeam} vs {bet.awayTeam}
            </CardTitle>
            <CardDescription className="flex items-center gap-4 mt-1">
              <span className="flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                {bet.league}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(bet.date)}
              </span>
            </CardDescription>
          </div>
          <Badge variant={bet.status === 'won' ? 'default' : 'destructive'}>
            {bet.status === 'won' ? 'Ganada' : 'Perdida'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Tu apuesta:</p>
            <p className="font-semibold">
              {getOutcomeText(bet.betOutcome, bet.homeTeam, bet.awayTeam)} ({bet.odds})
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Resultado real:</p>
            <p className="font-semibold">
              {getOutcomeText(bet.actualOutcome, bet.homeTeam, bet.awayTeam)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Cantidad apostada:</p>
            <p className="font-semibold">{bet.betAmount} puntos</p>
          </div>
          <div>
            <p className="text-muted-foreground">
              {bet.status === 'won' ? 'Ganancia:' : 'Pérdida:'}
            </p>
            <p className={`font-bold ${bet.status === 'won' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {bet.status === 'won' ? `+${bet.payout}` : `-${bet.betAmount}`} puntos
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Historial de Apuestas
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
                  {Math.round((wonBets.length / mockBetHistory.length) * 100)}%
                </p>
              </div>
              <Trophy className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for filtering */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Todas las Apuestas ({mockBetHistory.length})</TabsTrigger>
          <TabsTrigger value="won">Ganadas ({wonBets.length})</TabsTrigger>
          <TabsTrigger value="lost">Perdidas ({lostBets.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {mockBetHistory.map((bet) => (
            <BetCard key={bet.id} bet={bet} />
          ))}
        </TabsContent>
        
        <TabsContent value="won" className="space-y-4">
          {wonBets.map((bet) => (
            <BetCard key={bet.id} bet={bet} />
          ))}
        </TabsContent>
        
        <TabsContent value="lost" className="space-y-4">
          {lostBets.map((bet) => (
            <BetCard key={bet.id} bet={bet} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};