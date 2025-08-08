import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Clock, DollarSign, Trophy } from 'lucide-react';

const mockMatches = [
  {
    id: 1,
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    date: '2024-01-15',
    time: '21:00',
    league: 'La Liga',
    odds: { home: 2.1, draw: 3.4, away: 2.8 },
    status: 'upcoming'
  },
  {
    id: 2,
    homeTeam: 'Liverpool',
    awayTeam: 'Arsenal',
    date: '2024-01-16',
    time: '17:30',
    league: 'Premier League',
    odds: { home: 1.8, draw: 3.2, away: 4.1 },
    status: 'upcoming'
  },
  {
    id: 3,
    homeTeam: 'PSG',
    awayTeam: 'Monaco',
    date: '2024-01-16',
    time: '20:00',
    league: 'Ligue 1',
    odds: { home: 1.5, draw: 4.2, away: 5.8 },
    status: 'upcoming'
  },
  {
    id: 4,
    homeTeam: 'Bayern Munich',
    awayTeam: 'Dortmund',
    date: '2024-01-17',
    time: '18:30',
    league: 'Bundesliga',
    odds: { home: 1.9, draw: 3.6, away: 3.8 },
    status: 'upcoming'
  }
];

export const Bets = () => {
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<string>('');
  const [betAmount, setBetAmount] = useState('');

  const handlePlaceBet = () => {
    // TODO: Implement bet placement logic
    console.log('Placing bet:', { selectedMatch, selectedOutcome, betAmount });
    setSelectedMatch(null);
    setSelectedOutcome('');
    setBetAmount('');
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Partidos Disponibles
        </h1>
        <p className="text-xl text-muted-foreground">
          Elige un partido y demuestra tu conocimiento del fútbol
        </p>
      </div>

      <div className="grid gap-6">
        {mockMatches.map((match) => (
          <Card key={match.id} className="shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">
                    {match.homeTeam} vs {match.awayTeam}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <Trophy className="h-4 w-4" />
                      {match.league}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(match.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {match.time}
                    </span>
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  Próximo
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">{match.homeTeam}</p>
                  <p className="text-2xl font-bold text-primary">{match.odds.home}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Empate</p>
                  <p className="text-2xl font-bold text-primary">{match.odds.draw}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">{match.awayTeam}</p>
                  <p className="text-2xl font-bold text-primary">{match.odds.away}</p>
                </div>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full" 
                    onClick={() => setSelectedMatch(match)}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Apostar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Realizar Apuesta</DialogTitle>
                    <DialogDescription>
                      {match.homeTeam} vs {match.awayTeam} - {formatDate(match.date)} a las {match.time}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-medium">Selecciona el resultado:</Label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <Button
                          variant={selectedOutcome === 'home' ? 'default' : 'outline'}
                          onClick={() => setSelectedOutcome('home')}
                          className="p-4 h-auto flex flex-col"
                        >
                          <span className="text-sm">{match.homeTeam}</span>
                          <span className="text-lg font-bold">{match.odds.home}</span>
                        </Button>
                        <Button
                          variant={selectedOutcome === 'draw' ? 'default' : 'outline'}
                          onClick={() => setSelectedOutcome('draw')}
                          className="p-4 h-auto flex flex-col"
                        >
                          <span className="text-sm">Empate</span>
                          <span className="text-lg font-bold">{match.odds.draw}</span>
                        </Button>
                        <Button
                          variant={selectedOutcome === 'away' ? 'default' : 'outline'}
                          onClick={() => setSelectedOutcome('away')}
                          className="p-4 h-auto flex flex-col"
                        >
                          <span className="text-sm">{match.awayTeam}</span>
                          <span className="text-lg font-bold">{match.odds.away}</span>
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="betAmount">Cantidad a apostar (puntos):</Label>
                      <Input
                        id="betAmount"
                        type="number"
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        placeholder="100"
                        min="1"
                        max="1000"
                      />
                    </div>

                    {selectedOutcome && betAmount && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Ganancia potencial:</p>
                        <p className="text-xl font-bold text-primary">
                          {(parseFloat(betAmount) * 
                            (selectedOutcome === 'home' ? match.odds.home :
                             selectedOutcome === 'draw' ? match.odds.draw : match.odds.away)
                          ).toFixed(0)} puntos
                        </p>
                      </div>
                    )}

                    <Button 
                      onClick={handlePlaceBet}
                      disabled={!selectedOutcome || !betAmount}
                      className="w-full"
                    >
                      Confirmar Apuesta
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};