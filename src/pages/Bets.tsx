import { useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import BetSlip from '@/components/BetSlip';
import { useToast } from '@/hooks/use-toast';

function getNextTuesdayMidnight() {
  const now = new Date();
  const day = now.getDay(); // 0 = domingo, 1 = lunes, ... 6 = sábado
  const daysUntilTuesday = (2 - day + 7) % 7 || 7;
  const nextTuesday = new Date(now);
  nextTuesday.setDate(now.getDate() + daysUntilTuesday);
  nextTuesday.setHours(0, 0, 0, 0);
  return nextTuesday;
}

export default function Bets() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('match_odds_cache')
        .select('data')
        .single();

      if (error) {
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las cuotas',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      if (data && data.data && data.data.response) {
        setMatches(data.data.response);
      }
      setLoading(false);
    };

    fetchMatches();
  }, [toast]);

  if (loading) {
    return <p>Cargando partidos...</p>;
  }

  const nextTuesday = getNextTuesdayMidnight();

  const liveOdds = matches.filter(m => new Date(m.fixture.date) < nextTuesday);
  const upcomingOdds = matches.filter(m => new Date(m.fixture.date) >= nextTuesday);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">La Liga - cuotas en vivo</h1>

      {liveOdds.length > 0 ? (
        <Accordion type="single" collapsible className="w-full">
          {liveOdds.map(match => (
            <AccordionItem key={match.fixture.id} value={match.fixture.id.toString()}>
              <AccordionTrigger>
                {match.teams.home.name} vs {match.teams.away.name} -{' '}
                {new Date(match.fixture.date).toLocaleString()}
              </AccordionTrigger>
              <AccordionContent>
                {match.bookmakers.map((bookmaker: any) => (
                  <div key={bookmaker.id} className="mb-2">
                    <h3 className="font-semibold">{bookmaker.name}</h3>
                    {bookmaker.bets.map((bet: any) => (
                      <div key={bet.id} className="mb-1">
                        <h4 className="font-medium">{bet.name}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {bet.values.map((value: any, i: number) => (
                            <Button
                              key={i}
                              variant="outline"
                              className="w-full"
                              onClick={() =>
                                BetSlip.addBet({
                                  match_description: `${match.teams.home.name} vs ${match.teams.away.name}`,
                                  bet_selection: `${value.value} @ ${value.odd}`,
                                  stake: 0,
                                  odds: parseFloat(value.odd),
                                  status: 'pending',
                                  payout: 0,
                                  fixture_id: match.fixture.id,
                                  bet_type: 'single',
                                  week: 1,
                                  market_bets: bet.name,
                                })
                              }
                            >
                              {value.value} ({value.odd})
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <p>No hay partidos en vivo hasta el martes.</p>
      )}

      <h1 className="text-2xl font-bold mt-8 mb-4">La Liga - próximos partidos</h1>

      {upcomingOdds.length > 0 ? (
        <Accordion type="single" collapsible className="w-full">
          {upcomingOdds.map(match => (
            <AccordionItem key={match.fixture.id} value={match.fixture.id.toString()}>
              <AccordionTrigger>
                {match.teams.home.name} vs {match.teams.away.name} -{' '}
                {new Date(match.fixture.date).toLocaleString()}
              </AccordionTrigger>
              <AccordionContent>
                {match.bookmakers.map((bookmaker: any) => (
                  <div key={bookmaker.id} className="mb-2">
                    <h3 className="font-semibold">{bookmaker.name}</h3>
                    {bookmaker.bets.map((bet: any) => (
                      <div key={bet.id} className="mb-1">
                        <h4 className="font-medium">{bet.name}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {bet.values.map((value: any, i: number) => (
                            <Button
                              key={i}
                              variant="outline"
                              className="w-full"
                              onClick={() =>
                                BetSlip.addBet({
                                  match_description: `${match.teams.home.name} vs ${match.teams.away.name}`,
                                  bet_selection: `${value.value} @ ${value.odd}`,
                                  stake: 0,
                                  odds: parseFloat(value.odd),
                                  status: 'pending',
                                  payout: 0,
                                  fixture_id: match.fixture.id,
                                  bet_type: 'single',
                                  week: 1,
                                  market_bets: bet.name,
                                })
                              }
                            >
                              {value.value} ({value.odd})
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <p>No hay partidos próximos.</p>
      )}
    </div>
  );
}