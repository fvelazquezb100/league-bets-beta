import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Calendar, Clock, DollarSign, Trophy, CircleDot } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const Bets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [oddsData, setOddsData] = useState<any>(null);
  const [betSlip, setBetSlip] = useState<any[]>([]);
  const [stakeAmount, setStakeAmount] = useState('');

  useEffect(() => {
    const fetchOdds = async () => {
      try {
        const { data, error } = await supabase
          .from('match_odds_cache')
          .select('data')
          .eq('id', 1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching odds:', error);
          return;
        }

        if (data && data.data) {
          setOddsData(data.data);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchOdds();
  }, []);

  const addToBetSlip = (fixture: any, market: string, selection: string, odds: number) => {
    const newBet = {
      id: `${fixture.fixture.id}-${market}-${selection}`,
      fixture,
      market,
      selection,
      odds,
      matchDescription: `${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
    };

    setBetSlip(prev => {
      const exists = prev.find(bet => bet.id === newBet.id);
      if (exists) {
        toast({
          title: "Ya añadido",
          description: "Esta selección ya está en tu boleto",
        });
        return prev;
      }
      
      toast({
        title: "Añadido al boleto",
        description: `${newBet.matchDescription} - ${selection}`,
      });
      
      return [...prev, newBet];
    });
  };

  const removeFromBetSlip = (betId: string) => {
    setBetSlip(prev => prev.filter(bet => bet.id !== betId));
  };

  const placeBets = async () => {
    if (!user || betSlip.length === 0 || !stakeAmount) {
      toast({
        title: "Error",
        description: "Debes añadir selecciones y un importe válido",
        variant: "destructive",
      });
      return;
    }

    try {
      const betsToInsert = betSlip.map(bet => ({
        user_id: user.id,
        match_description: bet.matchDescription,
        bet_selection: bet.selection,
        stake: parseFloat(stakeAmount),
        odds: bet.odds,
        status: 'pending'
      }));

      const { error } = await supabase
        .from('bets')
        .insert(betsToInsert);

      if (error) throw error;

      toast({
        title: "¡Apuestas realizadas!",
        description: `${betSlip.length} apuesta(s) guardada(s) correctamente`,
      });

      setBetSlip([]);
      setStakeAmount('');
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron realizar las apuestas",
        variant: "destructive",
      });
    }
  };

  const totalStake = betSlip.length > 0 && stakeAmount ? parseFloat(stakeAmount) * betSlip.length : 0;
  const potentialWinnings = betSlip.reduce((total, bet) => {
    return total + (parseFloat(stakeAmount || '0') * bet.odds);
  }, 0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMarketName = (market: string) => {
    switch (market) {
      case 'Match Winner': return 'Ganador del Partido';
      case 'Both Teams Score': return 'Ambos Equipos Marcan';
      case 'Goals Over/Under': return 'Goles Más/Menos de';
      default: return market;
    }
  };

  if (!oddsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando cuotas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main betting area */}
      <div className="lg:col-span-3 space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            UK Championship - Cuotas en Vivo
          </h1>
          <p className="text-xl text-muted-foreground">
            Haz clic en una cuota para añadirla a tu boleto
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {oddsData?.response?.map((fixture: any, index: number) => (
            <AccordionItem key={fixture.fixture.id} value={`fixture-${index}`}>
              <Card>
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                      <CircleDot className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <h3 className="font-semibold text-lg">
                          {fixture.teams.home.name} vs {fixture.teams.away.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(fixture.fixture.date)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">En vivo</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-6 pb-6 space-y-6">
                    {/* Match Winner */}
                    <div>
                      <h4 className="font-medium mb-3">Ganador del Partido</h4>
                      <div className="grid grid-cols-3 gap-3">
                        {fixture.bookmakers?.[0]?.bets?.find((bet: any) => bet.name === 'Match Winner')?.values?.map((value: any) => (
                          <Button
                            key={value.value}
                            variant="outline"
                            className="p-4 h-auto flex flex-col hover:bg-primary hover:text-primary-foreground"
                            onClick={() => addToBetSlip(fixture, 'Match Winner', value.value, parseFloat(value.odd))}
                          >
                            <span className="text-sm font-medium">
                              {value.value === 'Home' ? fixture.teams.home.name : 
                               value.value === 'Away' ? fixture.teams.away.name : 'Empate'}
                            </span>
                            <span className="text-lg font-bold">{value.odd}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Both Teams Score */}
                    {fixture.bookmakers?.[0]?.bets?.find((bet: any) => bet.name === 'Both Teams Score') && (
                      <div>
                        <h4 className="font-medium mb-3">Ambos Equipos Marcan</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {fixture.bookmakers[0].bets.find((bet: any) => bet.name === 'Both Teams Score').values.map((value: any) => (
                            <Button
                              key={value.value}
                              variant="outline"
                              className="p-4 h-auto flex flex-col hover:bg-primary hover:text-primary-foreground"
                              onClick={() => addToBetSlip(fixture, 'Both Teams Score', value.value === 'Yes' ? 'Sí' : 'No', parseFloat(value.odd))}
                            >
                              <span className="text-sm font-medium">{value.value === 'Yes' ? 'Sí' : 'No'}</span>
                              <span className="text-lg font-bold">{value.odd}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </Card>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Bet Slip */}
      <div className="lg:col-span-1">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Boleto de Apuestas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {betSlip.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Haz clic en una cuota para añadirla a tu boleto.
              </p>
            ) : (
              <>
                <div className="space-y-3">
                  {betSlip.map((bet) => (
                    <div key={bet.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 pr-2">
                          <p className="font-medium text-sm">{bet.matchDescription}</p>
                          <p className="text-sm text-muted-foreground">{bet.selection}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{bet.odds}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => removeFromBetSlip(bet.id)}
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="stake">Importe (por apuesta)</Label>
                    <Input
                      id="stake"
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder="100"
                      min="1"
                      max="1000"
                    />
                  </div>

                  {stakeAmount && betSlip.length > 0 && (
                    <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total a apostar:</span>
                        <span className="font-medium">{totalStake.toFixed(0)} pts</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Ganancia Potencial:</span>
                        <span className="font-bold text-green-600">{potentialWinnings.toFixed(0)} pts</span>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={placeBets}
                    disabled={betSlip.length === 0 || !stakeAmount}
                    className="w-full"
                  >
                    Realizar Apuestas
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};